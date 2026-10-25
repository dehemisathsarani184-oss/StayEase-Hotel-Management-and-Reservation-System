
const express = require("express");
const router = express.Router();

// Import admin authentication middleware
const requireAdmin = require("../middleware/adminAuthMiddleware");

// Import room controller functions
const {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
} = require("../controllers/roomController");

// GET: Retrieve all rooms (Public)
router.get("/", getAllRooms);

// GET: Retrieve one room by ID (Public)
router.get("/:id", getRoomById);

// POST: Create a room (Admin only)
router.post("/", requireAdmin, createRoom);

// PUT: Update a room (Admin only)
router.put("/:id", requireAdmin, updateRoom);

// DELETE: Delete a room (Admin only)
router.delete("/:id", requireAdmin, deleteRoom);

module.exports = router;
