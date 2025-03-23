# 🚗 Carpooling App

A **dark-themed** ride-sharing web application where users can create and manage ride pools.

---

## 🌟 Features Implemented

### 1️⃣ User Authentication
- **Login & Register** pages created.
- User data stored in `localStorage`.
- Logout button added to the **header navbar**.

### 2️⃣ Dark Mode UI
- Applied a **dark theme** across the application.
- Used `#1e1e1e` as the primary background color.
- Inputs, buttons, and text elements styled to match the dark theme.
- **Logout button** designed with a **red** color.

### 3️⃣ Navigation & Layout
- **Navbar added** to all pages except login/register.
- **Navbar structure:**
  - **Left:** App name (`Carpooling App`).
  - **Right:** Logout button (**Red** color).
- The **login form** is now positioned on the **rightmost side**, with a GIF on the **left**.

### 4️⃣ Ride Pool Creation
- Implemented a **form** for users to create a carpool ride.
- Fields included:
  - **Personal details** (Name, Phone)
  - **Ride details** (From, To, Date, ETA, ETD)
  - **Vehicle details** (Name, Number, Color, Capacity)
  - **Preferences**: 
    - ✅ Allow Pets
    - ✅ Smoking Allowed
    - ✅ Carpool Type (Economy / Luxury)
    - ✅ Additional Rules
- Used **Google Maps API** to fetch coordinates for the `from` and `to` locations.

### 5️⃣ Managing Ride Requests
- Added **'Accept'** and **'Reject'** buttons for ride requests.
- If a request is **accepted**:
  - 🚗 The passenger count is updated in `MainCarpooling`.
  - ✅ A **'Message' button** replaces 'Accept/Reject'.
- If a request is **rejected**:
  - ❌ The ride is marked as **rejected**.

### 6️⃣ Manage Bookings
- A dedicated **"Manage Bookings"** section added.
- Displays:
  - ✅ **Accepted** ride requests.
  - ❌ **Rejected** ride requests.
  - 🚦 Status of each request.

### 7️⃣ Backend API Integration
- **Endpoints created** to:
  - Fetch ride details.
  - Handle ride requests.
  - Store user and ride data in the database.
  - Use **OpenCage API** for location coordinates.

---

## 🎨 Dark Mode Styles

### 🌑 Global Styles
```css
body {
    background-color: #121212;
    color: white;
}
```

### 📌 Navbar
```css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #1e1e1e;
    padding: 15px;
}

.app-name {
    font-size: 24px;
    color: white;
}

.logout-button {
    background-color: red;
    padding: 8px 15px;
    font-size: 14px;
    border-radius: 5px;
}
```

### 🚗 Create Ride Form
```css
.create-ride-container {
    background-color: #1e1e1e;
    color: white;
    border-radius: 8px;
}

button:hover {
    background-color: #cc3700;
}
```

## 🚀 Upcoming Features
✅ Deploy the backend & frontend.

✅ Add a messaging feature between drivers & riders.

✅ Enhance UI animations for a smoother experience.

## 🛠 Tech Stack
- **Frontend:** React, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **APIs:** Google Maps, OpenCage Geocoder
- **Hosting:** To be decided

## 🔥 How to Run the Project
```bash
# Clone the repository
git clone https://github.com/Viz2202/MoveInSync.git

# Install dependencies
cd carpooling-app

# Start the frontend
cd frontend
npm install
npm start

# Start the backend
cd backend
npm install
npm start
```

## 📌 Notes
- Ensure that `.env` file contains `REACT_APP_OPENCAGE_API_KEY` for location services.
- this also would require a `jwt_secret_key`
- Update MongoDB connection string in the backend.

🚀 **Happy Carpooling!** 🏁


