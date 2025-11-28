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
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';

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
            <Route path="/split" element={<Split />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/chats" element={<ChatList />} />
            <Route path="/chats/:roomId" element={<ChatRoom />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/request" element={<Request />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;
