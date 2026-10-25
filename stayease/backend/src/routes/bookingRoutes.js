const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Validate YYYY-MM-DD dates without accepting invalid calendar dates.
function parseDate(value) {
    if (typeof value !== "string") return null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return date;
}

function getNights(checkInDate, checkOutDate) {
    return Math.round(
        (checkOutDate.getTime() - checkInDate.getTime()) / 86400000
    );
}

// GET: Retrieve available rooms for selected dates
router.get("/available-rooms", async (req, res) => {
    try {
        const {
            check_in,
            check_out,
            adults = "1",
            children = "0",
        } = req.query;

        const checkInDate = parseDate(check_in);
        const checkOutDate = parseDate(check_out);

        if (
            !checkInDate ||
            !checkOutDate ||
            checkOutDate <= checkInDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid check-in and check-out dates.",
            });
        }

        const adultCount = Number(adults);
        const childCount = Number(children);

        if (
            !Number.isInteger(adultCount) ||
            !Number.isInteger(childCount) ||
            adultCount < 1 ||
            childCount < 0 ||
            adultCount + childCount > 11
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid guest counts.",
            });
        }

        const totalGuests = adultCount + childCount;

        const [rooms] = await db.execute(
            `SELECT
                r.id AS room_id,
                r.room_number,
                r.room_type_id,
                r.floor_number,
                rt.base_price,
                r.room_status,
                rt.type_name,
                rt.capacity
             FROM rooms r
             JOIN room_types rt ON r.room_type_id = rt.id
             WHERE r.room_status = 'available'
               AND rt.capacity >= ?
               AND NOT EXISTS (
                   SELECT 1
                   FROM reservations res
                   WHERE res.room_id = r.id
                     AND res.booking_status IN (
                         'confirmed',
                         'checked_in'
                     )
                     AND res.check_in < ?
                     AND res.check_out > ?
               )
             ORDER BY rt.base_price ASC`,
            [totalGuests, check_out, check_in]
        );

        return res.json({
            success: true,
            rooms,
        });
    } catch (error) {
        console.error("Available rooms error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve available rooms.",
        });
    }
});

