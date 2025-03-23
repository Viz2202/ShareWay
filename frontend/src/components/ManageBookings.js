import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import './ManageBookings.css';

const ManageBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [modalBooking, setModalBooking] = useState(null);

  const openModal = (booking) => {
    setModalBooking(booking);
  };

  const closeModal = () => {
    setModalBooking(null);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const name = user?.name;

    console.log("Logged-in User:", name); // Debugging

    if (!name) {
      console.error("No name found in local storage");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/manage-bookings?name=${name}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Bookings fetched:", data); // Debugging
        if (data.message) {
          console.log("API Message:", data.message);
          setBookings([]);
        } else {
          setBookings(data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching bookings:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="manage-bookings-container">
      <h2>Manage Your Bookings</h2>
  
      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div className="booking-grid">
          {bookings.map((booking, index) => (
            <div
              key={index}
              className={`booking-card ${expandedIndex === index ? "expanded" : ""}`}
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              {/* Basic Information */}
              <div className="booking-summary">
                <p><strong>From:</strong> {booking.riderStart}</p>
                <p><strong>To:</strong> {booking.riderEnd}</p>
                <p><strong>Status:</strong> {booking.status}</p>
              </div>
  
              {/* Expanded Details */}
              {expandedIndex === index && (
                <div className="booking-details">
                  <p><strong>Passengers:</strong> {booking.numPassengers}</p>
                  {booking.driver ? (
                    <p>
                      <strong>Driver:</strong> {booking.driver.name} <br />
                      <strong>Vehicle:</strong> {booking.driver.vehicleName}
                    </p>
                  ) : (
                    <p><strong>Driver:</strong> Not assigned yet</p>
                  )}
  
                  {/* Fixed Message Driver Button */}
                  {booking.status === "accepted" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents collapsing when clicking the button
                        openModal(booking);
                      }}
                    >
                      Message Driver
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
  
      {/* Modal Pop-up */}
      {modalBooking && (
        <div className="modal-overlay show" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✖</button>
            <h3>Booking Details</h3>
            <p><strong>From:</strong> {modalBooking.riderStart}</p>
            <p><strong>To:</strong> {modalBooking.riderEnd}</p>
            <p><strong>Passengers:</strong> {modalBooking.numPassengers}</p>
            <p><strong>Status:</strong> {modalBooking.status}</p>
            {modalBooking.driver ? (
              <>
                <p><strong>Driver:</strong> {modalBooking.driver.name}</p>
                <p><strong>Vehicle:</strong> {modalBooking.driver.vehicleName}</p>
              </>
            ) : (
              <p><strong>Driver:</strong> Not assigned yet</p>
            )}
  
            {/* Fixed Message Driver Button inside Modal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
                // Use a small timeout to ensure the modal closes first
                setTimeout(() => {
                  navigate("/messages", { state: { booking: modalBooking } });
                }, 50);
              }}
            >
              Message Driver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
  
export default ManageBookings;
