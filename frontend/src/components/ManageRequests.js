import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./ManageRequests.css"; // Import the CSS file

const ManageRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const phone = user?.phone;

    if (!phone) {
      console.error("No phone number found in local storage");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/manage-requests?phone=${phone}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.message ? [] : data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching ride requests:", error);
        setLoading(false);
      });
  }, []);

  const handleAccept = async (bookingId) => {
    try {
      const res = await fetch("http://localhost:5000/api/accept-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.bookingId === bookingId ? { ...req, status: "accepted" } : req
          )
        );
      } else {
        alert("Error accepting request");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      const res = await fetch("http://localhost:5000/api/reject-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((req) => req.bookingId !== bookingId));
      } else {
        alert("Error rejecting request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleMessage = (booking) => {
    navigate('/messages', { state: { booking } });
  };

  return (
    <div className="manage-requests-container">
      <h2>Manage Ride Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p className="no-requests">No ride requests found.</p>
      ) : (
        <ul className="requests-list">
          {requests.map((request, index) => (
            <li key={index} className="request-card">
              <p><strong>Rider:</strong> {request.riderName}</p>
              <p><strong>From:</strong> {request.riderStart}</p>
              <p><strong>To:</strong> {request.riderEnd}</p>
              <p><strong>Passengers:</strong> {request.numPassengers}</p>
              <p className={`request-status status-${request.status}`}>
                <strong>Status:</strong> {request.status}
              </p>
              <p><strong>Driver:</strong> {request.carpool.driverName}</p>
              <p><strong>Vehicle:</strong> {request.carpool.vehicleName}</p>

              <div className="request-actions">
                {request.status === "pending" ? (
                  <>
                    <button className="request-btn accept-btn" onClick={() => handleAccept(request.bookingId)}>
                      Accept Rider
                    </button>
                    <button className="request-btn reject-btn" onClick={() => handleReject(request.bookingId)}>
                      Reject Rider
                    </button>
                  </>
                ) : request.status === "accepted" ? (
                  <button className="request-btn message-btn" onClick={() => handleMessage(request)}>
                    Message
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageRequests;
