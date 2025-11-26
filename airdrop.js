const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');

async function main() {
    // Connect to Devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load Treasury Wallet
    const secretKey = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
    const treasury = Keypair.fromSecretKey(new Uint8Array(secretKey));

    console.log(`Treasury Address: ${treasury.publicKey.toBase58()}`);

    // Check Balance
    let balance = await connection.getBalance(treasury.publicKey);
    console.log(`Current Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    // Request Airdrop (2 SOL)
    console.log('Requesting airdrop of 2 SOL...');
    try {
        const signature = await connection.requestAirdrop(treasury.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);

        balance = await connection.getBalance(treasury.publicKey);
        console.log(`New Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        console.log('Airdrop successful!');
    } catch (e) {
        console.error('Airdrop failed (Rate limit or other error):', e.message);
        console.log('Try using a web faucet: https://faucet.solana.com/');
    }
}

main();
