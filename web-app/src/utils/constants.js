import { PublicKey } from '@solana/web3.js';

export const MINT_ADDRESS = new PublicKey('BuV4gcuXRVGKewkytasvGjhu6YBzuajMFUBDNs7hVM9z');

// DEMO ONLY: Treasury Secret Key to allow minting from frontend
// In a real app, this would be on a secure backend.
export const DEMO_TREASURY_SECRET = new Uint8Array([188, 184, 29, 197, 75, 81, 216, 218, 97, 249, 182, 229, 50, 235, 127, 62, 127, 147, 162, 198, 136, 174, 121, 76, 171, 76, 149, 50, 159, 143, 46, 92, 229, 42, 33, 228, 217, 62, 130, 186, 4, 20, 118, 254, 22, 204, 235, 32, 179, 246, 221, 76, 61, 24, 106, 34, 46, 90, 9, 112, 217, 181, 124, 94]);
