import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Messages.css";


const Messages = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { booking } = location.state || {};

    console.log("Location State:", location.state);
    console.log("Booking Object:", booking);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatInfo, setChatInfo] = useState({
        currentUser: null,
        otherUser: null,
        isDriver: false,
        isRider: false
    });

    // Load current user from localStorage
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.name) {
            console.error("No user found in local storage or missing name");
            return;
        }

        const currentUserName = user.name.trim().toLowerCase();
        console.log("Current User:", currentUserName);
        
        if (!booking) {
            console.error("No booking data provided");
            return;
        }

        // Extract data from booking
        const driverName = booking.carpool?.driverName?.trim().toLowerCase() || 
                          booking.driver?.name?.trim().toLowerCase() || null;
        
        // If booking.riderName exists, use it; otherwise, assume current user is rider if not driver
        const riderName = booking.riderName?.trim().toLowerCase() || 
                         (currentUserName !== driverName ? currentUserName : null);
        
        console.log("Driver Name:", driverName);
        console.log("Rider Name:", riderName);

        // Determine user roles and chat participant
        const isDriver = currentUserName === driverName;
        const isRider = currentUserName === riderName || (!isDriver && booking.status === "accepted");
        const otherUserName = isDriver ? riderName : driverName;

        console.log("Is Driver:", isDriver);
        console.log("Is Rider:", isRider);
        console.log("Chatting with:", otherUserName);

        setChatInfo({
            currentUser: currentUserName,
            otherUser: otherUserName,
            isDriver,
            isRider
        });
    }, [booking]);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        const { currentUser, otherUser } = chatInfo;
        
        if (!currentUser || !otherUser) {
            console.log("Missing user information for message fetch");
            return;
        }

        try {
            const url = `http://localhost:5000/api/get-messages?user1=${encodeURIComponent(currentUser)}&user2=${encodeURIComponent(otherUser)}`;
            console.log("Fetching messages from:", url);

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch messages");
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, [chatInfo]);

    useEffect(() => {
        fetchMessages();
        
        // Set up polling to refresh messages every few seconds
        const intervalId = setInterval(fetchMessages, 5000);
        
        return () => clearInterval(intervalId);
    }, [fetchMessages]);

    // Send message
    const sendMessage = async () => {
        const { currentUser, otherUser } = chatInfo;
        
        if (!newMessage.trim() || !currentUser || !otherUser) return;

        try {
            const res = await fetch("http://localhost:5000/api/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender: currentUser,
                    receiver: otherUser,
                    message: newMessage,
                }),
            });

            if (res.ok) {
                setMessages((prevMessages) => [...prevMessages, { sender: currentUser, message: newMessage }]);
                setNewMessage("");
                fetchMessages(); // Refresh messages
            } else {
                const errorData = await res.json();
                console.error("Error sending message:", errorData.error);
                alert("Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    // Handle navigation back
    const handleGoBack = () => {
        const { isDriver } = chatInfo;
        navigate(isDriver ? "/dashboard" : "/dashboard");
    };

    // Show authorization error or loading state
    if (!chatInfo.currentUser || (!chatInfo.isDriver && !chatInfo.isRider)) {
        return (
            <div>
                <h2>Chat Error</h2>
                <p>You are not authorized for this chat or the data is still loading.</p>
                <p>Please make sure you are signed in and have access to this booking.</p>
                <button onClick={handleGoBack}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="messages-container">
            <h2>Chat with {chatInfo.otherUser || "User"}</h2>
            
            {/* Booking Details */}
            <div className="booking-details">
                <p><strong>From:</strong> {booking?.riderStart || "Not specified"}</p>
                <p><strong>To:</strong> {booking?.riderEnd || "Not specified"}</p>
                <p><strong>Passengers:</strong> {booking?.numPassengers || "Not specified"}</p>
                <p><strong>Status:</strong> {booking?.status || "Not specified"}</p>
            </div>
    
            {/* Chat Messages */}
            <div className="chat-box">
                {messages.length === 0 ? (
                    <p className="no-messages">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={msg.sender === chatInfo.currentUser ? "message-container message-current-user" : "message-container message-other-user"}
                        >
                            <div className="message-bubble">{msg.message}</div>
                            <div className="message-sender">
                                {msg.sender === chatInfo.currentUser ? "You" : chatInfo.otherUser}
                            </div>
                        </div>
                    ))
                )}
            </div>
    
            {/* Message Input */}
            <div className="message-input-container">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button 
                    onClick={sendMessage}
                    className="send-button"
                >
                    Send
                </button>
            </div>
    
            {/* Go Back Button */}
            <button 
                onClick={handleGoBack}
                className="go-back-button"
            >
                Go Back
            </button>
        </div>
    );    
};

export default Messages;