// POST: Create a new customer booking
router.post("/", async (req, res) => {
    const {
        full_name,
        email,
        phone,
        address = "",
        room_id,
        check_in,
        check_out,
        adults = 1,
        children = 0,
        meal_plan_id = 1,
    } = req.body;

    // Validate required fields
    if (
        typeof full_name !== "string" ||
        !full_name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof phone !== "string" ||
        !phone.trim() ||
        room_id === undefined ||
        !check_in ||
        !check_out
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required booking details.",
        });
    }

    if (
        full_name.trim().length > 120 ||
        email.trim().length > 150 ||
        phone.trim().length > 25 ||
        typeof address !== "string" ||
        address.length > 255
    ) {
        return res.status(400).json({
            success: false,
            message: "One or more guest details exceed the allowed length.",
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address.",
        });
    }

    const checkInDate = parseDate(check_in);
    const checkOutDate = parseDate(check_out);

    if (
        !checkInDate ||
        !checkOutDate ||
        checkOutDate <= checkInDate
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid check-in and check-out dates.",
        });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (checkInDate < today) {
        return res.status(400).json({
            success: false,
            message: "Check-in date cannot be in the past.",
        });
    }

    const adultCount = Number(adults);
    const childCount = Number(children);
    const roomId = Number(room_id);
    const mealPlanId = Number(meal_plan_id);

    if (
        !Number.isInteger(adultCount) ||
        !Number.isInteger(childCount) ||
        adultCount < 1 ||
        childCount < 0 ||
        adultCount + childCount > 11 ||
        !Number.isSafeInteger(roomId) ||
        roomId < 1 ||
        !Number.isSafeInteger(mealPlanId) ||
        mealPlanId < 1
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid room, guest, and meal plan details.",
        });
    }

    const totalGuests = adultCount + childCount;
    const nights = getNights(checkInDate, checkOutDate);

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Lock the room row while checking availability and creating
        // the reservation.
        const [roomRows] = await connection.execute(
            `SELECT
                r.id,
                r.room_number,
                rt.type_name,
                rt.base_price,
                r.room_status,
                rt.capacity
             FROM rooms r
             JOIN room_types rt ON r.room_type_id = rt.id
             WHERE r.id = ?
             FOR UPDATE`,
            [roomId]
        );

        if (roomRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "The selected room was not found.",
            });
        }

        const room = roomRows[0];

        if (room.room_status !== "available") {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "This room is currently unavailable.",
            });
        }

        if (Number(room.capacity) < totalGuests) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "The selected room cannot accommodate all guests.",
            });
        }

        // Recheck date conflicts inside the transaction.
        const [conflicts] = await connection.execute(
            `SELECT id
             FROM reservations
             WHERE room_id = ?
               AND booking_status IN ('confirmed', 'checked_in')
               AND check_in < ?
               AND check_out > ?
             LIMIT 1`,
            [roomId, check_out, check_in]
        );

        if (conflicts.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "This room has already been booked for those dates.",
            });
        }

        // Confirm that the selected meal plan is active.
        const [mealPlans] = await connection.execute(
            `SELECT id, plan_name, price_per_guest_per_night
             FROM meal_plans
             WHERE id = ? AND is_active = TRUE`,
            [mealPlanId]
        );

        if (mealPlans.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "The selected meal plan is unavailable.",
            });
        }

        const mealPlan = mealPlans[0];

        // Calculate all prices on the server.
        const nightlyRate = Number(room.base_price);
        const mealPlanRate = Number(
            mealPlan.price_per_guest_per_night
        );

        const roomTotal = nightlyRate * nights;
        const mealTotal = mealPlanRate * totalGuests * nights;
        const estimatedTotal = Number(
            (roomTotal + mealTotal).toFixed(2)
        );

        // Calculate 20% advance payment and remaining balance.
        const advancePayment = Number(
            (estimatedTotal * 0.20).toFixed(2)
        );

        const remainingBalance = Number(
            (estimatedTotal - advancePayment).toFixed(2)
        );

        // Insert guest information.
        const [guestResult] = await connection.execute(
            `INSERT INTO guests (full_name, email, phone, address)
             VALUES (?, ?, ?, ?)`,
            [
                full_name.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                address.trim(),
            ]
        );

        const guestId = guestResult.insertId;

        // Generate a booking reference.
        const bookingReference =
            "SE" +
            Date.now().toString().slice(-8) +
            Math.floor(1000 + Math.random() * 9000);

        // Create booking as pending until payment is verified.
        const [bookingResult] = await connection.execute(
            `INSERT INTO reservations (
                booking_reference,
                guest_id,
                room_id,
                check_in,
                check_out,
                adults,
                children,
                nightly_rate,
                meal_plan_id,
                meal_plan_rate,
                booking_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
            [
                bookingReference,
                guestId,
                roomId,
                check_in,
                check_out,
                adultCount,
                childCount,
                nightlyRate,
                mealPlanId,
                mealPlanRate,
            ]
        );

        await connection.commit();

        // Return booking and payment details to the frontend.
        // Payment slip upload and admin verification are handled
        // by the separate payment route.
        const currency = "LKR";

        return res.status(201).json({
            success: true,
            message: "Booking created. Advance payment is required.",
            booking: {
                id: bookingResult.insertId,
                booking_reference: bookingReference,
                guest_id: guestId,
                room_id: roomId,
                room_number: room.room_number,
                room_type: room.type_name,
                guest_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                address: address.trim(),
                check_in,
                check_out,
                adults: adultCount,
                children: childCount,
                booking_status: "pending_payment",
                meal_plan_id: mealPlanId,
                meal_plan_name: mealPlan.plan_name,
                meal_plan_rate: mealPlanRate,
                nights,
                room_total: roomTotal,
                meal_total: mealTotal,
                estimated_total: estimatedTotal,
                advance_payment: advancePayment,
                remaining_balance: remainingBalance,
                currency,
            },
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Booking rollback error:",
                    rollbackError.message
                );
            }
        }

        console.error("Create booking error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create booking. Please try again.",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;