
const pool = require("../config/db");

const getEmployees = async (req, res) => {
    try {
        const search = (req.query.search || "").trim();

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
                email_verified_at,
                last_login_at,
                created_at,
                updated_at
             FROM users
             WHERE
                $1 = ''
                OR first_name ILIKE '%' || $1 || '%'
                OR last_name ILIKE '%' || $1 || '%'
                OR email ILIKE '%' || $1 || '%'
                OR employee_number ILIKE '%' || $1 || '%'
             ORDER BY created_at DESC, id DESC`,
            [search]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            employees: result.rows
        });

    } catch (error) {
        console.error("Get employees error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve employees."
        });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const employeeId = req.params.id;

        if (!/^[1-9]\d*$/.test(employeeId)) {
            return res.status(400).json({
                success: false,
                message: "A valid employee ID is required."
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
                email_verified_at,
                last_login_at,
                created_at,
                updated_at
             FROM users
             WHERE id = $1`,
            [employeeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        return res.status(200).json({
            success: true,
            employee: result.rows[0]
        });

    } catch (error) {
        console.error("Get employee error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve employee details."
        });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const employeeId = req.params.id;

        if (!/^[1-9]\d*$/.test(employeeId)) {
            return res.status(400).json({
                success: false,
                message: "A valid employee ID is required."
            });
        }

        const {
            employee_number,
            first_name,
            last_name,
            email,
            department,
            job_title
        } = req.body || {};

        if (
            typeof first_name !== "string" ||
            typeof last_name !== "string" ||
            typeof email !== "string" ||
            !first_name.trim() ||
            !last_name.trim() ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "First name, last name and email are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        if (
            employee_number !== undefined &&
            employee_number !== null &&
            typeof employee_number !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Employee number must be text."
            });
        }

        if (
            department !== undefined &&
            department !== null &&
            typeof department !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Department must be text."
            });
        }

        if (
            job_title !== undefined &&
            job_title !== null &&
            typeof job_title !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Job title must be text."
            });
        }

        const normalizedEmployeeNumber =
            employee_number == null || !employee_number.trim()
                ? null
                : employee_number.trim();

        const normalizedDepartment =
            department == null || !department.trim()
                ? null
                : department.trim();

        const normalizedJobTitle =
            job_title == null || !job_title.trim()
                ? null
                : job_title.trim();

        // Verify the target employee and protect Owner information.
        const targetResult = await pool.query(
            `SELECT id, role
             FROM users
             WHERE id = $1`,
            [employeeId]
        );

        if (targetResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        if (
            targetResult.rows[0].role === "owner" &&
            req.session.user.role !== "owner"
        ) {
            return res.status(403).json({
                success: false,
                message: "Only the Owner can modify Owner account information."
            });
        }

        const result = await pool.query(
            `UPDATE users
             SET
                employee_number = $1,
                first_name = $2,
                last_name = $3,
                email = $4,
                department = $5,
                job_title = $6,
                updated_at = NOW()
             WHERE id = $7
             RETURNING
                id,
                employee_number,
                first_name,
                last_name,
                email,
                role,
                department,
                job_title,
                status,
                updated_at`,
            [
                normalizedEmployeeNumber,
                first_name.trim(),
                last_name.trim(),
                normalizedEmail,
                normalizedDepartment,
                normalizedJobTitle,
                employeeId
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Employee information updated successfully.",
            employee: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This email address or employee number is already in use."
            });
        }

        console.error("Update employee error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update employee information."
        });
    }
};

const updateEmployeeStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        const employeeId = req.params.id;
        const { status } = req.body || {};
        const requestingUser = req.session.user;

        if (!/^[1-9]\d*$/.test(employeeId)) {
            return res.status(400).json({
                success: false,
                message: "A valid employee ID is required."
            });
        }

        // Prevent users from changing their own account status.
        if (String(requestingUser.id) === String(employeeId)) {
            return res.status(403).json({
                success: false,
                message: "You cannot change your own account status."
            });
        }

        const allowedStatuses = [
            "active",
            "suspended",
            "disabled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account status."
            });
        }

        await client.query("BEGIN");

        const employeeResult = await client.query(
            `SELECT id, role, status
             FROM users
             WHERE id = $1
             FOR UPDATE`,
            [employeeId]
        );

        if (employeeResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        const employee = employeeResult.rows[0];

        if (
            employee.role === "owner" &&
            requestingUser.role !== "owner"
        ) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                message: "Only the Owner can manage the Owner account status."
            });
        }

        if (
            employee.role === "owner" &&
            status !== "active"
        ) {
            const ownerCountResult = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM users
                 WHERE role = 'owner'
                   AND status = 'active'`
            );

            if (ownerCountResult.rows[0].count <= 1) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    message: "The last active Owner account cannot be suspended or disabled."
                });
            }
        }

        const result = await client.query(
            `UPDATE users
             SET status = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING
                id,
                first_name,
                last_name,
                email,
                role,
                status,
                updated_at`,
            [status, employeeId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Employee account status updated successfully.",
            employee: result.rows[0]
        });

    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Status rollback error:", rollbackError.message);
        }

        console.error("Update employee status error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update employee account status."
        });

    } finally {
        client.release();
    }
};

const updateEmployeeRole = async (req, res) => {
    let transactionStarted = false;
    const client = await pool.connect();

    try {
        const employeeId = req.params.id;
        const { role } = req.body || {};
        const requestingUser = req.session.user;

        if (!/^[1-9]\d*$/.test(employeeId)) {
            return res.status(400).json({
                success: false,
                message: "A valid employee ID is required."
            });
        }

        const allowedRoles = [
            "owner",
            "administrator",
            "it_manager",
            "technician",
            "employee",
            "auditor"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee role."
            });
        }

        if (String(requestingUser.id) === String(employeeId)) {
            return res.status(403).json({
                success: false,
                message: "You cannot change your own role."
            });
        }

        if (!["owner", "administrator"].includes(requestingUser.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to manage employee roles."
            });
        }

        await client.query("BEGIN");
        transactionStarted = true;

        const employeeResult = await client.query(
            `SELECT id, first_name, last_name, email, role, status
             FROM users
             WHERE id = $1
             FOR UPDATE`,
            [employeeId]
        );

        if (employeeResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        const employee = employeeResult.rows[0];

        if (
            role === "owner" &&
            requestingUser.role !== "owner"
        ) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(403).json({
                success: false,
                message: "Only the Owner can assign the Owner role."
            });
        }

        if (
            employee.role === "owner" &&
            requestingUser.role !== "owner"
        ) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(403).json({
                success: false,
                message: "Only the Owner can change an Owner's role."
            });
        }

        if (
            employee.role === "owner" &&
            role !== "owner" &&
            employee.status === "active"
        ) {
            const ownerCountResult = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM users
                 WHERE role = 'owner'
                   AND status = 'active'`
            );

            if (ownerCountResult.rows[0].count <= 1) {
                await client.query("ROLLBACK");
                transactionStarted = false;

                return res.status(409).json({
                    success: false,
                    message: "The last active Owner cannot be demoted."
                });
            }
        }

        const result = await client.query(
            `UPDATE users
             SET role = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING
                id,
                first_name,
                last_name,
                email,
                role,
                department,
                job_title,
                status,
                updated_at`,
            [role, employeeId]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message: "Employee role updated successfully.",
            employee: result.rows[0]
        });

    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Role rollback error:", rollbackError.message);
            }
        }

        console.error("Update employee role error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update employee role."
        });

    } finally {
        client.release();
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus,
    updateEmployeeRole
};
