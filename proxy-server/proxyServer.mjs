import express from 'express';
import cors from 'cors';

// Opprett Express-appen
const app = express();

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

const API_KEY = process.env.SVV_API_KEY;

app.get('/api/carinfo/:regNumber', async (req, res) => {
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
