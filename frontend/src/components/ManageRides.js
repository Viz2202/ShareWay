import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from "react-icons/fa";
import axios from 'axios';
import './ManageRides.css';

const ManageRides = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRide, setExpandedRide] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.phone) {
          setError('User not found or phone number missing');
          setLoading(false);
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/myrides?phone=${storedUser.phone}`);
        setRides(response.data);
      } catch (err) {
        setError('Failed to fetch rides');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const toggleExpand = (rideId) => {
    setExpandedRide(expandedRide === rideId ? null : rideId);
  };

  const handleDelete = async (rideId) => {
    const confirmDelete = window.confirm("❗ Are you sure you want to delete this ride?");
    
    if (!confirmDelete) return; // If user cancels, do nothing
  
    try {
      await axios.delete(`http://localhost:5000/api/deleteride/${rideId}`);
      setRides(rides.filter(ride => ride._id !== rideId));
      alert("✅ Ride deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting ride:", error);
      alert("❌ Failed to delete ride. Please try again.");
    }
  };  

  return (
    <div className="manage-rides-container">
      <h2>Manage Your Rides</h2>
      {loading ? (
        <p>Loading rides...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : rides.length === 0 ? (
        <p>No rides found.</p>
      ) : (
        <div className="rides-list">
          {rides.map((ride) => (
            <div key={ride._id} className="ride-box" onClick={() => toggleExpand(ride._id)}>
              <button className="delete-icon" onClick={(e) => { e.stopPropagation(); handleDelete(ride._id); }}>
                <FaTrash />
              </button>
              <div className="ride-summary">
                <strong>{ride.from} → {ride.to}</strong>
              </div>
              {expandedRide === ride._id && (
                <div className="ride-details">
                  <p><strong>Date:</strong> {ride.date}</p>
                  <p><strong>Departure Time:</strong> {ride.etd}</p>
                  <p><strong>Arrival Time:</strong> {ride.eta}</p>
                  <p><strong>Vehicle:</strong> {ride.vehicleName} ({ride.vehicleNumber})</p>
                  <p><strong>Color:</strong> {ride.vehicleColor}</p>
                  <p><strong>Capacity:</strong> {ride.vehicleCapacity}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <button onClick={() => navigate('/dashboard')}>Go Back</button>
    </div>
  );
};

export default ManageRides;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './ManageRides.css';

// const ManageRides = () => {
//   const navigate = useNavigate();
//   const [rides, setRides] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [expandedRide, setExpandedRide] = useState(null);

//   useEffect(() => {
//     const fetchRides = async () => {
//       try {
//         const storedUser = JSON.parse(localStorage.getItem('user'));
//         if (!storedUser || !storedUser.phoneNumber) {
//           setError('User not found or phone number missing');
//           setLoading(false);
//           return;
//         }

//         const response = await axios.get(`http://localhost:5000/api/myrides?phone=${storedUser.phone}`);
//         setRides(response.data);
//       } catch (err) {
//         setError('Failed to fetch rides');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRides();
//   }, []);

//   const toggleExpand = (rideId) => {
//     setExpandedRide(expandedRide === rideId ? null : rideId);
//   };

//   return (
//     <div className="manage-rides-container">
//       <h2>Manage Your Rides</h2>
//       {loading ? (
//         <p>Loading rides...</p>
//       ) : error ? (
//         <p className="error">{error}</p>
//       ) : rides.length === 0 ? (
//         <p>No rides found.</p>
//       ) : (
//         <div className="rides-list">
//           {rides.map((ride) => (
//             <div key={ride._id} className="ride-box" onClick={() => toggleExpand(ride._id)}>
//               <div className="ride-summary">
//                 <strong>{ride.from} → {ride.to}</strong>
//               </div>
//               {expandedRide === ride._id && (
//                 <div className="ride-details">
//                   <p><strong>Date:</strong> {ride.date}</p>
//                   <p><strong>Departure Time:</strong> {ride.etd}</p>
//                   <p><strong>Arrival Time:</strong> {ride.eta}</p>
//                   <p><strong>Vehicle:</strong> {ride.vehicleName} ({ride.vehicleNumber})</p>
//                   <p><strong>Color:</strong> {ride.vehicleColor}</p>
//                   <p><strong>Capacity:</strong> {ride.vehicleCapacity}</p>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//       <button onClick={() => navigate('/dashboard')}>Go Back</button>
//     </div>
//   );
// };

// export default ManageRides;