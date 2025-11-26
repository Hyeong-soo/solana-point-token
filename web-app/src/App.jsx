import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';

// Pages
import Dashboard from './pages/Dashboard';
import Buy from './pages/Buy';
import Send from './pages/Send';
import Request from './pages/Request';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Split from './pages/Split';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/buy" element={<Buy />} />
            <Route path="/send" element={<Send />} />
            <Route path="/request" element={<Request />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/split" element={<Split />} />
          </Route>
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;

