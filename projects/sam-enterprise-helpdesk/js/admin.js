
// ============================================
// SAM ENTERPRISE - ADMIN DASHBOARD
// ============================================


// ============================================
// 1. STORAGE ACCESS
// ============================================

function getAdminStorage(key) {

    try {

        const saved = localStorage.getItem(key);

        if (!saved) {
            return [];
        }

        const records = JSON.parse(saved);

        return Array.isArray(records) ? records : [];

    } catch (error) {

        console.error("Unable to retrieve dashboard records:", error);

        return [];

    }

}


// ============================================
// 2. DATE FORMATTING
// ============================================

function formatAdminDate(dateValue) {

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {

        return "Not available";

    }

    return date.toLocaleDateString("en-ZA", {

        day: "2-digit",

        month: "short",

        year: "numeric"

    });

}


// ============================================
// 3. UPDATE ADMIN STATISTICS
// ============================================

function renderAdminDashboard() {


    // Retrieve data from the existing modules

    const users = window.SamUserStore.getAll();

    const tickets = getAdminStorage("samEnterpriseTickets");

    const assets = getAdminStorage("samEnterpriseAssets");


    // ========================================
    // USER STATISTICS
    // ========================================

    const activeUsers = users.filter(
        user => user.status === "Active"
    );

    const employees = activeUsers.filter(
        user => user.role === "Employee"
    );

    const technicians = activeUsers.filter(
        user => user.role === "Technician"
    );

    const administrators = activeUsers.filter(
        user => user.role === "Administrator"
    );


    document.getElementById("adminTotalUsers").textContent =
        users.length;


    document.getElementById("adminEmployees").textContent =
        employees.length;


    document.getElementById("adminTechnicians").textContent =
        technicians.length;


    document.getElementById("adminAdministrators").textContent =
        administrators.length;


    // ========================================
    // TICKET STATISTICS
    // ========================================

    const open = tickets.filter(
        ticket => ticket.status === "Open"
    ).length;

    const inProgress = tickets.filter(
        ticket => ticket.status === "In Progress"
    ).length;

    const pending = tickets.filter(
        ticket => ticket.status === "Pending"
    ).length;

    const resolved = tickets.filter(
        ticket => ticket.status === "Resolved"
    ).length;


    const unresolved = open + inProgress + pending;


    document.getElementById("adminTotalTickets").textContent =
        tickets.length;


    document.getElementById("adminUnresolvedTickets").textContent =
        unresolved;


    document.getElementById("adminOpenCount").textContent =
        open;


    document.getElementById("adminProgressCount").textContent =
        inProgress;


    document.getElementById("adminPendingCount").textContent =
        pending;


    document.getElementById("adminResolvedCount").textContent =
        resolved;


    // Ticket distribution bars

    const totalTickets = tickets.length;


    function getBarWidth(count) {

        if (totalTickets === 0) {
            return "0%";
        }

        return `${(count / totalTickets) * 100}%`;

    }


    document.getElementById("adminOpenBar").style.width =
        getBarWidth(open);


    document.getElementById("adminProgressBar").style.width =
        getBarWidth(inProgress);


    document.getElementById("adminPendingBar").style.width =
        getBarWidth(pending);


    document.getElementById("adminResolvedBar").style.width =
        getBarWidth(resolved);


    // ========================================
    // ASSET STATISTICS
    // ========================================

    const maintenanceAssets = assets.filter(
        asset => asset.status === "Maintenance"
    ).length;


    document.getElementById("adminTotalAssets").textContent =
        assets.length;


    document.getElementById("adminMaintenanceAssets").textContent =
        maintenanceAssets;


    // ========================================
    // RECENT SUPPORT TICKETS
    // ========================================

    renderAdminRecentTickets(tickets);


}


// ============================================
// 4. DISPLAY RECENT TICKETS
// ============================================

function renderAdminRecentTickets(tickets) {

    const recentTable =
        document.getElementById("adminRecentTickets");

    const emptyMessage =
        document.getElementById("adminTicketEmpty");


    recentTable.replaceChildren();


    const sortedTickets = [...tickets].sort((a, b) => {

        return new Date(b.createdAt || 0) -
               new Date(a.createdAt || 0);

    });


    const recentTickets = sortedTickets.slice(0, 5);


    if (recentTickets.length === 0) {

        emptyMessage.classList.add("show");

        return;

    }


    emptyMessage.classList.remove("show");


    recentTickets.forEach(ticket => {

        const row = document.createElement("tr");


        // Ticket reference

        const idCell = document.createElement("td");

        idCell.className = "ticket-id";

        idCell.textContent = ticket.id;

        row.appendChild(idCell);


        // Employee

        const employeeCell = document.createElement("td");

        employeeCell.textContent =
            ticket.employeeName || "Unknown";

        row.appendChild(employeeCell);


        // Issue

        const issueCell = document.createElement("td");

        issueCell.textContent =
            ticket.issueTitle || "Unknown issue";

        row.appendChild(issueCell);


        // Department

        const departmentCell = document.createElement("td");

        departmentCell.textContent =
            ticket.department || "—";

        row.appendChild(departmentCell);


        // Priority

        const priorityCell = document.createElement("td");

        const priorityBadge = document.createElement("span");

        const allowedPriorities = [
            "low", "medium", "high", "critical"
        ];

        const priorityClass =
            String(ticket.priority || "low").toLowerCase();

        priorityBadge.className =
            "priority " +
            (
                allowedPriorities.includes(priorityClass)
                    ? priorityClass
                    : "low"
            );

        priorityBadge.textContent =
            ticket.priority || "Low";

        priorityCell.appendChild(priorityBadge);

        row.appendChild(priorityCell);


        // Status

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");

        const statusClasses = {

            "Open": "open",

            "In Progress": "progress",

            "Pending": "pending",

            "Resolved": "resolved"

        };

        statusBadge.className =
            "ticket-status " +
            (statusClasses[ticket.status] || "open");

        statusBadge.textContent =
            ticket.status || "Open";

        statusCell.appendChild(statusBadge);

        row.appendChild(statusCell);


        recentTable.appendChild(row);

    });

}


// ============================================
// 5. DISPLAY CURRENT DATE
// ============================================

const adminDate = document.getElementById("adminDate");

if (adminDate) {

    adminDate.textContent = new Date().toLocaleDateString(

        "en-ZA",

        {

            weekday: "long",

            year: "numeric",

            month: "long",

            day: "numeric"

        }

    );

}


// ============================================
// 6. REFRESH DASHBOARD
// ============================================

const refreshAdmin = document.getElementById("refreshAdmin");

if (refreshAdmin) {

    refreshAdmin.addEventListener("click", function() {

        renderAdminDashboard();

    });

}


// ============================================
// 7. INITIALISE ADMIN DASHBOARD
// ============================================

renderAdminDashboard();
