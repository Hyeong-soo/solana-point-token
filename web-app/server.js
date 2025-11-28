import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mintHandler from './api/mint.js';
import relayHandler from './api/relay.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock Vercel Request/Response for the handler
app.post('/api/mint', async (req, res) => {
    try {
        await mintHandler(req, res);
    } catch (error) {
        console.error("Local Server Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/relay', async (req, res) => {
    try {
        await relayHandler(req, res);
    } catch (error) {
        console.error("Local Server Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Local API Server running on http://localhost:${PORT}`);
});
