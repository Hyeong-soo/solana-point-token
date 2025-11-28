# Solana Point Token Web App 🪙

A decentralized web application for managing university points (POINT) on the Solana blockchain. This app allows students to buy, send, and split bills using POINT tokens, with a seamless integration of Firebase for social features and Solana for transactions.

## 🌟 Features

-   **Wallet Integration**: Connect with Phantom Wallet.
-   **Point System**:
    -   **Buy POINT**: Purchase tokens using KRW (mock) or Credit Card (mock) with real-time exchange rates.
    -   **Send POINT**: Transfer tokens to friends instantly.
    -   **Transaction History**: View all your past transactions.
-   **Social & Settlements**:
    -   **Friend System**: Search and add friends by Student ID.
    -   **Split Bill**: Create settlement requests with friends.
    -   **Chat Rooms**: Discuss settlements in dedicated chat rooms with image sharing.
    -   **Smart Settlements**: Auto-completes when everyone pays. Creator can also manually mark payments.
-   **Admin Dashboard**:
    -   Manage treasury balance.
    -   View system-wide transaction stats.
    -   Mint new tokens.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, TailwindCSS
-   **Blockchain**: Solana Web3.js, SPL Token
-   **Backend / Database**: Firebase (Authentication, Firestore, Storage)
-   **Serverless**: Vercel Serverless Functions (for secure key management)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
-   Git
-   Phantom Wallet extension installed in your browser.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd solana-point-token/web-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Setup

Create a `.env` file in the root directory and add your keys:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Solana Configuration
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_MINT_ADDRESS=your_token_mint_address
VITE_TREASURY_WALLET_ADDRESS=your_treasury_public_key

# Admin / Backend Secrets (Do NOT expose in frontend code)
TREASURY_SECRET_KEY=[1,2,3,...] # JSON array of secret key
ADMIN_EMAIL=admin@postech.ac.kr
```

### Firebase Setup

1.  **Authentication**: Enable **Email/Password** sign-in.
2.  **Firestore**: Create a database and apply the security rules found in `firestore.rules`.
3.  **Storage**: Enable storage and apply the security rules found in `storage.rules`.

### Running Locally

```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## 🔒 Security

-   **Firestore Rules**: Strict rules are implemented to ensure users can only access their own data and settlements they are part of.
-   **Backend Relay**: Sensitive operations like minting tokens or paying gas fees for users are handled via a secure backend API (`/api/mint`, `/api/relay`) to protect the Treasury's private key.

## 📂 Project Structure

-   `/src`: Frontend React code.
-   `/api`: Serverless functions for backend logic.
-   `firestore.rules`: Security rules for the database.
-   `storage.rules`: Security rules for file storage.

## 📝 License

This project is for educational purposes.
