
const pool = require("../config/db");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const {
    validateFileContent
} = require("../middleware/uploadMiddleware");

const UPLOAD_DIRECTORY = path.resolve(
    __dirname,
    "../uploads/tickets"
);

const ALLOWED_MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".pdf": "application/pdf",
    ".txt": "text/plain"
};

/**
 * Builds the ticket access condition for each role.
 */
const getAttachmentAccess = (role, userId, department) => {
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
 * Cleans the original filename before storing it.
 */
const cleanOriginalFilename = (filename) => {
    const cleaned = path
        .basename(filename.replace(/\\/g, "/"))
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim();

    return cleaned.substring(0, 255) || "attachment";
};

/**
 * Uploads attachments to an existing support ticket.
 */
const uploadAttachments = async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    const ticketId = req.params.id;
    const files = req.files || [];

    if (!/^\d+$/.test(ticketId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ticket ID."
        });
    }

    if (role === "auditor") {
        return res.status(403).json({
            success: false,
            message: "Auditors have read-only access."
        });
    }

    if (files.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Please select at least one attachment."
        });
    }

    for (const file of files) {
        if (!validateFileContent(file)) {
            return res.status(400).json({
                success: false,
                message: `The file "${cleanOriginalFilename(file.originalname)}" has invalid content.`
            });
        }
    }

    let client;
    const savedFilePaths = [];

    try {
        await fs.mkdir(UPLOAD_DIRECTORY, {
            recursive: true,
            mode: 0o700
        });

        client = await pool.connect();

        await client.query("BEGIN");

        const userResult = await client.query(
            `SELECT department, status
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
                message: "Your account cannot upload attachments."
            });
        }

        const department = userResult.rows[0].department;

        const access = getAttachmentAccess(
            role,
            userId,
            department
        );

        const values = [...access.values, ticketId];

        const ticketResult = await client.query(
            `SELECT t.id
             FROM tickets t
             WHERE ${access.condition}
             AND t.id = $${values.length}
             FOR UPDATE`,
            values
        );

        if (ticketResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Ticket not found or you do not have permission to upload attachments."
            });
        }

        const savedAttachments = [];

        for (const file of files) {
            const extension = path
                .extname(file.originalname)
                .toLowerCase();

            const storageKey = `${crypto.randomUUID()}.bin`;

            const filePath = path.join(
                UPLOAD_DIRECTORY,
                storageKey
            );

            await fs.writeFile(
                filePath,
                file.buffer,
                {
                    flag: "wx",
                    mode: 0o600
                }
            );

            savedFilePaths.push(filePath);

            const originalFilename = cleanOriginalFilename(
                file.originalname
            );

            const mimeType = ALLOWED_MIME_TYPES[extension];

            const attachmentResult = await client.query(
                `INSERT INTO ticket_attachments (
                    ticket_id,
                    uploaded_by,
                    original_filename,
                    storage_key,
                    mime_type,
                    size_bytes
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING
                    id,
                    ticket_id,
                    original_filename,
                    mime_type,
                    size_bytes,
                    created_at`,
                [
                    ticketId,
                    userId,
                    originalFilename,
                    storageKey,
                    mimeType,
                    file.size
                ]
            );

            savedAttachments.push(attachmentResult.rows[0]);
        }

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Attachments uploaded successfully.",
            count: savedAttachments.length,
            attachments: savedAttachments
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }

        await Promise.all(
            savedFilePaths.map(filePath =>
                fs.unlink(filePath).catch(() => {})
            )
        );

        console.error("Upload attachments error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to upload ticket attachments."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

/**
 * Downloads an attachment after checking ticket access.
 */
const downloadAttachment = async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;
    const ticketId = req.params.id;
    const attachmentId = req.params.attachmentId;

    if (
        !/^\d+$/.test(ticketId) ||
        !/^\d+$/.test(attachmentId)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid ticket or attachment ID."
        });
    }

    try {
        const userResult = await pool.query(
            `SELECT department
             FROM users
             WHERE id = $1`,
            [userId]
        );

        const department = userResult.rows[0]?.department || null;

        const access = getAttachmentAccess(
            role,
            userId,
            department
        );

        const values = [
            ...access.values,
            ticketId,
            attachmentId
        ];

        const attachmentResult = await pool.query(
            `SELECT
                a.id,
                a.original_filename,
                a.storage_key,
                a.mime_type
             FROM ticket_attachments a
             JOIN tickets t
                ON a.ticket_id = t.id
             WHERE ${access.condition}
             AND a.ticket_id = $${values.length - 1}
             AND a.id = $${values.length}`,
            values
        );

        if (attachmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found or you do not have permission to access it."
            });
        }

        const attachment = attachmentResult.rows[0];

        if (!/^[0-9a-f-]{36}\.bin$/i.test(attachment.storage_key)) {
            return res.status(500).json({
                success: false,
                message: "Invalid attachment storage reference."
            });
        }

        const filePath = path.resolve(
            UPLOAD_DIRECTORY,
            attachment.storage_key
        );

        if (!filePath.startsWith(UPLOAD_DIRECTORY + path.sep)) {
            return res.status(403).json({
                success: false,
                message: "Invalid attachment location."
            });
        }

        await fs.access(filePath);

        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("Content-Type", attachment.mime_type);

        return res.download(
            filePath,
            attachment.original_filename
        );

    } catch (error) {
        if (error.code === "ENOENT") {
            return res.status(404).json({
                success: false,
                message: "The stored attachment could not be found."
            });
        }

        console.error("Download attachment error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to download the attachment."
        });
    }
};

module.exports = {
    uploadAttachments,
    downloadAttachment
};
