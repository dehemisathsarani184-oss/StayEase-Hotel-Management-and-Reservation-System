
const db = require("../config/db");

// GET all room types
const getAllRoomTypes = async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM room_types ORDER BY id"
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch room types"
        });
    }
};

// GET one room type
const getRoomTypeById = async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM room_types WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Room type not found"
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch room type"
        });
    }
};

// CREATE room type
const createRoomType = async (req, res) => {
    try {
        const { type_name, description, capacity, base_price } = req.body;

        if (
            typeof type_name !== "string" ||
            !type_name.trim() ||
            !Number.isInteger(Number(capacity)) ||
            Number(capacity) < 1 ||
            base_price === undefined ||
            !Number.isFinite(Number(base_price)) ||
            Number(base_price) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid type_name, capacity and base_price are required"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO room_types
             (type_name, description, capacity, base_price)
             VALUES (?, ?, ?, ?)`,
            [
                type_name.trim(),
                description || null,
                Number(capacity),
                Number(base_price)
            ]
        );

        res.status(201).json({
            success: true,
            message: "Room type created",
            id: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This room type name already exists"
            });
        }

        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create room type"
        });
    }
};

// UPDATE room type
const updateRoomType = async (req, res) => {
    try {
        const { type_name, description, capacity, base_price } = req.body;

        if (
            typeof type_name !== "string" ||
            !type_name.trim() ||
            !Number.isInteger(Number(capacity)) ||
            Number(capacity) < 1 ||
            base_price === undefined ||
            !Number.isFinite(Number(base_price)) ||
            Number(base_price) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid type_name, capacity and base_price are required"
            });
        }

        const [result] = await db.execute(
            `UPDATE room_types
             SET type_name = ?, description = ?, capacity = ?, base_price = ?
             WHERE id = ?`,
            [
                type_name.trim(),
                description || null,
                Number(capacity),
                Number(base_price),
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Room type not found"
            });
        }

        res.json({ success: true, message: "Room type updated" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This room type name already exists"
            });
        }

        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update room type"
        });
    }
};

// DELETE room type
const deleteRoomType = async (req, res) => {
    try {
        const [result] = await db.execute(
            "DELETE FROM room_types WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Room type not found"
            });
        }

        res.json({ success: true, message: "Room type deleted" });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a room type that is used by rooms"
            });
        }

        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete room type"
        });
    }
};

module.exports = {
    getAllRoomTypes,
    getRoomTypeById,
    createRoomType,
    updateRoomType,
    deleteRoomType
};
