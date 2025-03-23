const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
// Load environment variables
dotenv.config();

// Create an Express app
const app = express();

const getCoordinates = async (location) => {
  const apiKey = process.env.OPENCAGE_API_KEY;  // Ensure you have the API key in your environment variables
  
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


// Middleware
app.use(express.json()); // For parsing JSON data
app.use(cors()); // Allow cross-origin requests

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Failed to connect to MongoDB:", err));


// User Model (Schema)
const userSchema = new mongoose.Schema({
  email: {type: String, required: true, unique: true,},
  password: {type: String, required: true,},
  roles: {rider: {type: Boolean,default: false,},driver: {type: Boolean,default: false,},},
  fullName: {type: String,required: true,},
  phone: {type: String,required: true,}
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const mainCarpoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  date: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  fromCoordinates: { type: { lat: Number, lng: Number }, required: true },
  toCoordinates: { type: { lat: Number, lng: Number }, required: true },
  vehicleName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  vehicleColor: { type: String, required: true },
  vehicleCapacity: { type: Number, required: true },
  eta: { type: String, required: true },
  etd: { type: String, required: true },
  preferences: { // Ride-specific preferences
    smokingAllowed: { type: Boolean, default: false }, // Max distance user is willing to walk to the pickup point
    allowPets: { type: Boolean, default: false }, // Whether pets are allowed
    carpoolType: { type: String, enum: ['Economy', 'Luxury'], default: 'Economy' }, // Type of carpool
    additionalRules: { type: Map, of: String } // Custom rules for the ride
  }
});


// Create a model for the collection
const MainCarpool = mongoose.model("MainCarpool", mainCarpoolSchema);

const bookingSchema = new mongoose.Schema({
  riderName: { type: String, required: true },
  riderPhoneNumber: { type: String, required: true },
  riderStart: { type: String, required: true },
  riderEnd: { type: String, required: true },
  numPassengers: { type: Number, required: true },
  allowPets: { type: Boolean, default: false },
  smokingAllowed: { type: Boolean, default: false },
  carpoolType: { type: String, enum: ['Economy', 'Luxury'], default: 'Economy' },
  additionalRules: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  acceptedDriver: { 
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);


const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, fullName, phone, roles } = req.body;
  
    // Validate input
    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({ message: 'Please provide all required fields: email, password, fullName, phone' });
    }
  
    if (!roles || (!roles.rider && !roles.driver)) {
      return res.status(400).json({ message: 'At least one role (Rider or Driver) must be selected' });
    }
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        email,
        password: hashedPassword,
        fullName,
        phone,
        roles,
      });
  
      await newUser.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error('Error during registration:', err);  // Log the error on the server side
      res.status(500).json({ message: 'Error registering user', error: err.message });
    }
  });
  

// Login an existing user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Fetch user with explicit field selection
    const user = await User.findOne({ email }).select("fullName roles phone password");

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.fullName,
        roles: user.roles,
        phone: user.phone || null // Ensure phone is included even if it's null
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        name: user.fullName,
        roles: user.roles,
        phone: user.phone || null // Ensuring phone is sent even if missing
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

app.post('/api/maincarpool', async (req, res) => {
  try {
    console.log("📥 Received Data:", req.body); // Log received data

    const { preferences, ...carpoolData } = req.body; // Deconstruct to separate preferences

    const newRide = new MainCarpool({
      ...carpoolData, 
      preferences: preferences || {} // Set preferences if provided
    });

    await newRide.save();
    res.status(201).json({ message: 'Ride Pool Created Successfully!' });
  } catch (error) {
    console.error('❌ Error creating ride:', error);
    res.status(500).json({ message: 'Error creating ride', error: error.message });
  }
});


app.get('/api/myrides', async (req, res) => {
  try {
    let { phone } = req.query;
    phone = phone.trim(); // Ensure no extra spaces

    console.log(`📞 Fetching rides for phoneNumber: ${phone}`);

    // Search using the correct field name: phoneNumber
    const rides = await MainCarpool.find({ phoneNumber: phone });

    console.log(`🚗 Rides found:`, rides);

    res.status(200).json(rides);
  } catch (error) {
    console.error('❌ Error fetching rides:', error);
    res.status(500).json({ message: "Error fetching rides", error: error.message });
  }
});

app.delete('/api/deleteride/:id', async (req, res) => {
  try {
    const rideId = req.params.id;

    const deletedRide = await MainCarpool.findByIdAndDelete(rideId);

    if (!deletedRide) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.status(200).json({ message: "Ride deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting ride:", error);
    res.status(500).json({ message: "Error deleting ride", error: error.message });
  }
});

app.get('/api/allrides', async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    console.log(`📢 Fetching all rides except for user: ${phone}`);

    // Fetch all rides except the ones created by the logged-in user
    const rides = await MainCarpool.find({ phoneNumber: { $ne: phone } });

    console.log(`🚗 Total rides found (excluding user's):`, rides);

    res.status(200).json(rides);
  } catch (error) {
    console.error("❌ Error fetching rides:", error);
    res.status(500).json({ message: "Error fetching rides", error: error.message });
  }
});

