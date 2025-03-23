import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css';  // Add your custom CSS

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState({ rider: false, driver: false });  // State for both roles
  const [error, setError] = useState('');
  const navigate = useNavigate();  // Initialize navigate hook

  const handleRegister = async (e) => {
    e.preventDefault();
  
    if (!roles.rider && !roles.driver) {
      setError('Please select at least one role (Rider or Driver)');
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        email,
        password,
        fullName,
        phone,
        roles,  // Send roles as an object
      });
  
      navigate('/');
    } catch (err) {
      console.log('Registration Error:', err.response ? err.response.data : err);  // Log the detailed error response
      setError('Error during registration');
    }
  };
  
  
  const handleRoleChange = (e) => {
    const { name, checked } = e.target;
    setRoles((prevRoles) => ({
      ...prevRoles,
      [name]: checked,
    }));
  };

  return (
    <div className="register-wrapper">
      {/* Left Side - GIF */}
      <div className="gif-container">
        <img src={'/assets/car moving.gif'} alt="Carpooling Animation" />
      </div>

      {/* Vertical Separator */}
      <div className="separator"></div>

      {/* Right Side - Register Form */}
      <div className="register-container">
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-group">
            <label>User Roles</label>
            <div className="role-checkboxes">
              <div>
                <input
                  type="checkbox"
                  name="rider"
                  checked={roles.rider}
                  onChange={handleRoleChange}
                />
                <label>Rider</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  name="driver"
                  checked={roles.driver}
                  onChange={handleRoleChange}
                />
                <label>Driver</label>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit">Register</button>
        </form>

        {/* Link to Login Page */}
        <p className="login-link">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
