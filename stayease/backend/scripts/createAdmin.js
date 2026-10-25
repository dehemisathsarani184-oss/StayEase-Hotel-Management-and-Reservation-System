
require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("readline");
const db = require("../src/config/db");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function createAdmin() {
    try {
        const fullName = (await ask("Admin full name: ")).trim();
        const email = (await ask("Admin email: "))
            .trim()
            .toLowerCase();
        const password = await ask("Admin password: ");

        if (!fullName || !email || !password) {
            throw new Error("All fields are required.");
        }

        if (password.length < 12) {
            throw new Error(
                "Use a password with at least 12 characters."
            );
        }

        const [existing] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            throw new Error("This email already exists.");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await db.execute(
            `INSERT INTO users
             (full_name, email, password_hash, role)
             VALUES (?, ?, ?, 'admin')`,
            [fullName, email, passwordHash]
        );

        console.log("Admin account created successfully.");
    } catch (error) {
        console.error("Could not create admin:", error.message);
    } finally {
        rl.close();
        await db.end();
    }
}

createAdmin();