app.get('/api/matchrides', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    // Convert rider's locations to coordinates
    const riderFromCoords = await getCoordinates(from);
    const riderToCoords = await getCoordinates(to);

    if (!riderFromCoords || !riderToCoords) {
      return res.status(400).json({ message: "Invalid locations" });
    }

    // Fetch all rides
    const availableRides = await MainCarpool.find();
    let matchedRides = [];

    for (let ride of availableRides) {
      const rideStartCoords = ride.fromCoordinates;
      const rideEndCoords = ride.toCoordinates;

      // Calculate Proximity
      const startDistance = haversine(riderFromCoords, rideStartCoords);
      const endDistance = haversine(riderToCoords, rideEndCoords);

      // Route Match Score
      const matchPercentage = calculateRouteMatch(startDistance, endDistance);

      matchedRides.push({
        rideId: ride._id,
        from: ride.from,
        to: ride.to,
        driver: ride.name,
        vehicle: ride.vehicleName,
        matchPercentage
      });
    }

    matchedRides.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json(matchedRides);
  } catch (error) {
    res.status(500).json({ message: "Error finding matches", error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      riderName, 
      riderPhoneNumber, 
      riderStart, 
      riderEnd, 
      numPassengers,
      allowPets,
      smokingAllowed,
      carpoolType,
      additionalRules
    } = req.body;

    if (!riderName || !riderPhoneNumber || !riderStart || !riderEnd || !numPassengers) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newBooking = new Booking({
      riderName,
      riderPhoneNumber,
      riderStart,
      riderEnd,
      numPassengers,
      allowPets,
      smokingAllowed,
      carpoolType,
      additionalRules
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      message: 'Booking created successfully',
      booking: savedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    console.error('Error details:', error.message);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error while creating booking',
      error: error.message
    });
  }
});

// GET: Fetch all bookings (for testing or future use)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/api/finddrivers', async (req, res) => {
  try {
    const { riderStart, riderEnd, carpoolType, allowPets, smokingAllowed } = req.query;

    // Fetch all pending bookings (drivers)
    const availableDrivers = await Booking.find({
      status: 'pending',
      carpoolType: carpoolType,
      allowPets: allowPets,
      smokingAllowed: smokingAllowed
    });

    // Calculate match percentage for each driver
    const driversWithMatch = availableDrivers.map(driver => {
      const matchPercentage = calculateMatchPercentage(
        riderStart, 
        riderEnd, 
        driver.riderStart, 
        driver.riderEnd
      );

      // Add match percentage to the driver data
      return { ...driver.toObject(), matchPercentage };
    });

    // Sort drivers by the match percentage in descending order
    const sortedDrivers = driversWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json(sortedDrivers);
  } catch (error) {
    console.error('Error finding drivers:', error);
    res.status(500).json({ error: 'Failed to find drivers' });
  }
});

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  console.log(`Distance between (${lat1},${lon1}) and (${lat2},${lon2}): ${distance} km`);
  return distance;
}

app.get('/api/find-drivers', async (req, res) => {
  try {
    const { riderStart, riderEnd } = req.query;
    console.log("Rider Start:", riderStart, "Rider End:", riderEnd);

    // Fetch available carpooling options from the database
    const mainCarpools = await MainCarpool.find();
    console.log("Main Carpools:", mainCarpools);

    // Get coordinates from addresses if needed
    const riderStartCoordinates = await getCoordinates(riderStart);
    const riderEndCoordinates = await getCoordinates(riderEnd);

    console.log("Rider Start Coordinates:", riderStartCoordinates);
    console.log("Rider End Coordinates:", riderEndCoordinates);

    // Calculate the direct distance between rider's start and end points
    const riderDirectDistance = getDistance(
      riderStartCoordinates.lat,
      riderStartCoordinates.lng,
      riderEndCoordinates.lat,
      riderEndCoordinates.lng
    );
    
    console.log("Rider Direct Distance:", riderDirectDistance);

    // Process all carpools and add debugging info
    const processedCarpools = mainCarpools.map(carpool => {
      // Calculate distance between rider's start and carpool's start point
      const fromDistance = getDistance(
        riderStartCoordinates.lat,
        riderStartCoordinates.lng,
        carpool.fromCoordinates.lat,
        carpool.fromCoordinates.lng
      );

      // Calculate distance between rider's end and carpool's end point
      const toDistance = getDistance(
        riderEndCoordinates.lat,
        riderEndCoordinates.lng,
        carpool.toCoordinates.lat,
        carpool.toCoordinates.lng
      );

      // Calculate match percentage
      const totalDeviationDistance = fromDistance + toDistance;
      const matchPercentage = 100 - (totalDeviationDistance / riderDirectDistance) * 50;

      console.log(`Carpool ${carpool._id}:`, {
        fromDistance,
        toDistance,
        totalDeviationDistance,
        matchPercentage
      });

      // Convert to object and add match percentage
      const carpoolObj = carpool.toObject ? carpool.toObject() : {...carpool};
      carpoolObj.matchPercentage = matchPercentage;
      
      return carpoolObj;
    });
    
    // Filter for matches above 50%
    const matchingCarpools = processedCarpools.filter(carpool => carpool.matchPercentage >= 50);
    
    console.log("Matching Carpools Count:", matchingCarpools.length);
    
    if (matchingCarpools.length === 0) {
      // If no 50%+ matches, return all carpools with their match percentages
      console.log("No matches above 50%, returning all carpools with match info");
      res.status(200).json(processedCarpools);
    } else {
      res.status(200).json(matchingCarpools);
    }
  } catch (error) {
    console.error('Error finding drivers:', error);
    res.status(500).json({ message: 'Error finding drivers', error: error.message });
  }
});

