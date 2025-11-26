import React, { createContext, useContext, useState, useEffect } from 'react';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { auth, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const WalletContext = createContext({});

export const useWallet = () => useContext(WalletContext);
export const useConnection = () => useContext(WalletContext); // Mocking useConnection for compatibility

export const WalletProvider = ({ children }) => {
    const [publicKey, setPublicKey] = useState(null);
    const [keypair, setKeypair] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);

    // Hardcoded Devnet Connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    useEffect(() => {
        // Timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (loading) {
                setLoading(false);
                alert("Firebase Auth Timed Out. Please check your network or console.");
            }
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            clearTimeout(timeoutId); // Clear timeout on response
            if (user) {
                try {
                    // Fetch user profile from Firestore
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserProfile(data);

                        // Decrypt Private Key (Simple decryption for demo)
                        // In production, use a proper key management system
                        const secretKey = new Uint8Array(JSON.parse(data.encryptedPrivateKey));
                        const loadedKeypair = Keypair.fromSecretKey(secretKey);

                        setKeypair(loadedKeypair);
                        setPublicKey(loadedKeypair.publicKey);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    alert("Error fetching profile: " + error.message);
                }
            } else {
                setPublicKey(null);
                setKeypair(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const signTransaction = async (transaction) => {
        if (!keypair) throw new Error("No wallet connected");
        transaction.partialSign(keypair);
        return transaction;
    };

    const disconnect = async () => {
        await auth.signOut();
    };

    return (
        <WalletContext.Provider value={{
            publicKey,
            keypair,
            connection,
            signTransaction,
            disconnect,
            connected: !!publicKey,
            loading,
            userProfile
        }}>
            {children}
        </WalletContext.Provider>
    );
};
