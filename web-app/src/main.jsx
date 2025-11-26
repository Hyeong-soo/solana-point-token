import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Polyfill for Solana web3.js
import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;

// DEBUG: Global Error Handler
window.onerror = function (message, source, lineno, colno, error) {
  alert(`Error: ${message}\nSource: ${source}:${lineno}`);
};
window.onunhandledrejection = function (event) {
  alert(`Unhandled Promise Rejection: ${event.reason}`);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
