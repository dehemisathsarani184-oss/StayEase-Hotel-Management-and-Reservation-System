
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();
const db = require("../config/db");
const requireAdmin = require("../middleware/adminAuthMiddleware");

// ---------- Slip upload setup ----------
const uploadDir = path.join(__dirname, "..", "uploads", "slips");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
};

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            const extension = ALLOWED[file.mimetype];

            if (!extension) {
                return cb(new Error("Unsupported file type."));
            }

            const name = `slip-${Date.now()}-${crypto
                .randomBytes(5)
                .toString("hex")}${extension}`;

            cb(null, name);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED[file.mimetype]) {
            return cb(
                new Error("Only JPG, PNG, WEBP or PDF files are allowed.")
            );
        }

        cb(null, true);
    },
});

function removeFile(file) {
    if (file?.path) {
        fs.unlink(file.path, () => {});
    }
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

// ---------- POST /api/payments/slip ----------
router.post("/slip", (req, res) => {
    upload.single("slip")(req, res, async (uploadError) => {
        if (uploadError) {
            return res.status(400).json({
                success: false,
                message:
                    uploadError.code === "LIMIT_FILE_SIZE"
                        ? "The file is too large. Maximum size is 5 MB."
                        : uploadError.message,
            });
        }

        const file = req.file;

        try {
            const bookingReference = String(
                req.body.booking_reference || ""
            ).trim();

            const email = normalizeEmail(req.body.email);

            const bankReference = String(
                req.body.bank_reference || ""
            )
                .trim()
                .slice(0, 100);

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "Please attach your payment slip.",
                });
            }

            if (!bookingReference || !email) {
                removeFile(file);

                return res.status(400).json({
                    success: false,
                    message:
                        "Booking reference and email are required.",
                });
            }

            const [rows] = await db.execute(
                `SELECT
                    res.id,
                    res.booking_status,
                    res.check_in,
                    res.check_out,
                    res.nightly_rate,
                    res.meal_plan_rate,
                    res.adults,
                    res.children,
                    g.email
                 FROM reservations res
                 JOIN guests g ON res.guest_id = g.id
                 WHERE res.booking_reference = ?`,
                [bookingReference]
            );

            if (
                rows.length === 0 ||
                normalizeEmail(rows[0].email) !== email
            ) {
                removeFile(file);

                return res.status(404).json({
                    success: false,
                    message:
                        "We could not match this booking reference and email.",
                });
            }

            const booking = rows[0];

            if (booking.booking_status !== "pending_payment") {
                removeFile(file);

                return res.status(409).json({
                    success: false,
                    message:
                        "This booking is not waiting for a payment.",
                });
            }

            const [existing] = await db.execute(
                `SELECT id
                 FROM payment_slips
                 WHERE reservation_id = ?
                   AND status = 'pending'
                 LIMIT 1`,
                [booking.id]
            );

            if (existing.length > 0) {
                removeFile(file);

                return res.status(409).json({
                    success: false,
                    message:
                        "A payment slip is already waiting for review for this booking.",
                });
            }

            // Calculate the 20% advance on the server.
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);

            const nights = Math.round(
                (Date.UTC(
                    checkOut.getFullYear(),
                    checkOut.getMonth(),
                    checkOut.getDate()
                ) -
                    Date.UTC(
                        checkIn.getFullYear(),
                        checkIn.getMonth(),
                        checkIn.getDate()
                    )) /
                    86400000
            );

            if (!Number.isFinite(nights) || nights <= 0) {
                removeFile(file);

                return res.status(400).json({
                    success: false,
                    message: "The booking dates are invalid.",
                });
            }

            const adults = Number(booking.adults);
            const children = Number(booking.children);
            const nightlyRate = Number(booking.nightly_rate);
            const mealPlanRate = Number(booking.meal_plan_rate);

            if (
                !Number.isFinite(adults) ||
                !Number.isFinite(children) ||
                !Number.isFinite(nightlyRate) ||
                !Number.isFinite(mealPlanRate) ||
                adults < 0 ||
                children < 0 ||
                nightlyRate < 0 ||
                mealPlanRate < 0
            ) {
                removeFile(file);

                return res.status(400).json({
                    success: false,
                    message: "The booking payment details are invalid.",
                });
            }

            const guests = adults + children;

            const total =
                nights * (nightlyRate + mealPlanRate * guests);

            const advance = Number((total * 0.2).toFixed(2));

            await db.execute(
                `INSERT INTO payment_slips
                    (
                        reservation_id,
                        file_name,
                        original_name,
                        amount,
                        bank_reference
                    )
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    booking.id,
                    file.filename,
                    String(file.originalname || "payment-slip").slice(
                        0,
                        255
                    ),
                    advance,
                    bankReference || null,
                ]
            );

            return res.status(201).json({
                success: true,
                message:
                    "Payment slip received. Our team will verify it and confirm your booking.",
            });
        } catch (error) {
            removeFile(file);

            console.error("Slip upload error:", error.message);

            return res.status(500).json({
                success: false,
                message:
                    "Could not save your payment slip. Please try again.",
            });
        }
    });
});

// ---------- POST /api/payments/demo-card ----------
// Portfolio demo only. This does not process real card payments.
router.post("/demo-card", async (req, res) => {
    try {
        const bookingReference = String(
            req.body.booking_reference || ""
        ).trim();

        const email = normalizeEmail(req.body.email);

        if (!bookingReference || !email) {
            return res.status(400).json({
                success: false,
                message: "Booking reference and email are required.",
            });
        }

        const [rows] = await db.execute(
            `SELECT res.id, res.booking_status, g.email
             FROM reservations res
             JOIN guests g ON res.guest_id = g.id
             WHERE res.booking_reference = ?`,
            [bookingReference]
        );

        if (
            rows.length === 0 ||
            normalizeEmail(rows[0].email) !== email
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Booking reference or email is incorrect.",
            });
        }

        if (rows[0].booking_status !== "pending_payment") {
            return res.status(409).json({
                success: false,
                message:
                    "This booking is not waiting for payment.",
            });
        }

        const [result] = await db.execute(
            `UPDATE reservations
             SET booking_status = 'confirmed'
             WHERE id = ?
               AND booking_status = 'pending_payment'`,
            [rows[0].id]
        );

        if (result.affectedRows !== 1) {
            return res.status(409).json({
                success: false,
                message:
                    "The booking status has changed. Please try again.",
            });
        }

        return res.json({
            success: true,
            demo: true,
            message:
                "Demo card payment successful. No real money was charged.",
        });
    } catch (error) {
        console.error("Demo card payment error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Demo payment failed. Please try again.",
        });
    }
});

// ---------- POST /api/payments/notify (PayHere) ----------
router.post("/notify", async (req, res) => {
    try {
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig,
        } = req.body;

        const secret = process.env.PAYHERE_MERCHANT_SECRET;
        const configuredMerchantId =
            process.env.PAYHERE_MERCHANT_ID;

        if (
            !secret ||
            !configuredMerchantId ||
            String(merchant_id) !== String(configuredMerchantId)
        ) {
            return res.status(400).send("Invalid merchant");
        }

        if (
            !order_id ||
            payhere_amount === undefined ||
            !payhere_currency ||
            status_code === undefined ||
            !md5sig
        ) {
            return res.status(400).send("Missing payment fields");
        }

        const hashedSecret = crypto
            .createHash("md5")
            .update(secret)
            .digest("hex")
            .toUpperCase();

        const localSig = crypto
            .createHash("md5")
            .update(
                String(merchant_id) +
                    String(order_id) +
                    String(payhere_amount) +
                    String(payhere_currency) +
                    String(status_code) +
                    hashedSecret
            )
            .digest("hex")
            .toUpperCase();

        const receivedSig = String(md5sig).toUpperCase();

        const validSignature =
            /^[A-F0-9]{32}$/.test(receivedSig) &&
            crypto.timingSafeEqual(
                Buffer.from(localSig, "hex"),
                Buffer.from(receivedSig, "hex")
            );

        if (!validSignature) {
            return res.status(400).send("Invalid signature");
        }

        // Only successful PayHere notifications are handled here.
        if (String(status_code) === "2") {
            const [result] = await db.execute(
                `UPDATE reservations
                 SET booking_status = 'confirmed'
                 WHERE booking_reference = ?
                   AND booking_status = 'pending_payment'`,
                [String(order_id)]
            );

            if (result.affectedRows === 0) {
                // It may already have been processed.
                const [rows] = await db.execute(
                    `SELECT id, booking_status
                     FROM reservations
                     WHERE booking_reference = ?`,
                    [String(order_id)]
                );

                if (
                    rows.length === 0 ||
                    rows[0].booking_status !== "confirmed"
                ) {
                    return res.status(404).send("Booking not found");
                }
            }
        }

        return res.status(200).send("OK");
    } catch (error) {
        console.error("PayHere notify error:", error.message);
        return res.status(500).send("Error");
    }
});

// ---------- Admin: list payment slips ----------
router.get("/slips", requireAdmin, async (req, res) => {
    try {
        const [slips] = await db.execute(
            `SELECT
                ps.id,
                ps.amount,
                ps.bank_reference,
                ps.status,
                ps.uploaded_at,
                ps.original_name,
                res.booking_reference,
                g.full_name,
                g.email
             FROM payment_slips ps
             JOIN reservations res ON ps.reservation_id = res.id
             JOIN guests g ON res.guest_id = g.id
             ORDER BY ps.id DESC`
        );

        return res.json({ success: true, slips });
    } catch (error) {
        console.error("List slips error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to load slips.",
        });
    }
});

// ---------- Admin: download a private payment slip ----------
router.get("/slips/:id/file", requireAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid slip ID.",
            });
        }

        const [rows] = await db.execute(
            "SELECT file_name FROM payment_slips WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Slip not found.",
            });
        }

        const filePath = path.join(
            uploadDir,
            path.basename(rows[0].file_name)
        );

        return res.sendFile(filePath, (error) => {
            if (error && !res.headersSent) {
                console.error("Send slip file error:", error.message);
                res.status(error.statusCode || 500).json({
                    success: false,
                    message: "Could not send the slip file.",
                });
            }
        });
    } catch (error) {
        console.error("Slip file error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to load file.",
        });
    }
});

// ---------- Admin: approve or reject a payment slip ----------
router.patch("/slips/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toLowerCase();

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid slip ID.",
        });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be approved or rejected.",
        });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT
                ps.reservation_id,
                ps.status AS slip_status,
                res.booking_status
             FROM payment_slips ps
             JOIN reservations res ON ps.reservation_id = res.id
             WHERE ps.id = ?
             FOR UPDATE`,
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Slip not found.",
            });
        }

        const slip = rows[0];

        if (slip.slip_status !== "pending") {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "This slip has already been reviewed.",
            });
        }

        if (
            status === "approved" &&
            slip.booking_status !== "pending_payment"
        ) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "This booking is no longer waiting for payment.",
            });
        }

        await connection.execute(
            `UPDATE payment_slips
             SET status = ?, reviewed_at = NOW()
             WHERE id = ? AND status = 'pending'`,
            [status, id]
        );

        if (status === "approved") {
            const [result] = await connection.execute(
                `UPDATE reservations
                 SET booking_status = 'confirmed'
                 WHERE id = ?
                   AND booking_status = 'pending_payment'`,
                [slip.reservation_id]
            );

            if (result.affectedRows !== 1) {
                throw new Error(
                    "Could not confirm the booking after approving the slip."
                );
            }
        }

        await connection.commit();

        return res.json({
            success: true,
            message: `Slip ${status}.`,
        });
    } catch (error) {
        if (connection) {
            await connection.rollback().catch(() => {});
        }

        console.error("Review slip error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update slip.",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;