app.post('/api/book-ride', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.get("/api/manage-requests", async (req, res) => {
  try {
      const { phone } = req.query;

      if (!phone) {
          return res.status(400).json({ error: "Phone number is required" });
      }

      // Step 1: Find the driver in MainCarpool using phone number
      const driver = await MainCarpool.findOne({ phoneNumber: phone });

      if (!driver) {
          return res.status(404).json({ error: "Driver not found" });
      }

      // Step 2: Get all bookings where this driver is the acceptedDriver
      const bookings = await Booking.find({
          status: { $in: ["pending", "accepted"] },
          acceptedDriver: driver._id
      });

      if (!bookings.length) {
          return res.json({ message: "No ride requests found." });
      }

      // Step 3: Format response
      const results = bookings.map((booking) => ({
          riderName: booking.riderName,
          riderStart: booking.riderStart,
          riderEnd: booking.riderEnd,
          numPassengers: booking.numPassengers,
          status: booking.status,
          carpool: {
              driverName: driver.name,
              vehicleName: driver.vehicleName,
              from: driver.from,
              to: driver.to,
          }
      }));

      res.json(results);
  } catch (error) {
      console.error("Error fetching manage requests:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/accept-request", async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking request
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Find the driver's carpool entry
    const driverCarpool = await MainCarpool.findById(booking.acceptedDriver);
    if (!driverCarpool) {
      return res.status(404).json({ error: "Driver's carpool not found" });
    }

    // Check if vehicle has enough capacity
    if (driverCarpool.vehicleCapacity < booking.numPassengers) {
      return res.status(400).json({ error: "Not enough space in vehicle" });
    }

    // Reduce the available vehicle capacity
    driverCarpool.vehicleCapacity -= booking.numPassengers;
    await driverCarpool.save();

    // Mark the booking as accepted
    booking.status = "accepted";
    await booking.save();

    res.json({ message: "Ride request accepted", updatedBooking: booking });
  } catch (error) {
    console.error("Error accepting ride request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/reject-request", async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking request
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Mark the booking as rejected
    booking.status = "rejected";
    await booking.save();

    res.json({ message: "Ride request rejected", updatedBooking: booking });
  } catch (error) {
    console.error("Error rejecting ride request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/manage-bookings", async (req, res) => {
  try {
    const { name } = req.query; // Get rider's name from request query

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Find all bookings made by this rider
    const bookings = await Booking.find({ riderName: name });
    
    // Ensure bookings is an array
    const bookingsArray = Array.isArray(bookings) ? bookings : [];

    if (!bookingsArray.length) {
      return res.json({ message: "No bookings found." });
    }

    // Populate driver details from MainCarpool using acceptedDriver ID
    const results = await Promise.all(
      bookingsArray.map(async (booking) => {
        let driver = null;
        if (booking.acceptedDriver) {
          driver = await MainCarpool.findById(booking.acceptedDriver);
        }

        return {
          bookingId: booking._id,
          riderStart: booking.riderStart,
          riderEnd: booking.riderEnd,
          numPassengers: booking.numPassengers,
          status: booking.status,
          driver: driver
            ? {
                name: driver.name,
                vehicleName: driver.vehicleName,
              }
            : null,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("Error fetching manage bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ✅ Fetch previous messages for a booking
// Get messages API
app.get("/api/get-messages", async (req, res) => {
  try {
    const { user1, user2 } = req.query;

    console.log("Fetching messages for:", user1, "and", user2); // ✅ Debugging

    if (!user1?.trim() || !user2?.trim()) { // ✅ Ensures both values exist
      return res.status(400).json({ error: "Both users are required" });
    }

    // ✅ Remove any booking ID dependency
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ✅ Send message API
app.post("/api/send-message", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message.trim()) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Decode names to handle special characters
    const decodedSender = decodeURIComponent(sender);
    const decodedReceiver = decodeURIComponent(receiver);

    const newMessage = new Message({
      sender: decodedSender,
      receiver: decodedReceiver,
      message,
      createdAt: new Date()
    });

    await newMessage.save();
    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
