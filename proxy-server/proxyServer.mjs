import express from 'express';
import cors from 'cors';

// Opprett Express-appen
const app = express();

// Logging Middleware
const loggingMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next(); // Call next() to move to the next middleware
};

// API Key Validation Middleware
const apiKeyValidationMiddleware = (req, res, next) => {
  const apiKey = req.headers['svv-authorization'];
  if (apiKey === `Apikey ${API_KEY}`) {
    next(); // API key is valid, proceed to the next middleware/route
  } else {
    res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
};

// CORS-konfigurasjon
const corsOptions = {
  origin: 'https://www.rimeligauksjon.no', // Tillat forespørsler fra dette domenet
  methods: 'GET, POST, PUT, DELETE, OPTIONS', // Tillatte metoder
  allowedHeaders: 'Content-Type, Authorization', // Tillatte headere
  credentials: true, // Tillat å sende cookies og auth-info
};

// Bruk CORS med spesifikke innstillinger
app.use(cors(corsOptions));
app.use(express.json());
app.use(loggingMiddleware); // Apply the logging middleware globally

const API_KEY = 'e59b5fa7-0331-4359-9c99-bbe1a520db87'; // Hardkodet API-nøkkel

app.get('/api/carinfo/:regNumber', apiKeyValidationMiddleware, async (req, res) => { // Apply API key validation middleware to this route
  const regNumber = req.params.regNumber;
  const url = `http://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata?kjennemerke=${regNumber}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'SVV-Authorization': `Apikey ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Legg til CORS-headere i responsen
    res.setHeader('Access-Control-Allow-Origin', 'https://www.rimeligauksjon.no');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.json(data);
  } catch (error) {
    console.error('Error fetching car data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eksporter appen som standard for Vercel å håndtere
export default app;