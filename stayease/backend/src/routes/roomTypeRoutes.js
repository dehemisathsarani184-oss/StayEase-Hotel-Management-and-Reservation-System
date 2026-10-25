
const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuthMiddleware");

const {
    getAllRoomTypes,
    getRoomTypeById,
    createRoomType,
    updateRoomType,
    deleteRoomType
} = require("../controllers/roomTypeController");

// View room types
router.get("/", requireAdmin, getAllRoomTypes);
router.get("/:id", requireAdmin, getRoomTypeById);

// Manage room types
router.post("/", requireAdmin, createRoomType);
router.put("/:id", requireAdmin, updateRoomType);
router.delete("/:id", requireAdmin, deleteRoomType);

module.exports = router;
