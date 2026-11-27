
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const createInvitation = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            first_name,
            last_name,
            email,
            employee_number,
            role,
            department,
            job_title
        } = req.body;

        if (!first_name || !last_name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, email and role are required."
            });
        }

        const allowedRoles = [
            "administrator",
            "it_manager",
            "technician",
            "employee",
            "auditor"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "The selected role is not allowed."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A user with this email address already exists."
            });
        }

        const invitationToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto
            .createHash("sha256")
            .update(invitationToken)
            .digest("hex");

        const invitationExpiry = new Date(
            Date.now() + 48 * 60 * 60 * 1000
        );

        await client.query("BEGIN");

        const userResult = await client.query(
            `INSERT INTO users (
                employee_number,
                first_name,
                last_name,
                email,
                role,
                department,
                job_title,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING
                id,
                employee_number,
                first_name,
                last_name,
                email,
                role,
                department,
                job_title,
                status`,
            [
                employee_number || null,
                first_name.trim(),
                last_name.trim(),
                normalizedEmail,
                role,
                department || null,
                job_title || null
            ]
        );

        const user = userResult.rows[0];

        await client.query(
            `INSERT INTO user_invitations (
                user_id,
                token_hash,
                expires_at
            )
            VALUES ($1, $2, $3)`,
            [user.id, tokenHash, invitationExpiry]
        );

        await client.query("COMMIT");

        const invitationLink =
            `http://127.0.0.1:5500/pages/accept-invitation.html?token=${invitationToken}`;

        return res.status(201).json({
            success: true,
            message: "Employee invitation created successfully.",
            employee: user,
            invitationLink
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create invitation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create employee invitation."
        });

    } finally {
        client.release();
    }
};

const acceptInvitation = async (req, res) => {
    const client = await pool.connect();

    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Invitation token and password are required."
            });
        }

        if (password.length < 12) {
            return res.status(400).json({
                success: false,
                message: "Your password must contain at least 12 characters."
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        await client.query("BEGIN");

        const invitationResult = await client.query(
            `SELECT
                id,
                user_id,
                expires_at,
                accepted_at
             FROM user_invitations
             WHERE token_hash = $1
             FOR UPDATE`,
            [tokenHash]
        );

        if (invitationResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "This invitation link is invalid."
            });
        }

        const invitation = invitationResult.rows[0];

        if (invitation.accepted_at) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "This invitation has already been used."
            });
        }

        if (new Date(invitation.expires_at) < new Date()) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "This invitation link has expired."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const userResult = await client.query(
            `UPDATE users
             SET
                password_hash = $1,
                status = 'active',
                email_verified_at = CURRENT_TIMESTAMP,
                password_changed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
               AND status = 'pending'
             RETURNING id`,
            [passwordHash, invitation.user_id]
        );

        if (userResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "This user account cannot be activated."
            });
        }

        await client.query(
            `UPDATE user_invitations
             SET accepted_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [invitation.id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Your account has been activated successfully. You can now log in."
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Accept invitation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to activate your account."
        });

    } finally {
        client.release();
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT
                id,
                first_name,
                last_name,
                email,
                password_hash,
                role,
                department,
                job_title,
                status
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email address or password."
            });
        }

        const user = result.rows[0];

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is not active. Please contact an administrator."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email address or password."
            });
        }

        await pool.query(
            `UPDATE users
             SET last_login_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [user.id]
        );

        req.session.regenerate((error) => {
            if (error) {
                console.error("Session regeneration error:", error.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to create your login session."
                });
            }

            req.session.user = {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                department: user.department,
                job_title: user.job_title
            };

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Session save error:", saveError.message);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to save your login session."
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Login successful.",
                    user: req.session.user
                });
            });
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An error occurred while logging in."
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const userId = req.session?.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to access your account."
            });
        }

        const result = await pool.query(
            `SELECT
                id,
                employee_number,
                first_name,
                last_name,
                email,
                role,
                department,
                job_title,
                status,
                created_at,
                last_login_at
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account could not be found."
            });
        }

        const user = result.rows[0];

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is not currently active."
            });
        }

        req.session.user = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            department: user.department,
            job_title: user.job_title
        };

        return res.status(200).json({
            success: true,
            message: "Current user retrieved successfully.",
            user
        });

    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve current user information."
        });
    }
};

const logout = async (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Unable to log out."
            });
        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        });

        return res.status(200).json({
            success: true,
            message: "You have been logged out successfully."
        });
    });
};

module.exports = {
    createInvitation,
    acceptInvitation,
    login,
    logout,
    getCurrentUser
};
