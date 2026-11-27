
const STORAGE_KEY = "samEnterpriseTickets";
const SETTINGS_KEY = "samEnterpriseSettings";


// Load application settings with safe defaults.

function getTicketAppSettings() {

    const defaults = {
        ticket: {
            prefix: "SAM",
            nextNumber: 1001,
            defaultPriority: "Medium",
            maxAttachments: 5,
            maxAttachmentSize: 5
        },

        departments: [
            "Information Technology",
            "Finance",
            "Human Resources",
            "Operations",
            "Administration",
            "Marketing",
            "Sales"
        ],

        system: {
            allowTicketSubmission: true
        }
    };

    try {

        const saved = JSON.parse(
            localStorage.getItem(SETTINGS_KEY) || "null"
        );

        if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
            return defaults;
        }

        return {
            ...defaults,
            ...saved,

            ticket: {
                ...defaults.ticket,
                ...(saved.ticket || {})
            },

            system: {
                ...defaults.system,
                ...(saved.system || {})
            },

            departments: Array.isArray(saved.departments)
                ? saved.departments
                : defaults.departments
        };

    } catch (error) {

        console.error("Unable to load ticket settings:", error);

        return defaults;

    }

}


// Generate sequential ticket reference numbers.

function generateTicketReference() {

    const settings = getTicketAppSettings();

    const prefix = /^[A-Z0-9]{1,8}$/i.test(settings.ticket.prefix)
        ? settings.ticket.prefix.toUpperCase()
        : "SAM";

    const nextNumber = Number(settings.ticket.nextNumber);

    if (!Number.isSafeInteger(nextNumber) || nextNumber < 1) {
        throw new Error("Invalid ticket reference configuration.");
    }

    const reference =
        `${prefix}-${String(nextNumber).padStart(6, "0")}`;

    settings.ticket.nextNumber = nextNumber + 1;

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(settings)
        );

        return reference;

    } catch (error) {

        console.error("Unable to update ticket numbering:", error);

        throw new Error("Could not generate a ticket reference.");

    }

}


// Populate the employee form using administrator settings.

function populateTicketFormSettings() {

    const settings = getTicketAppSettings();

    const prioritySelect = document.getElementById("priority");

    const departmentSelect = document.getElementById("department");


    if (prioritySelect) {

        prioritySelect.value = settings.ticket.defaultPriority;

    }


    if (departmentSelect) {

        const previousValue = departmentSelect.value;

        const placeholder = departmentSelect.options[0]?.cloneNode(true);

        departmentSelect.replaceChildren();

        if (placeholder) {

            departmentSelect.appendChild(placeholder);

        }

        settings.departments.forEach(department => {

            const option = document.createElement("option");

            option.value = department;

            option.textContent = department;

            departmentSelect.appendChild(option);

        });

        if (settings.departments.includes(previousValue)) {

            departmentSelect.value = previousValue;

        }

    }

}


// Retrieve submitted tickets.

function getStoredTickets() {

    try {

        const storedData = localStorage.getItem(STORAGE_KEY);

        if (!storedData) {
            return [];
        }

        const tickets = JSON.parse(storedData);

        return Array.isArray(tickets) ? tickets : [];

    } catch (error) {

        console.error("Unable to read saved tickets:", error);

        return [];

    }

}


// Save ticket records.

function saveStoredTickets(tickets) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tickets)
        );

        return true;

    } catch (error) {

        console.error("Unable to save tickets:", error);

        return false;

    }

}


// Select file upload elements.

const attachments = document.getElementById("attachments");

const fileList = document.getElementById("fileList");


// Validate supporting documents.

