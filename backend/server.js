const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const http = require('http'); // Brukes til å opprette serveren for både HTTP og WebSockets
const socketIo = require('socket.io'); // Importer Socket.IO for websockets
const cron = require('node-cron');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const cookieParser = require('cookie-parser'); // Legg til her


// Initialiser Redis-klienten
const redis = new Redis(process.env.REDIS_URL);
const clearLiveAuctionCaches = async () => {
  // Slett alle liste-cache-nøkler for live-auksjoner
  const liveAuctionsKeys = await redis.keys('allLiveAuctions-*');
  if (liveAuctionsKeys.length > 0) {
    await redis.del(liveAuctionsKeys);
  }

  // Slett teller-cacher for filtrerte data
  await redis.del('liveAuctionsCounts');

  // Slett spesifikke filter-cacher
  const filterCacheKeys = await redis.keys('liveAuctionsFilter-*');
  if (filterCacheKeys.length > 0) {
    await redis.del(filterCacheKeys);
  }
};
const clearAllCache = async () => {
  try {
    // Slett alle nøkler som matcher mønsteret for dine auksjoner
    const keys = await redis.keys('*'); // Alternativt spesifikt mønster som 'allLiveAuctions-*'
    if (keys.length > 0) {
      await redis.del(keys);
      console.log('All cache cleared successfully.');
    } else {
      console.log('No cache keys found to clear.');
    }
  } catch (err) {
    console.error('Error clearing cache:', err);
  }
};

// Function to clear filter counts cache
async function clearFilterCountsCache() {
  const countsCacheKey = 'liveAuctionsCounts';
  await redis.del(countsCacheKey); // Clear cache for liveAuctionsCounts
}

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: 'AKIAR4M65FGP76COT3D6',  // Replace this with your actual access key
    secretAccessKey: 'lk86nZYLS3iNAbgH3OnQfju+kw6cvTdtC8k/+q7I',  // Replace this with your actual secret key
  },
});
const app = express();
app.use(cookieParser());

// CORS mellomvare
const corsOptions = {
  origin: 'https://www.rimeligauksjon.no',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions)); //

// Plasser dette før andre ruter og mellomvarer
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.rimeligauksjon.no');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204); // Returner "No Content"
});

// Opprett HTTP-serveren
const server = http.createServer(app);

