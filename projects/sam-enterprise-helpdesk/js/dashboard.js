

// SAM ENTERPRISE - MAIN DASHBOARD




// 1. RETRIEVE TICKET RECORDS


const DASHBOARD_STORAGE_KEY = "samEnterpriseTickets";


function getDashboardTickets() {

    try {

        const savedTickets = localStorage.getItem(
            DASHBOARD_STORAGE_KEY
        );

        if (!savedTickets) {
            return [];
        }

        const tickets = JSON.parse(savedTickets);

        return Array.isArray(tickets) ? tickets : [];

    } catch (error) {

        console.error("Unable to retrieve dashboard tickets:", error);

        return [];

    }

}



// 2. DATE FUNCTIONS


function getDashboardDate(dateValue) {

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


function getDashboardCurrentDate() {

    return new Date().toLocaleDateString("en-ZA", {

        weekday: "long",

        year: "numeric",

        month: "long",

        day: "numeric"

    });

}


function isToday(dateValue) {

    if (!dateValue) {
        return false;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const today = new Date();

    return date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

}



// 3. UPDATE DATE AND GREETING


function updateDashboardGreeting() {

    const currentDate = document.getElementById("currentDate");

    const greeting = document.getElementById("dashboardGreeting");

    const hour = new Date().getHours();


    if (hour < 12) {

        greeting.textContent = "Good morning";

    } else if (hour < 18) {

        greeting.textContent = "Good afternoon";

    } else {

        greeting.textContent = "Good evening";

    }


    currentDate.textContent = getDashboardCurrentDate();

}



// 4. UPDATE DASHBOARD STATISTICS


function updateDashboardStatistics(tickets) {

    const total = tickets.length;


    const open = tickets.filter(ticket =>
        ticket.status === "Open"
    ).length;


    const inProgress = tickets.filter(ticket =>
        ticket.status === "In Progress"
    ).length;


    const resolvedToday = tickets.filter(ticket => {

        return ticket.status === "Resolved" &&
            isToday(ticket.resolvedAt);

    }).length;


    document.getElementById(
        "dashboardTotalTickets"
    ).textContent = total;


    document.getElementById(
        "dashboardOpenTickets"
    ).textContent = open;


    document.getElementById(
        "dashboardProgressTickets"
    ).textContent = inProgress;


    document.getElementById(
        "dashboardResolvedToday"
    ).textContent = resolvedToday;


    // Update sidebar ticket count

    document.getElementById(
        "sidebarTicketCount"
    ).textContent = total;

}



// 5. UPDATE TICKET PRIORITY DISTRIBUTION


function updateDashboardPriorities(tickets) {

    const priorityTypes = [

        {
            name: "Critical",
            bar: "dashboardCriticalBar",
            count: "dashboardCriticalCount"
        },

        {
            name: "High",
            bar: "dashboardHighBar",
            count: "dashboardHighCount"
        },

        {
            name: "Medium",
            bar: "dashboardMediumBar",
            count: "dashboardMediumCount"
        },

        {
            name: "Low",
            bar: "dashboardLowBar",
            count: "dashboardLowCount"
        }

    ];


    priorityTypes.forEach(priority => {

        const count = tickets.filter(ticket =>

            String(ticket.priority).toLowerCase() ===
            priority.name.toLowerCase()

        ).length;


        const percentage = tickets.length > 0

            ? (count / tickets.length) * 100

            : 0;


        document.getElementById(
            priority.count
        ).textContent = count;


        document.getElementById(
            priority.bar
        ).style.width = percentage + "%";

    });

}



// 6. CREATE TABLE CELL


function createDashboardCell(value) {

    const cell = document.createElement("td");

    cell.textContent = value || "—";

    return cell;

}



// 7. DISPLAY RECENT SUPPORT TICKETS


function renderDashboardTickets(tickets) {

    const ticketTable =
        document.getElementById("ticketTable");

    const emptyMessage =
        document.getElementById("dashboardTicketEmpty");


    ticketTable.replaceChildren();


    // Sort newest tickets first

    const recentTickets = [...tickets].sort((a, b) => {

        return new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0);

    }).slice(0, 5);


    if (recentTickets.length === 0) {

        emptyMessage.classList.add("show");

        return;

    }


    emptyMessage.classList.remove("show");


    recentTickets.forEach(ticket => {

        const row = document.createElement("tr");


        // Ticket ID

        const idCell = createDashboardCell(ticket.id);

        idCell.className = "ticket-id";

        row.appendChild(idCell);


        // Issue details

        const issueCell = document.createElement("td");

        const issueTitle = document.createElement("strong");

        issueTitle.textContent =
            ticket.issueTitle || "Unknown issue";


        const reportedBy = document.createElement("small");

        reportedBy.textContent =
            "Reported by " + (ticket.employeeName || "Unknown");


        issueCell.appendChild(issueTitle);

        issueCell.appendChild(reportedBy);

        row.appendChild(issueCell);


        // Department

        row.appendChild(
            createDashboardCell(ticket.department)
        );


        // Priority

        const priorityCell = document.createElement("td");

        const priorityBadge = document.createElement("span");


        const validPriorities = [
            "critical",
            "high",
            "medium",
            "low"
        ];


        const priorityClass =
            String(ticket.priority || "low").toLowerCase();


        priorityBadge.className =
            "priority " +
            (
                validPriorities.includes(priorityClass)
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


        // Assigned technician

        row.appendChild(
            createDashboardCell(ticket.assignedTo || "Unassigned")
        );


        ticketTable.appendChild(row);

    });

}



// 8. COLLECT RECENT ACTIVITY


function collectDashboardActivities(tickets) {

    const activities = [];


    tickets.forEach(ticket => {


        // Ticket submission

        if (ticket.createdAt) {

            activities.push({

                type: "submission",

                title: "New support ticket submitted",

                message:
                    `${ticket.id}: ${ticket.issueTitle}`,

                date: ticket.createdAt

            });

        }


        // Technician updates

        if (Array.isArray(ticket.updates)) {

            ticket.updates.forEach(update => {

                activities.push({

                    type: "update",

                    title: "Ticket updated: " + ticket.id,

                    message:
                        `${update.by || "Technician"}: ${update.message}`,

                    date: update.createdAt

                });

            });

        }


        // Ticket resolution

        if (ticket.resolvedAt) {

            activities.push({

                type: "resolved",

                title: "Ticket resolved: " + ticket.id,

                message: ticket.issueTitle,

                date: ticket.resolvedAt

            });

        }

    });


    return activities.sort((a, b) => {

        return new Date(b.date) - new Date(a.date);

    }).slice(0, 4);

}



// 9. DISPLAY RECENT ACTIVITY


function renderDashboardActivity(tickets) {

    const activityContainer =
        document.getElementById("dashboardActivity");

    const emptyMessage =
        document.getElementById("dashboardActivityEmpty");


    activityContainer.replaceChildren();


    const activities = collectDashboardActivities(tickets);


    if (activities.length === 0) {

        emptyMessage.classList.add("show");

        return;

    }


    emptyMessage.classList.remove("show");


    activities.forEach(activity => {

        const item = document.createElement("div");

        item.className = "activity-item";


        const iconContainer = document.createElement("div");

        const activityIcon = document.createElement("i");


        const iconSettings = {

            submission: {

                className: "blue",

                icon: "ticket-plus"

            },

            update: {

                className: "orange",

                icon: "refresh-cw"

            },

            resolved: {

                className: "green",

                icon: "check-circle"

            }

        };


        const settings =
            iconSettings[activity.type] || iconSettings.update;


        iconContainer.className =
            "activity-icon " + settings.className;


        iconContainer.appendChild(activityIcon);

        activityIcon.setAttribute(
            "data-lucide",
            settings.icon
        );


        // Activity details

        const details = document.createElement("div");

        const title = document.createElement("strong");

        title.textContent = activity.title;


        const message = document.createElement("p");

        const shortMessage =
            activity.message.length > 85

                ? activity.message.substring(0, 85) + "..."

                : activity.message;


        message.textContent = shortMessage;


        const date = document.createElement("small");

        date.textContent = getDashboardDate(activity.date);


        details.appendChild(title);

        details.appendChild(message);

        details.appendChild(date);


        item.appendChild(iconContainer);

        item.appendChild(details);


        activityContainer.appendChild(item);

    });


    if (window.lucide) {

        lucide.createIcons();

    }

}



// 10. INITIALISE DASHBOARD


function renderMainDashboard() {

    const tickets = getDashboardTickets();


    updateDashboardGreeting();

    updateDashboardStatistics(tickets);

    updateDashboardPriorities(tickets);

    renderDashboardTickets(tickets);

    renderDashboardActivity(tickets);


    if (window.lucide) {

        lucide.createIcons();

    }

}



// 11. REFRESH AFTER PAGE LOAD


document.addEventListener(
    "DOMContentLoaded",
    renderMainDashboard
);


// Refresh displayed information when the page
// becomes visible again.

document.addEventListener("visibilitychange", function() {

    if (!document.hidden) {

        renderMainDashboard();

    }

});
