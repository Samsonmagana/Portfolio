
// Sam Enterprise - IT Asset Management Controller

const pool = require("../config/db");

// Allowed asset categories
const allowedCategories = [
    "Laptop",
    "Desktop",
    "Monitor",
    "Printer",
    "Network Equipment",
    "Peripheral",
    "Other"
];

// Allowed physical asset conditions
const allowedConditions = [
    "New",
    "Good",
    "Fair",
    "Damaged"
];

// Allowed statuses for normal asset registration and updates.
// Assigned assets must use the allocation and return processes.
const allowedStatuses = [
    "Available",
    "Maintenance",
    "Retired"
];

// Allowed maintenance statuses
const allowedMaintenanceStatuses = [
    "Open",
    "In Progress",
    "Completed",
    "Cancelled"
];

// Validate positive numeric database IDs
const isValidId = (id) => {
    return /^[1-9]\d*$/.test(String(id));
};

// Clean optional text values before saving them to the database
const normalizeOptionalText = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    return typeof value === "string" && value.trim()
        ? value.trim()
        : null;
};

// Validate maintenance date values
const isValidMaintenanceDate = (value) => {
    if (value === undefined || value === null || value === "") {
        return true;
    }

    return !Number.isNaN(new Date(value).getTime());
};

// Validate asset information before database operations
const validateAssetData = (data, isUpdate = false) => {
    const {
        asset_tag,
        asset_name,
        category,
        condition,
        status,
        purchase_cost
    } = data;

    // New assets must have an asset tag and asset name
    if (!isUpdate) {
        if (
            typeof asset_tag !== "string" ||
            !asset_tag.trim() ||
            typeof asset_name !== "string" ||
            !asset_name.trim()
        ) {
            return "Asset tag and asset name are required.";
        }
    }

    // Validate the asset category
    if (
        category !== undefined &&
        !allowedCategories.includes(category)
    ) {
        return "Invalid asset category.";
    }

    // Validate the physical condition
    if (
        condition !== undefined &&
        !allowedConditions.includes(condition)
    ) {
        return "Invalid asset condition.";
    }

    // Prevent normal updates from changing an asset to Assigned
    if (
        status !== undefined &&
        !allowedStatuses.includes(status)
    ) {
        return "Invalid asset status. Use the allocation or return process for assigned assets.";
    }

    // Purchase cost must be a valid non-negative amount
    if (
        purchase_cost !== undefined &&
        purchase_cost !== null &&
        purchase_cost !== ""
    ) {
        const cost = Number(purchase_cost);

        if (!Number.isFinite(cost) || cost < 0) {
            return "Purchase cost must be a valid non-negative amount.";
        }
    }

    return null;
};

// Validate maintenance information
const validateMaintenanceData = (data, isUpdate = false) => {
    if (!isUpdate) {
        if (
            typeof data.maintenance_type !== "string" ||
            !data.maintenance_type.trim()
        ) {
            return "Maintenance type is required.";
        }

        if (
            typeof data.description !== "string" ||
            !data.description.trim()
        ) {
            return "Maintenance description is required.";
        }
    }

    if (
        data.maintenance_type !== undefined &&
        (
            typeof data.maintenance_type !== "string" ||
            !data.maintenance_type.trim()
        )
    ) {
        return "Please provide a valid maintenance type.";
    }

    if (
        data.description !== undefined &&
        (
            typeof data.description !== "string" ||
            !data.description.trim()
        )
    ) {
        return "Please provide a valid maintenance description.";
    }

    if (
        data.status !== undefined &&
        !allowedMaintenanceStatuses.includes(data.status)
    ) {
        return "Invalid maintenance status.";
    }

    if (
        data.maintenance_cost !== undefined &&
        data.maintenance_cost !== null &&
        data.maintenance_cost !== ""
    ) {
        const cost = Number(data.maintenance_cost);

        if (!Number.isFinite(cost) || cost < 0) {
            return "Maintenance cost must be a valid non-negative amount.";
        }
    }

    if (
        data.scheduled_at !== undefined &&
        !isValidMaintenanceDate(data.scheduled_at)
    ) {
        return "Please provide a valid scheduled date.";
    }

    if (
        data.completed_at !== undefined &&
        !isValidMaintenanceDate(data.completed_at)
    ) {
        return "Please provide a valid completion date.";
    }

    return null;
};

