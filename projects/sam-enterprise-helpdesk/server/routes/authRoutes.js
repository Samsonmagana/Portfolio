
const express = require("express");
const router = express.Router();

const {
    createInvitation,
    acceptInvitation,
    login,
    logout,
    getCurrentUser
} = require("../controllers/authController");

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

router.post(
    "/invite",
    requireAuth,
    requireRole("owner", "administrator"),
    createInvitation
);

router.post(
    "/accept-invitation",
    acceptInvitation
);

router.post(
    "/login",
    login
);

router.get(
    "/me",
    requireAuth,
    getCurrentUser
);

router.post(
    "/logout",
    requireAuth,
    logout
);

module.exports = router;