if (attachments && fileList) {

    attachments.addEventListener("change", function () {

        const selectedFiles = Array.from(this.files);

        const settings = getTicketAppSettings();

        const maximumFiles = Number(
            settings.ticket.maxAttachments
        ) || 5;

        const maximumSize =
            (Number(settings.ticket.maxAttachmentSize) || 5) *
            1024 * 1024;

        const allowedExtensions = [
            "jpg",
            "jpeg",
            "png",
            "pdf",
            "txt"
        ];

        fileList.replaceChildren();


        if (selectedFiles.length > maximumFiles) {

            alert(
                `You can upload a maximum of ${maximumFiles} files.`
            );

            this.value = "";

            return;

        }


        for (const file of selectedFiles) {

            const extension = file.name
                .split(".")
                .pop()
                .toLowerCase();


            if (file.size > maximumSize) {

                alert(
                    `${file.name} exceeds the ` +
                    `${settings.ticket.maxAttachmentSize} MB file limit.`
                );

                this.value = "";

                fileList.replaceChildren();

                return;

            }


            if (!allowedExtensions.includes(extension)) {

                alert(
                    `${file.name} is not an accepted file type.`
                );

                this.value = "";

                fileList.replaceChildren();

                return;

            }

        }


        selectedFiles.forEach(file => {

            const fileItem = document.createElement("div");

            fileItem.className = "file-item";


            const fileName = document.createElement("span");

            fileName.textContent = file.name;


            const fileSize = document.createElement("span");

            fileSize.textContent =
                (file.size / 1024).toFixed(1) + " KB";


            fileItem.appendChild(fileName);

            fileItem.appendChild(fileSize);

            fileList.appendChild(fileItem);

        });

    });

}


// Employee ticket submission elements.

const ticketForm = document.getElementById("ticketForm");

const successModal = document.getElementById("successModal");

const generatedTicketId =
    document.getElementById("generatedTicketId");

const closeSuccessModal =
    document.getElementById("closeModal");


// Handle new ticket submission.

if (ticketForm) {

    populateTicketFormSettings();


    ticketForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const settings = getTicketAppSettings();


        if (!settings.system.allowTicketSubmission) {

            alert(
                "New ticket submissions are currently disabled. " +
                "Please contact your IT department."
            );

            return;

        }


        if (!ticketForm.reportValidity()) {

            return;

        }


        const formData = new FormData(ticketForm);


        let referenceNumber;

        try {

            referenceNumber = generateTicketReference();

        } catch (error) {

            alert(error.message);

            return;

        }


        const now = new Date().toISOString();


        const newTicket = {

            id: referenceNumber,

            employeeName: formData.get("employeeName"),

            employeeEmail: formData.get("employeeEmail"),

            department: formData.get("department"),

            contactNumber: formData.get("contactNumber"),

            issueTitle: formData.get("issueTitle"),

            issueCategory: formData.get("issueCategory"),

            priority: formData.get("priority"),

            location: formData.get("location"),

            assetNumber: formData.get("assetNumber"),

            description: formData.get("description"),

            attachments: Array.from(attachments?.files || [])
                .map(file => file.name),

            status: "Open",

            assignedTo: "Unassigned",

            updates: [],

            createdAt: now,

            updatedAt: now

        };


        const existingTickets = getStoredTickets();

        existingTickets.unshift(newTicket);


        const saved = saveStoredTickets(existingTickets);


        if (!saved) {

            alert(
                "The ticket could not be saved. " +
                "Please check your browser storage settings."
            );

            return;

        }


        if (generatedTicketId) {

            generatedTicketId.textContent = referenceNumber;

        }


        if (successModal) {

            successModal.classList.add("show");

        }

    });

}


// Close the ticket submission confirmation.

function closeSubmissionModal() {

    if (successModal) {

        successModal.classList.remove("show");

    }

    if (ticketForm) {

        ticketForm.reset();

    }

    if (fileList) {

        fileList.replaceChildren();

    }

    if (attachments) {

        attachments.value = "";

    }

    populateTicketFormSettings();

}


if (closeSuccessModal) {

    closeSuccessModal.addEventListener(
        "click",
        closeSubmissionModal
    );

}


if (successModal) {

    successModal.addEventListener("click", function (event) {

        if (event.target === successModal) {

            closeSubmissionModal();

        }

    });

}


// My Tickets page elements.

const myTicketsTable =
    document.getElementById("myTicketsTable");

const totalTickets =
    document.getElementById("totalTickets");

const openTickets =
    document.getElementById("openTickets");

const progressTickets =
    document.getElementById("progressTickets");

const resolvedTickets =
    document.getElementById("resolvedTickets");

