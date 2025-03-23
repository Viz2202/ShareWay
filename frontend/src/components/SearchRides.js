import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchRides.css';

const SearchRides = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    riderName: '',
    riderPhoneNumber: '',
    riderStart: '',
    riderEnd: '',
    numPassengers: 1,
    allowPets: false,
    smokingAllowed: false,
    carpoolType: 'Economy',
    additionalRules: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    navigate('/find-driver', { state: formData });
  };

  return (
    <div className="search-rides-container">
      <h2>Provide Ride Details</h2>
      <form onSubmit={handleSubmit} className="ride-form">
        {/* Rider Name */}
        <div className="form-group">
          <label>Rider Name:</label>
          <input
            type="text"
            name="riderName"
            placeholder="Enter your name"
            value={formData.riderName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Rider Phone Number */}
        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="text"
            name="riderPhoneNumber"
            placeholder="Enter your phone number"
            value={formData.riderPhoneNumber}
            onChange={handleChange}
            required
          />
        </div>

        {/* Rider Start Location */}
        <div className="form-group">
          <label>From:</label>
          <input
            type="text"
            name="riderStart"
            placeholder="Starting location"
            value={formData.riderStart}
            onChange={handleChange}
            required
          />
        </div>

        {/* Rider End Location */}
        <div className="form-group">
          <label>To:</label>
          <input
            type="text"
            name="riderEnd"
            placeholder="Destination location"
            value={formData.riderEnd}
            onChange={handleChange}
            required
          />
        </div>

        {/* Number of Passengers */}
        <div className="form-group">
          <label>Number of Passengers:</label>
          <input
            type="number"
            name="numPassengers"
            value={formData.numPassengers}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        {/* Rider Preferences */}
        <div className="preferences-section">
          <h3>Rider Preferences</h3>

          {/* Allow Pets */}
          <div className="form-group">
            <label>Allow Pets:</label>
            <input
              type="checkbox"
              name="allowPets"
              checked={formData.allowPets}
              onChange={handleChange}
            />
          </div>

          {/* Smoking Allowed */}
          <div className="form-group">
            <label>Smoking Allowed:</label>
            <input
              type="checkbox"
              name="smokingAllowed"
              checked={formData.smokingAllowed}
              onChange={handleChange}
            />
          </div>

          {/* Carpool Type */}
          <div className="form-group">
            <label>Carpool Type:</label>
            <select
              name="carpoolType"
              value={formData.carpoolType}
              onChange={handleChange}
              required
            >
              <option value="Economy">Economy</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          {/* Additional Rules */}
          <div className="form-group">
            <label>Additional Rules:</label>
            <textarea
              name="additionalRules"
              placeholder="Enter any additional rules"
              value={formData.additionalRules}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default SearchRides;