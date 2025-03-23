import React from 'react';
import './Navbar.css';

const Navbar = ({ onLogout }) => {
  return (
    <nav className="navbar">
      <h1 className="app-name">ShareWay</h1>
      <button className="logout-button" onClick={onLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;
