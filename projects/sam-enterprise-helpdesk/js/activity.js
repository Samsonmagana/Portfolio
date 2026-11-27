
/**
 * Sam Enterprise - Asset Activity Log
 * Displays recent asset activities from the PostgreSQL API.
 */

(function () {
    "use strict";

    const API_BASE_URL = "http://127.0.0.1:5000/api";

    const activityTableBody = document.getElementById("activityTableBody");
    const activityCount = document.getElementById("activityCount");
    const activitySearch = document.getElementById("activitySearch");
    const actionFilter = document.getElementById("actionFilter");
    const refreshActivityButton = document.getElementById("refreshActivity");

    let activities = [];

    // Authenticate the current user.
    if (window.SamAuth) {
        SamAuth.requireAuth();
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function formatDate(dateValue) {
        if (!dateValue) return "N/A";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "N/A";

        return date.toLocaleString("en-ZA", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function formatAction(action) {
        return String(action || "UNKNOWN")
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    function getActionClass(action) {
        const classes = {
            ASSET_CREATED: "created",
            ASSET_ASSIGNED: "assigned",
            ASSET_RETURNED: "returned",
            ASSET_UPDATED: "updated"
        };

        return classes[action] || "";
    }

    function getActivityDetails(activity) {
        const details = activity.details || {};
        const messages = [];

        if (details.assigned_employee) {
            messages.push(`Assigned to: ${details.assigned_employee}`);
        }

        if (details.return_condition) {
            messages.push(`Return condition: ${details.return_condition}`);
        }

        if (details.notes) {
            messages.push(`Notes: ${details.notes}`);
        }

        if (details.maintenance_type) {
            messages.push(`Maintenance: ${details.maintenance_type}`);
        }

        if (details.description) {
            messages.push(details.description);
        }

        if (messages.length === 0) {
            return "No additional details";
        }

        return messages.join(" | ");
    }

    async function loadActivities() {
        activityTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="status-message">
                    Loading activity records...
                </td>
            </tr>
        `;

        refreshActivityButton.disabled = true;
        refreshActivityButton.textContent = "Loading...";

        try {
            const response = await fetch(
                `${API_BASE_URL}/assets/activity`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (response.status === 401 || response.status === 403) {
                throw new Error("You are not authorised to view asset activities. Please log in again.");
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load activity records.");
            }

            activities = data.activities || [];

            activityCount.textContent = data.count ?? activities.length;

            renderActivities();

        } catch (error) {
            console.error("Activity Log Error:", error);

            activityTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="status-message">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;
        } finally {
            refreshActivityButton.disabled = false;
            refreshActivityButton.textContent = "↻ Refresh";
        }
    }

    function renderActivities() {
        const searchTerm = activitySearch.value.trim().toLowerCase();
        const selectedAction = actionFilter.value;

        const filteredActivities = activities.filter(activity => {
            const userName = [
                activity.first_name,
                activity.last_name
            ].filter(Boolean).join(" ");

            const searchableText = [
                activity.asset_tag,
                activity.asset_name,
                activity.action,
                activity.email,
                userName,
                getActivityDetails(activity)
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const matchesAction =
                selectedAction === "All" ||
                activity.action === selectedAction;

            return matchesSearch && matchesAction;
        });

        if (filteredActivities.length === 0) {
            activityTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="status-message">
                        No matching activity records found.
                    </td>
                </tr>
            `;

            return;
        }

        activityTableBody.innerHTML = filteredActivities.map(activity => {
            const fullName = [
                activity.first_name,
                activity.last_name
            ].filter(Boolean).join(" ");

            const performedBy = fullName || activity.email || "Unknown user";

            return `
                <tr>
                    <td>${escapeHTML(formatDate(activity.created_at))}</td>

                    <td>
                        <strong>${escapeHTML(activity.asset_tag || "Unknown")}</strong>
                        <br>
                        <span style="color:#64748b;">
                            ${escapeHTML(activity.asset_name || "")}
                        </span>
                    </td>

                    <td>
                        <span class="action-badge ${getActionClass(activity.action)}">
                            ${escapeHTML(formatAction(activity.action))}
                        </span>
                    </td>

                    <td>
                        <strong>${escapeHTML(performedBy)}</strong>
                        <br>
                        <span style="color:#64748b;">
                            ${escapeHTML(activity.email || "")}
                        </span>
                    </td>

                    <td class="details">
                        ${escapeHTML(getActivityDetails(activity))}
                    </td>
                </tr>
            `;
        }).join("");
    }

    activitySearch.addEventListener("input", renderActivities);
    actionFilter.addEventListener("change", renderActivities);
    refreshActivityButton.addEventListener("click", loadActivities);

    // Load activity records when the page opens.
    loadActivities();

})();
