import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateRidePool.css';

const CreateRidePool = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    date: '',
    from: '',
    to: '',
    vehicleName: '',
    vehicleNumber: '',
    vehicleColor: '',
    vehicleCapacity: '',
    eta: '',
    etd: '',
    allowPets: false,           // Preference for pets
    carpoolType: 'Economy',     // Preference for carpool type
    additionalRules: '',        // Custom rules
    smokingAllowed: false,      // New preference for smoking
  });
  

  useEffect(() => {
    // Fetch name and phone number from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setFormData((prev) => ({
        ...prev,
        name: storedUser.name || '',
        phoneNumber: storedUser.phone || '',
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,  // Handle checkbox inputs
    }));
  };

  // ✅ Function to get coordinates from Google Maps API
const getCoordinates = async (location) => {
  const apiKey = process.env.REACT_APP_OPENCAGE_API_KEY;
  
  if (!apiKey) {
    console.error("API Key is undefined. Make sure your .env file is set up correctly.");
    throw new Error("API key missing");
  }
  
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry;
      return { lat, lng };
    } else {
      throw new Error("Location not found");
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw new Error("Invalid location");
  }
};

  // ✅ Fixed `handleSubmit` function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Fetch coordinates for 'from' and 'to' locations
      const fromCoords = await getCoordinates(formData.from);
      const toCoords = await getCoordinates(formData.to);

      if (!fromCoords || !toCoords) {
        alert("Invalid locations. Please enter correct locations.");
        return;
      }

      // ✅ Add coordinates to ride data
      const rideData = {
        ...formData,
        fromCoordinates: fromCoords,
        toCoordinates: toCoords,
      };

      await axios.post("http://localhost:5000/api/maincarpool", rideData);
      alert("Ride Pool Created Successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating ride:", error);
      alert(`Failed to create ride pool: ${error.response ? error.response.data.message : error.message}`);
    }
  };

  return (
    <div className="create-ride-container">
  <h2>Create a Ride Pool</h2>
  <form onSubmit={handleSubmit}>
    <label>Date:</label>
    <input
      type="date"
      name="date"
      value={formData.date}
      onChange={handleChange}
      required
    />

    <label>From:</label>
    <input
      type="text"
      name="from"
      value={formData.from}
      onChange={handleChange}
      required
    />

    <label>To:</label>
    <input
      type="text"
      name="to"
      value={formData.to}
      onChange={handleChange}
      required
    />

    <label>Vehicle Name:</label>
    <input
      type="text"
      name="vehicleName"
      value={formData.vehicleName}
      onChange={handleChange}
      required
    />

    <label>Vehicle Number:</label>
    <input
      type="text"
      name="vehicleNumber"
      value={formData.vehicleNumber}
      onChange={handleChange}
      required
    />

    <label>Vehicle Color:</label>
    <input
      type="text"
      name="vehicleColor"
      value={formData.vehicleColor}
      onChange={handleChange}
      required
    />

    <label>Vehicle Capacity:</label>
    <input
      type="number"
      name="vehicleCapacity"
      value={formData.vehicleCapacity}
      onChange={handleChange}
      required
    />

    <label>Estimated Time of Departure (ETD):</label>
    <input
      type="time"
      name="etd"
      value={formData.etd}
      onChange={handleChange}
      required
    />

    <label>Estimated Time of Arrival (ETA):</label>
    <input
      type="time"
      name="eta"
      value={formData.eta}
      onChange={handleChange}
      required
    />

    {/* New input fields for preferences */}
    <label>Allow Pets:</label>
    <input
      type="checkbox"
      name="allowPets"
      checked={formData.allowPets}
      onChange={handleChange}
    />

    <label>Smoking Allowed:</label>
    <input
      type="checkbox"
      name="smokingAllowed"
      checked={formData.smokingAllowed}
      onChange={handleChange}
    />

    <label>Carpool Type:</label>
    <select
      name="carpoolType"
      value={formData.carpoolType}
      onChange={handleChange}
    >
      <option value="Economy">Economy</option>
      <option value="Luxury">Luxury</option>
    </select>

    <label>Additional Rules:</label>
    <textarea
      name="additionalRules"
      value={formData.additionalRules}
      onChange={handleChange}
      placeholder="Enter custom rules for the ride"
    />

    <button type="submit">Create Ride</button>
  </form>
  <button onClick={() => navigate('/dashboard')}>Go Back</button>
</div>
  );
};

export default CreateRidePool;
