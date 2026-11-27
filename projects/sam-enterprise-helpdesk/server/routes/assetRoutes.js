
const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/assetController");

const {
    getAssetActivity
} = require("../controllers/assetActivityController");

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

const managementRoles = [
    "owner",
    "administrator",
    "it_manager"
];

const viewRoles = [
    "owner",
    "administrator",
    "it_manager",
    "technician",
    "auditor"
];

// Asset activity log
router.get(
    "/activity",
    requireAuth,
    requireRole(...viewRoles),
    getAssetActivity
);

// Asset inventory
router.get("/", requireAuth, requireRole(...viewRoles), getAssets);

router.get(
    "/employees",
    requireAuth,
    requireRole(...managementRoles),
    getEligibleEmployees
);

router.get("/:id", requireAuth, requireRole(...viewRoles), getAssetById);

// Asset maintenance
router.get(
    "/:id/maintenance",
    requireAuth,
    requireRole(...viewRoles),
    getAssetMaintenance
);

router.post(
    "/:id/maintenance",
    requireAuth,
    requireRole(...managementRoles),
    createAssetMaintenance
);

router.put(
    "/maintenance/:maintenanceId",
    requireAuth,
    requireRole(...managementRoles),
    updateAssetMaintenance
);

// Asset management
router.post("/", requireAuth, requireRole(...managementRoles), createAsset);

router.put("/:id", requireAuth, requireRole(...managementRoles), updateAsset);

router.post(
    "/:id/assign",
    requireAuth,
    requireRole(...managementRoles),
    assignAsset
);

router.post(
    "/:id/return",
    requireAuth,
    requireRole(...managementRoles),
    returnAsset
);

module.exports = router;
