
const pool = require("../config/db");

const COMPANY_TIME_ZONE = "Africa/Johannesburg";

const VALID_PRIORITIES = ["Low", "Medium", "High", "Critical"];

const VALID_STATUSES = [
    "Open",
    "In Progress",
    "Pending",
    "Resolved"
];

/**
 * Retrieves the department belonging to a user.
 */
const getUserDepartment = async (userId) => {
    const result = await pool.query(
        `SELECT department
         FROM users
         WHERE id = $1`,
        [userId]
    );

    return result.rows[0]?.department || null;
};

/**
 * Builds the ticket visibility condition for each role.
 */
const getTicketAccess = (role, userId, department) => {
    switch (role) {
        case "owner":
        case "administrator":
        case "auditor":
            return {
                condition: "TRUE",
                values: []
            };

        case "it_manager":
            return {
                condition: "t.department = $1",
                values: [department]
            };

        case "technician":
            return {
                condition: `(t.assigned_to = $1 OR
                    (t.assigned_to IS NULL AND t.department = $2))`,
                values: [userId, department]
            };

        case "employee":
            return {
                condition: "t.created_by = $1",
                values: [userId]
            };

        default:
            return {
                condition: "FALSE",
                values: []
            };
    }
};

/**
 * Creates a new support ticket.
 */
