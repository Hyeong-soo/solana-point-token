import { PublicKey } from '@solana/web3.js';

export const MINT_ADDRESS = new PublicKey('BuV4gcuXRVGKewkytasvGjhu6YBzuajMFUBDNs7hVM9z');

// DEMO ONLY: Treasury Secret Key to allow minting from frontend
// In a real app, this would be on a secure backend.
export const DEMO_TREASURY_SECRET = new Uint8Array(JSON.parse(import.meta.env.VITE_TREASURY_SECRET));
