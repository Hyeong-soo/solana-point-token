import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { MINT_ADDRESS } from '../src/utils/constants.js';

// Vercel Serverless Function
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userAddress, amount } = req.body;

        if (!userAddress || !amount) {
            return res.status(400).json({ error: 'Missing userAddress or amount' });
        }

        // 1. Load Secret Key (Securely from Server Environment)
        const secretString = process.env.TREASURY_SECRET;
        if (!secretString) {
            console.error("TREASURY_SECRET is missing in environment variables.");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        let secretKey;
        try {
            secretKey = Uint8Array.from(JSON.parse(secretString));
        } catch (e) {
            console.error("Failed to parse TREASURY_SECRET:", e);
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const adminKeypair = Keypair.fromSecretKey(secretKey);

        // 2. Connect to Solana
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const userPublicKey = new PublicKey(userAddress);

        // 3. Get/Create User's Token Account
        // Note: In a real app, we might want to check if it exists first to avoid paying rent if not needed,
        // but getOrCreate is convenient. Admin pays for rent here.
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            adminKeypair, // Payer
            MINT_ADDRESS,
            userPublicKey
        );

        // 4. Mint Tokens
        const mintAmount = BigInt(Math.floor(Number(amount) * 100)); // Decimals = 2

        const signature = await mintTo(
            connection,
            adminKeypair, // Payer
            MINT_ADDRESS, // Mint
            userTokenAccount.address, // Destination
            adminKeypair, // Authority
            mintAmount
        );

        return res.status(200).json({ success: true, signature });

    } catch (error) {
        console.error("Minting error:", error);
        return res.status(500).json({ error: error.message || 'Minting failed' });
    }
}
