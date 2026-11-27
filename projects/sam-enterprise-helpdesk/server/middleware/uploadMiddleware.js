
const multer = require("multer");
const path = require("path");
const { TextDecoder } = require("util");

const ALLOWED_FILES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".pdf": "application/pdf",
    ".txt": "text/plain"
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMimeType = ALLOWED_FILES[extension];

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
        return callback(
            new Error("Invalid file type. Only JPG, JPEG, PNG, PDF and TXT files are allowed.")
        );
    }

    callback(null, true);
};

/**
 * Checks the actual contents of an uploaded file.
 */
const validateFileContent = (file) => {
    if (!file || !Buffer.isBuffer(file.buffer)) {
        return false;
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const buffer = file.buffer;

    if (extension === ".jpg" || extension === ".jpeg") {
        return (
            buffer.length >= 3 &&
            buffer[0] === 0xFF &&
            buffer[1] === 0xD8 &&
            buffer[2] === 0xFF
        );
    }

    if (extension === ".png") {
        const pngSignature = Buffer.from([
            0x89, 0x50, 0x4E, 0x47,
            0x0D, 0x0A, 0x1A, 0x0A
        ]);

        return (
            buffer.length >= 8 &&
            buffer.subarray(0, 8).equals(pngSignature)
        );
    }

    if (extension === ".pdf") {
        return buffer.subarray(0, 5).toString() === "%PDF-";
    }

    if (extension === ".txt") {
        try {
            const decoder = new TextDecoder("utf-8", {
                fatal: true
            });

            const content = decoder.decode(buffer);

            // Reject binary data and unsupported control characters.
            return !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(content);

        } catch (error) {
            return false;
        }
    }

    return false;
};

const uploadTicketAttachments = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    }
}).array("attachments", 5);

module.exports = {
    uploadTicketAttachments,
    validateFileContent
};
