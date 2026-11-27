
/**
 * Sam Enterprise - Asset Activity Log
 * Retrieves recent asset activities for authorised users.
 */

const pool = require("../config/db");

const getAssetActivity = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                aa.id,
                aa.asset_id,
                a.asset_tag,
                a.asset_name,
                aa.user_id,
                u.first_name,
                u.last_name,
                u.email,
                aa.action,
                aa.details,
                aa.created_at
            FROM asset_activity aa
            LEFT JOIN assets a
                ON a.id = aa.asset_id
            LEFT JOIN users u
                ON u.id = aa.user_id
            ORDER BY aa.created_at DESC
            LIMIT 100`
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            activities: result.rows
        });

    } catch (error) {
        console.error("Get asset activity error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve asset activity."
        });
    }
};

module.exports = {
    getAssetActivity
};
