const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const cron = require('node-cron');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
      accessKeyId: 'AKIAR4M65FGP76COT3D6',
      secretAccessKey: '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'
  }
});

const app = express();
// CORS mellomvare skal komme først
app.use(cors({
  origin: 'https://www.rimeligauksjon.no', // Tillat forespørsler fra denne frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors({
  origin: 'https://www.rimeligauksjon.no',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uri = "mongodb+srv://peiwast124:Heipiwi18.@cluster0.xfxhgbf.mongodb.net/";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
  tls: true, // Ensure TLS/SSL is enforced
  tlsAllowInvalidCertificates: false, // Adjust based on your certificate setup
  tlsAllowInvalidHostnames: false // Adjust based on your certificate setup
});

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to the MongoDB database');
    const db = client.db("signup");
    const loginCollection = db.collection("login");
    const auctionCollection = db.collection("auctions");
    const messageCollection = db.collection("messages");
    const liveAuctionCollection = db.collection('liveauctions');

    async function uploadImageToS3(imageBase64, userEmail, carBrand, carModel, carYear) {
      console.log('imageBase64:', imageBase64 ? 'Exists' : 'Missing');
      console.log('userEmail:', userEmail);
      console.log('carBrand:', carBrand);
      console.log('carModel:', carModel);
      console.log('carYear:', carYear);
    
      if (typeof imageBase64 !== 'string') {
        throw new Error('imageBase64 is not a string');
      }
    
      // Check if required parameters are provided
      if (!userEmail || !carBrand || !carModel || !carYear) {
        throw new Error('Missing required parameters');
      }
    
      const uniqueImageName = `${uuidv4()}.jpg`;
      const buffer = Buffer.from(imageBase64.split(',')[1], 'base64');
      
      // Replace "@" with "_at_" to prevent issues in folder names
      const sanitizedEmail = userEmail.replace('@', '_at_');
      const sanitizedCarBrand = carBrand.replace(/\s+/g, '-').toLowerCase(); // Sanitize car brand
      const sanitizedCarModel = carModel.replace(/\s+/g, '-').toLowerCase(); // Sanitize car model
      const carFolder = `${sanitizedCarBrand}-${carYear}-${sanitizedCarModel}`; // Create car folder name
    
      const params = {
        Bucket: 'rimeligauksjon2024',
        Key: `users/${sanitizedEmail}/${carFolder}/${uniqueImageName}`, // Store in user-specific folder with car details
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
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) return res.sendStatus(401);

      jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
      });
    };

    cron.schedule('* * * * *', async () => { // Kjører hvert minutt
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

        const otp = speakeasy.totp({
          secret: 'secret', // Ideally, use a user-specific secret
          encoding: 'base32'
        });

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
          otp
        };

        await loginCollection.insertOne(newUser);

        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'peiwast124@gmail.com',
            pass: 'eysj jfoz ahcj qqzo' // App-specific password
          }
        });

        let mailOptions = {
          from: '"RimeligAuksjon.no" <peiwast124@gmail.com>',
          to: email,
          subject: 'Verifiser din brukerkonto.',
          text: `Engangskoden din er: ${otp}`
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
        const user = await loginCollection.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        await loginCollection.updateOne({ email }, { $set: { verified: true }, $unset: { otp: "" } });
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
          secret: 'secret', // Ideally, use a user-specific secret
          encoding: 'base32'
        });

        await loginCollection.updateOne({ email }, { $set: { otp } });

        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'peiwast124@gmail.com',
            pass: 'eysj jfoz ahcj qqzo' // App-specific password
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

    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await loginCollection.findOne({ email, password });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });
        if (!user.verified) {
          const otp = speakeasy.totp({
            secret: 'secret', // Ideally, use a user-specific secret
            encoding: 'base32'
          });

          await loginCollection.updateOne({ email }, { $set: { otp } });

          let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'peiwast124@gmail.com',
              pass: 'eysj jfoz ahcj qqzo' // App-specific password
            }
          });

          let mailOptions = {
            from: '"RimeligAuksjon.no" <peiwast124@gmail.com>',
            to: email,
            subject: 'Verifiser din brukerkonto.',
            text: `Din engangskode er: ${otp}`
          };

          await transporter.sendMail(mailOptions);

          return res.status(200).json({ message: 'User not verified', email });
        }

        const accessToken = jwt.sign({ userId: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ accessToken, role: user.role });
      } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.get('/api/auctions', async (req, res) => {
      try {
        const auctions = await auctionCollection.find().toArray();
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
    
        const { brand, model, year, images } = req.body; // Extract car details and images from the request body
    
        const newAuction = {
          ...req.body,
          userId: new ObjectId(req.user.userId),
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`
        };
    
        // Upload each image and save the URLs
        const imageUrls = await Promise.all(images.map((imageBase64) => {
          return uploadImageToS3(imageBase64, user.email, brand, model, year); // Pass the authenticated user's email
        }));
    
        newAuction.imageUrls = imageUrls; // Store image URLs in the auction data
    
        const result = await auctionCollection.insertOne(newAuction);
        res.json(result);
      } catch (err) {
        console.error('Error during auction creation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    // Endepunkt for å fornye tokenet
app.post('/api/refresh-token', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const newToken = jwt.sign({ userId, role: req.user.role }, 'your_jwt_secret', { expiresIn: '15m' }); // Forny token i 15 minutter
  res.json({ accessToken: newToken });
});

app.get('/api/liveauctions/counts', async (req, res) => {
  try {
    const counts = {
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
        counts[field][value] = await liveAuctionCollection.countDocuments({ [field]: value });
      }
    };

    await calculateCounts('karosseri', karosserier);
    await calculateCounts('brand', brands);
    await calculateCounts('location', locations);
    await calculateCounts('fuel', fuelTypes);
    await calculateCounts('gearType', gearTypes);
    await calculateCounts('driveType', driveTypes);

    const models = await liveAuctionCollection.distinct('model');
    await calculateCounts('model', models);

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
    const result = await liveAuctionCollection.updateOne({ _id: new ObjectId(liveAuctionId) }, { $set: updateData });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Live auction not found' });
    res.json({ message: 'Live auction updated successfully' });
  } catch (err) {
    console.error('Error updating live auction:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

    app.get('/api/liveauctions/filter', async (req, res) => {
      try {
        const {
          brand, model, year, location, minPrice, maxPrice, karosseri, fuelType, transmission, drivetrain,
          auctionDuration, reservePrice, auctionWithoutReserve, taxClass, fuel, gearType, mainColor,
          power, seats, owners, doors, equipment, city
        } = req.query;
        const query = {};

        if (brand) query.brand = { $in: brand.split(',') };
        if (model) query.model = model;
        if (year) query.year = parseInt(year);
        if (location) query.location = location;
        if (minPrice) query.highestBid = { $gte: parseFloat(minPrice) };
        if (maxPrice) {
          query.highestBid = query.highestBid || {};
          query.highestBid.$lte = parseFloat(maxPrice);
        }
        if (karosseri) query.karosseri = { $in: karosseri.split(',') };
        if (fuelType) query.fuelType = fuelType;
        if (transmission) query.transmission = transmission;
        if (drivetrain) query.drivetrain = drivetrain;
        if (auctionDuration) query.auctionDuration = parseInt(auctionDuration);
        if (reservePrice) query.reservePrice = parseFloat(reservePrice);
        if (auctionWithoutReserve) query.auctionWithoutReserve = auctionWithoutReserve === 'true';
        if (taxClass) query.taxClass = taxClass;
        if (fuel) query.fuel = fuel;
        if (gearType) query.gearType = gearType;
        if (mainColor) query.mainColor = mainColor;
        if (power) query.power = parseInt(power);
        if (seats) query.seats = parseInt(seats);
        if (owners) query.owners = parseInt(owners);
        if (doors) query.doors = parseInt(doors);
        if (equipment) query.equipment = { $regex: new RegExp(equipment, 'i') };
        if (city) query.city = city;

        const liveAuctions = await liveAuctionCollection.find(query).toArray();
        res.json(liveAuctions);
      } catch (err) {
        console.error('Error fetching filtered live auctions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.delete('/api/liveauctions/:id', authenticateToken, async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
        const result = await liveAuctionCollection.deleteOne({ _id: new ObjectId(liveAuctionId) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Live auction not found' });
        res.json({ message: 'Live auction deleted successfully' });
      } catch (err) {
        console.error('Error deleting live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
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

    // Live Auctions routes
    app.get('/api/liveauctions', async (req, res) => {
      try {
        const liveAuctions = await liveAuctionCollection.find().toArray();
        res.json(liveAuctions);
      } catch (err) {
        console.error('Error fetching live auctions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });


    app.post('/api/liveauctions', authenticateToken, async (req, res) => {
      try {
        const user = await loginCollection.findOne({ _id: new ObjectId(req.user.userId) });
        const { startDate, endDate, ...auctionData } = req.body;

        const newLiveAuction = {
          ...auctionData,
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

        const result = await liveAuctionCollection.insertOne(newLiveAuction);
        res.status(201).json({ message: 'Live auction created successfully', result });
      } catch (err) {
        console.error('Error creating live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    

    app.get('/api/liveauctions/:id', async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
        const liveAuction = await liveAuctionCollection.findOne({ _id: new ObjectId(liveAuctionId) });
        if (!liveAuction) return res.status(404).json({ message: 'Live auction not found' });
        res.json(liveAuction);
      } catch (err) {
        console.error('Error fetching live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.delete('/api/liveauctions/:id', authenticateToken, async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
        const result = await liveAuctionCollection.deleteOne({ _id: new ObjectId(liveAuctionId) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Live auction not found' });
        res.json({ message: 'Live auction deleted successfully' });
      } catch (err) {
        console.error('Error deleting live auction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.put('/api/liveauctions/:id', authenticateToken, async (req, res) => {
      try {
        const liveAuctionId = req.params.id;
        const updateData = { ...req.body };
        const result = await liveAuctionCollection.updateOne({ _id: new ObjectId(liveAuctionId) }, { $set: updateData });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Live auction not found' });
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

    const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');

app.post('/api/liveauctions/:id/bid', authenticateToken, async (req, res) => {
  try {
    const liveAuctionId = req.params.id;
    const { bidAmount } = req.body;

    const liveAuction = await liveAuctionCollection.findOne({ _id: new ObjectId(liveAuctionId) });
    if (!liveAuction) return res.status(404).json({ message: 'Auksjonen ble ikke funnet' });

    if (bidAmount <= liveAuction.highestBid) {
      return res.status(400).json({ message: 'Bud må være høyere enn nåværende høyeste bud' });
    }

    const reservePriceMet = bidAmount >= liveAuction.reservePrice;

    // Sjekk om brukeren allerede har plassert et bud på denne auksjonen
    let userBidderNumber = liveAuction.bidders && liveAuction.bidders[req.user.userId];

    if (!userBidderNumber) {
      userBidderNumber = Object.keys(liveAuction.bidders || {}).length + 1; // Tildel nytt nummer
      await liveAuctionCollection.updateOne(
        { _id: new ObjectId(liveAuctionId) },
        { $set: { [`bidders.${req.user.userId}`]: userBidderNumber } }  // Lagre budgiver-nummer i auksjonen
      );
    }

    // Oppdater budlisten med det nye budet
    const newBid = {
      bidder: `Budgiver ${userBidderNumber}`,  // Bruk budgiver-nummeret
      amount: bidAmount,
      time: new Date()  // Tidsstempelet for når budet ble lagt inn
    };

    await liveAuctionCollection.updateOne(
      { _id: new ObjectId(liveAuctionId) },
      {
        $set: {
          highestBid: bidAmount,
          highestBidder: req.user.userId,
          reservePriceMet
        },
        $push: {
          bids: newBid  // Legger til det nye budet i budlisten
        },
        $inc: {
          bidCount: 1,  // Øker antall bud med 1
        }
      }
    );

    // Send e-postvarsel til høyeste budgiver
    const highestBidder = await loginCollection.findOne({ _id: new ObjectId(req.user.userId) });

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'peiwast124@gmail.com',
        pass: 'eysj jfoz ahcj qqzo' // App-spesifikt passordt passord for Gmail
      }
    });

    let mailOptions = {
      from: '"RimeligAuksjon.no" <dinemail@gmail.com>',
      to: highestBidder.email,
      subject: 'Du er den høyeste budgiveren!',
      text: `Gratulerer! Du er for øyeblikket den høyeste budgiveren for auksjonen ${liveAuction.brand} ${liveAuction.model} med et bud på ${bidAmount}.`
    };

    await transporter.sendMail(mailOptions);

    // Send e-postvarsel til auksjonseieren hvis reserveprisen er møtt
    if (reservePriceMet) {
      const auctionOwner = await loginCollection.findOne({ _id: new ObjectId(liveAuction.userId) });

      if (auctionOwner) {
        let ownerMailOptions = {
          from: '"RimeligAuksjon.no" <dinemail@gmail.com>',
          to: auctionOwner.email,
          subject: 'Nytt bud på din auksjon!',
          text: `Din auksjon for ${liveAuction.brand} ${liveAuction.model} har mottatt et nytt bud på ${bidAmount} fra ${highestBidder.email}. Minsteprisen er nådd!`
        };

        await transporter.sendMail(ownerMailOptions);
      }
    }

    res.json({ message: 'Bud lagt inn vellykket' }); // Endret her
  } catch (err) {
    console.error('Feil ved innlegging av bud:', err);
    res.status(500).json({ error: 'Intern serverfeil' });
  }
});


    app.get('/api/myauctions', authenticateToken, async (req, res) => {
      try {
        const userId = req.user.userId;
        const auctions = await auctionCollection.find({ userId: new ObjectId(userId) }).toArray();
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

        const images = document.images || [];
        if (images.length === 0) {
          return res.status(400).json({ error: 'No images found in the document' });
        }

        // Upload images to S3 and get URLs
        const imageUrls = await Promise.all(images.map(base64Image => {
          return uploadImageToS3(base64Image, user.email, document.brand, document.model, document.year);
        }));

        // Set up email transport
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'peiwast124@gmail.com',
            pass: 'eysj jfoz ahcj qqzo'
          }
        });

        // Prepare email content
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

        // Send e-posten
        let info = await transporter.sendMail(mailOptions);
        console.log('E-post sendt: %s', info.messageId);
        res.status(200).send('E-post sendt med bildet.');
      } catch (error) {
        console.error(error);
        res.status(500).send('Feil under sending av e-post.');
      }
    });

    const PORT = process.env.PORT || 8082;
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
}

connectDB();
