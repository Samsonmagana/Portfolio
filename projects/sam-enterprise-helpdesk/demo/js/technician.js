
// =============================================
// SAM ENTERPRISE - TECHNICIAN MANAGEMENT SYSTEM
// =============================================


// =============================================
// 1. SHARED DATABASE (BROWSER LOCAL STORAGE)
// =============================================

const TECH_STORAGE_KEY = "samEnterpriseTickets";

const CURRENT_TECHNICIAN = "Alex Morgan";


function getAllSupportTickets() {

    try {

        const records = localStorage.getItem(TECH_STORAGE_KEY);

        if (!records) {
            return [];
        }

        const parsedRecords = JSON.parse(records);

        return Array.isArray(parsedRecords) ? parsedRecords : [];

    } catch (error) {

        console.error("Could not retrieve support tickets:", error);

        return [];

    }

}


function saveAllSupportTickets(tickets) {

    try {

        localStorage.setItem(
            TECH_STORAGE_KEY,
            JSON.stringify(tickets)
        );

        return true;

    } catch (error) {

        console.error("Could not save support tickets:", error);

        return false;

    }

}


// =============================================
// 2. PAGE ELEMENTS
// =============================================

const technicianTable =
    document.getElementById("technicianTicketTable");

const technicianTableWrapper =
    document.getElementById("technicianTableWrapper");

const technicianEmptyState =
    document.getElementById("technicianEmptyState");

const technicianEmptyMessage =
    document.getElementById("technicianEmptyMessage");

const technicianSearch =
    document.getElementById("techSearch");

const technicianRecordCount =
    document.getElementById("techRecordCount");


// =============================================
// 3. CURRENT FILTER
// =============================================

let activeTechnicianFilter = "All";


// =============================================
// 4. FORMAT DATE AND TIME
// =============================================

