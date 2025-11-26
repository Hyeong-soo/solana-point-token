const {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    clusterApiUrl,
} = require('@solana/web3.js');
const {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const fs = require('fs');

async function main() {
    // 1. Connect to Devnet
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    console.log('Connected to Devnet');

    // 2. Generate a new wallet (keypair)
    const payer = Keypair.generate();
    console.log('Generated new wallet:', payer.publicKey.toBase58());

    // Save wallet to file for later use
    fs.writeFileSync(
        'wallet.json',
        JSON.stringify(Array.from(payer.secretKey))
    );
    console.log('Wallet secret key saved to wallet.json');

    // 3. Airdrop SOL
    console.log('Requesting airdrop...');
    try {
        const airdropSignature = await connection.requestAirdrop(
            payer.publicKey,
            2 * LAMPORTS_PER_SOL // 2 SOL
        );

        const latestBlockHash = await connection.getLatestBlockhash();

        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: airdropSignature,
        });
        console.log('Airdrop successful!');
    } catch (error) {
        console.error('Airdrop failed:', error);
        console.log('Please try again or fund the wallet manually.');
        return;
    }

    // 4. Create Mint (The Token)
    console.log('Creating "POINT" token mint...');
    const mint = await createMint(
        connection,
        payer,
        payer.publicKey, // Mint Authority
        payer.publicKey, // Freeze Authority
        2 // Decimals (like KRW, usually 0 or 2, let's use 2 for cents)
    );
    console.log('Token Mint Address:', mint.toBase58());

    // Save mint address
    fs.writeFileSync('mint.txt', mint.toBase58());

    // 5. Create Token Account for the payer
    console.log('Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );
    console.log('Token Account:', tokenAccount.address.toBase58());

    // 6. Mint Tokens
    console.log('Minting 1,000,000 POINT tokens...');
    await mintTo(
        connection,
        payer,
        mint,
        tokenAccount.address,
        payer,
        1000000 * 100 // Amount * 10^decimals
    );
    console.log('Minted 1,000,000 POINT tokens to', tokenAccount.address.toBase58());

    console.log('\n--- SUMMARY ---');
    console.log('Wallet Public Key:', payer.publicKey.toBase58());
    console.log('Token Mint Address:', mint.toBase58());
    console.log('Token Account:', tokenAccount.address.toBase58());
    console.log('Balance: 1,000,000 POINT');
    console.log('See transaction on explorer: https://explorer.solana.com/address/' + tokenAccount.address.toBase58() + '?cluster=devnet');
}

main().catch(err => {
    console.error(err);
});
