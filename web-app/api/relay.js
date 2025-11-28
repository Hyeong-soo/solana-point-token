import { Connection, Keypair, Transaction } from '@solana/web3.js';

// Vercel Serverless Function
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { transaction: serializedTx } = req.body;

        if (!serializedTx) {
            return res.status(400).json({ error: 'Missing transaction' });
        }

        // 1. Load Secret Key
        const secretString = process.env.TREASURY_SECRET;
        if (!secretString) {
            return res.status(500).json({ error: 'Server configuration error' });
        }
        const secretKey = Uint8Array.from(JSON.parse(secretString));
        const treasuryKeypair = Keypair.fromSecretKey(secretKey);

        // 2. Connect to Solana
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        // 3. Deserialize Transaction
        const transaction = Transaction.from(Buffer.from(serializedTx, 'base64'));

        // 4. Sign as Fee Payer (Treasury)
        transaction.partialSign(treasuryKeypair);

        // 5. Send & Confirm
        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        return res.status(200).json({ success: true, signature });

    } catch (error) {
        console.error("Relay error:", error);
        return res.status(500).json({ error: error.message || 'Relay failed' });
    }
}