const ticketSearch =
    document.getElementById("ticketSearch");

const emptyState =
    document.getElementById("emptyState");

const emptyMessage =
    document.getElementById("emptyMessage");

const ticketTableWrapper =
    document.getElementById("ticketTableWrapper");

const recordCount =
    document.getElementById("recordCount");


// Current ticket status filter.

let currentFilter = "All";


// Format ticket dates.

function formatTicketDate(dateValue) {

    if (!dateValue) {

        return "Not available";

    }

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


// Determine ticket status styling.

function getStatusClass(status) {

    switch (status) {

        case "Open":

            return "open";

        case "In Progress":

            return "progress";

        case "Pending":

            return "pending";

        case "Resolved":

            return "resolved";

        default:

            return "open";

    }

}


// Determine ticket priority styling.

function getPriorityClass(priority) {

    const value = String(priority || "").toLowerCase();

    const allowedPriorities = [
        "low",
        "medium",
        "high",
        "critical"
    ];

    return allowedPriorities.includes(value)
        ? value
        : "low";

}


// Create a table cell safely.

function createCell(value, className = "") {

    const cell = document.createElement("td");

    if (className) {

        cell.className = className;

    }

    cell.textContent = value || "—";

    return cell;

}


// Display employee tickets.

function renderTickets() {

    if (!myTicketsTable) {

        return;

    }


    const allTickets = getStoredTickets();

    const searchValue = ticketSearch
        ? ticketSearch.value.toLowerCase().trim()
        : "";


    const openCount = allTickets.filter(ticket =>
        ticket.status === "Open"
    ).length;


    const progressCount = allTickets.filter(ticket =>
        ticket.status === "In Progress"
    ).length;


    const pendingCount = allTickets.filter(ticket =>
        ticket.status === "Pending"
    ).length;


    const resolvedCount = allTickets.filter(ticket =>
        ticket.status === "Resolved"
    ).length;


    totalTickets.textContent = allTickets.length;

    openTickets.textContent = openCount;

    progressTickets.textContent = progressCount;

    resolvedTickets.textContent = resolvedCount;


    document.getElementById("allFilterCount").textContent =
        allTickets.length;

    document.getElementById("openFilterCount").textContent =
        openCount;

    document.getElementById("progressFilterCount").textContent =
        progressCount;

    document.getElementById("pendingFilterCount").textContent =
        pendingCount;

    document.getElementById("resolvedFilterCount").textContent =
        resolvedCount;


    const filteredTickets = allTickets.filter(ticket => {

        const matchesStatus =
            currentFilter === "All" ||
            ticket.status === currentFilter;


        const searchableText = [

            ticket.id,

            ticket.issueTitle,

            ticket.issueCategory,

            ticket.department,

            ticket.status

        ].join(" ").toLowerCase();


        const matchesSearch =
            searchableText.includes(searchValue);


        return matchesStatus && matchesSearch;

    });


    myTicketsTable.replaceChildren();


    recordCount.textContent =
        filteredTickets.length +
        (filteredTickets.length === 1 ? " record" : " records");


    if (filteredTickets.length === 0) {

        ticketTableWrapper.style.display = "none";

        emptyState.classList.add("show");


        if (allTickets.length === 0) {

            emptyMessage.textContent =
                "You haven't submitted any support requests yet.";

        } else {

            emptyMessage.textContent =
                "No tickets match your selected filter or search.";

        }

        return;

    }


    ticketTableWrapper.style.display = "block";

    emptyState.classList.remove("show");


    filteredTickets.forEach(ticket => {

        const row = document.createElement("tr");


        // Ticket reference.

        const idCell = createCell(
            ticket.id,
            "ticket-id"
        );

        row.appendChild(idCell);


        // Issue details.

        const issueCell = document.createElement("td");

        issueCell.className = "ticket-issue";


        const issueTitle = document.createElement("strong");

        issueTitle.textContent = ticket.issueTitle || "Unknown issue";


        const issueCategory = document.createElement("small");

        issueCategory.textContent =
            ticket.issueCategory || "Unspecified category";


        issueCell.appendChild(issueTitle);

        issueCell.appendChild(issueCategory);

        row.appendChild(issueCell);


        // Submission date.

        row.appendChild(
            createCell(
                formatTicketDate(ticket.createdAt),
                "ticket-date"
            )
        );


        // Priority.

        const priorityCell = document.createElement("td");

        const priorityBadge = document.createElement("span");

        priorityBadge.className =
            "priority " + getPriorityClass(ticket.priority);

        priorityBadge.textContent = ticket.priority || "Low";

        priorityCell.appendChild(priorityBadge);

        row.appendChild(priorityCell);


        // Status.

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");

        statusBadge.className =
            "ticket-status " + getStatusClass(ticket.status);

        statusBadge.textContent = ticket.status || "Open";

        statusCell.appendChild(statusBadge);

        row.appendChild(statusCell);


        // Assigned technician.

        row.appendChild(
            createCell(ticket.assignedTo || "Unassigned")
        );


        // View ticket details.

        const actionCell = document.createElement("td");

        const viewButton = document.createElement("button");

        viewButton.type = "button";

        viewButton.className = "view-ticket-button";


        const viewIcon = document.createElement("i");

        viewIcon.setAttribute("data-lucide", "eye");


        viewButton.appendChild(viewIcon);

        viewButton.appendChild(
            document.createTextNode(" View")
        );


        viewButton.addEventListener("click", function () {

            openTicketDetails(ticket);

        });


        actionCell.appendChild(viewButton);

        row.appendChild(actionCell);


        myTicketsTable.appendChild(row);

    });


    if (window.lucide) {

        lucide.createIcons();

    }

}


// Apply status filters.

const filterButtons = document.querySelectorAll("[data-filter]");


filterButtons.forEach(button => {

    button.addEventListener("click", function () {

        currentFilter = this.dataset.filter;


        filterButtons.forEach(item => {

            item.classList.remove("active");

            item.setAttribute("aria-pressed", "false");

        });


        this.classList.add("active");

        this.setAttribute("aria-pressed", "true");


        renderTickets();

    });

});


// Ticket search.

if (ticketSearch) {

    ticketSearch.addEventListener(
        "input",
        renderTickets
    );

}


// Clear search.

const clearSearch = document.getElementById("clearSearch");


if (clearSearch) {

    clearSearch.addEventListener("click", function () {

        if (ticketSearch) {

            ticketSearch.value = "";

        }

        renderTickets();

    });

}


// Ticket detail modal elements.

const ticketDetailsModal =
    document.getElementById("ticketDetailsModal");

const ticketDetailsContent =
    document.getElementById("ticketDetailsContent");

const detailTicketId =
    document.getElementById("detailTicketId");


// Create a ticket detail field.

function createDetailField(label, value) {

    const field = document.createElement("div");

    field.className = "detail-field";


    const fieldLabel = document.createElement("span");

    fieldLabel.textContent = label;


    const fieldValue = document.createElement("strong");

    fieldValue.textContent = value || "Not provided";


    field.appendChild(fieldLabel);

    field.appendChild(fieldValue);


    return field;

}


// Display ticket activity for the employee.

function renderEmployeeTicketUpdates(ticket) {

    const updates = Array.isArray(ticket.updates)
        ? ticket.updates
        : [];


    const section = document.createElement("div");

    section.className = "detail-description";


    const heading = document.createElement("h4");

    heading.textContent = "Technician Updates";


    section.appendChild(heading);


    if (updates.length === 0) {

        const empty = document.createElement("p");

        empty.textContent =
            "No technician updates have been recorded yet.";

        section.appendChild(empty);

        return section;

    }


    updates.slice().reverse().forEach(update => {

        const updateEntry = document.createElement("div");

        updateEntry.className = "history-entry";


        const author = document.createElement("strong");

        author.textContent = update.by || "IT Technician";


        const message = document.createElement("p");

        message.textContent = update.message || "Ticket updated.";


        const date = document.createElement("small");

        date.textContent = formatTicketDate(update.createdAt);


        updateEntry.appendChild(author);

        updateEntry.appendChild(message);

        updateEntry.appendChild(date);


        section.appendChild(updateEntry);

    });


    return section;

}


// Display full ticket details.

function openTicketDetails(ticket) {

    if (!ticketDetailsModal || !ticketDetailsContent) {

        return;

    }


    detailTicketId.textContent = ticket.id;

    ticketDetailsContent.replaceChildren();


    // Ticket status and priority.

    const statusRow = document.createElement("div");

    statusRow.className = "detail-status-row";


    const statusBadge = document.createElement("span");

    statusBadge.className =
        "ticket-status " + getStatusClass(ticket.status);

    statusBadge.textContent = ticket.status;


    const priorityBadge = document.createElement("span");

    priorityBadge.className =
        "priority " + getPriorityClass(ticket.priority);

    priorityBadge.textContent =
        (ticket.priority || "Low") + " Priority";


    statusRow.appendChild(statusBadge);

    statusRow.appendChild(priorityBadge);

    ticketDetailsContent.appendChild(statusRow);


    // Employee and incident information.

    const detailGrid = document.createElement("div");

    detailGrid.className = "detail-grid";


    const fields = [

        ["Issue Title", ticket.issueTitle],

        ["Issue Category", ticket.issueCategory],

        ["Employee Name", ticket.employeeName],

        ["Company Email", ticket.employeeEmail],

        ["Department", ticket.department],

        ["Contact Number", ticket.contactNumber],

        ["Date Submitted", formatTicketDate(ticket.createdAt)],

        ["Assigned Technician", ticket.assignedTo],

        ["Work Location", ticket.location],

        ["Asset Number", ticket.assetNumber]

    ];


    fields.forEach(([label, value]) => {

        detailGrid.appendChild(
            createDetailField(label, value)
        );

    });


    ticketDetailsContent.appendChild(detailGrid);


    // Problem description.

    const descriptionSection = document.createElement("div");

    descriptionSection.className = "detail-description";


    const descriptionHeading = document.createElement("h4");

    descriptionHeading.textContent = "Problem Description";


    const descriptionText = document.createElement("p");

    descriptionText.textContent =
        ticket.description || "No description provided.";


    descriptionSection.appendChild(descriptionHeading);

    descriptionSection.appendChild(descriptionText);

    ticketDetailsContent.appendChild(descriptionSection);


    // Supporting documents.

    const attachmentSection = document.createElement("div");

    attachmentSection.className = "detail-attachments";


    const attachmentHeading = document.createElement("h4");

    attachmentHeading.textContent = "Supporting Documents";

    attachmentSection.appendChild(attachmentHeading);


    if (ticket.attachments && ticket.attachments.length > 0) {

        ticket.attachments.forEach(file => {

            const attachmentName = document.createElement("p");

            attachmentName.textContent = "Attachment: " + file;

            attachmentSection.appendChild(attachmentName);

        });

    } else {

        const noAttachments = document.createElement("p");

        noAttachments.textContent = "No attachments provided.";

        attachmentSection.appendChild(noAttachments);

    }


    ticketDetailsContent.appendChild(attachmentSection);


    // Technician responses and progress notes.

    ticketDetailsContent.appendChild(
        renderEmployeeTicketUpdates(ticket)
    );


    ticketDetailsModal.classList.add("show");


    if (window.lucide) {

        lucide.createIcons();

    }

}


// Close ticket details.

const closeDetails = document.getElementById("closeDetails");


function closeTicketDetails() {

    if (ticketDetailsModal) {

        ticketDetailsModal.classList.remove("show");

    }

}


if (closeDetails) {

    closeDetails.addEventListener(
        "click",
        closeTicketDetails
    );

}


if (ticketDetailsModal) {

    ticketDetailsModal.addEventListener("click", function (event) {

        if (event.target === ticketDetailsModal) {

            closeTicketDetails();

        }

    });

}


// Close modals using Escape.

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeTicketDetails();

    }

});


// Display current date.

const ticketsDate = document.getElementById("ticketsDate");


if (ticketsDate) {

    ticketsDate.textContent = new Date().toLocaleDateString(
        "en-ZA",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


// Initialise My Tickets when its page is open.

renderTickets();
