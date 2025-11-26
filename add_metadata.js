const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createMetadataAccountV3 } = require('@metaplex-foundation/mpl-token-metadata');
const { createSignerFromKeypair, signerIdentity, publicKey } = require('@metaplex-foundation/umi');
const fs = require('fs');

async function main() {
    // 1. Load Wallet and Mint Address
    const walletSecret = JSON.parse(fs.readFileSync('wallet.json', 'utf-8'));
    const mintAddress = fs.readFileSync('mint.txt', 'utf-8').trim();

    console.log('Loaded Mint Address:', mintAddress);

    // 2. Setup Umi
    const umi = createUmi('https://api.devnet.solana.com');

    // Create signer from loaded secret key
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletSecret));
    const signer = createSignerFromKeypair(umi, keypair);

    umi.use(signerIdentity(signer));
    console.log('Umi set up with wallet:', signer.publicKey);

    // 3. Create Metadata
    console.log('Creating Metadata...');

    const transaction = createMetadataAccountV3(umi, {
        mint: publicKey(mintAddress),
        mintAuthority: signer,
        payer: signer,
        data: {
            name: "POINT",
            symbol: "POINT",
            uri: "", // We can add a JSON URI here later for image/description
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
        },
        isMutable: true,
        collectionDetails: null,
    });

    const result = await transaction.sendAndConfirm(umi);
    // const signature = base58.deserialize(result.signature); // Requires importing base58

    console.log('Metadata added successfully!');
    // console.log('Signature:', signature);
    console.log('Check Explorer: https://explorer.solana.com/address/' + mintAddress + '?cluster=devnet');
}

main().catch(err => {
    console.error('Error adding metadata:', err);
});
