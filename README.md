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

### 3. Project Configuration
1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd solana-point-token
    ```
2.  Navigate to the web app directory:
    ```bash
    cd web-app
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  **Configure Firebase**:
    - Open `src/utils/firebase.js`.
    - Replace the `firebaseConfig` object with the one you copied in Step 2.

### 4. Run the Application
Start the development server:

```bash
npm run dev
```

Open your browser and visit `http://localhost:5173`.

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

## ⚠️ Important Notes

- **Devnet Only**: This application is configured to run on the Solana Devnet.
- **Security**: Private keys are stored in Firestore for demonstration purposes. **Do not use this code in a production environment without implementing a secure Key Management System (KMS).**
- **Firestore Rules**: In "Test Mode", anyone can read/write to your database. For production, you must configure Firestore Security Rules.
