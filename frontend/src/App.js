import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import CreateRidePool from './components/CreateRidePool';
import ManageRides from './components/ManageRides';
import SearchRides from './components/SearchRides';
import FindDriver from './components/FindDriver';
import ManageRequests from './components/ManageRequests';
import ManageBookings from './components/ManageBookings';
import Messages from "./components/Messages";
import Navbar from './components/Navbar';  // Import the Navbar component
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  // Check localStorage for token on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser({ token, ...JSON.parse(userData) });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LoginPage setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/create-ride" element={user ? <CreateRidePool /> : <Navigate to="/" />} />
          <Route path="/manage-rides" element={user ? <ManageRides /> : <Navigate to="/" />} />
          <Route path="/search-rides" element={user ? <SearchRides /> : <Navigate to="/" />} />
          <Route path="/find-driver" element={user ? <FindDriver /> : <Navigate to="/" />} />
          <Route path="/manage-requests" element={user ? <ManageRequests /> : <Navigate to="/" />} />
          <Route path="/manage-bookings" element={user ? <ManageBookings /> : <Navigate to="/" />} />
          <Route path="/messages" element={user ? <Messages /> : <Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

// Layout Component to handle navbar visibility
function Layout({ user, onLogout, children }) {
  const location = useLocation();

  // Hide navbar on Login and Register pages
  const hideNavbar = location.pathname === '/' || location.pathname === '/register';

  return (
    <>
      {!hideNavbar && user && <Navbar onLogout={onLogout} />}
      {children}
    </>
  );
}

export default App;
