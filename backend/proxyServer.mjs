// proxyServer.mjs

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 8081; // Bruk en annen port for proxy-serveren

app.use(cors());
app.use(express.json());

const API_KEY = 'e59b5fa7-0331-4359-9c99-bbe1a520db87';

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
    res.json(data);
  } catch (error) {
    console.error('Error fetching car data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`);
});