// Safely roll back a database transaction
const rollbackTransaction = async (client) => {
    if (client) {
        await client.query("ROLLBACK").catch((error) => {
            console.error("Database rollback error:", error.message);
        });
    }
};

// Retrieve the asset inventory
const getAssets = async (req, res) => {
    try {
        const search = typeof req.query.search === "string"
            ? req.query.search.trim()
            : "";

        const category = typeof req.query.category === "string"
            ? req.query.category.trim()
            : "";

        const status = typeof req.query.status === "string"
            ? req.query.status.trim()
            : "";

        // Validate the category filter
        if (
            category &&
            category !== "All" &&
            !allowedCategories.includes(category)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid asset category filter."
            });
        }

        // Assigned is a valid inventory status
        const validFilterStatuses = [
            "Assigned",
            ...allowedStatuses
        ];

        // Validate the status filter
        if (
            status &&
            status !== "All" &&
            !validFilterStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid asset status filter."
            });
        }

        // Retrieve assets together with their assigned employee details
        const result = await pool.query(
            `SELECT
                a.*,
                u.employee_number,
                u.first_name AS assigned_first_name,
                u.last_name AS assigned_last_name,
                u.email AS assigned_email
             FROM assets a
             LEFT JOIN users u
                ON a.assigned_user_id = u.id
             WHERE
                ($1 = ''
                    OR a.asset_tag ILIKE '%' || $1 || '%'
                    OR a.asset_name ILIKE '%' || $1 || '%'
                    OR a.manufacturer ILIKE '%' || $1 || '%'
                    OR a.model ILIKE '%' || $1 || '%'
                    OR a.serial_number ILIKE '%' || $1 || '%'
                    OR a.location ILIKE '%' || $1 || '%'
                    OR u.first_name ILIKE '%' || $1 || '%'
                    OR u.last_name ILIKE '%' || $1 || '%')
                AND ($2 = '' OR $2 = 'All' OR a.category = $2)
                AND ($3 = '' OR $3 = 'All' OR a.status = $3)
             ORDER BY a.created_at DESC, a.id DESC`,
            [search, category, status]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            assets: result.rows
        });

    } catch (error) {
        console.error("Get assets error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve asset inventory."
        });
    }
};

