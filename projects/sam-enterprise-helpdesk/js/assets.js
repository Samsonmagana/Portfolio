
/**
 * Sam Enterprise - IT Asset Management
 * Retrieves and manages company assets through the PostgreSQL API.
 */

(function () {
    "use strict";

    const API_BASE_URL = "http://127.0.0.1:5000/api";

    let assets = [];
    let currentUser = null;
    let activeAssetFilter = "All";

    let isSaving = false;
    let isAssigning = false;
    let isReturning = false;
    let isSavingMaintenance = false;

    let selectedAssignmentAssetId = null;
    let selectedReturnAssetId = null;
    let selectedMaintenanceAssetId = null;
    let selectedHistoryAssetId = null;

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

    // Main inventory elements
    const assetTableBody = document.getElementById("assetTableBody");
    const assetSearch = document.getElementById("assetSearch");
    const assetCategoryFilter = document.getElementById("assetCategoryFilter");
    const assetTableWrapper = document.getElementById("assetTableWrapper");
    const assetEmptyState = document.getElementById("assetEmptyState");
    const assetEmptyMessage = document.getElementById("assetEmptyMessage");
    const assetRecordCount = document.getElementById("assetRecordCount");
    const assetAlerts = document.getElementById("assetAlerts");

    // Registration and editing elements
    const assetModal = document.getElementById("assetModal");
    const assetForm = document.getElementById("assetForm");
    const assetModalTitle = document.getElementById("assetModalTitle");

    const assetIdInput = document.getElementById("assetId");
    const assetTagInput = document.getElementById("assetTag");
    const assetNameInput = document.getElementById("assetName");
    const assetCategoryInput = document.getElementById("assetCategory");
    const assetManufacturerInput = document.getElementById("assetManufacturer");
    const assetModelInput = document.getElementById("assetModel");
    const assetSerialInput = document.getElementById("assetSerial");
    const assetLocationInput = document.getElementById("assetLocation");
    const assetEmployeeInput = document.getElementById("assetEmployee");
    const assetStatusInput = document.getElementById("assetStatus");
    const assetConditionInput = document.getElementById("assetCondition");
    const assetPurchaseDateInput = document.getElementById("assetPurchaseDate");
    const assetWarrantyDateInput = document.getElementById("assetWarrantyDate");
    const assetCostInput = document.getElementById("assetCost");
    const assetNotesInput = document.getElementById("assetNotes");

    const addAssetButton = document.getElementById("addAssetButton");
    const emptyAddAssetButton = document.getElementById("emptyAddAssetButton");

    // Assignment modal elements
    const assignmentModal = document.getElementById("assignmentModal");
    const assignmentForm = document.getElementById("assignmentForm");
    const assignmentAssetInfo = document.getElementById("assignmentAssetInfo");
    const assignmentEmployee = document.getElementById("assignmentEmployee");
    const assignmentNotes = document.getElementById("assignmentNotes");
    const confirmAssignmentButton = document.getElementById("confirmAssignment");

    // Return modal elements
    const returnAssetModal = document.getElementById("returnAssetModal");
    const returnAssetForm = document.getElementById("returnAssetForm");
    const returnAssetInfo = document.getElementById("returnAssetInfo");
    const returnCondition = document.getElementById("returnCondition");
    const returnNotes = document.getElementById("returnNotes");
    const confirmReturnButton = document.getElementById("confirmReturn");

    // Maintenance modal elements
    const maintenanceModal = document.getElementById("maintenanceModal");
    const maintenanceForm = document.getElementById("maintenanceForm");
    const maintenanceModalTitle = document.getElementById("maintenanceModalTitle");
    const maintenanceAssetInfo = document.getElementById("maintenanceAssetInfo");
    const maintenanceIdInput = document.getElementById("maintenanceId");
    const maintenanceTypeInput = document.getElementById("maintenanceType");
    const maintenanceDescriptionInput = document.getElementById("maintenanceDescription");
    const maintenanceStatusInput = document.getElementById("maintenanceStatus");
    const maintenanceProviderInput = document.getElementById("maintenanceProvider");
    const maintenanceCostInput = document.getElementById("maintenanceCost");
    const maintenanceScheduledInput = document.getElementById("maintenanceScheduled");
    const maintenanceCompletedInput = document.getElementById("maintenanceCompleted");
    const saveMaintenanceButton = document.getElementById("saveMaintenanceButton");

    // Maintenance history elements
    const maintenanceHistoryModal = document.getElementById("maintenanceHistoryModal");
    const maintenanceHistoryAssetInfo = document.getElementById("maintenanceHistoryAssetInfo");
    const maintenanceHistoryTableBody = document.getElementById("maintenanceHistoryTableBody");
    const maintenanceHistoryEmptyState = document.getElementById("maintenanceHistoryEmptyState");
    const addMaintenanceFromHistoryButton = document.getElementById("addMaintenanceFromHistory");

    // Send requests to the backend API.
    async function apiRequest(endpoint, options = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "The requested operation could not be completed."
            );
        }

        return data;
    }

    // Convert database records into the format used by this page.
    function normaliseAsset(record) {
        const assignedName =
            record.assigned_employee ||
            record.assigned_employee_name ||
            (
                record.assigned_first_name
                    ? `${record.assigned_first_name} ${record.assigned_last_name || ""}`.trim()
                    : ""
            ) ||
            (
                record.first_name
                    ? `${record.first_name} ${record.last_name || ""}`.trim()
                    : ""
            );

        return {
            id: record.id,
            assetTag: record.asset_tag || "",
            name: record.asset_name || record.name || "",
            category: record.category || "",
            manufacturer: record.manufacturer || "",
            model: record.model || "",
            serialNumber: record.serial_number || "",
            location: record.location || "",
            assignedEmployee: assignedName,
            assignedEmployeeEmail: record.assigned_email || "",
            employeeNumber: record.employee_number || "",
            condition: record.condition || "Good",
            status: record.status || "Available",
            purchaseDate: record.purchase_date
                ? String(record.purchase_date).slice(0, 10)
                : "",
            warrantyExpiry: record.warranty_expiry
                ? String(record.warranty_expiry).slice(0, 10)
                : "",
            purchaseCost: record.purchase_cost ?? null,
            notes: record.notes || ""
        };
    }

    function canManageAssets() {
        return Boolean(
            currentUser &&
            managementRoles.includes(currentUser.role)
        );
    }

    function canViewAssets() {
        return Boolean(
            currentUser &&
            viewRoles.includes(currentUser.role)
        );
    }

    // Format monetary values.
    function formatCurrency(amount) {
        if (amount === null || amount === undefined || amount === "") {
            return "Not recorded";
        }

        const number = Number(amount);

        if (!Number.isFinite(number)) {
            return "Not recorded";
        }

        return new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR"
        }).format(number);
    }

    function getAssetStatusClass(status) {
        const classes = {
            Assigned: "assigned",
            Available: "available",
            Maintenance: "maintenance",
            Retired: "retired"
        };

        return classes[status] || "available";
    }

    function getAssetConditionClass(condition) {
        const value = String(condition || "Good").toLowerCase();

        return ["new", "good", "fair", "damaged"].includes(value)
            ? value
            : "good";
    }

    function createAssetCell(value, className = "") {
        const cell = document.createElement("td");

        if (className) {
            cell.className = className;
        }

        cell.textContent = value || "—";

        return cell;
    }

    function refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Format database dates for datetime-local inputs.
    function formatDateTimeLocal(value) {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
        );

        return localDate.toISOString().slice(0, 16);
    }

    // Format database dates for display.
    function formatDateTime(value) {
        if (!value) return "Not recorded";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Not recorded";
        }

        return date.toLocaleString("en-ZA");
    }

    // Retrieve the inventory from PostgreSQL.
    async function loadAssets() {
        try {
            const data = await apiRequest("/assets");

            assets = Array.isArray(data.assets)
                ? data.assets.map(normaliseAsset)
                : [];

            renderAssets();

        } catch (error) {
            console.error("Asset loading error:", error);

            assets = [];
            renderAssets();

            if (assetEmptyState) {
                assetEmptyState.classList.add("show");
            }

            if (assetEmptyMessage) {
                assetEmptyMessage.textContent = error.message;
            }
        }
    }

    // Update the dashboard statistics.
    function updateAssetStatistics() {
        const total = assets.length;

        const assigned = assets.filter(
            asset => asset.status === "Assigned"
        ).length;

        const available = assets.filter(
            asset => asset.status === "Available"
        ).length;

        const maintenance = assets.filter(
            asset => asset.status === "Maintenance"
        ).length;

        const retired = assets.filter(
            asset => asset.status === "Retired"
        ).length;

        const statisticElements = {
            totalAssets: total,
            assignedAssets: assigned,
            availableAssets: available,
            maintenanceAssets: maintenance,
            allAssetsCount: total,
            assignedFilterCount: assigned,
            availableFilterCount: available,
            maintenanceFilterCount: maintenance,
            retiredFilterCount: retired
        };

        Object.entries(statisticElements).forEach(([id, value]) => {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = value;
            }
        });
    }

    // Display warranty and equipment condition alerts.
    function updateAssetAlerts() {
        if (!assetAlerts) return;

        assetAlerts.replaceChildren();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiredWarranties = assets.filter(asset => {
            if (!asset.warrantyExpiry || asset.status === "Retired") {
                return false;
            }

            const expiryDate = new Date(
                `${asset.warrantyExpiry}T00:00:00`
            );

            return !Number.isNaN(expiryDate.getTime()) &&
                expiryDate < today;
        });

        const damagedAssets = assets.filter(asset =>
            asset.condition === "Damaged" &&
            asset.status !== "Retired"
        );

        const maintenanceCount = assets.filter(
            asset => asset.status === "Maintenance"
        ).length;

        function addAlert(iconName, headingText, messageText, error = false) {
            const alert = document.createElement("div");

            alert.className = error
                ? "asset-alert error"
                : "asset-alert";

            const icon = document.createElement("i");
            icon.setAttribute("data-lucide", iconName);

            const content = document.createElement("div");

            const heading = document.createElement("strong");
            heading.textContent = headingText;

            const message = document.createElement("p");
            message.textContent = messageText;

            content.append(heading, message);
            alert.append(icon, content);

            assetAlerts.appendChild(alert);
        }

        if (expiredWarranties.length > 0) {
            addAlert(
                "calendar-clock",
                "Warranty expiry notification",
                `${expiredWarranties.length} asset(s) have expired warranties. Review their coverage and service options.`
            );
        }

        if (damagedAssets.length > 0) {
            addAlert(
                "alert-triangle",
                "Equipment condition requires attention",
                `${damagedAssets.length} asset(s) have damaged condition records. Review them for possible maintenance or retirement.`,
                true
            );
        }

        if (maintenanceCount > 0) {
            addAlert(
                "wrench",
                "Equipment under maintenance",
                `${maintenanceCount} asset(s) are currently marked as under maintenance.`
            );
        }

        if (assetAlerts.children.length > 0) {
            refreshIcons();
        }
    }

    // Create an action button for the asset table.
    function createActionButton(label, iconName, callback) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "view-ticket-button";
        button.setAttribute("aria-label", label);

        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", iconName);

        button.append(
            icon,
            document.createTextNode(` ${label}`)
        );

        button.addEventListener("click", callback);

        return button;
    }

    // Display the inventory table.
    function renderAssets() {
        if (!assetTableBody) return;

        updateAssetStatistics();
        updateAssetAlerts();

        const searchTerm = assetSearch
            ? assetSearch.value.toLowerCase().trim()
            : "";

        const selectedCategory = assetCategoryFilter
            ? assetCategoryFilter.value
            : "All";

        const filteredAssets = assets.filter(asset => {
            const matchesStatus =
                activeAssetFilter === "All" ||
                asset.status === activeAssetFilter;

            const matchesCategory =
                selectedCategory === "All" ||
                asset.category === selectedCategory;

            const searchableContent = [
                asset.assetTag,
                asset.name,
                asset.category,
                asset.manufacturer,
                asset.model,
                asset.serialNumber,
                asset.location,
                asset.assignedEmployee
            ].join(" ").toLowerCase();

            return matchesStatus &&
                matchesCategory &&
                searchableContent.includes(searchTerm);
        });

        assetTableBody.replaceChildren();

        if (assetRecordCount) {
            assetRecordCount.textContent =
                `${filteredAssets.length} ${
                    filteredAssets.length === 1 ? "asset" : "assets"
                }`;
        }

        if (filteredAssets.length === 0) {
            if (assetTableWrapper) {
                assetTableWrapper.style.display = "none";
            }

            if (assetEmptyState) {
                assetEmptyState.classList.add("show");
            }

            if (assetEmptyMessage) {
                assetEmptyMessage.textContent = assets.length === 0
                    ? "No company equipment has been registered yet."
                    : "No assets match your search or selected filters.";
            }

            return;
        }

        if (assetTableWrapper) {
            assetTableWrapper.style.display = "block";
        }

        if (assetEmptyState) {
            assetEmptyState.classList.remove("show");
        }

        filteredAssets.forEach(asset => {
            const row = document.createElement("tr");

            const tagCell = document.createElement("td");
            const tag = document.createElement("span");

            tag.className = "asset-tag";
            tag.textContent = asset.assetTag;

            tagCell.appendChild(tag);
            row.appendChild(tagCell);

            const nameCell = document.createElement("td");

            const name = document.createElement("span");
            name.className = "asset-name";
            name.textContent = asset.name;

            const manufacturer = document.createElement("span");
            manufacturer.className = "asset-subtitle";
            manufacturer.textContent =
                `${asset.manufacturer || "Manufacturer not recorded"} · ${asset.model || "Model not recorded"}`;

            nameCell.append(name, manufacturer);
            row.appendChild(nameCell);

            row.appendChild(createAssetCell(asset.category));
            row.appendChild(createAssetCell(asset.location));

            row.appendChild(
                createAssetCell(
                    asset.status === "Assigned"
                        ? asset.assignedEmployee
                        : "—",
                    "asset-employee"
                )
            );

            const conditionCell = document.createElement("td");
            const condition = document.createElement("span");

            condition.className =
                `asset-condition ${getAssetConditionClass(asset.condition)}`;

            condition.textContent = asset.condition;

            conditionCell.appendChild(condition);
            row.appendChild(conditionCell);

            const statusCell = document.createElement("td");
            const status = document.createElement("span");

            status.className =
                `asset-status ${getAssetStatusClass(asset.status)}`;

            status.textContent = asset.status;

            statusCell.appendChild(status);
            row.appendChild(statusCell);

            const actionCell = document.createElement("td");

            if (canManageAssets()) {
                if (asset.status === "Available") {
                    actionCell.appendChild(
                        createActionButton(
                            "Assign",
                            "user-check",
                            () => openAssignmentModal(asset.id)
                        )
                    );
                }

                if (asset.status === "Assigned") {
                    actionCell.appendChild(
                        createActionButton(
                            "Return",
                            "package-check",
                            () => openReturnModal(asset.id)
                        )
                    );
                }

                actionCell.appendChild(
                    createActionButton(
                        "Maintenance",
                        "wrench",
                        () => openMaintenanceModal(asset.id)
                    )
                );

                actionCell.appendChild(
                    createActionButton(
                        "History",
                        "clipboard-list",
                        () => openMaintenanceHistory(asset.id)
                    )
                );

                actionCell.appendChild(
                    createActionButton(
                        "Manage",
                        "settings-2",
                        () => openAssetForm(asset.id)
                    )
                );

            } else {
                actionCell.appendChild(
                    createActionButton(
                        "History",
                        "clipboard-list",
                        () => openMaintenanceHistory(asset.id)
                    )
                );
            }

            row.appendChild(actionCell);
            assetTableBody.appendChild(row);
        });

        refreshIcons();
    }

    // Asset status filters.
    document.querySelectorAll("[data-asset-filter]").forEach(button => {
        button.addEventListener("click", function () {
            activeAssetFilter = this.dataset.assetFilter;

            document.querySelectorAll("[data-asset-filter]").forEach(item => {
                item.classList.remove("active");
                item.setAttribute("aria-pressed", "false");
            });

            this.classList.add("active");
            this.setAttribute("aria-pressed", "true");

            renderAssets();
        });
    });

    if (assetSearch) {
        assetSearch.addEventListener("input", renderAssets);
    }

    if (assetCategoryFilter) {
        assetCategoryFilter.addEventListener("change", renderAssets);
    }

    // Open the registration or editing form.
    function openAssetForm(assetId = null) {
        if (!canManageAssets()) {
            alert("You do not have permission to manage company assets.");
            return;
        }

        assetForm.reset();
        assetIdInput.value = "";

        assetModalTitle.textContent = "Register New Asset";

        if (assetId !== null) {
            const asset = assets.find(
                item => String(item.id) === String(assetId)
            );

            if (!asset) {
                alert("The selected asset could not be found.");
                return;
            }

            assetModalTitle.textContent = "Manage Asset";

            assetIdInput.value = asset.id;
            assetTagInput.value = asset.assetTag;
            assetNameInput.value = asset.name;
            assetCategoryInput.value = asset.category;
            assetManufacturerInput.value = asset.manufacturer;
            assetModelInput.value = asset.model;
            assetSerialInput.value = asset.serialNumber;
            assetLocationInput.value = asset.location;
            assetEmployeeInput.value = asset.assignedEmployee;
            assetConditionInput.value = asset.condition;
            assetPurchaseDateInput.value = asset.purchaseDate;
            assetWarrantyDateInput.value = asset.warrantyExpiry;
            assetCostInput.value = asset.purchaseCost ?? "";
            assetNotesInput.value = asset.notes;

            assetStatusInput.value = asset.status;

        } else {
            assetConditionInput.value = "Good";
            assetStatusInput.value = "Available";
            assetEmployeeInput.value = "";
        }

        if (assetStatusInput) {
            assetStatusInput.disabled = true;
        }

        if (assetEmployeeInput) {
            assetEmployeeInput.disabled = true;
        }

        assetModal.classList.add("show");

        refreshIcons();
    }

    function closeAssetForm() {
        if (!assetModal) return;

        assetModal.classList.remove("show");
        assetForm.reset();
    }

    // Save a new asset or update an existing asset.
    async function saveAsset(event) {
        event.preventDefault();

        if (isSaving) return;

        if (!canManageAssets()) {
            alert("You do not have permission to manage company assets.");
            return;
        }

        if (!assetForm.reportValidity()) {
            return;
        }

        const editingId = assetIdInput.value;

        const assetTag = assetTagInput.value.trim().toUpperCase();
        const serialNumber = assetSerialInput.value.trim();

        const purchaseDate = assetPurchaseDateInput.value;
        const warrantyDate = assetWarrantyDateInput.value;

        if (purchaseDate && warrantyDate && warrantyDate < purchaseDate) {
            alert("Warranty expiry cannot be earlier than the purchase date.");
            assetWarrantyDateInput.focus();
            return;
        }

        const duplicateTag = assets.some(asset =>
            asset.assetTag.toLowerCase() === assetTag.toLowerCase() &&
            String(asset.id) !== String(editingId)
        );

        if (duplicateTag) {
            alert("This asset tag is already registered. Please use a unique tag.");
            assetTagInput.focus();
            return;
        }

        if (serialNumber) {
            const duplicateSerial = assets.some(asset =>
                asset.serialNumber.toLowerCase() === serialNumber.toLowerCase() &&
                String(asset.id) !== String(editingId)
            );

            if (duplicateSerial) {
                alert("This serial number is already registered.");
                assetSerialInput.focus();
                return;
            }
        }

        const purchaseCost = assetCostInput.value === ""
            ? null
            : Number(assetCostInput.value);

        if (
            purchaseCost !== null &&
            (!Number.isFinite(purchaseCost) || purchaseCost < 0)
        ) {
            alert("Enter a valid purchase cost.");
            assetCostInput.focus();
            return;
        }

        const assetData = {
            asset_tag: assetTag,
            asset_name: assetNameInput.value.trim(),
            category: assetCategoryInput.value,
            manufacturer: assetManufacturerInput.value.trim() || null,
            model: assetModelInput.value.trim() || null,
            serial_number: serialNumber || null,
            location: assetLocationInput.value.trim(),
            condition: assetConditionInput.value,
            purchase_date: purchaseDate || null,
            warranty_expiry: warrantyDate || null,
            purchase_cost: purchaseCost,
            notes: assetNotesInput.value.trim() || null
        };

        if (!editingId) {
            assetData.status = "Available";
        }

        const saveButton = assetForm.querySelector(
            'button[type="submit"]'
        );

        isSaving = true;

        if (saveButton) {
            saveButton.disabled = true;
        }

        try {
            if (editingId) {
                await apiRequest(`/assets/${encodeURIComponent(editingId)}`, {
                    method: "PUT",
                    body: JSON.stringify(assetData)
                });
            } else {
                await apiRequest("/assets", {
                    method: "POST",
                    body: JSON.stringify(assetData)
                });
            }

            closeAssetForm();

            await loadAssets();

            alert(
                editingId
                    ? "Asset information updated successfully."
                    : "New company asset registered successfully."
            );

        } catch (error) {
            console.error("Asset saving error:", error);
            alert(error.message);

        } finally {
            isSaving = false;

            if (saveButton) {
                saveButton.disabled = false;
            }
        }
    }

    // Retrieve active employees who can receive company assets.
    async function loadEligibleEmployees() {
        if (!assignmentEmployee) return;

        assignmentEmployee.replaceChildren();

        const loadingOption = document.createElement("option");
        loadingOption.value = "";
        loadingOption.textContent = "Loading employees...";

        assignmentEmployee.appendChild(loadingOption);

        try {
            const data = await apiRequest("/assets/employees");

            const employees = Array.isArray(data.employees)
                ? data.employees
                : [];

            assignmentEmployee.replaceChildren();

            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select an employee";

            assignmentEmployee.appendChild(defaultOption);

            employees.forEach(employee => {
                const option = document.createElement("option");

                option.value = employee.id;

                const fullName =
                    `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

                const employeeNumber = employee.employee_number
                    ? ` (${employee.employee_number})`
                    : "";

                const department = employee.department
                    ? ` - ${employee.department}`
                    : "";

                option.textContent =
                    `${fullName || employee.email}${employeeNumber}${department}`;

                assignmentEmployee.appendChild(option);
            });

            if (employees.length === 0) {
                defaultOption.textContent = "No active employees available";
                assignmentEmployee.disabled = true;
            } else {
                assignmentEmployee.disabled = false;
            }

        } catch (error) {
            console.error("Employee loading error:", error);

            assignmentEmployee.replaceChildren();

            const errorOption = document.createElement("option");
            errorOption.value = "";
            errorOption.textContent = "Could not load employees";

            assignmentEmployee.appendChild(errorOption);
            assignmentEmployee.disabled = true;

            throw error;
        }
    }

    // Open the asset allocation form.
    async function openAssignmentModal(assetId) {
        if (!canManageAssets()) {
            alert("You do not have permission to assign company assets.");
            return;
        }

        const asset = assets.find(
            item => String(item.id) === String(assetId)
        );

        if (!asset) {
            alert("The selected asset could not be found.");
            return;
        }

        if (asset.status !== "Available") {
            alert("Only available assets can be assigned.");
            return;
        }

        selectedAssignmentAssetId = asset.id;

        assignmentForm.reset();
        assignmentEmployee.disabled = false;

        assignmentAssetInfo.textContent =
            `${asset.assetTag} - ${asset.name}`;

        assignmentModal.classList.add("show");

        try {
            await loadEligibleEmployees();
        } catch (error) {
            alert(`Unable to retrieve employees: ${error.message}`);
        }

        refreshIcons();
    }

    function closeAssignmentModal() {
        if (!assignmentModal) return;

        assignmentModal.classList.remove("show");

        if (assignmentForm) {
            assignmentForm.reset();
        }

        selectedAssignmentAssetId = null;
    }

    // Submit an asset allocation to the backend.
    async function assignAsset(event) {
        event.preventDefault();

        if (isAssigning) return;

        if (!canManageAssets()) {
            alert("You do not have permission to assign company assets.");
            return;
        }

        if (!selectedAssignmentAssetId) {
            alert("Please select an asset before continuing.");
            return;
        }

        if (!assignmentForm.reportValidity()) {
            return;
        }

        const employeeId = assignmentEmployee.value;

        if (!employeeId) {
            alert("Please select an employee.");
            assignmentEmployee.focus();
            return;
        }

        const asset = assets.find(
            item => String(item.id) === String(selectedAssignmentAssetId)
        );

        if (!asset || asset.status !== "Available") {
            alert("This asset is no longer available for allocation. Refresh the inventory.");
            closeAssignmentModal();
            await loadAssets();
            return;
        }

        const assignmentData = {
            assigned_user_id: employeeId,
            notes: assignmentNotes.value.trim() || null
        };

        isAssigning = true;

        if (confirmAssignmentButton) {
            confirmAssignmentButton.disabled = true;
        }

        try {
            await apiRequest(
                `/assets/${encodeURIComponent(selectedAssignmentAssetId)}/assign`,
                {
                    method: "POST",
                    body: JSON.stringify(assignmentData)
                }
            );

            closeAssignmentModal();

            await loadAssets();

            alert("Asset successfully assigned to the selected employee.");

        } catch (error) {
            console.error("Asset assignment error:", error);
            alert(error.message);

        } finally {
            isAssigning = false;

            if (confirmAssignmentButton) {
                confirmAssignmentButton.disabled = false;
            }
        }
    }

    // Open the asset return form.
    function openReturnModal(assetId) {
        if (!canManageAssets()) {
            alert("You do not have permission to return company assets.");
            return;
        }

        const asset = assets.find(
            item => String(item.id) === String(assetId)
        );

        if (!asset) {
            alert("The selected asset could not be found.");
            return;
        }

        if (asset.status !== "Assigned") {
            alert("Only assigned assets can be returned.");
            return;
        }

        selectedReturnAssetId = asset.id;

        returnAssetForm.reset();

        returnAssetInfo.textContent =
            `${asset.assetTag} - ${asset.name} | Assigned to: ${asset.assignedEmployee || "Employee not identified"}`;

        returnAssetModal.classList.add("show");

        refreshIcons();
    }

    function closeReturnModal() {
        if (!returnAssetModal) return;

        returnAssetModal.classList.remove("show");

        if (returnAssetForm) {
            returnAssetForm.reset();
        }

        selectedReturnAssetId = null;
    }

    // Submit an asset return to the backend.
    async function returnCompanyAsset(event) {
        event.preventDefault();

        if (isReturning) return;

        if (!canManageAssets()) {
            alert("You do not have permission to return company assets.");
            return;
        }

        if (!selectedReturnAssetId) {
            alert("Please select an asset before continuing.");
            return;
        }

        const asset = assets.find(
            item => String(item.id) === String(selectedReturnAssetId)
        );

        if (!asset || asset.status !== "Assigned") {
            alert("This asset is no longer assigned. Refresh the inventory.");
            closeReturnModal();
            await loadAssets();
            return;
        }

        const returnData = {
            condition: returnCondition.value || null,
            notes: returnNotes.value.trim() || null
        };

        isReturning = true;

        if (confirmReturnButton) {
            confirmReturnButton.disabled = true;
        }

        try {
            await apiRequest(
                `/assets/${encodeURIComponent(selectedReturnAssetId)}/return`,
                {
                    method: "POST",
                    body: JSON.stringify(returnData)
                }
            );

            closeReturnModal();

            await loadAssets();

            alert("Asset successfully returned to the company inventory.");

        } catch (error) {
            console.error("Asset return error:", error);
            alert(error.message);

        } finally {
            isReturning = false;

            if (confirmReturnButton) {
                confirmReturnButton.disabled = false;
            }
        }
    }

    // Open a maintenance form for a selected asset.
    function openMaintenanceModal(assetId, record = null) {
        if (!canManageAssets()) {
            alert("You do not have permission to manage maintenance records.");
            return;
        }

        const asset = assets.find(
            item => String(item.id) === String(assetId)
        );

        if (!asset) {
            alert("The selected asset could not be found.");
            return;
        }

        if (
            asset.status === "Assigned" &&
            !record
        ) {
            alert(
                "This asset is currently assigned to an employee. Return it before recording maintenance."
            );
            return;
        }

        if (!maintenanceModal || !maintenanceForm) {
            alert("The maintenance form could not be loaded. Check the maintenance HTML elements.");
            return;
        }

        selectedMaintenanceAssetId = asset.id;

        maintenanceForm.reset();

        if (maintenanceIdInput) {
            maintenanceIdInput.value = record ? record.id : "";
        }

        if (maintenanceModalTitle) {
            maintenanceModalTitle.textContent = record
                ? "Update Maintenance Record"
                : "Record Maintenance";
        }

        if (maintenanceAssetInfo) {
            maintenanceAssetInfo.textContent =
                `${asset.assetTag} - ${asset.name}`;
        }

        if (record) {
            maintenanceTypeInput.value = record.maintenance_type || "";
            maintenanceDescriptionInput.value = record.description || "";
            maintenanceStatusInput.value = record.status || "Open";
            maintenanceProviderInput.value = record.service_provider || "";
            maintenanceCostInput.value = record.maintenance_cost ?? "";
            maintenanceScheduledInput.value =
                formatDateTimeLocal(record.scheduled_at);
            maintenanceCompletedInput.value =
                formatDateTimeLocal(record.completed_at);
        } else if (maintenanceStatusInput) {
            maintenanceStatusInput.value = "Open";

            if (maintenanceCompletedInput) {
                maintenanceCompletedInput.value = "";
            }
        }

        maintenanceModal.classList.add("show");

        refreshIcons();
    }

    // Close the maintenance form.
    function closeMaintenanceModal() {
        if (!maintenanceModal) return;

        maintenanceModal.classList.remove("show");

        if (maintenanceForm) {
            maintenanceForm.reset();
        }

        if (maintenanceIdInput) {
            maintenanceIdInput.value = "";
        }

        selectedMaintenanceAssetId = null;
    }

    // Save a new maintenance record or update an existing one.
    async function saveMaintenance(event) {
        event.preventDefault();

        if (isSavingMaintenance) return;

        if (!canManageAssets()) {
            alert("You do not have permission to manage maintenance records.");
            return;
        }

        if (!maintenanceForm.reportValidity()) {
            return;
        }

        if (!selectedMaintenanceAssetId) {
            alert("Please select an asset before continuing.");
            return;
        }

        const asset = assets.find(
            item => String(item.id) === String(selectedMaintenanceAssetId)
        );

        if (!asset) {
            alert("The selected asset could not be found.");
            return;
        }

        if (
            asset.status === "Assigned" &&
            !maintenanceIdInput.value
        ) {
            alert("Return this asset before recording maintenance.");
            return;
        }

        const maintenanceCost = maintenanceCostInput.value === ""
            ? null
            : Number(maintenanceCostInput.value);

        if (
            maintenanceCost !== null &&
            (!Number.isFinite(maintenanceCost) || maintenanceCost < 0)
        ) {
            alert("Enter a valid maintenance cost.");
            maintenanceCostInput.focus();
            return;
        }

        const scheduledAt = maintenanceScheduledInput.value;
        const status = maintenanceStatusInput.value;

        // Only Completed records may contain a completion date.
        // All other statuses must send null to the backend.
        let completedAt = null;

        if (status === "Completed") {
            completedAt = maintenanceCompletedInput.value
                ? new Date(maintenanceCompletedInput.value).toISOString()
                : new Date().toISOString();
        }

        const maintenanceData = {
            maintenance_type: maintenanceTypeInput.value.trim(),
            description: maintenanceDescriptionInput.value.trim(),
            status: status,
            service_provider: maintenanceProviderInput.value.trim() || null,
            maintenance_cost: maintenanceCost,
            scheduled_at: scheduledAt
                ? new Date(scheduledAt).toISOString()
                : null,
            completed_at: completedAt
        };

        const maintenanceId = maintenanceIdInput.value;

        isSavingMaintenance = true;

        if (saveMaintenanceButton) {
            saveMaintenanceButton.disabled = true;
        }

        try {
            if (maintenanceId) {
                await apiRequest(
                    `/assets/maintenance/${encodeURIComponent(maintenanceId)}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(maintenanceData)
                    }
                );
            } else {
                await apiRequest(
                    `/assets/${encodeURIComponent(selectedMaintenanceAssetId)}/maintenance`,
                    {
                        method: "POST",
                        body: JSON.stringify(maintenanceData)
                    }
                );
            }

            const assetId = selectedMaintenanceAssetId;

            closeMaintenanceModal();

            await loadAssets();

            await loadMaintenanceHistory(assetId);

            alert(
                maintenanceId
                    ? "Maintenance record updated successfully."
                    : "Maintenance record saved successfully."
            );

        } catch (error) {
            console.error("Maintenance saving error:", error);
            alert(error.message);

        } finally {
            isSavingMaintenance = false;

            if (saveMaintenanceButton) {
                saveMaintenanceButton.disabled = false;
            }
        }
    }

    // Retrieve maintenance records for an asset.
    async function loadMaintenanceHistory(assetId) {
        const data = await apiRequest(
            `/assets/${encodeURIComponent(assetId)}/maintenance`
        );

        const records = Array.isArray(data.maintenance)
            ? data.maintenance
            : [];

        renderMaintenanceHistory(records);

        return records;
    }

    // Display maintenance history.
    function renderMaintenanceHistory(records) {
        if (!maintenanceHistoryTableBody) return;

        maintenanceHistoryTableBody.replaceChildren();

        if (maintenanceHistoryEmptyState) {
            maintenanceHistoryEmptyState.classList.toggle(
                "show",
                records.length === 0
            );
        }

        records.forEach(record => {
            const row = document.createElement("tr");

            row.appendChild(
                createAssetCell(record.maintenance_type)
            );

            row.appendChild(
                createAssetCell(record.description)
            );

            const statusCell = document.createElement("td");
            const status = document.createElement("span");

            status.className =
                `asset-status ${String(record.status || "Open")
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`;

            status.textContent = record.status || "Open";

            statusCell.appendChild(status);
            row.appendChild(statusCell);

            row.appendChild(
                createAssetCell(record.service_provider)
            );

            row.appendChild(
                createAssetCell(
                    record.maintenance_cost === null ||
                    record.maintenance_cost === undefined
                        ? "Not recorded"
                        : formatCurrency(record.maintenance_cost)
                )
            );

            row.appendChild(
                createAssetCell(formatDateTime(record.scheduled_at))
            );

            row.appendChild(
                createAssetCell(formatDateTime(record.completed_at))
            );

            const recordedBy = [
                record.first_name,
                record.last_name
            ].filter(Boolean).join(" ");

            row.appendChild(
                createAssetCell(recordedBy || record.email || "Unknown")
            );

            const actionCell = document.createElement("td");

            if (canManageAssets()) {
                actionCell.appendChild(
                    createActionButton(
                        "Edit",
                        "pencil",
                        () => openMaintenanceModal(
                            selectedHistoryAssetId,
                            record
                        )
                    )
                );
            }

            row.appendChild(actionCell);
            maintenanceHistoryTableBody.appendChild(row);
        });

        refreshIcons();
    }

    // Open maintenance history for an asset.
    async function openMaintenanceHistory(assetId) {
        const asset = assets.find(
            item => String(item.id) === String(assetId)
        );

        if (!asset) {
            alert("The selected asset could not be found.");
            return;
        }

        if (!maintenanceHistoryModal) {
            alert("The maintenance history window could not be loaded.");
            return;
        }

        selectedHistoryAssetId = asset.id;

        if (maintenanceHistoryAssetInfo) {
            maintenanceHistoryAssetInfo.textContent =
                `${asset.assetTag} - ${asset.name}`;
        }

        maintenanceHistoryModal.classList.add("show");

        if (maintenanceHistoryTableBody) {
            maintenanceHistoryTableBody.replaceChildren();

            const loadingRow = document.createElement("tr");
            const loadingCell = document.createElement("td");

            loadingCell.colSpan = 9;
            loadingCell.textContent = "Loading maintenance history...";

            loadingRow.appendChild(loadingCell);
            maintenanceHistoryTableBody.appendChild(loadingRow);
        }

        try {
            await loadMaintenanceHistory(asset.id);

        } catch (error) {
            console.error("Maintenance history error:", error);
            alert(`Unable to load maintenance history: ${error.message}`);
            closeMaintenanceHistory();
        }

        refreshIcons();
    }

    // Close maintenance history.
    function closeMaintenanceHistory() {
        if (!maintenanceHistoryModal) return;

        maintenanceHistoryModal.classList.remove("show");

        selectedHistoryAssetId = null;

        if (maintenanceHistoryTableBody) {
            maintenanceHistoryTableBody.replaceChildren();
        }
    }

    // Register asset form event listeners.
    if (addAssetButton) {
        addAssetButton.addEventListener("click", () => openAssetForm());
    }

    if (emptyAddAssetButton) {
        emptyAddAssetButton.addEventListener("click", () => openAssetForm());
    }

    document.getElementById("closeAssetModal")
        ?.addEventListener("click", closeAssetForm);

    document.getElementById("cancelAssetForm")
        ?.addEventListener("click", closeAssetForm);

    if (assetModal) {
        assetModal.addEventListener("click", event => {
            if (event.target === assetModal) {
                closeAssetForm();
            }
        });
    }

    if (assetForm) {
        assetForm.addEventListener("submit", saveAsset);
    }

    // Register asset assignment event listeners.
    document.getElementById("closeAssignmentModal")
        ?.addEventListener("click", closeAssignmentModal);

    document.getElementById("cancelAssignment")
        ?.addEventListener("click", closeAssignmentModal);

    if (assignmentModal) {
        assignmentModal.addEventListener("click", event => {
            if (event.target === assignmentModal) {
                closeAssignmentModal();
            }
        });
    }

    if (assignmentForm) {
        assignmentForm.addEventListener("submit", assignAsset);
    }

    // Register asset return event listeners.
    document.getElementById("closeReturnModal")
        ?.addEventListener("click", closeReturnModal);

    document.getElementById("cancelReturn")
        ?.addEventListener("click", closeReturnModal);

    if (returnAssetModal) {
        returnAssetModal.addEventListener("click", event => {
            if (event.target === returnAssetModal) {
                closeReturnModal();
            }
        });
    }

    if (returnAssetForm) {
        returnAssetForm.addEventListener("submit", returnCompanyAsset);
    }

    // Register maintenance form event listeners.
    document.getElementById("closeMaintenanceModal")
        ?.addEventListener("click", closeMaintenanceModal);

    document.getElementById("cancelMaintenance")
        ?.addEventListener("click", closeMaintenanceModal);

    if (maintenanceModal) {
        maintenanceModal.addEventListener("click", event => {
            if (event.target === maintenanceModal) {
                closeMaintenanceModal();
            }
        });
    }

    if (maintenanceForm) {
        maintenanceForm.addEventListener("submit", saveMaintenance);
    }

    // Register maintenance history event listeners.
    document.getElementById("closeMaintenanceHistoryModal")
        ?.addEventListener("click", closeMaintenanceHistory);

    if (maintenanceHistoryModal) {
        maintenanceHistoryModal.addEventListener("click", event => {
            if (event.target === maintenanceHistoryModal) {
                closeMaintenanceHistory();
            }
        });
    }

    if (addMaintenanceFromHistoryButton) {
        addMaintenanceFromHistoryButton.addEventListener("click", () => {
            if (selectedHistoryAssetId) {
                openMaintenanceModal(selectedHistoryAssetId);
            }
        });
    }

    // Close open modals when Escape is pressed.
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        if (assetModal?.classList.contains("show")) {
            closeAssetForm();
        }

        if (assignmentModal?.classList.contains("show")) {
            closeAssignmentModal();
        }

        if (returnAssetModal?.classList.contains("show")) {
            closeReturnModal();
        }

        if (maintenanceModal?.classList.contains("show")) {
            closeMaintenanceModal();
        }

        if (maintenanceHistoryModal?.classList.contains("show")) {
            closeMaintenanceHistory();
        }
    });

    // Display the current date.
    const assetDate = document.getElementById("assetDate");

    if (assetDate) {
        assetDate.textContent = new Date().toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    // Start the page after verifying the signed-in user.
    async function initialiseAssetManagement() {
        if (!window.SamAuth) {
            alert("The authentication system could not be loaded.");
            return;
        }

        currentUser = await SamAuth.requireAuth();

        if (!currentUser) {
            return;
        }

        if (!canViewAssets()) {
            alert("You do not have permission to view company assets.");
            return;
        }

        if (!canManageAssets()) {
            if (addAssetButton) {
                addAssetButton.style.display = "none";
            }

            if (emptyAddAssetButton) {
                emptyAddAssetButton.style.display = "none";
            }
        }

        await loadAssets();
    }

    initialiseAssetManagement();

})();