// Opprett WebSocket-server med riktig CORS-konfigurasjon
const io = socketIo(server, {
  cors: {
    origin: 'https://www.rimeligauksjon.no',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uri = 'mongodb+srv://peiwast124:Heipiwi18.@cluster0.xfxhgbf.mongodb.net/'; // Gjør det mer sikkert med miljøvariabler
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
});

let auctionCollection; // Declare auctionCollection globally
let liveAuctionCollection; // Declare liveAuctionCollection globally
let loginCollection; // Declare 

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('signup');
    const loginCollection = db.collection('login');
    const liveAuctionCollection = db.collection('liveauctions');
    const auctionCollection = db.collection('auctions');


    // WebSocket-handling: Lytt til når brukere legger inn bud
    io.on('connection', (socket) => {
      console.log(`[${new Date().toISOString()}] User connected: `, socket.id);

      // Lytt etter bud og oppdater auksjonen
      socket.on('placeBid', async (data) => {
        const { auctionId, bidAmount, bidderId } = data; // Make sure bidderId is included in the incoming data
        console.log(`[${new Date().toISOString()}] Received bid from ${socket.id} for auctionId: ${auctionId}, bidAmount: ${bidAmount}`);
      
        try {
          const auction = await liveAuctionCollection.findOne({ _id: new ObjectId(auctionId) });
          if (!auction) {
            console.error(`[${new Date().toISOString()}] Auction not found: ${auctionId}`);
            socket.emit('error', { message: 'Auksjon ikke funnet' });
            return;
          }
      
          // Update the bid in the database
          const updateResult = await liveAuctionCollection.updateOne(
            { _id: new ObjectId(auctionId) },
            {
              $set: { highestBid: bidAmount },
              $push: { bids: { amount: bidAmount, bidder: bidderId, time: new Date() } }, // Use bidderId here
            }
          );
      
          console.log(`[${new Date().toISOString()}] Updated auction ${auctionId} with new bid from ${bidderId}. Update result: `, updateResult);
      
          // Emit the updated bid to all connected clients
          io.emit('bidUpdated', { auctionId, bidAmount, bidderId }); // Ensure all required fields are correctly emitted
          console.log(`[${new Date().toISOString()}] Bid update emitted to all clients for auctionId: ${auctionId}`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error placing bid for auctionId: ${auctionId} from ${bidderId}`, error);
          socket.emit('error', { message: 'Feil ved budinnlegging' });
        }
      });
      

      // Lytt til frakobling
      socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] User disconnected: `, socket.id);
      });
    });

    async function uploadImageToS3(imageBase64, userEmail, carBrand, carModel, carYear) {
      if (typeof imageBase64 !== 'string') {
        throw new Error('imageBase64 is not a string');
      }

      if (!userEmail || !carBrand || !carModel || !carYear) {
        throw new Error('Missing required parameters');
      }

      const uniqueImageName = `${uuidv4()}.jpg`;
      const buffer = Buffer.from(imageBase64.split(',')[1], 'base64');

      const sanitizedEmail = userEmail.replace('@', '_at_');
      const sanitizedCarBrand = carBrand.replace(/\s+/g, '-').toLowerCase();
      const sanitizedCarModel = carModel.replace(/\s+/g, '-').toLowerCase();
      const carFolder = `${sanitizedCarBrand}-${carYear}-${sanitizedCarModel}`;

      const params = {
        Bucket: 'rimeligauksjon2024',
        Key: `users/${sanitizedEmail}/${carFolder}/${uniqueImageName}`,
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg'
      };

      const command = new PutObjectCommand(params);
      const uploadResult = await s3.send(command);
      const imageUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
      return imageUrl;
    }

    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
    
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
    
      jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) {
          return res.status(403).json({ message: 'Token is not valid' });
        }
        req.user = user;
        next();
      });
    };
    

    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const expiredAuctions = await liveAuctionCollection.find({ endDate: { $lte: now }, status: 'Pågående' }).toArray();

        for (let auction of expiredAuctions) {
          await liveAuctionCollection.updateOne({ _id: auction._id }, { $set: { status: 'Utgått' } });
        }

      } catch (err) {
        console.error('Error updating expired auctions:', err);
      }
    });

    const checkAdminRole = (req, res, next) => {
      if (req.user.role !== 'admin') return res.sendStatus(403);
      next();
    };



    

    app.post('/signup', async (req, res) => {
      try {
        const { firstName, lastName, email, confirmEmail, password, mobile, birthDate, address1, address2, postalCode, city, country, accountNumber } = req.body;
        const existingUser = await loginCollection.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });
    
        const secret = speakeasy.generateSecret({ length: 20 }).base32; // Generer unik secret
        const otp = speakeasy.totp({
          secret: secret,
          encoding: 'base32',
        });
    
        const otpExpiry = Date.now() + 5 * 60 * 1000; // OTP gyldig i 5 minutter
    
        const newUser = {
          firstName,
          lastName,
          email,
          password,
          mobile,
          birthDate,
          address1,
          address2,
          postalCode,
          city,
          country,
          accountNumber,
          role: 'user',
          verified: false,
          otpSecret: secret, // Lagre secret
          otp, // Behold for debugging (valgfritt)
          otpExpiry, // Legg til utløpstid
        };
    
        await loginCollection.insertOne(newUser);
    
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'peiwast124@gmail.com',
            pass: 'eysj jfoz ahcj qqzo',
          },
        });
    
        let mailOptions = {
          from: '"RimeligAuksjon.no" <peiwast124@gmail.com>',
          to: email,
          subject: 'Verifiser din brukerkonto.',
          text: `Engangskoden din er: ${otp}. Den er gyldig i 5 minutter.`,
        };
    
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Signup successful, please verify your email', userId: newUser._id });
      } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    
    app.post('/verify-otp', async (req, res) => {
      try {
        const { email, otp } = req.body;
    
        // Log input data for debugging
        console.log(`Verifying OTP for email: ${email} with OTP: ${otp}`);
    
        // Finn brukeren basert på e-posten
        const user = await loginCollection.findOne({ email });
        if (!user) {
          console.error('User not found for email:', email);
          return res.status(400).json({ message: 'User not found' });
        }
    
        // Sjekk om OTP-en har utløpt
        if (user.otpExpiry < Date.now()) {
          console.error('OTP has expired for email:', email);
          return res.status(400).json({ message: 'OTP has expired' });
        }
    
        // Verifiser OTP med speakeasy
        const verified = speakeasy.totp.verify({
          secret: user.otpSecret,
          encoding: 'base32',
          token: otp,
          window: 2, // Utvider tidsvinduet for å tillate mer fleksibilitet
        });
    
        // Hvis OTP ikke stemmer
        if (!verified) {
          console.error('Invalid OTP:', otp, 'for email:', email, 'with secret:', user.otpSecret);
          return res.status(400).json({ message: 'Invalid OTP' });
        }
    
        // Oppdater brukeren som verifisert og fjern OTP-secret og utløpstid
        await loginCollection.updateOne(
          { email },
          { $set: { verified: true }, $unset: { otpSecret: "", otpExpiry: "" } }
        );
    
        console.log(`Email verified successfully for email: ${email}`);
        res.status(200).json({ message: 'Email verified successfully' });
      } catch (err) {
        console.error('Error during OTP verification:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    



   
    
    
    app.post('/forgot-password', async (req, res) => {
      try {
        const { email } = req.body;
        const user = await loginCollection.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const otp = speakeasy.totp({
          secret: 'secret',
          encoding: 'base32'
        });

        await loginCollection.updateOne({ email }, { $set: { otp } });

        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'peiwast124@gmail.com',
            pass: 'eysj jfoz ahcj qqzo'
          }
        });

        let mailOptions = {
          from: '"RimeligAuksjon.no" <peiwast124@gmail.com>',
          to: email,
          subject: 'Engangskode for tilbakestilling av passord.',
          text: `Engangskoden din er: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
      } catch (err) {
        console.error('Error during forgot password:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await loginCollection.findOne({ email, password });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    
        if (!user.verified) {
          const otp = speakeasy.totp({
            secret: 'secret',
            encoding: 'base32',
          });
    
          await loginCollection.updateOne({ email }, { $set: { otp } });
    
          let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'peiwast124@gmail.com',
              pass: 'eysj jfoz ahcj qqzo',
            },
          });
    
          let mailOptions = {
            from: '"RimeligAuksjon.no" <peiwast124@gmail.com>',
            to: email,
            subject: 'Verifiser din brukerkonto.',
            text: `Din engangskode er: ${otp}`,
          };
    
          await transporter.sendMail(mailOptions);
    
          return res.status(200).json({ message: 'User not verified', email });
        }
    
        // Generer tokens
        const accessToken = jwt.sign({ userId: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user._id, role: user.role }, 'your_refresh_secret', { expiresIn: '7d' });
    
        // Sett refreshToken som en HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: true, // Bruk true hvis du bruker HTTPS
          sameSite: 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dager
        });
    
        res.json({ accessToken, role: user.role });
      } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    

    app.post('/reset-password', async (req, res) => {
      try {
        const { email, otp, newPassword } = req.body;
        const user = await loginCollection.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        await loginCollection.updateOne({ email }, { $set: { password: newPassword }, $unset: { otp: "" } });
        res.status(200).json({ message: 'Password reset successfully' });
      } catch (err) {
        console.error('Error during password reset:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.post('/api/refresh-token', (req, res) => {
      console.log('Cookies received:', req.cookies); // Logger innkommende cookies
      console.log('Headers received:', req.headers); // Logger headers for å verifisere CORS og token-tilstedeværelse
    
      const refreshToken = req.cookies.refreshToken;
    
      if (!refreshToken) {
        console.error('No refresh token provided');
        return res.status(401).json({ message: 'No refresh token provided' });
      }
    
      jwt.verify(refreshToken, 'your_refresh_secret', (err, user) => {
        if (err) {
          console.error('Invalid refresh token:', err);
          return res.status(403).json({ message: 'Invalid refresh token' });
        }
    
        console.log('Token verified successfully:', user);
    
        const newAccessToken = jwt.sign({ userId: user.userId, role: user.role }, 'your_jwt_secret', { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ userId: user.userId, role: user.role }, 'your_refresh_secret', { expiresIn: '7d' });
    
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    
        console.log('New tokens generated and sent');
        res.json({ accessToken: newAccessToken });
      });
    });
    
    
    
    

 
    app.get('/api/auctions', async (req, res) => {
      console.log('Fetching auctions...');
      try {
        const startTime = Date.now();
        const auctions = await auctionCollection.find().toArray();
        const endTime = Date.now();
        console.log(`Fetched ${auctions.length} auctions in ${endTime - startTime}ms`);
        res.json(auctions);
      } catch (err) {
        console.error('Error retrieving auctions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    

    app.post('/api/auctions', authenticateToken, async (req, res) => {
      try {
        const user = await loginCollection.findOne({ _id: new ObjectId(req.user.userId) });
    
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        const { brand, model, year, images } = req.body;
    
        // Upload images to S3 and get URLs
        const imageUrls = await Promise.all(images.map((imageBase64) => {
          return uploadImageToS3(imageBase64, user.email, brand, model, year);
        }));
    
        // Create new auction object without base64 images
        const newAuction = {
          ...req.body,
          userId: new ObjectId(req.user.userId),
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          imageUrls: imageUrls // Only store URLs
        };
    
        delete newAuction.images; // Remove the base64 images before saving
        delete newAuction.previewImages; // Remove the base64 images before saving

        const result = await auctionCollection.insertOne(newAuction);
        res.json(result);
      } catch (err) {
        console.error('Error during auction creation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    
    // Endepunkt for å fornye tokenet
 
    
    // Logout Endpoint
    app.post('/logout', (req, res) => {
      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    });

    app.get('/api/liveauctions/counts', async (req, res) => {
      try {
        const { category } = req.query; // Get the category from the request query
        const cacheKey = `liveAuctionsCounts-${category || 'all'}`; // Include category in the cache key
        let counts = await redis.get(cacheKey);
    
        if (!counts) {
          console.log('Cache miss. Calculating counts.');
    
          counts = {
            karosseri: {},
            brand: {},
            location: {},
            fuel: {},
            gearType: {},
            driveType: {},
            model: {}
          };
    
          const karosserier = ['Stasjonsvogn', 'Cabriolet', 'Kombi 5-dørs', 'Flerbruksbil', 'Pickup', 'Kombi 3-dørs', 'Sedan', 'Coupe', 'SUV/Offroad', 'Kasse'];
          const brands = ['AUDI', 'BMW', 'BYD', 'CHEVROLET', 'CHRYSLER', 'CITROEN', 'DODGE', 'FERRARI', 'FIAT', 'FORD', 'HONDA', 'HYUNDAI', 'JAGUAR', 'JEEP', 'KIA', 'LAMBORGHINI', 'LAND ROVER', 'LEXUS', 'MASERATI', 'MAZDA', 'MERCEDES-BENZ', 'MINI', 'MITSUBISHI', 'NISSAN', 'OPEL', 'PEUGEOT', 'PORSCHE', 'RENAULT', 'ROLLS ROYCE', 'SAAB', 'SEAT', 'SKODA', 'SUBARU', 'SUZUKI', 'TESLA', 'TOYOTA', 'VOLKSWAGEN', 'VOLVO'];
          const locations = ['Akershus', 'Aust-Agder', 'Buskerud', 'Finnmark', 'Hedmark', 'Hordaland', 'Møre og Romsdal', 'Nordland', 'Nord-Trøndelag', 'Oppland', 'Oslo', 'Rogaland', 'Sogn og Fjordane', 'Sør-Trøndelag', 'Telemark', 'Troms', 'Vest-Agder', 'Vestfold', 'Østfold'];
          const fuelTypes = ['Bensin', 'Diesel', 'Elektrisitet', 'Hybrid'];
          const gearTypes = ['Automat', 'Manuell'];
          const driveTypes = ['Bakhjulstrekk', 'Firehjulstrekk', 'Framhjulstrekk'];
    
          const calculateCounts = async (field, values) => {
            for (const value of values) {
              // Include category in the query if provided
              const query = { [field]: value };
              if (category) {
                query.category = category;
              }
              counts[field][value] = await liveAuctionCollection.countDocuments(query);
            }
          };
    
          await calculateCounts('karosseri', karosserier);
          await calculateCounts('brand', brands);
          await calculateCounts('location', locations);
          await calculateCounts('fuel', fuelTypes);
          await calculateCounts('gearType', gearTypes);
          await calculateCounts('driveType', driveTypes);
    
          const models = await liveAuctionCollection.distinct('model', category ? { category } : {}); // Filter models by category if provided
          await calculateCounts('model', models);
    
          await redis.set(cacheKey, JSON.stringify(counts), 'EX', 600);
        } else {
          console.log('Cache hit! Returning cached counts.');
          counts = JSON.parse(counts);
        }
    
        res.json(counts);
      } catch (err) {
        console.error('Error fetching filter counts:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    app.put('/api/liveauctions/:id', authenticateToken, async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
        const updateData = { ...req.body };
    
        const result = await liveAuctionCollection.updateOne(
          { _id: new ObjectId(liveAuctionId) },
          { $set: updateData }
        );
    
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Live auction not found' });
        }
    
        // Slett cache relatert til denne auksjonen
        const cacheKey = `liveAuction-${liveAuctionId}`;
        await redis.del(cacheKey);  // Slett spesifikk auksjonsdata fra cachen
        
        const allLiveAuctionsKeys = await redis.keys('allLiveAuctions-*');
        if (allLiveAuctionsKeys.length > 0) {
          await redis.del(allLiveAuctionsKeys);  // Slett alle cache-nøkler relatert til lister av auksjoner
        }
    
        res.json({ message: 'Live auction updated successfully' });
      } catch (err) {
        console.error('Error updating live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    app.get('/api/liveauctions/filter', async (req, res) => {
      try {
        const {
          brand, model, year, location, minPrice, maxPrice, karosseri, fuel, gearType, driveType,
          auctionDuration, reservePrice, auctionWithoutReserve, category
        } = req.query;
    
        const andConditions = [];
    
        // Log each filter value
        console.log('Filter values received:', {
          brand, model, year, location, minPrice, maxPrice, karosseri, fuel, gearType, driveType,
          auctionDuration, reservePrice, auctionWithoutReserve, category
        });
    
        // Construct query
        if (category) {
          andConditions.push({ category });
        }
        if (brand && brand.length > 0) {
          const brands = Array.isArray(brand) ? brand : brand.split(',');
          andConditions.push({ brand: { $in: brands.map((b) => b.toUpperCase()) } });
        }
        if (model) {
          andConditions.push({ model: { $regex: new RegExp(model, 'i') } });
        }
        if (year) {
          const yearInt = parseInt(year, 10);
          if (!isNaN(yearInt)) {
            andConditions.push({ year: yearInt });
          }
        }
        if (location) {
          andConditions.push({ location: { $regex: new RegExp(location, 'i') } });
        }
        if (minPrice || maxPrice) {
          const priceFilter = {};
          if (minPrice) priceFilter.$gte = parseFloat(minPrice);
          if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
          andConditions.push({ highestBid: priceFilter });
        }
        if (karosseri) {
          const karosserier = Array.isArray(karosseri) ? karosseri : karosseri.split(',');
          andConditions.push({ karosseri: { $in: karosserier } });
        }
        if (fuel) {
          const fuels = Array.isArray(fuel) ? fuel : fuel.split(',');
          andConditions.push({ fuel: { $in: fuels } });
        }
        if (gearType) {
          const gearTypes = Array.isArray(gearType) ? gearType : gearType.split(',');
          andConditions.push({ gearType: { $in: gearTypes } });
        }
        if (driveType) {
          const driveTypes = Array.isArray(driveType) ? driveType : driveType.split(',');
          andConditions.push({ driveType: { $in: driveTypes } });
        }
        if (auctionDuration) {
          const durationInt = parseInt(auctionDuration, 10);
          if (!isNaN(durationInt)) {
            andConditions.push({ auctionDuration: durationInt });
          }
        }
        if (reservePrice) {
          andConditions.push({ reservePrice: parseFloat(reservePrice) });
        }
        if (auctionWithoutReserve) {
          andConditions.push({ auctionWithoutReserve: auctionWithoutReserve === 'true' });
        }
    
        const query = andConditions.length > 0 ? { $and: andConditions } : {};
        console.log('Constructed query:', JSON.stringify(query, null, 2));
    
        const liveAuctions = await liveAuctionCollection.find(query).toArray();
    
        console.log('Auctions found:', liveAuctions.length);
        res.status(200).json(liveAuctions || []);
      } catch (error) {
        console.error('Error processing filter request:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
      }
    });
    
    
    
    

    app.get('/api/auctions/:id', authenticateToken, async (req, res) => {
      try {
        const auctionId = req.params.id;
        const auction = await auctionCollection.findOne({ _id: new ObjectId(auctionId) });
        if (!auction) return res.status(404).json({ message: 'Auction not found' });
        res.json(auction);
      } catch (err) {
        console.error('Error fetching auction details:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    app.get('/api/liveauctions', async (req, res) => {
      const startTime = Date.now();
    //Hei
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
    
        const cacheKey = `allLiveAuctions-page-${page}-limit-${limit}`;
        let liveAuctions;
    
        try {
          liveAuctions = await redis.get(cacheKey);
          if (liveAuctions) {
            console.log(`Cache hit!`);
            liveAuctions = JSON.parse(liveAuctions);
          }
        } catch (redisError) {
          console.error('Redis error:', redisError);
          liveAuctions = null; // Fortsett uten cache om Redis feiler
        }
    
        if (!liveAuctions) {
          console.log(`Cache miss. Fetching from database.`);
          liveAuctions = await liveAuctionCollection.find({})
            .project({
              brand: 1,
              model: 1,
              mileage: 1, // Legg til mileage her

              year: 1,
              endDate: 1,
              highestBid: 1,
              bidCount: 1,
              status: 1,
              location: 1,
              imageUrls: 1
            })
            .skip(skip)
            .limit(limit)
            .toArray();
    
          if (!liveAuctions || liveAuctions.length === 0) {
            console.log('No live auctions found.');
          } else {
            try {
              await redis.set(cacheKey, JSON.stringify(liveAuctions), 'EX', 600);
            } catch (redisSetError) {
              console.error('Error setting Redis cache:', redisSetError);
            }
          }
        }
    
        const endTime = Date.now();
        console.log(`Total API response time: ${endTime - startTime}ms`);
    
        res.json(liveAuctions);
      } catch (err) {
        console.error('Error retrieving live auctions:', err.message || err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    app.post('/api/liveauctions', authenticateToken, async (req, res) => {
      try {
        const user = await loginCollection.findOne({ _id: new ObjectId(req.user.userId) });
        const { startDate, endDate, category, ...auctionData } = req.body;
    
        const newLiveAuction = {
          ...auctionData,
          category, // Add category to live auction data
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: 'Pågående',
          bidCount: 0,
          bids: [],
          highestBid: 0,
          userId: req.user.userId,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`
        };
    
        // Sett inn den nye auksjonen i databasen
        const result = await liveAuctionCollection.insertOne(newLiveAuction);
    
        // Clear caches for filters and all live auctions
        await clearFilterCountsCache();
        await redis.del("allLiveAuctions");
    
        // Send en suksessmelding tilbake til klienten
        res.status(201).json({ message: 'Live auction created successfully', result });
      } catch (err) {
        console.error('Error creating live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    
    
    app.get('/api/liveauctions/:id', async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
        const cacheKey = `liveAuction-${liveAuctionId}`;

        let liveAuction = await redis.get(cacheKey);

        if (!liveAuction) {
          liveAuction = await liveAuctionCollection.findOne({ _id: new ObjectId(liveAuctionId) });

          if (!liveAuction) {
            return res.status(404).json({ message: 'Live auction not found' });
          }

          await redis.set(cacheKey, JSON.stringify(liveAuction));
          console.log('Cache miss. Data hentet fra databasen.');
        } else {
          console.log('Cache hit! Data hentet fra cachen.');
          liveAuction = JSON.parse(liveAuction);
        }

        res.json(liveAuction);
      } catch (err) {
        console.error('Error fetching live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.delete('/api/liveauctions/:id', authenticateToken, async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
    
        // Slett auksjonen fra databasen
        const result = await liveAuctionCollection.deleteOne({ _id: new ObjectId(liveAuctionId) });
    
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Live auction not found' });
        }
    
        // Tøm all cache relatert til live-auksjoner
        await clearAllCache();
    
        res.json({ message: 'Live auction deleted successfully' });
      } catch (err) {
        console.error('Error deleting live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    

    app.delete('/api/auctions/:id', authenticateToken, async (req, res) => {
      try {
        const auctionId = req.params.id;
        const result = await auctionCollection.deleteOne({ _id: new ObjectId(auctionId) });

        if (result.deletedCount === 0) return res.status(404).json({ message: 'Auction not found' });

        res.json({ message: 'Auction deleted successfully' });

      } catch (err) {
        console.error('Error deleting auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    app.put('/api/liveauctions/:id', authenticateToken, async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
        const updateData = { ...req.body };
    
        const result = await liveAuctionCollection.updateOne(
          { _id: new ObjectId(liveAuctionId) },
          { $set: updateData }
        );
    
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Live auction not found' });
        }
    
        // Clear caches for filters and all live auctions
        await clearFilterCountsCache();
        await redis.del("allLiveAuctions");
    
        res.json({ message: 'Live auction updated successfully' });
      } catch (err) {
        console.error('Error updating live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    

    app.get('/api/search', async (req, res) => {
      try {
        const searchTerm = req.query.q;
        const results = await liveAuctionCollection.find({
          $or: [
            { brand: { $regex: searchTerm, $options: 'i' } },
            { model: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
          ]
        }).toArray();
        res.json(results);
      } catch (err) {
        console.error('Error fetching search results:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.post('/api/liveauctions/:id/bid', authenticateToken, async (req, res) => {
      const session = client.startSession(); // Start en MongoDB session
      session.startTransaction(); // Start transaksjonen
    
      try {
        const liveAuctionId = req.params.id;
        const { bidAmount } = req.body;
    
        const cacheKey = `liveAuction-${liveAuctionId}`;
        await redis.del(cacheKey); // Invalidate the cache for this auction
    
        // Utfør en transaksjonssikker oppdatering
        const liveAuction = await liveAuctionCollection
          .findOne({ _id: new ObjectId(liveAuctionId) }, { session }); // Her har vi fjernet bruk av session fra findOne()
    
        if (!liveAuction) {
          await session.abortTransaction(); // Avbryt transaksjonen hvis auksjonen ikke finnes
          session.endSession();
          return res.status(404).json({ message: 'Auksjonen ble ikke funnet' });
        }
    
        // Sjekk om brukeren allerede har høyeste bud, og hindre at samme bruker gir to bud på rad
        if (liveAuction.highestBidder === req.user.userId) {
          await session.abortTransaction(); // Avbryt transaksjonen hvis brukeren allerede har høyeste bud
          session.endSession();
          return res.status(400).json({ message: 'Du kan ikke legge inn to bud på rad. Vent til noen andre byr før du kan by igjen.' });
        }
    
        // Sjekk om budet er høyere enn det nåværende høyeste budet
        if (bidAmount <= liveAuction.highestBid) {
          await session.abortTransaction(); // Avbryt transaksjonen hvis budet ikke er høyt nok
          session.endSession();
          return res.status(400).json({ message: 'Bud må være høyere enn nåværende høyeste bud' });
        }
    
        const reservePriceMet = bidAmount >= liveAuction.reservePrice;
    
        let userBidderNumber = liveAuction.bidders && liveAuction.bidders[req.user.userId];
    
        if (!userBidderNumber) {
          userBidderNumber = Object.keys(liveAuction.bidders || {}).length + 1;
          await liveAuctionCollection.updateOne(
            { _id: new ObjectId(liveAuctionId) },
            { $set: { [`bidders.${req.user.userId}`]: userBidderNumber } },
            { session } // Bruker session her
          );
        }
    
        const newBid = {
          bidder: `Budgiver ${userBidderNumber}`,
          amount: bidAmount,
          time: new Date(),
        };
    
        await liveAuctionCollection.updateOne(
          { _id: new ObjectId(liveAuctionId) },
          {
            $set: {
              highestBid: bidAmount,
              highestBidder: req.user.userId,
              reservePriceMet,
            },
            $push: {
              bids: newBid,
            },
            $inc: {
              bidCount: 1,
            },
          },
          { session } // Bruker session her
        );
    
        await session.commitTransaction(); // Fullfør transaksjonen
        session.endSession();
    
        const highestBidder = await loginCollection.findOne({ _id: new ObjectId(req.user.userId) });
    
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'peiwast124@gmail.com',
            pass: 'eysj jfoz ahcj qqzo',
          },
        });
    
        let mailOptions = {
          from: '"RimeligAuksjon.no" <dinemail@gmail.com>',
          to: highestBidder.email,
          subject: 'Du er den høyeste budgiveren!',
          text: `Gratulerer! Du er for øyeblikket den høyeste budgiveren for auksjonen ${liveAuction.brand} ${liveAuction.model} med et bud på ${bidAmount}.`,
        };
    
        await transporter.sendMail(mailOptions);
    
        if (reservePriceMet) {
          const auctionOwner = await loginCollection.findOne({ _id: new ObjectId(liveAuction.userId) });
    
          if (auctionOwner) {
            let ownerMailOptions = {
              from: '"RimeligAuksjon.no" <dinemail@gmail.com>',
              to: auctionOwner.email,
              subject: 'Nytt bud på din auksjon!',
              text: `Din auksjon for ${liveAuction.brand} ${liveAuction.model} har mottatt et nytt bud på ${bidAmount} fra ${highestBidder.email}. Minsteprisen er nådd!`,
            };
    
            await transporter.sendMail(ownerMailOptions);
          }
        }
    
        // (Optional) Repopulate cache with updated auction data
        const updatedAuction = await liveAuctionCollection.findOne({ _id: new ObjectId(liveAuctionId) });
        await redis.set(cacheKey, JSON.stringify(updatedAuction), 'EX', 600); // Cache for 10 minutes
    
        res.json({ message: 'Bud lagt inn vellykket' });
      } catch (err) {
        await session.abortTransaction(); // Avbryt transaksjonen hvis det er en feil
        session.endSession();
        console.error('Feil ved innlegging av bud:', err);
        res.status(500).json({ error: 'Intern serverfeil' });
      }
    });
    
    app.get('/api/myliveauctions', authenticateToken, async (req, res) => {
      console.log('Request received at /api/myliveauctions');
      try {
          const userId = req.user.userId;
  
          // Bygg søkespørringen. Hvis `userId` kan være både streng eller ObjectId, bør vi håndtere begge tilfeller.
          const query = {
              userId: userId // Her behandler vi `userId` som en streng
          };
  
          const liveAuctions = await liveAuctionCollection.find(query).toArray();
  
          if (!liveAuctions || liveAuctions.length === 0) {
              console.log('No live auctions found for user', userId);
              return res.status(200).json([]); // Returnerer en tom array i stedet for 404 for bedre brukeropplevelse
          }
  
          console.log('Live auctions found:', liveAuctions);
          res.json(liveAuctions);
      } catch (err) {
          console.error('Error fetching live auctions:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
  
    
    
    
    
    
    
    app.get('/api/myliveauctions', authenticateToken, async (req, res) => {
      console.log('Request received at /api/myliveauctions');
      try {
          const userId = req.user.userId;
  
          // Bygg søkespørringen. Hvis `userId` kan være både streng eller ObjectId, bør vi håndtere begge tilfeller.
          const query = {
              userId: userId // Her behandler vi `userId` som en streng
          };
  
          const liveAuctions = await liveAuctionCollection.find(query).toArray();
  
          if (!liveAuctions || liveAuctions.length === 0) {
              console.log('No live auctions found for user', userId);
              return res.status(200).json([]); // Returnerer en tom array i stedet for 404 for bedre brukeropplevelse
          }
  
          console.log('Live auctions found:', liveAuctions);
          res.json(liveAuctions);
      } catch (err) {
          console.error('Error fetching live auctions:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
  
    
    
    
    
    app.get('/api/myauctions', authenticateToken, async (req, res) => {
      try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;
    
        // Fetch auctions directly from the database without caching
        const auctions = await auctionCollection.find({ userId: new ObjectId(userId) })
          .skip(skip)
          .limit(limit)
          .toArray();
    
        // Handle case where no auctions are found
        if (!auctions || auctions.length === 0) {
          return res.status(404).json({ message: 'Ingen auksjoner funnet.' });
        }
    
        res.json(auctions);
      } catch (err) {
        console.error('Error fetching auctions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    

    app.get('/api/mymessages', authenticateToken, async (req, res) => {
      try {
        const userId = req.user.userId;
        const messages = await messageCollection.find({ userId: new ObjectId(userId) }).toArray();
        res.json(messages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.get('/api/userdetails', authenticateToken, async (req, res) => {
      try {
        const userId = req.user.userId;
        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });
        res.json(user);
      } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.put('/api/userdetails', authenticateToken, async (req, res) => {
      try {
        const userId = req.user.userId;
        const updateUser = {
          ...req.body,
        };
        const result = await loginCollection.updateOne({ _id: new ObjectId(userId) }, { $set: updateUser });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User details updated successfully' });
      } catch (err) {
        console.error('Error updating user details:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.post('/send-image', authenticateToken, async (req, res) => {
      const { documentId } = req.body;
    
      try {
        const document = await auctionCollection.findOne({ _id: new ObjectId(documentId) });
        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }
    
        const user = await loginCollection.findOne({ _id: new ObjectId(req.user.userId) });
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        const { brand, model, year, imageUrls } = document;
    
        if (!imageUrls || imageUrls.length === 0) {
          return res.status(400).json({ error: 'No images found in the document' });
        }
    
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'peiwast124@gmail.com',
            pass: 'eysj jfoz ahcj qqzo'
          }
        });
    
        let emailContent = `
          <p>Hei,</p>
          <p>Her er informasjonen om din auksjonsforespørsel:</p>
          <h3>Bilinformasjon:</h3>
          <ul>
            <li><strong>Registreringsnummer:</strong> ${document.regNumber}</li>
            <li><strong>Merke:</strong> ${document.brand}</li>
            <li><strong>Modell:</strong> ${document.model}</li>
            <li><strong>År:</strong> ${document.year}</li>
            <li><strong>Chassisnummer:</strong> ${document.chassisNumber}</li>
            <li><strong>Avgiftsklasse:</strong> ${document.taxClass}</li>
            <li><strong>Drivstoff:</strong> ${document.fuel}</li>
            <li><strong>Girtype:</strong> ${document.gearType}</li>
            <li><strong>Driftstype:</strong> ${document.driveType}</li>
            <li><strong>Hovedfarge:</strong> ${document.mainColor}</li>
            <li><strong>Effekt:</strong> ${document.power}</li>
            <li><strong>Antall seter:</strong> ${document.seats}</li>
            <li><strong>Antall eiere:</strong> ${document.owners}</li>
            <li><strong>1. gang registrert:</strong> ${document.firstRegistration}</li>
            <li><strong>Antall dører:</strong> ${document.doors}</li>
            <li><strong>Egenvekt:</strong> ${document.weight}</li>
            <li><strong>CO2-utslipp:</strong> ${document.co2}</li>
            <li><strong>Omregistreringsavgift:</strong> ${document.omregistreringsavgift}</li>
            <li><strong>Sist EU-godkjent:</strong> ${document.lastEUApproval}</li>
            <li><strong>Neste frist for EU-kontroll:</strong> ${document.nextEUControl}</li>
          </ul>
    
          <h3>Beskrivelse:</h3>
          <p><strong>Beskrivelse:</strong> ${document.description}</p>
          <p><strong>Beskrivelse av tilstand:</strong> ${document.conditionDescription}</p>
    
          <h3>Utstyr:</h3>
          <ul>
            ${document.equipment.map(item => `<li>${item}</li>`).join('')}
          </ul>
    
          <h3>Bilder:</h3>
          <div>
            ${imageUrls.map((url, index) => `<img src="${url}" alt="Bilde ${index + 1}" style="width: 100px; height: auto; margin-right: 10px;"/>`).join('')}
          </div>
    
          <p>Med vennlig hilsen,<br/>RimeligAuksjon.no</p>
        `;
    
        let mailOptions = {
          from: '"RimeligAuksjon.no" <peiwast124@gmail.com>',
          to: `${user.email}, peiwast124@gmail.com`,
          subject: 'Her er informasjonen om din auksjonsforespørsel fra RimeligAuksjon.no',
          html: emailContent,
        };
    
        let info = await transporter.sendMail(mailOptions);
        console.log('E-post sendt: %s', info.messageId);
        res.status(200).send('E-post sendt med bildet.');
      } catch (error) {
        console.error(error);
        res.status(500).send('Feil under sending av e-post.');
      }
    });
    
    const PORT = process.env.PORT || 8082;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
}

connectDB();