

// SAM ENTERPRISE - REPORTS & ANALYTICS




// 1. STORAGE


const REPORT_STORAGE_KEY = "samEnterpriseTickets";


function getReportTickets() {

    try {

        const savedData = localStorage.getItem(REPORT_STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const tickets = JSON.parse(savedData);

        return Array.isArray(tickets) ? tickets : [];

    } catch (error) {

        console.error("Unable to load reporting data:", error);

        return [];

    }

}



// 2. SELECT PAGE ELEMENTS


const reportPeriod = document.getElementById("reportPeriod");

const reportDepartment =
    document.getElementById("reportDepartment");

const reportPriority =
    document.getElementById("reportPriority");

const reportTotalTickets =
    document.getElementById("reportTotalTickets");

const reportResolvedTickets =
    document.getElementById("reportResolvedTickets");

const reportResolutionRate =
    document.getElementById("reportResolutionRate");

const reportBacklog =
    document.getElementById("reportBacklog");

const averageResolutionTime =
    document.getElementById("averageResolutionTime");

const resolutionTimeDescription =
    document.getElementById("resolutionTimeDescription");



// 3. FORMAT DATES


function reportDate(dateValue) {

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


function reportShortDate(dateValue) {

    const date = new Date(dateValue);

    return date.toLocaleDateString("en-ZA", {

        day: "2-digit",

        month: "short"

    });

}


function getLocalDateKey(dateValue) {

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}



// 4. GET FILTERED TICKET RECORDS


function getFilteredReportTickets() {

    const tickets = getReportTickets();

    const period = reportPeriod.value;

    const department = reportDepartment.value;

    const priority = reportPriority.value;


    const now = new Date();


    let startDate = null;


    if (period !== "all") {

        const days = Number(period);

        startDate = new Date(now);

        startDate.setHours(0, 0, 0, 0);

        startDate.setDate(
            startDate.getDate() - days + 1
        );

    }


    return tickets.filter(ticket => {

        // Date filter

        const ticketDate = new Date(ticket.createdAt);

        if (Number.isNaN(ticketDate.getTime())) {
            return false;
        }

        const matchesDate =
            !startDate ||
            ticketDate >= startDate && ticketDate <= now;


        // Department filter

        const matchesDepartment =
            department === "All" ||
            ticket.department === department;


        // Priority filter

        const matchesPriority =
            priority === "All" ||
            ticket.priority === priority;


        return matchesDate &&
            matchesDepartment &&
            matchesPriority;

    });

}



// 5. UPDATE REPORT FILTER INFORMATION


function updateReportFilterInformation(tickets) {

    const result = document.getElementById(
        "reportFilterResult"
    );


    const periodText = {

        "7": "last 7 days",

        "30": "last 30 days",

        "90": "last 90 days",

        "all": "all recorded time"

    };


    const departmentText =
        reportDepartment.value === "All"
            ? "all departments"
            : reportDepartment.value;


    const priorityText =
        reportPriority.value === "All"
            ? "all priority levels"
            : reportPriority.value + " priority";


    result.textContent =
        `Showing ${tickets.length} ticket(s) from ${periodText[reportPeriod.value]}, ` +
        `${departmentText}, ${priorityText}.`;

}



// 6. CALCULATE MAIN PERFORMANCE METRICS


function updateReportMetrics(tickets) {

    const total = tickets.length;


    const resolved = tickets.filter(ticket =>

        ticket.status === "Resolved"

    ).length;


    const backlog = tickets.filter(ticket =>

        ["Open", "In Progress", "Pending"].includes(ticket.status)

    ).length;


    const resolutionRate = total > 0

        ? (resolved / total) * 100

        : 0;


    reportTotalTickets.textContent = total;

    reportResolvedTickets.textContent = resolved;

    reportResolutionRate.textContent =
        resolutionRate.toFixed(1) + "%";

    reportBacklog.textContent = backlog;


    // Calculate average resolution time

    const validResolutionTimes = tickets

        .filter(ticket => {

            if (
                ticket.status !== "Resolved" ||
                !ticket.createdAt ||
                !ticket.resolvedAt
            ) {
                return false;
            }

            const start = new Date(ticket.createdAt).getTime();

            const end = new Date(ticket.resolvedAt).getTime();

            return Number.isFinite(start) &&
                Number.isFinite(end) &&
                end >= start;

        })

        .map(ticket => {

            return (
                new Date(ticket.resolvedAt).getTime() -
                new Date(ticket.createdAt).getTime()
            ) / 3600000;

        });


    if (validResolutionTimes.length === 0) {

        averageResolutionTime.textContent = "Not available";

        resolutionTimeDescription.textContent =
            "No resolved tickets with complete timestamps are available.";

        return;

    }


    const averageHours = validResolutionTimes.reduce(

        (sum, hours) => sum + hours,

        0

    ) / validResolutionTimes.length;


    const days = Math.floor(averageHours / 24);

    const remainingHours = Math.floor(averageHours % 24);

    const remainingMinutes = Math.round(
        (averageHours % 1) * 60
    );


    let formattedTime = "";


    if (days > 0) {

        formattedTime += days + "d ";

    }

    if (remainingHours > 0) {

        formattedTime += remainingHours + "h ";

    }

    if (remainingMinutes > 0 || formattedTime === "") {

        formattedTime += remainingMinutes + "m";

    }


    averageResolutionTime.textContent = formattedTime.trim();


    resolutionTimeDescription.textContent =
        `Calculated from ${validResolutionTimes.length} resolved ticket(s) with valid submission and resolution timestamps.`;

}



// 7. BUILD DAILY / WEEKLY / MONTHLY TREND DATA


function buildTicketTrend(tickets) {

    const period = reportPeriod.value;

    const buckets = [];


    if (period === "7" || period === "30") {

        const days = Number(period);

        const today = new Date();

        today.setHours(0, 0, 0, 0);


        for (let i = days - 1; i >= 0; i--) {

            const date = new Date(today);

            date.setDate(today.getDate() - i);


            buckets.push({

                key: getLocalDateKey(date),

                label: reportShortDate(date),

                count: 0

            });

        }

    } else if (period === "90") {

        // Build 13 weekly buckets, including this week.

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const currentDay = today.getDay();

        const mondayOffset = (currentDay + 6) % 7;

        const currentMonday = new Date(today);

        currentMonday.setDate(
            today.getDate() - mondayOffset
        );


        for (let i = 12; i >= 0; i--) {

            const weekStart = new Date(currentMonday);

            weekStart.setDate(
                currentMonday.getDate() - (i * 7)
            );


            const weekEnd = new Date(weekStart);

            weekEnd.setDate(weekStart.getDate() + 7);


            buckets.push({

                start: weekStart.getTime(),

                end: weekEnd.getTime(),

                label: reportShortDate(weekStart),

                count: 0

            });

        }

    } else {

        // All time: group records by calendar month.

        const validDates = tickets

            .map(ticket => new Date(ticket.createdAt))

            .filter(date => !Number.isNaN(date.getTime()));


        const firstDate = validDates.length > 0

            ? new Date(
                Math.min(...validDates.map(date => date.getTime()))
            )

            : new Date();


        const currentDate = new Date();

        let cursor = new Date(

            firstDate.getFullYear(),

            firstDate.getMonth(),

            1

        );


        const currentMonth = new Date(

            currentDate.getFullYear(),

            currentDate.getMonth(),

            1

        );


        while (cursor <= currentMonth) {

            const nextMonth = new Date(

                cursor.getFullYear(),

                cursor.getMonth() + 1,

                1

            );


            buckets.push({

                start: cursor.getTime(),

                end: nextMonth.getTime(),

                label: cursor.toLocaleDateString("en-ZA", {

                    month: "short",

                    year: "2-digit"

                }),

                count: 0

            });


            cursor = nextMonth;

        }

    }


    // Count tickets inside their relevant buckets.

    tickets.forEach(ticket => {

        const timestamp = new Date(
            ticket.createdAt
        ).getTime();


        if (!Number.isFinite(timestamp)) {
            return;
        }


        buckets.forEach(bucket => {

            if (bucket.key) {

                if (bucket.key === getLocalDateKey(ticket.createdAt)) {

                    bucket.count++;

                }

            } else if (
                timestamp >= bucket.start &&
                timestamp < bucket.end
            ) {

                bucket.count++;

            }

        });

    });


    return buckets;

}



// 8. RENDER TICKET VOLUME CHART


function renderTicketVolumeChart(tickets) {

    const chart = document.getElementById(
        "ticketVolumeChart"
    );


    chart.replaceChildren();


    if (tickets.length === 0) {

        const empty = document.createElement("div");

        empty.className = "volume-chart-empty";

        empty.textContent =
            "No ticket data is available for this reporting period.";

        chart.appendChild(empty);

        return;

    }


    const buckets = buildTicketTrend(tickets);


    const maximum = Math.max(

        1,

        ...buckets.map(bucket => bucket.count)

    );


    buckets.forEach(bucket => {

        const item = document.createElement("div");

        item.className = "volume-bar-item";


        const value = document.createElement("span");

        value.className = "volume-bar-value";

        value.textContent = bucket.count;


        const bar = document.createElement("div");

        bar.className = "volume-bar";


        // Always display a minimum bar for zero values.

        const height = bucket.count > 0

            ? Math.max(4, (bucket.count / maximum) * 165)

            : 3;


        bar.style.height = height + "px";


        const label = document.createElement("small");

        label.textContent = bucket.label;


        item.title =
            `${bucket.label}: ${bucket.count} ticket(s)`;


        item.appendChild(value);

        item.appendChild(bar);

        item.appendChild(label);


        chart.appendChild(item);

    });

}



// 9. RENDER TICKET STATUS BREAKDOWN


function renderStatusBreakdown(tickets) {

    const chart = document.getElementById(
        "ticketStatusChart"
    );


    chart.replaceChildren();


    const statuses = [

        {
            label: "Open",
            className: "status-open-fill"
        },

        {
            label: "In Progress",
            className: "status-progress-fill"
        },

        {
            label: "Pending",
            className: "status-pending-fill"
        },

        {
            label: "Resolved",
            className: "status-resolved-fill"
        }

    ];


    statuses.forEach(status => {

        const count = tickets.filter(ticket =>

            ticket.status === status.label

        ).length;


        const percentage = tickets.length > 0

            ? (count / tickets.length) * 100

            : 0;


        const row = document.createElement("div");

        row.className = "status-chart-row";


        const label = document.createElement("span");

        label.textContent = status.label;


        const track = document.createElement("div");

        track.className = "status-chart-track";


        const fill = document.createElement("div");

        fill.className =
            "status-chart-fill " + status.className;

        fill.style.width = percentage + "%";


        const number = document.createElement("strong");

        number.textContent = count;


        track.appendChild(fill);

        row.appendChild(label);

        row.appendChild(track);

        row.appendChild(number);


        chart.appendChild(row);

    });

}



// 10. GENERIC BREAKDOWN CHART


function renderBreakdownChart(containerId, tickets, key) {

    const container = document.getElementById(containerId);

    container.replaceChildren();


    const groups = {};


    tickets.forEach(ticket => {

        const value = ticket[key] || "Not specified";

        groups[value] = (groups[value] || 0) + 1;

    });


    const sortedGroups = Object.entries(groups)

        .sort((a, b) => b[1] - a[1])

        .slice(0, 8);


    if (sortedGroups.length === 0) {

        const empty = document.createElement("p");

        empty.className = "report-empty show";

        empty.textContent = "No records available.";

        container.appendChild(empty);

        return;

    }


    const list = document.createElement("div");

    list.className = "breakdown-list";


    const maximum = Math.max(

        1,

        ...sortedGroups.map(group => group[1])

    );


    sortedGroups.forEach(([label, count]) => {

        const item = document.createElement("div");

        item.className = "breakdown-item";


        const heading = document.createElement("div");

        heading.className = "breakdown-heading";


        const title = document.createElement("span");

        title.textContent = label;


        const value = document.createElement("strong");

        value.textContent = `${count} (${Math.round(
            (count / tickets.length) * 100
        )}%)`;


        heading.appendChild(title);

        heading.appendChild(value);


        const track = document.createElement("div");

        track.className = "breakdown-track";


        const fill = document.createElement("div");

        fill.className = "breakdown-fill";

        fill.style.width = (count / maximum * 100) + "%";


        track.appendChild(fill);


        item.appendChild(heading);

        item.appendChild(track);


        list.appendChild(item);

    });


    container.appendChild(list);

}



// 11. TECHNICIAN PERFORMANCE REPORT


function renderTechnicianPerformance(tickets) {

    const table = document.getElementById(
        "technicianReportTable"
    );

    const empty = document.getElementById(
        "technicianReportEmpty"
    );


    table.replaceChildren();


    const technicianGroups = {};


    tickets.forEach(ticket => {

        const technician = ticket.assignedTo;


        if (
            !technician ||
            technician === "Unassigned"
        ) {

            return;

        }


        if (!technicianGroups[technician]) {

            technicianGroups[technician] = {

                total: 0,

                resolved: 0,

                progress: 0,

                outstanding: 0

            };

        }


        const group = technicianGroups[technician];


        group.total++;


        if (ticket.status === "Resolved") {

            group.resolved++;

        } else if (ticket.status === "In Progress") {

            group.progress++;

        } else {

            group.outstanding++;

        }

    });


    const technicians = Object.entries(technicianGroups)

        .sort((a, b) => b[1].total - a[1].total);


    if (technicians.length === 0) {

        empty.classList.add("show");

        return;

    }


    empty.classList.remove("show");


    technicians.forEach(([name, data]) => {

        const row = document.createElement("tr");


        function addCell(value) {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        }


        addCell(name);

        addCell(data.total);

        addCell(data.resolved);

        addCell(data.progress);

        addCell(data.outstanding);


        const rate = data.total > 0

            ? (data.resolved / data.total) * 100

            : 0;


        const rateCell = document.createElement("td");

        rateCell.className = "report-rate";

        rateCell.textContent = rate.toFixed(1) + "%";

        row.appendChild(rateCell);


        table.appendChild(row);

    });

}



// 12. MANAGEMENT INSIGHTS


function renderManagementInsights(tickets) {

    const container = document.getElementById(
        "managementInsights"
    );


    container.replaceChildren();


    const insights = [];


    if (tickets.length === 0) {

        insights.push({

            icon: "info",

            title: "No reporting data available",

            description:
                "Submit support tickets through the Employee Portal to begin generating management insights."

        });

    } else {

        // Most common category

        const categories = {};

        tickets.forEach(ticket => {

            const category = ticket.issueCategory || "Not specified";

            categories[category] =
                (categories[category] || 0) + 1;

        });


        const topCategory = Object.entries(categories)

            .sort((a, b) => b[1] - a[1])[0];


        if (topCategory) {

            insights.push({

                icon: "trending-up",

                title: "Most frequently reported issue",

                description:
                    `${topCategory[0]} accounts for ${topCategory[1]} ticket(s) in the selected reporting period.`

            });

        }


        // Department with most tickets

        const departments = {};

        tickets.forEach(ticket => {

            const department =
                ticket.department || "Not specified";

            departments[department] =
                (departments[department] || 0) + 1;

        });


        const topDepartment = Object.entries(departments)

            .sort((a, b) => b[1] - a[1])[0];


        if (topDepartment) {

            insights.push({

                icon: "building-2",

                title: "Department with most incidents",

                description:
                    `${topDepartment[0]} has submitted ${topDepartment[1]} ticket(s) in the selected reporting period.`

            });

        }


        // Unresolved backlog

        const backlog = tickets.filter(ticket =>

            ["Open", "In Progress", "Pending"].includes(ticket.status)

        ).length;


        insights.push({

            icon: "inbox",

            title: "Outstanding support workload",

            description:
                `${backlog} of ${tickets.length} ticket(s) remain unresolved in the selected reporting period.`

        });


        // Critical incidents

        const critical = tickets.filter(ticket =>

            ticket.priority === "Critical" &&

            ticket.status !== "Resolved"

        ).length;


        insights.push({

            icon: critical > 0 ? "alert-triangle" : "shield-check",

            title: critical > 0
                ? "Critical incidents need attention"
                : "No unresolved critical incidents",

            description: critical > 0

                ? `${critical} unresolved critical incident(s) were found in the selected reporting period. Review them promptly.`

                : "No unresolved Critical-priority tickets were found in the selected reporting period."

        });

    }


    insights.forEach(insight => {

        const item = document.createElement("div");

        item.className = "management-insight";


        const iconContainer = document.createElement("div");

        iconContainer.className = "insight-icon";


        const icon = document.createElement("i");

        icon.setAttribute("data-lucide", insight.icon);


        iconContainer.appendChild(icon);


        const content = document.createElement("div");


        const heading = document.createElement("strong");

        heading.textContent = insight.title;


        const description = document.createElement("p");

        description.textContent = insight.description;


        content.appendChild(heading);

        content.appendChild(description);


        item.appendChild(iconContainer);

        item.appendChild(content);


        container.appendChild(item);

    });


    if (window.lucide) {

        lucide.createIcons();

    }

}


// 13. REFRESH ALL REPORTS


function refreshReports() {

    const filteredTickets = getFilteredReportTickets();


    updateReportFilterInformation(filteredTickets);

    updateReportMetrics(filteredTickets);

    renderTicketVolumeChart(filteredTickets);

    renderStatusBreakdown(filteredTickets);

    renderBreakdownChart(
        "categoryBreakdown",
        filteredTickets,
        "issueCategory"
    );

    renderBreakdownChart(
        "departmentBreakdown",
        filteredTickets,
        "department"
    );

    renderTechnicianPerformance(filteredTickets);

    renderManagementInsights(filteredTickets);


    if (window.lucide) {

        lucide.createIcons();

    }

}



// 14. REPORT FILTER EVENTS


[

    reportPeriod,

    reportDepartment,

    reportPriority

].forEach(filter => {

    filter.addEventListener("change", refreshReports);

});


// 15. RESET REPORT FILTERS


document.getElementById("resetReportFilters")

    .addEventListener("click", function() {

        reportPeriod.value = "30";

        reportDepartment.value = "All";

        reportPriority.value = "All";


        refreshReports();

    });



// 16. EXPORT FILTERED REPORT TO CSV


function escapeCSVValue(value) {

    let safeValue = String(value ?? "");


    // Reduce spreadsheet formula-injection risk.

    if (/^[\s]*[=+\-@]/.test(safeValue)) {

        safeValue = "'" + safeValue;

    }


    return '"' + safeValue.replace(/"/g, '""') + '"';

}


function exportTicketReport() {

    const tickets = getFilteredReportTickets();


    if (tickets.length === 0) {

        alert("There are no matching tickets to export.");

        return;

    }


    const headings = [

        "Ticket ID",

        "Employee Name",

        "Employee Email",

        "Department",

        "Issue Title",

        "Issue Category",

        "Priority",

        "Status",

        "Assigned Technician",

        "Location",

        "Date Submitted",

        "Last Updated",

        "Date Resolved",

        "Asset Number"

    ];


    const rows = tickets.map(ticket => [

        ticket.id,

        ticket.employeeName,

        ticket.employeeEmail,

        ticket.department,

        ticket.issueTitle,

        ticket.issueCategory,

        ticket.priority,

        ticket.status,

        ticket.assignedTo,

        ticket.location,

        ticket.createdAt,

        ticket.updatedAt,

        ticket.resolvedAt,

        ticket.assetNumber

    ]);


    const csvContent = [

        headings,

        ...rows

    ]

    .map(row => row.map(escapeCSVValue).join(","))

    .join("\r\n");


    // UTF-8 BOM improves compatibility with spreadsheet applications.

    const blob = new Blob(

        ["\uFEFF" + csvContent],

        { type: "text/csv;charset=utf-8;" }

    );


    const url = URL.createObjectURL(blob);


    const link = document.createElement("a");

    link.href = url;

    link.download =
        "Sam-Enterprise-Ticket-Report-" +
        new Date().toISOString().slice(0, 10) +
        ".csv";


    document.body.appendChild(link);

    link.click();

    link.remove();


    URL.revokeObjectURL(url);

}


document.getElementById("exportReports")

    .addEventListener("click", exportTicketReport);



// 17. DISPLAY CURRENT DATE


document.getElementById("reportsDate").textContent =

    new Date().toLocaleDateString("en-ZA", {

        weekday: "long",

        year: "numeric",

        month: "long",

        day: "numeric"

    });



// 18. INITIALISE REPORTING CENTRE


refreshReports();


document.addEventListener("visibilitychange", function() {

    if (!document.hidden) {

        refreshReports();

    }

});
