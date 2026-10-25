
const express = require("express");
const router = express.Router();

const db = require("../config/db");
const requireAdmin = require("../middleware/adminAuthMiddleware");

// Get all active meal plans (Public)
// Customers need this when making a booking.
router.get("/", async (req, res) => {
    try {
        const [plans] = await db.execute(`
            SELECT
                id,
                plan_code,
                plan_name,
                description,
                price_per_guest_per_night
            FROM meal_plans
            WHERE is_active = TRUE
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            mealPlans: plans
        });
    } catch (error) {
        console.error("Meal plans error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load meal plans"
        });
    }
});

module.exports = router;