function formatTechnicianDate(dateValue) {

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


function formatTechnicianDateTime(dateValue) {

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString("en-ZA", {

        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit"

    });

}


// =============================================
// 5. STATUS AND PRIORITY CSS CLASSES
// =============================================

function technicianStatusClass(status) {

    const classes = {

        "Open": "open",

        "In Progress": "progress",

        "Pending": "pending",

        "Resolved": "resolved"

    };

    return classes[status] || "open";

}


function technicianPriorityClass(priority) {

    const allowed = [
        "low",
        "medium",
        "high",
        "critical"
    ];

    const value = String(priority || "").toLowerCase();

    return allowed.includes(value) ? value : "low";

}


// =============================================
// 6. CREATE SAFE TABLE ELEMENTS
// =============================================

function createTechnicianCell(value) {

    const cell = document.createElement("td");

    cell.textContent = value || "—";

    return cell;

}


// =============================================
// 7. UPDATE DASHBOARD STATISTICS
// =============================================

function updateTechnicianStatistics(tickets) {

    const total = tickets.length;

    const unassigned = tickets.filter(ticket =>
        !ticket.assignedTo ||
        ticket.assignedTo === "Unassigned"
    ).length;

    const inProgress = tickets.filter(ticket =>
        ticket.status === "In Progress"
    ).length;

    const resolved = tickets.filter(ticket =>
        ticket.status === "Resolved"
    ).length;

    const open = tickets.filter(ticket =>
        ticket.status === "Open"
    ).length;

    const pending = tickets.filter(ticket =>
        ticket.status === "Pending"
    ).length;

    const critical = tickets.filter(ticket =>
        ticket.priority === "Critical" &&
        ticket.status !== "Resolved"
    ).length;


    document.getElementById("techTotalTickets").textContent = total;

    document.getElementById("techUnassigned").textContent = unassigned;

    document.getElementById("techInProgress").textContent = inProgress;

    document.getElementById("techResolved").textContent = resolved;


    document.getElementById("techAllCount").textContent = total;

    document.getElementById("techOpenCount").textContent = open;

    document.getElementById("techProgressCount").textContent = inProgress;

    document.getElementById("techPendingCount").textContent = pending;

    document.getElementById("techResolvedCount").textContent = resolved;


    // Critical incident alert

    const criticalAlert = document.getElementById("criticalAlert");

    const criticalAlertText =
        document.getElementById("criticalAlertText");

    criticalAlert.style.display = critical > 0 ? "flex" : "none";

    criticalAlertText.textContent = critical > 0
        ? `${critical} unresolved critical incident(s) require immediate attention.`
        : "There are currently no critical incidents.";

}


// =============================================
// 8. DISPLAY ALL TICKETS IN THE QUEUE
// =============================================

function renderTechnicianQueue() {

    if (!technicianTable) {
        return;
    }

    const tickets = getAllSupportTickets();

    updateTechnicianStatistics(tickets);


    // Get search value

    const searchValue = technicianSearch
        ? technicianSearch.value.toLowerCase().trim()
        : "";


    // Apply search and filter

    const visibleTickets = tickets.filter(ticket => {

        const matchesStatus =
            activeTechnicianFilter === "All" ||
            ticket.status === activeTechnicianFilter;


        const searchableInformation = [

            ticket.id,

            ticket.issueTitle,

            ticket.employeeName,

            ticket.employeeEmail,

            ticket.department,

            ticket.issueCategory,

            ticket.assignedTo

        ].join(" ").toLowerCase();


        const matchesSearch =
            searchableInformation.includes(searchValue);


        return matchesStatus && matchesSearch;

    });


    // Clear existing rows

    technicianTable.replaceChildren();


    technicianRecordCount.textContent =
        visibleTickets.length +
        (visibleTickets.length === 1 ? " ticket" : " tickets");


    // Empty state

    if (visibleTickets.length === 0) {

        technicianTableWrapper.style.display = "none";

        technicianEmptyState.classList.add("show");

        if (tickets.length === 0) {

            technicianEmptyMessage.textContent =
                "No employee support requests have been submitted yet.";

        } else {

            technicianEmptyMessage.textContent =
                "No tickets match the selected filter or search.";

        }

        return;

    }


    technicianTableWrapper.style.display = "block";

    technicianEmptyState.classList.remove("show");


    // Create ticket rows

    visibleTickets.forEach(ticket => {

        const row = document.createElement("tr");


        // Ticket ID

        const idCell = createTechnicianCell(ticket.id);

        idCell.className = "ticket-id";

        row.appendChild(idCell);


        // Employee and issue

        const employeeCell = document.createElement("td");

        const issueTitle = document.createElement("strong");

        issueTitle.textContent = ticket.issueTitle;

        const employeeName = document.createElement("small");

        employeeName.textContent =
            `${ticket.employeeName} · ${formatTechnicianDate(ticket.createdAt)}`;

        employeeCell.appendChild(issueTitle);

        employeeCell.appendChild(employeeName);

        row.appendChild(employeeCell);


        // Department

        row.appendChild(
            createTechnicianCell(ticket.department)
        );


        // Priority

        const priorityCell = document.createElement("td");

        const priorityBadge = document.createElement("span");

        priorityBadge.className =
            "priority " + technicianPriorityClass(ticket.priority);

        priorityBadge.textContent = ticket.priority;

        priorityCell.appendChild(priorityBadge);

        row.appendChild(priorityCell);


        // Status

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");

        statusBadge.className =
            "ticket-status " + technicianStatusClass(ticket.status);

        statusBadge.textContent = ticket.status;

        statusCell.appendChild(statusBadge);

        row.appendChild(statusCell);


        // Assigned technician

        row.appendChild(
            createTechnicianCell(ticket.assignedTo || "Unassigned")
        );


        // Manage ticket button

        const actionCell = document.createElement("td");

        const manageButton = document.createElement("button");

        manageButton.type = "button";

        manageButton.className = "view-ticket-button";

        const manageIcon = document.createElement("i");

        manageIcon.setAttribute("data-lucide", "settings-2");

        manageButton.appendChild(manageIcon);

        manageButton.appendChild(
            document.createTextNode(" Manage")
        );

        manageButton.addEventListener("click", () => {

            openTicketManager(ticket.id);

        });

        actionCell.appendChild(manageButton);

        row.appendChild(actionCell);


        technicianTable.appendChild(row);

    });


    if (window.lucide) {
        lucide.createIcons();
    }

}


// =============================================
// 9. TICKET FILTER BUTTONS
// =============================================

const technicianFilterButtons =
    document.querySelectorAll("[data-tech-filter]");


technicianFilterButtons.forEach(button => {

    button.addEventListener("click", function () {

        activeTechnicianFilter = this.dataset.techFilter;


        technicianFilterButtons.forEach(item => {

            item.classList.remove("active");

            item.setAttribute("aria-pressed", "false");

        });


        this.classList.add("active");

        this.setAttribute("aria-pressed", "true");


        renderTechnicianQueue();

    });

});


// =============================================
// 10. SEARCH TICKETS
// =============================================

if (technicianSearch) {

    technicianSearch.addEventListener("input", function () {

        renderTechnicianQueue();

    });

}


const technicianClearSearch =
    document.getElementById("techClearSearch");


if (technicianClearSearch) {

    technicianClearSearch.addEventListener("click", function () {

        technicianSearch.value = "";

        renderTechnicianQueue();

    });

}


// =============================================
// 11. TICKET MANAGEMENT MODAL ELEMENTS
// =============================================

const manageTicketModal =
    document.getElementById("manageTicketModal");

const manageTicketForm =
    document.getElementById("manageTicketForm");

const manageTicketTitle =
    document.getElementById("manageTicketTitle");

const managementSummary =
    document.getElementById("managementSummary");

const editingTicketId =
    document.getElementById("editingTicketId");

const technicianAssignment =
    document.getElementById("technicianAssignment");

const technicianPriority =
    document.getElementById("technicianPriority");

const technicianStatus =
    document.getElementById("technicianStatus");

const technicianNotes =
    document.getElementById("technicianNotes");

const ticketActivityHistory =
    document.getElementById("ticketActivityHistory");


// =============================================
// 12. DISPLAY TICKET ACTIVITY HISTORY
// =============================================

function renderTicketActivity(ticket) {

    ticketActivityHistory.replaceChildren();


    // Original submission activity

    const initialEntry = document.createElement("div");

    initialEntry.className = "history-entry";

    const initialTitle = document.createElement("strong");

    initialTitle.textContent = "Ticket submitted";

    const initialMessage = document.createElement("p");

    initialMessage.textContent =
        `Submitted by ${ticket.employeeName}. The support request entered the system.`;


    const initialDate = document.createElement("small");

    initialDate.textContent =
        formatTechnicianDateTime(ticket.createdAt);


    initialEntry.appendChild(initialTitle);

    initialEntry.appendChild(initialMessage);

    initialEntry.appendChild(initialDate);

    ticketActivityHistory.appendChild(initialEntry);


    // Existing technician updates

    const updates = Array.isArray(ticket.updates)
        ? [...ticket.updates].reverse()
        : [];


    if (updates.length === 0) {

        const emptyHistory = document.createElement("p");

        emptyHistory.className = "history-empty";

        emptyHistory.textContent =
            "No technician updates have been recorded yet.";

        ticketActivityHistory.appendChild(emptyHistory);

        return;

    }


    updates.forEach(update => {

        const entry = document.createElement("div");

        entry.className = "history-entry";


        const title = document.createElement("strong");

        title.textContent = update.type || "Technician update";


        const message = document.createElement("p");

        message.textContent = update.message;


        const date = document.createElement("small");

        date.textContent =
            `By ${update.by} · ${formatTechnicianDateTime(update.createdAt)}`;


        entry.appendChild(title);

        entry.appendChild(message);

        entry.appendChild(date);


        ticketActivityHistory.appendChild(entry);

    });

}


// =============================================
// 13. OPEN TICKET MANAGEMENT
// =============================================

function openTicketManager(ticketId) {

    const tickets = getAllSupportTickets();

    const ticket = tickets.find(item => item.id === ticketId);

    if (!ticket) {

        alert("The selected ticket could not be found.");

        return;

    }


    // Display ticket reference

    manageTicketTitle.textContent = ticket.id;

    editingTicketId.value = ticket.id;


    // Display employee issue information

    managementSummary.replaceChildren();


    const issueHeading = document.createElement("h3");

    issueHeading.textContent = ticket.issueTitle;


    const issueDescription = document.createElement("p");

    issueDescription.textContent = ticket.description;


    const metadata = document.createElement("div");

    metadata.className = "summary-meta";


    const employee = document.createElement("span");

    employee.textContent = `Employee: ${ticket.employeeName}`;


    const department = document.createElement("span");

    department.textContent = `Department: ${ticket.department}`;


    const category = document.createElement("span");

    category.textContent = `Category: ${ticket.issueCategory}`;


    metadata.appendChild(employee);

    metadata.appendChild(department);

    metadata.appendChild(category);


    managementSummary.appendChild(issueHeading);

    managementSummary.appendChild(issueDescription);

    managementSummary.appendChild(metadata);


    // Set existing management values

    technicianAssignment.value =
        ticket.assignedTo === "Unassigned"
            ? ""
            : ticket.assignedTo;


    technicianPriority.value = ticket.priority;

    technicianStatus.value = ticket.status;

    technicianNotes.value = "";


    // Display activity history

    renderTicketActivity(ticket);


    // Show modal

    manageTicketModal.classList.add("show");


    if (window.lucide) {
        lucide.createIcons();
    }

}


// =============================================
// 14. SAVE TECHNICIAN UPDATES
// =============================================

if (manageTicketForm) {

    manageTicketForm.addEventListener("submit", function (event) {

        event.preventDefault();


        if (!manageTicketForm.reportValidity()) {
            return;
        }


        const tickets = getAllSupportTickets();

        const ticketId = editingTicketId.value;

        const ticketIndex = tickets.findIndex(
            ticket => ticket.id === ticketId
        );


        if (ticketIndex === -1) {

            alert("Ticket could not be found.");

            return;

        }


        const ticket = tickets[ticketIndex];


        // Capture new values

        const newAssignment = technicianAssignment.value;

        const newPriority = technicianPriority.value;

        const newStatus = technicianStatus.value;

        const notes = technicianNotes.value.trim();


        // Generate a description of changes

        const changes = [];


        if (ticket.assignedTo !== newAssignment) {

            changes.push(
                `Assignment changed from ${ticket.assignedTo || "Unassigned"} to ${newAssignment}.`
            );

        }


        if (ticket.priority !== newPriority) {

            changes.push(
                `Priority changed from ${ticket.priority} to ${newPriority}.`
            );

        }


        if (ticket.status !== newStatus) {

            changes.push(
                `Status changed from ${ticket.status} to ${newStatus}.`
            );

        }


        if (notes) {

            changes.push(`Technician notes: ${notes}`);

        }


        if (changes.length === 0) {

            alert("No changes or troubleshooting notes have been entered.");

            return;

        }


        // Update ticket information

        ticket.assignedTo = newAssignment;

        ticket.priority = newPriority;

        ticket.status = newStatus;

        ticket.updatedAt = new Date().toISOString();


        // Track resolution time

        if (newStatus === "Resolved" && !ticket.resolvedAt) {

            ticket.resolvedAt = new Date().toISOString();

        }

        if (newStatus !== "Resolved") {

            delete ticket.resolvedAt;

        }


        // Create activity history

        if (!Array.isArray(ticket.updates)) {

            ticket.updates = [];

        }


        ticket.updates.push({

            type: "Technician update",

            message: changes.join("\n"),

            by: CURRENT_TECHNICIAN,

            createdAt: new Date().toISOString()

        });


        // Save changes

        const saved = saveAllSupportTickets(tickets);


        if (!saved) {

            alert("Unable to save changes. Please try again.");

            return;

        }


        // Close management modal

        manageTicketModal.classList.remove("show");


        // Refresh technician dashboard

        renderTechnicianQueue();


        alert(
            `Ticket ${ticketId} has been updated successfully.`
        );

    });

}


// =============================================
// 15. CLOSE MANAGEMENT MODAL
// =============================================

function closeManageTicketModal() {

    if (manageTicketModal) {

        manageTicketModal.classList.remove("show");

    }

}


const closeManageModal =
    document.getElementById("closeManageModal");

const cancelManageTicket =
    document.getElementById("cancelManageTicket");


if (closeManageModal) {

    closeManageModal.addEventListener(
        "click",
        closeManageTicketModal
    );

}


if (cancelManageTicket) {

    cancelManageTicket.addEventListener(
        "click",
        closeManageTicketModal
    );

}


if (manageTicketModal) {

    manageTicketModal.addEventListener("click", function (event) {

        if (event.target === manageTicketModal) {

            closeManageTicketModal();

        }

    });

}


document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeManageTicketModal();

    }

});


// =============================================
// 16. REFRESH TICKET QUEUE
// =============================================

const refreshTicketsButton =
    document.getElementById("refreshTickets");


if (refreshTicketsButton) {

    refreshTicketsButton.addEventListener("click", function () {

        renderTechnicianQueue();

    });

}


// =============================================
// 17. DISPLAY CURRENT DATE
// =============================================

const technicianDate =
    document.getElementById("technicianDate");


if (technicianDate) {

    technicianDate.textContent = new Date().toLocaleDateString(
        "en-ZA",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


// =============================================
// 18. INITIALISE TECHNICIAN DASHBOARD
// =============================================

renderTechnicianQueue();
