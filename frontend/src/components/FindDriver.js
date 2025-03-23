import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import './FindDriver.css'; // Make sure to import the CSS file

const FindDriverPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state;
  const [startCoordinates, setStartCoordinates] = useState(null);
  const [endCoordinates, setEndCoordinates] = useState(null);
  const [matchingCarpools, setMatchingCarpools] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    allowPets: null,
    smokingAllowed: null,
    carpoolType: null
  });
  
  // Function to fetch coordinates for a given address using OpenCage API
  const getCoordinates = async (location) => {
    const apiKey = process.env.REACT_APP_OPENCAGE_API_KEY; // Your OpenCage API Key
    
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

  // Fetch coordinates when component is mounted or formData is available
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (formData) {
        try {
          const startCoords = await getCoordinates(formData.riderStart);
          const endCoords = await getCoordinates(formData.riderEnd);

          setStartCoordinates(startCoords);
          setEndCoordinates(endCoords);
        } catch (error) {
          console.error("Error while fetching coordinates:", error.message);
        }
      }
    };

    fetchCoordinates();
  }, [formData]);

  // Fetch matching carpooling options
  useEffect(() => {
    const fetchMatchingCarpools = async () => {
      if (startCoordinates && endCoordinates) {
        try {
          // Get matching carpools directly from the API
          const response = await axios.get('http://localhost:5000/api/find-drivers', {
            params: {
              riderStart: formData.riderStart,
              riderEnd: formData.riderEnd
            }
          });

          // The API now handles the matching logic, so we just display the results
          // But we'll format the match percentage for display
          const formattedCarpools = response.data.map(carpool => ({
            ...carpool,
            matchPercentage: typeof carpool.matchPercentage === 'number' 
              ? carpool.matchPercentage.toFixed(2) 
              : carpool.matchPercentage
          }));

          setMatchingCarpools(formattedCarpools);
        } catch (error) {
          console.error("Error fetching matching carpool options:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMatchingCarpools();
  }, [startCoordinates, endCoordinates, formData]);

  // Function to apply filters
  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      allowPets: null,
      smokingAllowed: null,
      carpoolType: null
    });
  };

  // Apply filters to the matching carpools
  const filteredCarpools = matchingCarpools.filter(carpool => {
    let matchesFilters = true;
    
    // Filter by pets
    if (filters.allowPets !== null) {
      matchesFilters = matchesFilters && carpool.preferences.allowPets === filters.allowPets;
    }
    
    // Filter by smoking
    if (filters.smokingAllowed !== null) {
      matchesFilters = matchesFilters && carpool.preferences.smokingAllowed === filters.smokingAllowed;
    }
    
    return matchesFilters;
  });

  const handleRequestRide = async (selectedCarpool) => {
    try {
      const bookingData = {
        riderName: formData.riderName, 
        riderPhoneNumber: formData.riderPhoneNumber,
        riderStart: formData.riderStart,
        riderEnd: formData.riderEnd,
        numPassengers: formData.numPassengers,
        allowPets: filters.allowPets ?? false,
        smokingAllowed: filters.smokingAllowed ?? false,
        carpoolType: filters.carpoolType ?? 'Economy',
        additionalRules: formData.additionalRules ?? '',
        status: 'pending',
        acceptedDriver: selectedCarpool._id
      };
      
      // Now you can log it after it's defined
      console.log('Sending request to book ride with data:', bookingData);
      console.log('Using endpoint:', 'http://localhost:5000/api/book-ride');
      
      const response = await axios.post('http://localhost:5000/api/book-ride', bookingData);
      
      if (response.status === 201) {
        alert('Booking request sent successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error booking ride:', error);
      alert('Failed to book ride. Please try again.');
    }
  };

  return (
    <div className="find-driver-container">
      <h2>Welcome to Find a Driver</h2>
      <p>We are looking for the best drivers for your ride. Please check the available options!</p>
      
      <div className="coordinates-section">
        <div className="coordinates-box">
          <h3>Rider Start Coordinates:</h3>
          {startCoordinates ? (
            <p>Latitude: {startCoordinates.lat}, Longitude: {startCoordinates.lng}</p>
          ) : (
            <p className="loading">Loading...</p>
          )}
        </div>

        <div className="coordinates-box">
          <h3>Rider End Coordinates:</h3>
          {endCoordinates ? (
            <p>Latitude: {endCoordinates.lat}, Longitude: {endCoordinates.lng}</p>
          ) : (
            <p className="loading">Loading...</p>
          )}
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading available drivers...</p>
      ) : (
        <>
          <div className="filter-container">
            <h3>Filter Options</h3>
            <div className="filter-options">
              <div className="filter-group">
                <label>Pets:</label>
                <select 
                  value={filters.allowPets === null ? 'all' : filters.allowPets.toString()} 
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('allowPets', value === 'all' ? null : value === 'true')
                  }}
                >
                  <option value="all">All</option>
                  <option value="true">Pets Allowed</option>
                  <option value="false">No Pets</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Smoking:</label>
                <select 
                  value={filters.smokingAllowed === null ? 'all' : filters.smokingAllowed.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('smokingAllowed', value === 'all' ? null : value === 'true')
                  }}
                >
                  <option value="all">All</option>
                  <option value="true">Smoking Allowed</option>
                  <option value="false">No Smoking</option>
                </select>
              </div>

              <button onClick={resetFilters} className="reset-filters-btn">Reset Filters</button>
            </div>
          </div>

          <div className="carpool-results">
            <h3>Available Drivers ({filteredCarpools.length})</h3>
            {filteredCarpools.length > 0 ? (
              filteredCarpools.map((carpool, index) => (
                <div key={index} className="carpool-card">
                  <h3>{carpool.name} - {carpool.vehicleName}</h3>
                  <p>From: {carpool.from} ({carpool.fromCoordinates.lat}, {carpool.fromCoordinates.lng})</p>
                  <p>To: {carpool.to} ({carpool.toCoordinates.lat}, {carpool.toCoordinates.lng})</p>
                  <p>Vehicle: {carpool.vehicleName} ({carpool.vehicleNumber})</p>
                  <p>Capacity: {carpool.vehicleCapacity}</p>
                  <p>Type: <span className="highlight">{carpool.carpoolType || 'Not specified'}</span></p>
                  <p>Preferences: {carpool.preferences.smokingAllowed ? 'Smoking Allowed' : 'No Smoking'}</p>
                  <p>Pets: {carpool.preferences.allowPets ? 'Pets Allowed' : 'No Pets'}</p>
                  <p>Match Percentage: {carpool.matchPercentage}%</p>
                  <button 
                    onClick={() => {
                      console.log('Button clicked');
                      console.log('Carpool data:', carpool);
                      if (carpool) {
                        handleRequestRide(carpool);
                      } else {
                        console.error('Carpool data is undefined');
                      }
                    }}
                  >
                    Request Ride
                  </button>
                </div>
              ))
            ) : (
              <p className="no-results">No matching carpooling options found with selected filters</p>
            )}
          </div>
        </>
      )}

      <button onClick={() => navigate('/dashboard')} className="back-button">Go Back</button>
    </div>
  );
};

export default FindDriverPage;