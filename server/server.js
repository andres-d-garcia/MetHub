import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 3000;

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

// Enable CORS for requests from the frontend origin
app.use(cors({ origin: 'http://127.0.0.1:5500' }));

// Middleware to parse JSON bodies
app.use(express.json());

// Proxy middleware
app.use('/api', async (req, res) => {
  const endpoint = req.originalUrl.replace('/api', '');
  const metApiUrl = `${MET_API_BASE}${endpoint}`;

  console.log(`Forwarding request to: ${metApiUrl}`);

  try {
    const response = await fetch(metApiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      // body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error forwarding request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
