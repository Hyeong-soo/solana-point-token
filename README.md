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

### 5. Credit Card Payment (Simulation)
- **Mock Payment**: Simulates a Stripe-like credit card payment flow.
- **UI**: Includes card input form with validation and processing animations.
- **Demo**: Allows users to experience the "Buy POINT" flow without real transactions.

---

## 🛠️ Tech Stack

- **Blockchain**: Solana (Devnet), SPL Token
- **Frontend**: React, Vite, Tailwind CSS
- **Backend / DB**: Firebase Authentication, Firestore
- **Wallet**: Custom Custodial Context (replacing standard Wallet Adapter)

---

## ⚡️ Getting Started (Step-by-Step)

Follow these instructions to set up and run the project locally.

### 1. Prerequisites
- **Node.js** (v16 or higher) installed.
- **Git** installed.
- A **Google Account** (for Firebase).

### 2. Firebase Setup (Required)
This project uses Firebase for user authentication and database.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and give it a name (e.g., `solana-point-app`).
3.  **Authentication**:
    - Go to **Build > Authentication**.
    - Click **"Get Started"**.
    - Select **"Email/Password"** as a Sign-in provider and **Enable** it.
4.  **Firestore Database**:
    - Go to **Build > Firestore Database**.
    - Click **"Create Database"**.
    - Choose **"Start in test mode"** (for development purposes).
    - Select a location (e.g., `asia-northeast3` for Seoul).
5.  **Get Configuration**:
    - Click the **Gear icon (Project settings)** > **General**.
    - Scroll down to "Your apps" and click the **Web (</>)** icon.
    - Register app (nickname: `WebApp`).
    - **Copy the `firebaseConfig` object**.

### 3. Clone & Install
1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd solana-point-token
    ```
2.  Install dependencies for the scripts (root directory):
    ```bash
    npm install
    ```
3.  Install dependencies for the web app:
    ```bash
    cd web-app
    npm install
    ```

### 4. Solana Setup (Admin Wallet & Token Mint)
You need to generate a Treasury Wallet and the POINT Token Mint.

1.  Go back to the root directory:
    ```bash
    cd ..
    ```
2.  Run the token creation script:
    ```bash
    node create_token.js
    ```
    - This script will:
        - Generate a new **Treasury Wallet** (`wallet.json`).
        - Airdrop SOL to the wallet (Devnet).
        - Create the **POINT Token Mint**.
        - Save the Mint Address to `mint.txt`.
        - Mint initial tokens to the treasury.

### 5. Environment Configuration
1.  Navigate to the `web-app` directory:
    ```bash
    cd web-app
    ```
2.  Create a `.env` file:
    ```bash
    touch .env
    ```
3.  Add the following variables to `.env`:
    ```env
    # Firebase Config (From Step 2)
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

    # Treasury Secret (From wallet.json)
    # Open wallet.json in the root directory and copy the array content: [12, 34, ...]
    VITE_TREASURY_SECRET=[12, 34, 56, ...] 
    ```

### 6. App Configuration
1.  Open `mint.txt` in the root directory and copy the address (e.g., `J5XP...`).
2.  Open `web-app/src/utils/constants.js`.
3.  Update the `MINT_ADDRESS` constant:
    ```javascript
    export const MINT_ADDRESS = new PublicKey('YOUR_MINT_ADDRESS_FROM_MINT_TXT');
    ```

### 7. Run the Application
1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and visit `http://localhost:5173`.

### 8. Admin Account Setup (Critical)
To access the Admin Dashboard and manage the system:

1.  Go to the **Register** page (`/register`).
2.  Enter **Student ID**: `admin`.
3.  Fill in other details (Name: Admin, Dept: HQ, Password: ...).
4.  Click **Create Account**.
    - The system recognizes the ID `admin` and automatically links it to the **Treasury Wallet** (using the secret from `.env`).
5.  You will be redirected to the **Admin Dashboard**.

---

## � Project Structure

```
solana-point-token/
├── web-app/            # React Frontend Application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Wallet & Auth Context
│   │   ├── pages/      # Application Pages (Login, Dashboard, etc.)
│   │   └── utils/      # Firebase config & Constants
├── create_token.js     # Script to mint POINT token (Admin only)
├── airdrop.js          # Script to airdrop SOL (Admin only)
└── README.md
```

---

### 9. Deployment (Vercel)
The easiest way to deploy this app is using **Vercel**.

1.  Push your code to a GitHub repository.
2.  Go to [Vercel](https://vercel.com) and sign up/login.
3.  Click **"Add New..."** > **"Project"**.
4.  Import your GitHub repository.
5.  **Environment Variables**:
    - In the "Configure Project" step, expand **"Environment Variables"**.
    - Add all variables from your `.env` file (`VITE_FIREBASE_...`, `VITE_TREASURY_SECRET`).
    - **Note**: For `VITE_TREASURY_SECRET`, paste the array string exactly as it is in your `.env` (e.g., `[12, 34, ...]`).
6.  Click **"Deploy"**.

---

## ⚠️ Important Notes

- **Devnet Only**: This application is configured to run on the Solana Devnet.
- **Security Warning (Critical)**:
    - This project uses a **Treasury Secret Key** (`VITE_TREASURY_SECRET`) in the frontend code to allow the Admin to mint tokens directly from the browser.
    - **This is NOT secure for a real production application.** In a real app, the secret key should NEVER be exposed to the client. It should be stored on a secure backend server (e.g., Node.js, Python), and the frontend should send requests to that backend.
    - **For this Demo**: It is acceptable for demonstration purposes, but be aware that anyone with access to the deployed frontend code could potentially extract this key if they know where to look.
- **Firestore Rules**: In "Test Mode", anyone can read/write to your database. For production, you must configure Firestore Security Rules.

## 🔒 Firebase Security Rules (Production)

Before deploying, you **MUST** update your Security Rules to prevent unauthorized access.

### 1. Firestore Rules
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Firestore Database** > **Rules**.
3.  Copy and paste the contents of `web-app/firestore.rules` into the editor.
4.  Click **Publish**.

### 2. Storage Rules
1.  Navigate to **Storage** > **Rules**.
2.  Copy and paste the contents of `web-app/storage.rules` into the editor.
3.  Click **Publish**.