// Retrieve one asset by its database ID
const getAssetById = async (req, res) => {
    try {
        const assetId = req.params.id;

        // Validate the asset ID
        if (!isValidId(assetId)) {
            return res.status(400).json({
                success: false,
                message: "A valid asset ID is required."
            });
        }

        // Retrieve the asset and its assigned employee details
        const result = await pool.query(
            `SELECT
                a.*,
                u.employee_number,
                u.first_name AS assigned_first_name,
                u.last_name AS assigned_last_name,
                u.email AS assigned_email
             FROM assets a
             LEFT JOIN users u
                ON a.assigned_user_id = u.id
             WHERE a.id = $1`,
            [assetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        return res.status(200).json({
            success: true,
            asset: result.rows[0]
        });

    } catch (error) {
        console.error("Get asset error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve asset details."
        });
    }
};

// Retrieve active employees eligible for asset allocation
const getEligibleEmployees = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                employee_number,
                first_name,
                last_name,
                email,
                role,
                department,
                job_title
             FROM users
             WHERE status = 'active'
             ORDER BY first_name ASC, last_name ASC`
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            employees: result.rows
        });

    } catch (error) {
        console.error("Get asset employees error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve employees for asset allocation."
        });
    }
};

// Register a new company asset
const createAsset = async (req, res) => {
    let client;

    try {
        const data = req.body || {};

        // Validate the submitted asset information
        const validationError = validateAssetData(data);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const assetTag = data.asset_tag.trim();
        const assetName = data.asset_name.trim();
        const category = data.category;
        const condition = data.condition || "Good";
        const status = data.status || "Available";

        // Obtain a database connection for the transaction
        client = await pool.connect();

        await client.query("BEGIN");

        // Insert the asset into the inventory
        const result = await client.query(
            `INSERT INTO assets (
                asset_tag,
                asset_name,
                category,
                manufacturer,
                model,
                serial_number,
                location,
                condition,
                status,
                purchase_date,
                warranty_expiry,
                purchase_cost,
                notes,
                created_by,
                updated_by
             )
             VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14, $14
             )
             RETURNING *`,
            [
                assetTag,
                assetName,
                category,
                normalizeOptionalText(data.manufacturer),
                normalizeOptionalText(data.model),
                normalizeOptionalText(data.serial_number),
                normalizeOptionalText(data.location),
                condition,
                status,
                data.purchase_date || null,
                data.warranty_expiry || null,
                data.purchase_cost === "" || data.purchase_cost == null
                    ? null
                    : Number(data.purchase_cost),
                normalizeOptionalText(data.notes),
                req.session.user.id
            ]
        );

        const asset = result.rows[0];

        // Record the registration in the asset audit trail
        await client.query(
            `INSERT INTO asset_activity (
                asset_id,
                user_id,
                action,
                details
             )
             VALUES ($1, $2, $3, $4)`,
            [
                asset.id,
                req.session.user.id,
                "ASSET_CREATED",
                JSON.stringify({
                    asset_tag: asset.asset_tag,
                    asset_name: asset.asset_name
                })
            ]
        );

        // Save the asset and audit record together
        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Asset registered successfully.",
            asset
        });

    } catch (error) {
        await rollbackTransaction(client);

        // Handle duplicate asset tags and serial numbers
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This asset tag or serial number is already registered."
            });
        }

        // Handle invalid date values
        if (error.code === "22007" || error.code === "22008") {
            return res.status(400).json({
                success: false,
                message: "Please provide valid asset dates."
            });
        }

        console.error("Create asset error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to register asset."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Update existing asset information
const updateAsset = async (req, res) => {
    let client;

    try {
        const assetId = req.params.id;
        const data = req.body || {};

        // Validate the asset ID
        if (!isValidId(assetId)) {
            return res.status(400).json({
                success: false,
                message: "A valid asset ID is required."
            });
        }

        // Validate the submitted asset information
        const validationError = validateAssetData(data, true);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Only these fields can be changed through this endpoint
        const allowedFields = [
            "asset_tag",
            "asset_name",
            "category",
            "manufacturer",
            "model",
            "serial_number",
            "location",
            "condition",
            "status",
            "purchase_date",
            "warranty_expiry",
            "purchase_cost",
            "notes"
        ];

        const updates = [];
        const values = [];

        // Build the parameterised update query
        for (const field of allowedFields) {
            if (!Object.prototype.hasOwnProperty.call(data, field)) {
                continue;
            }

            let value = data[field];

            // Asset tag and name cannot be empty
            if (
                field === "asset_tag" ||
                field === "asset_name"
            ) {
                if (typeof value !== "string" || !value.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} cannot be empty.`
                    });
                }

                value = value.trim();
            }

            // Clean optional text fields
            if (
                [
                    "manufacturer",
                    "model",
                    "serial_number",
                    "location",
                    "notes"
                ].includes(field)
            ) {
                value = normalizeOptionalText(value);
            }

            // Convert purchase cost to a number or NULL
            if (field === "purchase_cost") {
                value = value === "" || value == null
                    ? null
                    : Number(value);
            }

            // Convert empty date fields to NULL
            if (
                field === "purchase_date" ||
                field === "warranty_expiry"
            ) {
                value = value || null;
            }

            values.push(value);
            updates.push(`${field} = $${values.length}`);
        }

        // Reject an empty update request
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No asset information was provided for updating."
            });
        }

        // Record the user responsible for the update
        updates.push(`updated_by = $${values.length + 1}`);
        values.push(req.session.user.id);

        // Update the modification timestamp
        updates.push("updated_at = CURRENT_TIMESTAMP");

        client = await pool.connect();

        await client.query("BEGIN");

        // Lock the existing asset while updating it
        const existingResult = await client.query(
            `SELECT *
             FROM assets
             WHERE id = $1
             FOR UPDATE`,
            [assetId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        const existingAsset = existingResult.rows[0];

        // Assigned assets must be returned before their status
        // can be changed through the normal update endpoint
        if (
            existingAsset.status === "Assigned" &&
            data.status !== undefined
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Return the assigned asset before changing its status."
            });
        }

        values.push(assetId);

        // Update the asset information
        const result = await client.query(
            `UPDATE assets
             SET ${updates.join(", ")}
             WHERE id = $${values.length}
             RETURNING *`,
            values
        );

        // Record the update in the audit trail
        await client.query(
            `INSERT INTO asset_activity (
                asset_id,
                user_id,
                action,
                details
             )
             VALUES ($1, $2, $3, $4)`,
            [
                assetId,
                req.session.user.id,
                "ASSET_UPDATED",
                JSON.stringify({
                    previous_asset_tag: existingAsset.asset_tag,
                    updated_fields: Object.keys(data)
                })
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Asset information updated successfully.",
            asset: result.rows[0]
        });

    } catch (error) {
        await rollbackTransaction(client);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This asset tag or serial number is already registered."
            });
        }

        if (error.code === "22007" || error.code === "22008") {
            return res.status(400).json({
                success: false,
                message: "Please provide valid asset dates."
            });
        }

        console.error("Update asset error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update asset information."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Assign an available asset to an active employee
const assignAsset = async (req, res) => {
    const { id } = req.params;
    const { assigned_user_id, notes } = req.body || {};

    // Validate the asset ID
    if (!isValidId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid asset ID."
        });
    }

    // Validate the selected employee ID
    if (!isValidId(assigned_user_id)) {
        return res.status(400).json({
            success: false,
            message: "Please select a valid employee."
        });
    }

    const assignedBy = req.session.user.id;
    const assignmentNotes = normalizeOptionalText(notes);

    let client;

    try {
        client = await pool.connect();

        // Begin the allocation transaction
        await client.query("BEGIN");

        // Lock the asset to prevent simultaneous allocations
        const assetResult = await client.query(
            `SELECT
                id,
                asset_tag,
                asset_name,
                status,
                assigned_user_id
             FROM assets
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (assetResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        const asset = assetResult.rows[0];

        // Only available assets can be allocated
        if (asset.status !== "Available") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Only available assets can be assigned."
            });
        }

        // Verify that the selected employee has an active account
        const employeeResult = await client.query(
            `SELECT
                id,
                first_name,
                last_name,
                email
             FROM users
             WHERE id = $1
               AND status = 'active'
             FOR UPDATE`,
            [assigned_user_id]
        );

        if (employeeResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "The selected employee does not have an active account."
            });
        }

        const employee = employeeResult.rows[0];

        // Update the asset's current assignment
        await client.query(
            `UPDATE assets
             SET
                status = 'Assigned',
                assigned_user_id = $1,
                updated_by = $2,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [assigned_user_id, assignedBy, id]
        );

        // Create a new assignment history record
        const assignmentResult = await client.query(
            `INSERT INTO asset_assignments (
                asset_id,
                assigned_user_id,
                assigned_by,
                notes
             )
             VALUES ($1, $2, $3, $4)
             RETURNING id, assigned_at`,
            [id, assigned_user_id, assignedBy, assignmentNotes]
        );

        const assignment = assignmentResult.rows[0];

        // Record the allocation in the asset audit trail
        await client.query(
            `INSERT INTO asset_activity (
                asset_id,
                user_id,
                action,
                details
             )
             VALUES ($1, $2, $3, $4)`,
            [
                id,
                assignedBy,
                "ASSET_ASSIGNED",
                JSON.stringify({
                    asset_tag: asset.asset_tag,
                    asset_name: asset.asset_name,
                    assigned_user_id: employee.id,
                    assigned_employee:
                        `${employee.first_name} ${employee.last_name}`,
                    assignment_id: assignment.id,
                    notes: assignmentNotes
                })
            ]
        );

        // Save the asset update, assignment history and audit record
        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Asset assigned successfully.",
            assignment: {
                id: assignment.id,
                asset_id: Number(id),
                assigned_user_id: employee.id,
                assigned_employee:
                    `${employee.first_name} ${employee.last_name}`,
                assigned_at: assignment.assigned_at
            }
        });

    } catch (error) {
        await rollbackTransaction(client);

        console.error("Assign asset error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An error occurred while assigning the asset."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Process the return of an asset from an employee
const returnAsset = async (req, res) => {
    const { id } = req.params;
    const { condition, notes } = req.body || {};

    // Validate the asset ID
    if (!isValidId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid asset ID."
        });
    }

    // Validate the supplied return condition
    if (
        condition !== undefined &&
        condition !== null &&
        condition !== "" &&
        !allowedConditions.includes(condition)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid return condition."
        });
    }

    const returnedBy = req.session.user.id;
    const returnCondition = condition || null;
    const returnNotes = normalizeOptionalText(notes);

    let client;

    try {
        client = await pool.connect();

        // Begin the return transaction
        await client.query("BEGIN");

        // Lock the asset while its return is processed
        const assetResult = await client.query(
            `SELECT
                id,
                asset_tag,
                asset_name,
                status,
                assigned_user_id,
                condition
             FROM assets
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (assetResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        const asset = assetResult.rows[0];

        // Confirm that the asset is currently assigned
        if (
            asset.status !== "Assigned" ||
            !asset.assigned_user_id
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "This asset is not currently assigned."
            });
        }

        // Retrieve the active assignment history record
        const assignmentResult = await client.query(
            `SELECT
                id,
                assigned_user_id,
                assigned_at,
                notes
             FROM asset_assignments
             WHERE asset_id = $1
               AND returned_at IS NULL
             FOR UPDATE`,
            [id]
        );

        if (assignmentResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "No active assignment record was found for this asset."
            });
        }

        // Prevent processing an asset with inconsistent
        // multiple active assignment records
        if (assignmentResult.rows.length > 1) {
            await client.query("ROLLBACK");

            console.error(
                "Multiple active assignments found for asset:",
                id
            );

            return res.status(409).json({
                success: false,
                message: "Multiple active assignment records were found. Please investigate the asset history."
            });
        }

        const assignment = assignmentResult.rows[0];

        // Close the assignment history record
        await client.query(
            `UPDATE asset_assignments
             SET
                returned_at = CURRENT_TIMESTAMP,
                returned_by = $1,
                return_condition = $2
             WHERE id = $3`,
            [returnedBy, returnCondition, assignment.id]
        );

        // Return the asset to Available status and remove
        // its assigned employee to satisfy the database constraint
        await client.query(
            `UPDATE assets
             SET
                status = 'Available',
                assigned_user_id = NULL,
                condition = COALESCE($1, condition),
                updated_by = $2,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [returnCondition, returnedBy, id]
        );

        // Record the return and its details in the audit trail
        // Return notes are stored in JSON because the assignment
        // table does not have a separate return-notes column
        await client.query(
            `INSERT INTO asset_activity (
                asset_id,
                user_id,
                action,
                details
             )
             VALUES ($1, $2, $3, $4)`,
            [
                id,
                returnedBy,
                "ASSET_RETURNED",
                JSON.stringify({
                    asset_tag: asset.asset_tag,
                    asset_name: asset.asset_name,
                    previous_assigned_user_id:
                        assignment.assigned_user_id,
                    assignment_id: assignment.id,
                    return_condition:
                        returnCondition || asset.condition,
                    notes: returnNotes
                })
            ]
        );

        // Commit all return operations together
        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Asset returned successfully.",
            asset: {
                id: Number(id),
                status: "Available",
                assigned_user_id: null,
                condition: returnCondition || asset.condition
            }
        });

    } catch (error) {
        await rollbackTransaction(client);

        console.error("Return asset error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An error occurred while returning the asset."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Retrieve maintenance history for an asset
const getAssetMaintenance = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the asset ID
        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "A valid asset ID is required."
            });
        }

        // Confirm that the asset exists
        const assetResult = await pool.query(
            `SELECT id, asset_tag, asset_name
             FROM assets
             WHERE id = $1`,
            [id]
        );

        if (assetResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        // Retrieve maintenance records and the user who recorded them
        const result = await pool.query(
            `SELECT
                m.*,
                u.first_name AS recorded_by_first_name,
                u.last_name AS recorded_by_last_name,
                u.email AS recorded_by_email
             FROM asset_maintenance m
             LEFT JOIN users u
                ON m.recorded_by = u.id
             WHERE m.asset_id = $1
             ORDER BY m.created_at DESC, m.id DESC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            asset: assetResult.rows[0],
            count: result.rows.length,
            maintenance: result.rows
        });

    } catch (error) {
        console.error("Get asset maintenance error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve asset maintenance history."
        });
    }
};

// Record new maintenance for an asset
const createAssetMaintenance = async (req, res) => {
    let client;

    try {
        const { id } = req.params;
        const data = req.body || {};

        // Validate the asset ID
        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "A valid asset ID is required."
            });
        }

        // Validate the submitted maintenance information
        const validationError = validateMaintenanceData(data);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const maintenanceType = data.maintenance_type.trim();
        const description = data.description.trim();
        const status = data.status || "Open";

        const serviceProvider = normalizeOptionalText(
            data.service_provider
        );

        const maintenanceCost =
            data.maintenance_cost === "" ||
            data.maintenance_cost == null
                ? null
                : Number(data.maintenance_cost);

        const scheduledAt = data.scheduled_at || null;

        // Automatically record the completion date when
        // a maintenance record is created as Completed
        const completedAt = data.completed_at ||
            (status === "Completed"
                ? new Date().toISOString()
                : null);

        client = await pool.connect();

        await client.query("BEGIN");

        // Lock and confirm the asset
        const assetResult = await client.query(
            `SELECT id, asset_tag, asset_name
             FROM assets
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (assetResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Asset not found."
            });
        }

        const asset = assetResult.rows[0];

        // Insert the maintenance record
        const result = await client.query(
            `INSERT INTO asset_maintenance (
                asset_id,
                maintenance_type,
                description,
                status,
                service_provider,
                maintenance_cost,
                scheduled_at,
                completed_at,
                recorded_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                id,
                maintenanceType,
                description,
                status,
                serviceProvider,
                maintenanceCost,
                scheduledAt,
                completedAt,
                req.session.user.id
            ]
        );

        const maintenance = result.rows[0];

        // Record the maintenance activity in the audit trail
        await client.query(
            `INSERT INTO asset_activity (
                asset_id,
                user_id,
                action,
                details
             )
             VALUES ($1, $2, $3, $4)`,
            [
                id,
                req.session.user.id,
                "ASSET_MAINTENANCE_CREATED",
                JSON.stringify({
                    maintenance_id: maintenance.id,
                    maintenance_type: maintenance.maintenance_type,
                    status: maintenance.status,
                    asset_tag: asset.asset_tag,
                    asset_name: asset.asset_name
                })
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Asset maintenance recorded successfully.",
            maintenance
        });

    } catch (error) {
        await rollbackTransaction(client);

        if (error.code === "22007" || error.code === "22008") {
            return res.status(400).json({
                success: false,
                message: "Please provide valid maintenance dates."
            });
        }

        console.error("Create asset maintenance error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to record asset maintenance."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Update an existing maintenance record
const updateAssetMaintenance = async (req, res) => {
    let client;

    try {
        const { maintenanceId } = req.params;
        const data = req.body || {};

        // Validate the maintenance record ID
        if (!isValidId(maintenanceId)) {
            return res.status(400).json({
                success: false,
                message: "A valid maintenance record ID is required."
            });
        }

        // Validate the submitted maintenance information
        const validationError = validateMaintenanceData(data, true);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Only these maintenance fields can be updated
        const allowedFields = [
            "maintenance_type",
            "description",
            "status",
            "service_provider",
            "maintenance_cost",
            "scheduled_at",
            "completed_at"
        ];

        const updates = [];
        const values = [];

        // Build a parameterised update query
        for (const field of allowedFields) {
            if (!Object.prototype.hasOwnProperty.call(data, field)) {
                continue;
            }

            let value = data[field];

            if (
                field === "maintenance_type" ||
                field === "description"
            ) {
                value = value.trim();
            }

            if (field === "service_provider") {
                value = normalizeOptionalText(value);
            }

            if (field === "maintenance_cost") {
                value =
                    value === "" || value == null
                        ? null
                        : Number(value);
            }

            if (
                field === "scheduled_at" ||
                field === "completed_at"
            ) {
                value = value || null;
            }

            values.push(value);
            updates.push(`${field} = $${values.length}`);
        }

        // Reject requests that contain no updatable fields
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No maintenance information was provided for updating."
            });
        }

        client = await pool.connect();

        await client.query("BEGIN");

        // Lock the existing maintenance record
        const existingResult = await client.query(
            `SELECT *
             FROM asset_maintenance
             WHERE id = $1
             FOR UPDATE`,
            [maintenanceId]
        );

        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Maintenance record not found."
            });
        }

        const existingMaintenance = existingResult.rows[0];

        // Automatically set the completion date when the status
        // changes to Completed and no completion date is supplied
        if (
            data.status === "Completed" &&
            data.completed_at === undefined
        ) {
            updates.push(
                "completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)"
            );
        }

        // Clear the completion date when the record is reopened
        // or moved to another non-completed status
        if (
            data.status !== undefined &&
            data.status !== "Completed" &&
            data.completed_at === undefined
        ) {
            updates.push("completed_at = NULL");
        }

        // Update the modification timestamp
        updates.push("updated_at = CURRENT_TIMESTAMP");

        values.push(maintenanceId);

        // Update the maintenance record
        const result = await client.query(
            `UPDATE asset_maintenance
             SET ${updates.join(", ")}
             WHERE id = $${values.length}
             RETURNING *`,
            values
        );

        const maintenance = result.rows[0];

        // Record the maintenance update in the asset audit trail
        await client.query(
            `INSERT INTO asset_activity (
                asset_id,
                user_id,
                action,
                details
             )
             VALUES ($1, $2, $3, $4)`,
            [
                maintenance.asset_id,
                req.session.user.id,
                "ASSET_MAINTENANCE_UPDATED",
                JSON.stringify({
                    maintenance_id: maintenance.id,
                    previous_status: existingMaintenance.status,
                    current_status: maintenance.status,
                    updated_fields: Object.keys(data)
                })
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Asset maintenance record updated successfully.",
            maintenance
        });

    } catch (error) {
        await rollbackTransaction(client);

        if (error.code === "22007" || error.code === "22008") {
            return res.status(400).json({
                success: false,
                message: "Please provide valid maintenance dates."
            });
        }

        console.error("Update asset maintenance error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update asset maintenance record."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

// Export controller functions for use in assetRoutes.js
module.exports = {
    getAssets,
    getAssetById,
    getEligibleEmployees,
    createAsset,
    updateAsset,
    assignAsset,
    returnAsset,
    getAssetMaintenance,
    createAssetMaintenance,
    updateAssetMaintenance
};
