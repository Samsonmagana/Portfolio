
const pool = require("../config/db");

const requireAuth = async (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in."
        });
    }

    try {
        const userId = req.session.user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid session. Please log in again."
            });
        }

        const result = await pool.query(
            `SELECT id, role, status
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (
            result.rows.length === 0 ||
            result.rows[0].status !== "active"
        ) {
            return req.session.destroy((error) => {
                if (error) {
                    console.error("Session destruction error:", error.message);
                }

                res.clearCookie("connect.sid");

                return res.status(401).json({
                    success: false,
                    message: "Your account is inactive. Please contact your administrator."
                });
            });
        }

        // Keep the session role synchronized with the database.
        req.session.user.role = result.rows[0].role;

        next();

    } catch (error) {
        console.error("Authentication verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to verify your account."
        });
    }
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please log in first."
            });
        }

        if (!allowedRoles.includes(req.session.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action."
            });
        }

        next();
    };
};

module.exports = {
    requireAuth,
    requireRole
};