const createTicket = async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;

    if (role === "auditor") {
        return res.status(403).json({
            success: false,
            message: "Auditors have read-only access."
        });
    }

    const {
        contactNumber,
        issueTitle,
        issueCategory,
        priority,
        location,
        assetNumber,
        description
    } = req.body;

    if (
        !issueTitle ||
        typeof issueTitle !== "string" ||
        !issueTitle.trim() ||
        !description ||
        typeof description !== "string" ||
        !description.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide a ticket title and description."
        });
    }

    const selectedPriority = priority || "Medium";

    if (!VALID_PRIORITIES.includes(selectedPriority)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ticket priority."
        });
    }

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const userResult = await client.query(
            `SELECT id, department, status
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (
            userResult.rows.length === 0 ||
            userResult.rows[0].status !== "active"
        ) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                message: "Your account cannot create tickets."
            });
        }

        const department = userResult.rows[0].department;

        const yearResult = await client.query(
            `SELECT
                DATE_PART(
                    'year',
                    CURRENT_TIMESTAMP AT TIME ZONE $1
                )::INTEGER AS ticket_year`,
            [COMPANY_TIME_ZONE]
        );

        const ticketYear = yearResult.rows[0].ticket_year;

        const counterResult = await client.query(
            `INSERT INTO ticket_counters (
                ticket_year,
                last_number
            )
            VALUES ($1, 1)
            ON CONFLICT (ticket_year)
            DO UPDATE SET
                last_number = ticket_counters.last_number + 1
            RETURNING last_number`,
            [ticketYear]
        );

        const ticketNumber = counterResult.rows[0].last_number;

        const ticketReference =
            `SAM-${ticketYear}-${String(ticketNumber).padStart(2, "0")}`;

        const ticketResult = await client.query(
            `INSERT INTO tickets (
                ticket_reference,
                ticket_year,
                ticket_number,
                created_by,
                department,
                contact_number,
                issue_title,
                issue_category,
                priority,
                location,
                asset_number,
                description
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12
            )
            RETURNING *`,
            [
                ticketReference,
                ticketYear,
                ticketNumber,
                userId,
                department,
                contactNumber || null,
                issueTitle.trim(),
                issueCategory || null,
                selectedPriority,
                location || null,
                assetNumber || null,
                description.trim()
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Support ticket created successfully.",
            ticket: ticketResult.rows[0]
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        console.error("Create ticket error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create your support ticket."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

/**
 * Retrieves tickets according to the logged-in user's role.
 */
const getTickets = async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;

    try {
        const department = await getUserDepartment(userId);

        const access = getTicketAccess(
            role,
            userId,
            department
        );

        const values = [...access.values];

        let query = `
            SELECT
                t.*,
                creator.first_name AS creator_first_name,
                creator.last_name AS creator_last_name,
                creator.email AS creator_email,
                assignee.first_name AS assignee_first_name,
                assignee.last_name AS assignee_last_name
            FROM tickets t
            LEFT JOIN users creator
                ON t.created_by = creator.id
            LEFT JOIN users assignee
                ON t.assigned_to = assignee.id
            WHERE ${access.condition}
        `;

        if (req.query.status) {
            if (!VALID_STATUSES.includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid ticket status filter."
                });
            }

            values.push(req.query.status);
            query += ` AND t.status = $${values.length}`;
        }

        query += " ORDER BY t.created_at DESC";

        const result = await pool.query(query, values);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            tickets: result.rows
        });

    } catch (error) {
        console.error("Get tickets error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve support tickets."
        });
    }
};

/**
 * Retrieves one ticket after checking the user's access.
 */
const getTicketById = async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    const ticketId = req.params.id;

    if (!/^\d+$/.test(ticketId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ticket ID."
        });
    }

    try {
        const department = await getUserDepartment(userId);

        const access = getTicketAccess(
            role,
            userId,
            department
        );

        const values = [...access.values, ticketId];

        const ticketResult = await pool.query(
            `SELECT
                t.*,
                creator.first_name AS creator_first_name,
                creator.last_name AS creator_last_name,
                creator.email AS creator_email,
                assignee.first_name AS assignee_first_name,
                assignee.last_name AS assignee_last_name
             FROM tickets t
             LEFT JOIN users creator
                ON t.created_by = creator.id
             LEFT JOIN users assignee
                ON t.assigned_to = assignee.id
             WHERE ${access.condition}
             AND t.id = $${values.length}`,
            values
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found or you do not have permission to view it."
            });
        }

        const updatesResult = await pool.query(
            `SELECT
                tu.*,
                u.first_name,
                u.last_name,
                u.role
             FROM ticket_updates tu
             JOIN users u
                ON tu.updated_by = u.id
             WHERE tu.ticket_id = $1
             ORDER BY tu.created_at ASC`,
            [ticketId]
        );

        const attachmentsResult = await pool.query(
            `SELECT
                id,
                original_filename,
                mime_type,
                size_bytes,
                created_at
             FROM ticket_attachments
             WHERE ticket_id = $1
             ORDER BY created_at ASC`,
            [ticketId]
        );

        return res.status(200).json({
            success: true,
            ticket: ticketResult.rows[0],
            updates: updatesResult.rows,
            attachments: attachmentsResult.rows
        });

    } catch (error) {
        console.error("Get ticket details error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve ticket details."
        });
    }
};

/**
 * Updates a ticket's status and records the change.
 */
const updateTicketStatus = async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    const ticketId = req.params.id;

    const { status, message } = req.body;

    if (!/^\d+$/.test(ticketId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ticket ID."
        });
    }

    if (role === "employee" || role === "auditor") {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to update ticket status."
        });
    }

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ticket status."
        });
    }

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const departmentResult = await client.query(
            `SELECT department
             FROM users
             WHERE id = $1`,
            [userId]
        );

        const department = departmentResult.rows[0]?.department || null;

        const ticketResult = await client.query(
            `SELECT *
             FROM tickets
             WHERE id = $1
             FOR UPDATE`,
            [ticketId]
        );

        if (ticketResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        const ticket = ticketResult.rows[0];

        let permitted = false;

        if (role === "owner" || role === "administrator") {
            permitted = true;
        } else if (role === "it_manager") {
            permitted = ticket.department === department;
        } else if (role === "technician") {
            permitted =
                String(ticket.assigned_to) === String(userId);
        }

        if (!permitted) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                message: "You do not have permission to update this ticket."
            });
        }

        const previousStatus = ticket.status;

        if (previousStatus === status) {
            await client.query("COMMIT");

            return res.status(200).json({
                success: true,
                message: "The ticket already has this status.",
                ticket
            });
        }

        const updateResult = await client.query(
            `UPDATE tickets
             SET
                status = $1::VARCHAR(30),
                updated_at = CURRENT_TIMESTAMP,
                resolved_at = CASE
                    WHEN $2::TEXT = 'Resolved' THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END
             WHERE id = $3::BIGINT
             RETURNING *`,
            [status, status, ticketId]
        );

        await client.query(
            `INSERT INTO ticket_updates (
                ticket_id,
                updated_by,
                previous_status,
                new_status,
                message
            )
            VALUES ($1, $2, $3, $4, $5)`,
            [
                ticketId,
                userId,
                previousStatus,
                status,
                typeof message === "string" && message.trim()
                    ? message.trim()
                    : `Ticket status changed from ${previousStatus} to ${status}.`
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Ticket status updated successfully.",
            ticket: updateResult.rows[0]
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        console.error("Update ticket status error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update ticket status."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = {
    createTicket,
    getTickets,
    getTicketById,
    updateTicketStatus
};
