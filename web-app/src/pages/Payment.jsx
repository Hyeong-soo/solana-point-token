import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Payment = () => {
    const { publicKey } = useWallet();
    const [copied, setCopied] = useState(false);
    const [studentId, setStudentId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentId = async () => {
            if (!auth.currentUser) return;
            try {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userDoc.exists()) {
                    setStudentId(userDoc.data().studentId);
                }
            } catch (err) {
                console.error("Failed to fetch student ID:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentId();
    }, []);

    const handleCopy = () => {
        if (studentId) {
            navigator.clipboard.writeText(studentId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!publicKey) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Wallet Not Connected</h2>
                <p className="text-gray-500 mb-6">Please connect your wallet to use the payment feature.</p>
                <Link to="/" className="bg-postech-600 text-white px-6 py-3 rounded-xl font-bold">
                    Go Home
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-postech-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto relative">
            {/* Header */}
            <div className="flex items-center mb-6">
                <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800 ml-2">Payment Code</h1>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-postech-600 p-6 text-center">
                    <p className="text-postech-100 text-sm font-medium mb-1">Show this code to pay</p>
                    <h2 className="text-white text-2xl font-bold">Student ID Payment</h2>
                </div>

                <div className="p-8 flex flex-col items-center gap-8 bg-white">
                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        {studentId ? (
                            <QRCode
                                value={studentId}
                                size={200}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        ) : (
                            <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                                No Student ID
                            </div>
                        )}
                    </div>

                    {/* Barcode */}
                    <div className="w-full flex justify-center overflow-hidden">
                        {studentId && (
                            <Barcode
                                value={studentId}
                                width={2}
                                height={60}
                                displayValue={true}
                                background="transparent"
                            />
                        )}
                    </div>

                    {/* ID Display */}
                    <div className="w-full bg-gray-50 rounded-xl p-4 flex items-center justify-between group cursor-pointer" onClick={handleCopy}>
                        <div className="overflow-hidden">
                            <p className="text-xs text-gray-400 mb-1">Student ID</p>
                            <p className="text-lg font-mono text-gray-800 truncate font-bold tracking-wider">
                                {studentId || 'Not Found'}
                            </p>
                        </div>
                        <div className="pl-3 text-gray-400 group-hover:text-postech-600 transition-colors">
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-8 text-center">
                    <p className="text-xs text-gray-400">
                        This code identifies you for payment approval. <br />
                        Valid for use at supported terminals.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Payment;
