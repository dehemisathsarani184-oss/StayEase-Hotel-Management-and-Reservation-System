
const db = require("../config/db");

// GET all rooms
const getAllRooms = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                r.id,
                r.room_number,
                r.room_type_id,
                rt.type_name,
                rt.capacity,
                rt.base_price,
                r.floor_number,
                r.room_status,
                r.housekeeping_status
            FROM rooms r
            JOIN room_types rt ON r.room_type_id = rt.id
            ORDER BY r.room_number
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch rooms"
        });
    }
};

// GET one room
const getRoomById = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.*, rt.type_name, rt.capacity, rt.base_price
             FROM rooms r
             JOIN room_types rt ON r.room_type_id = rt.id
             WHERE r.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch room"
        });
    }
};

// CREATE room
const createRoom = async (req, res) => {
    try {
        const {
            room_number,
            room_type_id,
            floor_number,
            room_status = "available",
            housekeeping_status = "clean"
        } = req.body;

        const validRoomStatuses = ["available", "occupied", "maintenance"];
        const validHousekeepingStatuses = ["clean", "dirty", "inspected"];

        if (
            typeof room_number !== "string" ||
            !room_number.trim() ||
            !Number.isInteger(Number(room_type_id)) ||
            Number(room_type_id) < 1 ||
            (floor_number !== undefined && floor_number !== null &&
                !Number.isInteger(Number(floor_number))) ||
            !validRoomStatuses.includes(room_status) ||
            !validHousekeepingStatuses.includes(housekeeping_status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid room details"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO rooms
             (room_number, room_type_id, floor_number, room_status, housekeeping_status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                room_number.trim(),
                Number(room_type_id),
                floor_number ?? null,
                room_status,
                housekeeping_status
            ]
        );

        res.status(201).json({
            success: true,
            message: "Room created",
            id: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This room number already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Selected room type does not exist"
            });
        }

        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create room"
        });
    }
};

// UPDATE room
const updateRoom = async (req, res) => {
    try {
        const {
            room_number,
            room_type_id,
            floor_number,
            room_status,
            housekeeping_status
        } = req.body;

        const validRoomStatuses = ["available", "occupied", "maintenance"];
        const validHousekeepingStatuses = ["clean", "dirty", "inspected"];

        if (
            typeof room_number !== "string" ||
            !room_number.trim() ||
            !Number.isInteger(Number(room_type_id)) ||
            Number(room_type_id) < 1 ||
            (floor_number !== undefined && floor_number !== null &&
                !Number.isInteger(Number(floor_number))) ||
            !validRoomStatuses.includes(room_status) ||
            !validHousekeepingStatuses.includes(housekeeping_status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid room details"
            });
        }

        const [result] = await db.execute(
            `UPDATE rooms
             SET room_number = ?, room_type_id = ?, floor_number = ?,
                 room_status = ?, housekeeping_status = ?
             WHERE id = ?`,
            [
                room_number.trim(),
                Number(room_type_id),
                floor_number ?? null,
                room_status,
                housekeeping_status,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.json({ success: true, message: "Room updated" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This room number already exists"
            });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                success: false,
                message: "Selected room type does not exist"
            });
        }

        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update room"
        });
    }
};

// DELETE room
const deleteRoom = async (req, res) => {
    try {
        const [result] = await db.execute(
            "DELETE FROM rooms WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.json({ success: true, message: "Room deleted" });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a room linked to reservations"
            });
        }

        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete room"
        });
    }
};

module.exports = {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
};
