import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [userDetails, setUserDetails] = useState({});
  const [isDriver, setIsDriver] = useState(false);
  const [isRider, setIsRider] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')) || user;
    if (storedUser) {
      setUserDetails(storedUser);
      setIsDriver(storedUser.roles?.driver || false);
      setIsRider(storedUser.roles?.rider || false);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (onLogout) onLogout();
  };

  return (
    <>
      {/* Navbar */}
      {/* <div className="navbar">
        <h1>Dashboard</h1>
      </div> */}

      {/* Dashboard Content */}
      <div className="dashboard-container">
        <h2>Welcome, {userDetails.name}</h2>
        <div className="user-info">
          <p><strong>Roles:</strong> {isDriver && "Driver"}{isDriver && isRider && " and "} {isRider && "Rider"}</p>
        </div>

        <div className="action-buttons">
          {isDriver && <button className="dashboard-btn" onClick={() => navigate('/create-ride')}>Create Ride Pool</button>}
          {isRider && <button className="dashboard-btn" onClick={() => navigate('/search-rides')}>Search for Rides</button>}
          {isRider && <button className="dashboard-btn" onClick={() => navigate('/manage-bookings')}>Manage Bookings</button>}
          {isDriver && <button className="dashboard-btn" onClick={() => navigate('/manage-requests')}>Manage Requests</button>}
          {isDriver && <button className="dashboard-btn" onClick={() => navigate('/manage-rides')}>Manage Your Rides</button>}
        </div>

        {/* <button className="dashboard-btn logout-btn" onClick={handleLogout}>Logout</button> */}
      </div>
    </>
  );
};

export default Dashboard;
