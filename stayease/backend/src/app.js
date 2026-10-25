const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

// Import API routes
const roomTypeRoutes = require("./routes/roomTypeRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const mealPlanRoutes = require("./routes/mealPlanRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const paymentRoutes = require("./routes/Paymentroutes"); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database connection test
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT DATABASE() AS database_name"
        );

        res.json({
            success: true,
            message: "StayEase API is running!",
            database: rows[0].database_name
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Admin Authentication API
app.use("/api/auth", adminAuthRoutes);

// Dashboard API
app.use("/api/dashboard", dashboardRoutes);

// Room Types API
app.use("/api/room-types", roomTypeRoutes);

// Rooms API
app.use("/api/rooms", roomRoutes);

// Bookings API
app.use("/api/bookings", bookingRoutes);

// Meal Plans API
app.use("/api/meal-plans", mealPlanRoutes);

// Payments API (card notify + slip upload)  NEW
app.use("/api/payments", paymentRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});