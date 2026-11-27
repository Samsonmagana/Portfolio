const express = require("express");
const router = express.Router();

const {
    createTicket,
    getTickets,
    getTicketById,
    updateTicketStatus
} = require("../controllers/ticketController");

const {
    assignTicket,
    getAssignableTechnicians
} = require("../controllers/ticketAssignmentController");

const {
    uploadAttachments,
    downloadAttachment
} = require("../controllers/attachmentController");

const {
    uploadTicketAttachments
} = require("../middleware/uploadMiddleware");

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

// Roles allowed to view support tickets.
const ticketViewRoles = [
    "owner",
    "administrator",
    "it_manager",
    "technician",
    "employee",
    "auditor"
];

// Roles allowed to create support tickets and upload attachments.
const ticketCreateRoles = [
    "owner",
    "administrator",
    "it_manager",
    "technician",
    "employee"
];

// Roles allowed to update ticket status.
const ticketUpdateRoles = [
    "owner",
    "administrator",
    "it_manager",
    "technician"
];

// Roles allowed to assign tickets and retrieve eligible technicians.
const ticketAssignmentRoles = [
    "owner",
    "administrator",
    "it_manager"
];

/**
 * Handles file-upload middleware errors.
 */
const handleAttachmentUpload = (req, res, next) => {
    uploadTicketAttachments(req, res, (error) => {
        if (error) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "Each attachment must not exceed 5 MB."
                });
            }

            if (
                error.code === "LIMIT_FILE_COUNT" ||
                error.code === "LIMIT_UNEXPECTED_FILE"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "You can upload a maximum of 5 attachments."
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message || "File upload failed."
            });
        }

        next();
    });
};

// Retrieve tickets accessible to the logged-in user.
router.get(
    "/",
    requireAuth,
    requireRole(...ticketViewRoles),
    getTickets
);

// Retrieve technicians eligible for ticket assignment.
// Keep this route before the /:id route.
router.get(
    "/technicians",
    requireAuth,
    requireRole(...ticketAssignmentRoles),
    getAssignableTechnicians
);

// Create a new support ticket.
router.post(
    "/",
    requireAuth,
    requireRole(...ticketCreateRoles),
    createTicket
);

// Upload attachments to an existing ticket.
router.post(
    "/:id/attachments",
    requireAuth,
    requireRole(...ticketCreateRoles),
    handleAttachmentUpload,
    uploadAttachments
);

// Download an attachment from a ticket.
router.get(
    "/:id/attachments/:attachmentId",
    requireAuth,
    requireRole(...ticketViewRoles),
    downloadAttachment
);

// Retrieve an individual ticket.
router.get(
    "/:id",
    requireAuth,
    requireRole(...ticketViewRoles),
    getTicketById
);

// Assign a ticket to an active technician.
router.patch(
    "/:id/assign",
    requireAuth,
    requireRole(...ticketAssignmentRoles),
    assignTicket
);

// Update a ticket's status.
router.patch(
    "/:id/status",
    requireAuth,
    requireRole(...ticketUpdateRoles),
    updateTicketStatus
);

module.exports = router;