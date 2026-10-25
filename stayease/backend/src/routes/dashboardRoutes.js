const express = require("express");
const router = express.Router();
const db = require("../config/db");
const requireAdmin = require("../middleware/adminAuthMiddleware");

// GET: Dashboard statistics and recent bookings
router.get("/", requireAdmin, async (req, res) => {
  try {
    // 1. Get dashboard statistics
    const [statsRows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM reservations) AS totalBookings,
        (SELECT COUNT(*) FROM rooms) AS totalRooms,
        (
          SELECT COUNT(*)
          FROM rooms
          WHERE room_status = 'available'
        ) AS availableRooms,
        (
          SELECT COALESCE(
            SUM(
              DATEDIFF(check_out, check_in) *
              (
                nightly_rate +
                (meal_plan_rate * (adults + children))
              )
            ), 0
          )
          FROM reservations
          WHERE booking_status IN ('confirmed', 'checked_in')
        ) AS estimatedRevenue
    `);

    // 2. Get the latest 8 bookings
    const [recentBookings] = await db.execute(`
      SELECT
        res.id,
        res.booking_reference,
        g.full_name,
        r.room_number,
        rt.type_name,
        res.check_in,
        res.check_out,
        res.booking_status,
        DATEDIFF(res.check_out, res.check_in) *
        (
          res.nightly_rate +
          (res.meal_plan_rate * (res.adults + res.children))
        ) AS estimated_total
      FROM reservations res
      JOIN guests g ON res.guest_id = g.id
      JOIN rooms r ON res.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY res.id DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      stats: statsRows[0],
      recentBookings,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard data.",
    });
  }
});

module.exports = router;