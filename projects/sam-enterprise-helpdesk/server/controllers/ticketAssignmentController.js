/**
 * Sam Enterprise - Ticket Assignment
 * Assigns support tickets to active technicians.
 */

const pool = require("../config/db");

const assignTicket = async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    const ticketId = req.params.id;
    const assignedTo = req.body.assignedTo ?? req.body.assigned_to;

    if (!/^\d+$/.test(ticketId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ticket ID."
        });
    }

    if (!assignedTo || !/^\d+$/.test(String(assignedTo))) {
        return res.status(400).json({
            success: false,
            message: "Please select a valid technician."
        });
    }

    if (!["owner", "administrator", "it_manager"].includes(role)) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to assign tickets."
        });
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

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

        if (role === "it_manager") {
            const managerResult = await client.query(
                `SELECT department
                 FROM users
                 WHERE id = $1`,
                [userId]
            );

            const managerDepartment =
                managerResult.rows[0]?.department || null;

            if (managerDepartment !== ticket.department) {
                await client.query("ROLLBACK");
                return res.status(403).json({
                    success: false,
                    message: "You cannot assign tickets outside your department."
                });
            }
        }

        if (ticket.status === "Resolved") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Resolved tickets cannot be assigned."
            });
        }

        const technicianResult = await client.query(
            `SELECT id, first_name, last_name, email, department
             FROM users
             WHERE id = $1
               AND role = 'technician'
               AND status = 'active'`,
            [assignedTo]
        );

        if (technicianResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "The selected user is not an active technician."
            });
        }

        const technician = technicianResult.rows[0];

        if (technician.department !== ticket.department) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "The technician must belong to the ticket's department."
            });
        }

        const updateResult = await client.query(
            `UPDATE tickets
             SET assigned_to = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [technician.id, ticketId]
        );

        await client.query(
            `INSERT INTO ticket_updates (
                ticket_id,
                updated_by,
                message
             )
             VALUES ($1, $2, $3)`,
            [
                ticketId,
                userId,
                `Ticket assigned to ${technician.first_name} ${technician.last_name}.`
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Ticket assigned successfully.",
            ticket: {
                ...updateResult.rows[0],
                assignee_first_name: technician.first_name,
                assignee_last_name: technician.last_name
            }
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        console.error("Assign ticket error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to assign the support ticket."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

const getAssignableTechnicians = async (req, res) => {
    const { id: userId, role } = req.session.user;

    try {
        let result;

        if (role === "it_manager") {
            result = await pool.query(
                `SELECT id, first_name, last_name, email, department
                 FROM users
                 WHERE role = 'technician'
                   AND status = 'active'
                   AND department = (
                       SELECT department
                       FROM users
                       WHERE id = $1
                   )
                 ORDER BY first_name, last_name`,
                [userId]
            );
        } else {
            result = await pool.query(
                `SELECT id, first_name, last_name, email, department
                 FROM users
                 WHERE role = 'technician'
                   AND status = 'active'
                 ORDER BY first_name, last_name`
            );
        }

        return res.status(200).json({
            success: true,
            technicians: result.rows
        });

    } catch (error) {
        console.error("Get assignable technicians error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve technicians."
        });
    }
};

module.exports = {
    assignTicket,
    getAssignableTechnicians
};