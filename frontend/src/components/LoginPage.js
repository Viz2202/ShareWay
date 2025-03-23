import React, { useState , useEffect} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Move this effect to handle navigation after authentication
  useEffect(() => {
    // When authenticated state becomes true, navigate to dashboard
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  const handleLogin = (token, user) => {
    console.log("Saving to localStorage:", user); // Debug what's being saved
    // Save token and user data to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  
    // Determine the user's role(s)
    const isDriver = user.roles.driver;
    const isRider = user.roles.rider;
  
    // Update the user state in the parent component
    setUser({ token, ...user, isDriver, isRider });
  
    // Set authenticated to true to trigger navigation via useEffect
    setAuthenticated(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });
  
      console.log('Raw user data:', response.data.user);
      console.log('Available fields:', Object.keys(response.data.user));
      
      const { token, user } = response.data;
  
      if (token && user) {
        // Find the name field from various possible properties
        // This will help identify which field actually contains the name
        const possibleNameFields = ['name', 'fullName', 'userName', 'firstName', 'displayName'];
        console.log('Checking possible name fields:');
        possibleNameFields.forEach(field => {
          console.log(`${field}:`, user[field]);
        });
        
        // Use the first available name field or default to 'User'
        const nameValue = possibleNameFields.find(field => user[field]) 
                           ? user[possibleNameFields.find(field => user[field])]
                           : 'User';
        
        const userData = {
          name: nameValue,
          roles: user.roles || [],
          phone: user.phone
        };
        
        console.log('Final userData:', userData);
        handleLogin(token, userData);
      } else {
        setError('Invalid response from server - no token or user data received');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    
    <div className="login-wrapper">
      {/* Left side for GIF */}
      <div className="gif-container">
        <img src={'/assets/car moving.gif'} alt="Moving Car" className="car-gif" />
      </div>

      {/* Vertical Separator */}
      <div className="separator"></div>

      {/* Right side for Login Form */}
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
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
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit">Login</button>
        </form>
        <p className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
