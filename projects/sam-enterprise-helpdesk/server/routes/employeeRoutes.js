
const express = require("express");
const router = express.Router();

const {
    getEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus,
    updateEmployeeRole
} = require("../controllers/employeeController");

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

const managementRoles = [
    "owner",
    "administrator",
    "it_manager"
];

// View employee directory
router.get(
    "/",
    requireAuth,
    requireRole(
        "owner",
        "administrator",
        "it_manager",
        "auditor"
    ),
    getEmployees
);

// View individual employee
router.get(
    "/:id",
    requireAuth,
    requireRole(
        "owner",
        "administrator",
        "it_manager",
        "auditor"
    ),
    getEmployeeById
);

// Update employee information
router.put(
    "/:id",
    requireAuth,
    requireRole(...managementRoles),
    updateEmployee
);

// Manage employee account status
router.patch(
    "/:id/status",
    requireAuth,
    requireRole("owner", "administrator"),
    updateEmployeeStatus
);

// Manage employee organisational roles
router.patch(
    "/:id/role",
    requireAuth,
    requireRole("owner", "administrator"),
    updateEmployeeRole
);

module.exports = router;
