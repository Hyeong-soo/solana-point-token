import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../utils/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Keypair } from '@solana/web3.js';
import { Loader2, GraduationCap } from 'lucide-react';
import { TREASURY_ADDRESS } from '../utils/constants';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        studentId: '',
        password: '',
        name: '',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Generate Solana Wallet
            let publicKey;
            let secretKey;

            if (formData.studentId === 'admin') {
                // Admin uses the Treasury Address (Public Key only)
                // Private Key is NOT stored in Firestore/Frontend for security.
                publicKey = TREASURY_ADDRESS.toBase58();
                secretKey = []; // No secret key for admin in frontend
            } else {
                const newKeypair = Keypair.generate();
                publicKey = newKeypair.publicKey.toBase58();
                secretKey = Array.from(newKeypair.secretKey);
            }

            // 2. Create Firebase Auth User
            // Map Student ID to a dummy email for Firebase Auth
            let email = `${formData.studentId}@point.app`;

            // Special Admin Registration
            if (formData.studentId === 'admin') {
                email = 'admin@point.app';
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
            const user = userCredential.user;

            // 3. Save Profile to Firestore
            await setDoc(doc(db, "users", user.uid), {
                studentId: formData.studentId,
                name: formData.name,
                department: formData.department,
                walletAddress: publicKey,
                encryptedPrivateKey: JSON.stringify(secretKey), // Simple storage for demo
                createdAt: new Date().toISOString(),
                friends: []
            });

            // 4. Save mapping for friend search (optional, but good for lookup)
            await setDoc(doc(db, "student_lookup", formData.studentId), {
                uid: user.uid,
                name: formData.name,
                address: publicKey
            });

            alert("Registration successful! Your wallet has been created.");
            navigate('/');

        } catch (err) {
            console.error("Registration failed:", err);
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-postech-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-postech-200">
                        <GraduationCap size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Sign Up</h1>
                    <p className="text-gray-500 text-sm mt-1">Create your campus wallet</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Student ID</label>
                        <input
                            type="text"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleChange}
                            placeholder="e.g. 20250145"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-postech-500 focus:ring-2 focus:ring-postech-100 transition-all font-medium"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-postech-500 focus:ring-2 focus:ring-postech-100 transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-postech-500 focus:ring-2 focus:ring-postech-100 transition-all font-medium"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="CS"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-postech-500 focus:ring-2 focus:ring-postech-100 transition-all font-medium"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-postech-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-postech-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-postech-200"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-postech-600 font-bold hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
