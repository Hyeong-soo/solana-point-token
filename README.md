# Campus Point Token System (POSTECH Edition)

A blockchain-based campus currency system built on **Solana**, designed for a seamless "wallet-less" experience for students.

## 🚀 Features

### 1. Custodial Wallet System
- **No Wallet Install Required**: Students sign up/login with their **Student ID** (e.g., `20250145`).
- **Automatic Wallet Generation**: The system automatically generates and manages a Solana wallet for each student.
- **Secure Storage**: Encrypted private keys are stored in Firestore (Demo implementation).

### 2. Friend System
- **Search & Add**: Find friends by Student ID.
- **Real-time Interaction**: Send POINTs to friends easily.

### 3. Split Bill (Dutch Pay)
- **N-bbang**: Select multiple friends to split a bill.
- **Flexible Adjustment**: Automatically calculates 1/N, with options to adjust individual shares.
- **Batch Requests**: Sends payment requests to all selected friends in one click.

### 4. POSTECH Brand UI
- **Design**: Customized with POSTECH's official brand colors (Red `#A61955`, Orange `#F6A700`).
- **UX**: Modern, mobile-friendly interface.

---

## 🛠️ Tech Stack

- **Blockchain**: Solana (Devnet), SPL Token
- **Frontend**: React, Vite, Tailwind CSS
- **Backend / DB**: Firebase Authentication, Firestore
- **Wallet**: Custom Custodial Context (replacing standard Wallet Adapter)

---

## 📂 Project Structure

```
solana-point-token/
├── web-app/            # React Frontend Application
├── create_token.js     # Script to mint POINT token
├── airdrop.js          # Script to airdrop SOL/POINT

└── ...
```

---

## ⚡️ Getting Started

### 1. Prerequisites
- Node.js (v16+)
- Firebase Project (configured in `web-app/src/utils/firebase.js`)

### 2. Installation

```bash
cd web-app
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📝 Scripts

- **`node create_token.js`**: Mints the initial supply of POINT tokens.
- **`node airdrop.js`**: Airdrops SOL to the admin wallet.


---

## ⚠️ Note

This project is a **Proof of Concept (PoC)**.
- Private keys are stored in Firestore for demonstration purposes. **Do not use in production without a secure KMS.**
- Runs on **Solana Devnet**.
