import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/vehicle-data/:regNumber', async (req, res) => {
  const regNumber = req.params.regNumber;

  try {
    const response = await fetch(`https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata?kjennemerke=${regNumber}`, {
      method: 'GET',
      headers: {
        'SVV-Authorization': 'Apikey e59b5fa7-0331-4359-9c99-bbe1a520db87',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `HTTP error! status: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Vegvesen:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;
