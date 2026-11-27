
"use strict";

const API_BASE_URL = "http://127.0.0.1:5000/api";

const COMPANY_TIME_ZONE = "Africa/Johannesburg";

const VALID_PRIORITIES = [
    "Low",
    "Medium",
    "High",
    "Critical"
];

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
    "jpg",
    "jpeg",
    "png",
    "pdf",
    "txt"
];

let currentFilter = "All";
let currentUser = null;
let allTickets = [];


// Make authenticated API requests.

async function ticketApiRequest(endpoint, options = {}) {
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(options.body && !isFormData ? {
            "Content-Type": "application/json"
        } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers
    });

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error("The server returned an invalid response.");
    }

    if (response.status === 401) {
        alert("Your session has expired. Please log in again.");

        window.location.href = "login.html";

        throw new Error("Authentication required.");
    }

    if (!response.ok || data.success === false) {
        throw new Error(
            data.message || "The requested operation failed."
        );
    }

    return data;
}


// Load the authenticated user's account details.

async function loadTicketCurrentUser() {
    const data = await ticketApiRequest("/auth/me");

    currentUser = data.user || data;

    const firstName = currentUser.first_name || "";
    const lastName = currentUser.last_name || "";

    const fullName = [firstName, lastName]
        .filter(Boolean)
        .join(" ");

    const roleLabels = {
        owner: "Owner",
        administrator: "Administrator",
        it_manager: "IT Manager",
        technician: "Technician",
        employee: "Employee",
        auditor: "Auditor"
    };

    const roleLabel =
        roleLabels[currentUser.role] || currentUser.role || "User";

    const initials = [firstName, lastName]
        .filter(Boolean)
        .map(name => name.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2) || "U";

    const profileElements = [
        ["sidebarUserName", fullName],
        ["sidebarUserRole", roleLabel],
        ["topbarUserName", fullName],
        ["topbarUserRole", roleLabel],
        ["sidebarUserAvatar", initials],
        ["topbarUserAvatar", initials]
    ];

    profileElements.forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    });

    const employeeName = document.getElementById("employeeName");
    const employeeEmail = document.getElementById("employeeEmail");
    const department = document.getElementById("department");

    if (employeeName) {
        employeeName.value = fullName;
    }

    if (employeeEmail) {
        employeeEmail.value = currentUser.email || "";
    }

    if (department) {
        department.value = currentUser.department || "";
    }

    return currentUser;
}


// Format dates using South African company time.

function formatTicketDate(dateValue, includeTime = false) {
    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    const options = {
        timeZone: COMPANY_TIME_ZONE,
        day: "2-digit",
        month: "short",
        year: "numeric"
    };

    if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
        options.hour12 = false;
    }

    return new Intl.DateTimeFormat("en-ZA", options).format(date);
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

    return VALID_PRIORITIES.some(
        item => item.toLowerCase() === value
    ) ? value : "medium";
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


// Convert a database ticket into the format used by the interface.

function normalizeTicket(ticket) {
    const creatorName = [
        ticket.creator_first_name,
        ticket.creator_last_name
    ].filter(Boolean).join(" ");

    const technicianName = [
        ticket.assignee_first_name,
        ticket.assignee_last_name
    ].filter(Boolean).join(" ");

    return {
        id: ticket.id,
        reference: ticket.ticket_reference,

        employeeName: creatorName || "Not available",
        employeeEmail: ticket.creator_email || "",

        department: ticket.department || "",
        contactNumber: ticket.contact_number || "",

        issueTitle: ticket.issue_title || "",
        issueCategory: ticket.issue_category || "",

        priority: ticket.priority || "Medium",

        location: ticket.location || "",
        assetNumber: ticket.asset_number || "",

        description: ticket.description || "",

        status: ticket.status || "Open",

        assignedTo: technicianName || "Unassigned",
        assignedUserId: ticket.assigned_to || null,

        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at
    };
}


// Select file upload elements.

const attachments = document.getElementById("attachments");
const fileList = document.getElementById("fileList");


// Validate supporting documents.

if (attachments && fileList) {
    attachments.addEventListener("change", function () {
        const selectedFiles = Array.from(this.files);

        fileList.replaceChildren();

        if (selectedFiles.length > MAX_ATTACHMENTS) {
            alert(
                `You can upload a maximum of ${MAX_ATTACHMENTS} files.`
            );

            this.value = "";

            return;
        }

        for (const file of selectedFiles) {
            const extension = file.name
                .split(".")
                .pop()
                .toLowerCase();

            if (file.size > MAX_ATTACHMENT_SIZE) {
                alert(
                    `${file.name} exceeds the 5 MB file limit.`
                );

                this.value = "";
                fileList.replaceChildren();

                return;
            }

            if (!ALLOWED_EXTENSIONS.includes(extension)) {
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


// Ticket submission elements.

const ticketForm = document.getElementById("ticketForm");

const successModal = document.getElementById("successModal");

const generatedTicketId =
    document.getElementById("generatedTicketId");

const closeSuccessModal =
    document.getElementById("closeModal");

const submitTicketButton =
    document.getElementById("submitTicketButton");


// Handle new ticket submission.

if (ticketForm) {
    ticketForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!ticketForm.reportValidity()) {
            return;
        }

        if (!currentUser) {
            alert("Unable to verify your account. Please log in again.");
            return;
        }

        if (currentUser.role === "auditor") {
            alert("Auditors have read-only access and cannot submit tickets.");
            return;
        }

        const selectedFiles = attachments
            ? Array.from(attachments.files)
            : [];

        if (selectedFiles.length > MAX_ATTACHMENTS) {
            alert(`You can upload a maximum of ${MAX_ATTACHMENTS} files.`);
            return;
        }

        for (const file of selectedFiles) {
            const extension = file.name
                .split(".")
                .pop()
                .toLowerCase();

            if (
                file.size > MAX_ATTACHMENT_SIZE ||
                !ALLOWED_EXTENSIONS.includes(extension)
            ) {
                alert(`Please check the selected file: ${file.name}`);
                return;
            }
        }

        const formData = new FormData(ticketForm);

        const ticketData = {
            contactNumber: formData.get("contactNumber"),
            issueTitle: formData.get("issueTitle"),
            issueCategory: formData.get("issueCategory"),
            priority: formData.get("priority"),
            location: formData.get("location"),
            assetNumber: formData.get("assetNumber"),
            description: formData.get("description")
        };

        try {
            if (submitTicketButton) {
                submitTicketButton.disabled = true;
                submitTicketButton.textContent = "Submitting...";
            }

            const result = await ticketApiRequest("/tickets", {
                method: "POST",
                body: JSON.stringify(ticketData)
            });

            const createdTicket = result.ticket;

            if (!createdTicket || !createdTicket.id) {
                throw new Error(
                    "The ticket was submitted, but the server did not return its ID."
                );
            }

            const ticketReference =
                createdTicket.ticket_reference;

            let uploadWarning = "";

            if (selectedFiles.length > 0) {
                try {
                    if (submitTicketButton) {
                        submitTicketButton.textContent = "Uploading attachments...";
                    }

                    const attachmentForm = new FormData();

                    selectedFiles.forEach(file => {
                        attachmentForm.append(
                            "attachments",
                            file,
                            file.name
                        );
                    });

                    await ticketApiRequest(
                        `/tickets/${encodeURIComponent(createdTicket.id)}/attachments`,
                        {
                            method: "POST",
                            body: attachmentForm
                        }
                    );

                } catch (uploadError) {
                    console.error(
                        "Ticket attachment upload error:",
                        uploadError
                    );

                    uploadWarning =
                        `Ticket ${ticketReference} was created successfully, ` +
                        `but its attachments could not be uploaded: ` +
                        uploadError.message;
                }
            }

            if (generatedTicketId) {
                generatedTicketId.textContent = ticketReference;
            }

            if (successModal) {
                successModal.classList.add("show");
            } else {
                alert(
                    `Ticket ${ticketReference} was submitted successfully.`
                );
            }

            if (uploadWarning) {
                alert(uploadWarning);
            }

        } catch (error) {
            console.error("Ticket submission error:", error);

            alert(error.message);

        } finally {
            if (submitTicketButton) {
                submitTicketButton.disabled = false;

                submitTicketButton.textContent =
                    "Submit Support Ticket";
            }
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

    if (currentUser) {
        const employeeName = document.getElementById("employeeName");
        const employeeEmail = document.getElementById("employeeEmail");
        const department = document.getElementById("department");

        if (employeeName) {
            employeeName.value = [
                currentUser.first_name,
                currentUser.last_name
            ].filter(Boolean).join(" ");
        }

        if (employeeEmail) {
            employeeEmail.value = currentUser.email || "";
        }

        if (department) {
            department.value = currentUser.department || "";
        }
    }

    const prioritySelect = document.getElementById("priority");

    if (prioritySelect) {
        prioritySelect.value = "Medium";
    }
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


// Update ticket statistics.

function updateTicketStatistics(tickets) {
    const openCount = tickets.filter(
        ticket => ticket.status === "Open"
    ).length;

    const progressCount = tickets.filter(
        ticket => ticket.status === "In Progress"
    ).length;

    const pendingCount = tickets.filter(
        ticket => ticket.status === "Pending"
    ).length;

    const resolvedCount = tickets.filter(
        ticket => ticket.status === "Resolved"
    ).length;

    if (totalTickets) {
        totalTickets.textContent = tickets.length;
    }

    if (openTickets) {
        openTickets.textContent = openCount;
    }

    if (progressTickets) {
        progressTickets.textContent = progressCount;
    }

    if (resolvedTickets) {
        resolvedTickets.textContent = resolvedCount;
    }

    const filterCounts = {
        allFilterCount: tickets.length,
        openFilterCount: openCount,
        progressFilterCount: progressCount,
        pendingFilterCount: pendingCount,
        resolvedFilterCount: resolvedCount
    };

    Object.entries(filterCounts).forEach(([id, count]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = count;
        }
    });
}


// Render employee or authorised support tickets.

function renderTickets() {
    if (!myTicketsTable) {
        return;
    }

    const searchValue = ticketSearch
        ? ticketSearch.value.toLowerCase().trim()
        : "";

    updateTicketStatistics(allTickets);

    const filteredTickets = allTickets.filter(ticket => {
        const matchesStatus =
            currentFilter === "All" ||
            ticket.status === currentFilter;

        const searchableText = [
            ticket.reference,
            ticket.issueTitle,
            ticket.issueCategory,
            ticket.department,
            ticket.status,
            ticket.employeeName
        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(searchValue);

        return matchesStatus && matchesSearch;
    });

    myTicketsTable.replaceChildren();

    if (recordCount) {
        recordCount.textContent =
            `${filteredTickets.length} ${
                filteredTickets.length === 1 ? "record" : "records"
            }`;
    }

    if (filteredTickets.length === 0) {
        if (ticketTableWrapper) {
            ticketTableWrapper.style.display = "none";
        }

        if (emptyState) {
            emptyState.classList.add("show");
        }

        if (emptyMessage) {
            emptyMessage.textContent = allTickets.length === 0
                ? "You haven't submitted any support requests yet."
                : "No tickets match your selected filter or search.";
        }

        return;
    }

    if (ticketTableWrapper) {
        ticketTableWrapper.style.display = "block";
    }

    if (emptyState) {
        emptyState.classList.remove("show");
    }

    filteredTickets.forEach(ticket => {
        const row = document.createElement("tr");

        row.appendChild(
            createCell(ticket.reference, "ticket-id")
        );

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

        row.appendChild(
            createCell(formatTicketDate(ticket.createdAt), "ticket-date")
        );

        const priorityCell = document.createElement("td");

        const priorityBadge = document.createElement("span");
        priorityBadge.className =
            "priority " + getPriorityClass(ticket.priority);

        priorityBadge.textContent = ticket.priority;

        priorityCell.appendChild(priorityBadge);
        row.appendChild(priorityCell);

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");
        statusBadge.className =
            "ticket-status " + getStatusClass(ticket.status);

        statusBadge.textContent = ticket.status;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        row.appendChild(
            createCell(ticket.assignedTo)
        );

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
            openTicketDetails(ticket.id);
        });

        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        myTicketsTable.appendChild(row);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}


// Load tickets from PostgreSQL.

async function loadTickets() {
    if (!myTicketsTable) {
        return;
    }

    try {
        myTicketsTable.innerHTML = `
            <tr>
                <td colspan="7">Loading support tickets...</td>
            </tr>
        `;

        const result = await ticketApiRequest("/tickets");

        allTickets = (result.tickets || []).map(normalizeTicket);

        renderTickets();

    } catch (error) {
        console.error("Ticket retrieval error:", error);

        myTicketsTable.replaceChildren();

        if (emptyState) {
            emptyState.classList.add("show");
        }

        if (emptyMessage) {
            emptyMessage.textContent = error.message;
        }

        if (ticketTableWrapper) {
            ticketTableWrapper.style.display = "none";
        }
    }
}


// Apply ticket status filters.

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
    ticketSearch.addEventListener("input", renderTickets);
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
    fieldValue.textContent =
        value === null || value === undefined || value === ""
            ? "Not provided"
            : String(value);

    field.appendChild(fieldLabel);
    field.appendChild(fieldValue);

    return field;
}


// Display ticket updates returned by PostgreSQL.

function renderEmployeeTicketUpdates(updates) {
    const section = document.createElement("div");
    section.className = "detail-description";

    const heading = document.createElement("h4");
    heading.textContent = "Ticket Activity";

    section.appendChild(heading);

    if (!Array.isArray(updates) || updates.length === 0) {
        const empty = document.createElement("p");

        empty.textContent =
            "No ticket updates have been recorded yet.";

        section.appendChild(empty);

        return section;
    }

    updates.forEach(update => {
        const updateEntry = document.createElement("div");
        updateEntry.className = "history-entry";

        const author = document.createElement("strong");

        author.textContent = [
            update.first_name,
            update.last_name
        ].filter(Boolean).join(" ") || "IT Support";

        const status = document.createElement("p");

        if (update.previous_status && update.new_status) {
            status.textContent =
                `${update.previous_status} → ${update.new_status}`;
        }

        const message = document.createElement("p");
        message.textContent = update.message || "Ticket updated.";

        const date = document.createElement("small");

        date.textContent = formatTicketDate(
            update.created_at,
            true
        );

        updateEntry.appendChild(author);

        if (status.textContent) {
            updateEntry.appendChild(status);
        }

        updateEntry.appendChild(message);
        updateEntry.appendChild(date);

        section.appendChild(updateEntry);
    });

    return section;
}


// Download an attachment through the authenticated API.

async function downloadTicketAttachment(ticketId, attachment) {
    const downloadUrl =
        `${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}` +
        `/attachments/${encodeURIComponent(attachment.id)}`;

    try {
        const response = await fetch(downloadUrl, {
            method: "GET",
            credentials: "include"
        });

        if (response.status === 401) {
            alert("Your session has expired. Please log in again.");

            window.location.href = "login.html";

            return;
        }

        if (!response.ok) {
            let message = "Unable to download this attachment.";

            try {
                const errorData = await response.json();

                message = errorData.message || message;

            } catch (error) {
                // Keep the default download error.
            }

            throw new Error(message);
        }

        const fileBlob = await response.blob();

        const objectUrl = URL.createObjectURL(fileBlob);

        const downloadLink = document.createElement("a");

        downloadLink.href = objectUrl;
        downloadLink.download =
            attachment.original_filename || "attachment";

        document.body.appendChild(downloadLink);

        downloadLink.click();

        downloadLink.remove();

        URL.revokeObjectURL(objectUrl);

    } catch (error) {
        console.error("Attachment download error:", error);

        alert(error.message);
    }
}


// Display full ticket details.

async function openTicketDetails(ticketId) {
    if (!ticketDetailsModal || !ticketDetailsContent) {
        return;
    }

    ticketDetailsContent.replaceChildren();

    if (detailTicketId) {
        detailTicketId.textContent = "Loading...";
    }

    ticketDetailsModal.classList.add("show");

    try {
        const result = await ticketApiRequest(
            `/tickets/${encodeURIComponent(ticketId)}`
        );

        const ticket = normalizeTicket(result.ticket);

        if (detailTicketId) {
            detailTicketId.textContent = ticket.reference;
        }

        // Status and priority.

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
            ticket.priority + " Priority";

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
            ["Date Submitted", formatTicketDate(ticket.createdAt, true)],
            ["Last Updated", formatTicketDate(ticket.updatedAt, true)],
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


        // Technician assignment controls.

        if (
            currentUser &&
            ["owner", "administrator", "it_manager"].includes(currentUser.role)
        ) {
            const assignmentSection = document.createElement("div");
            assignmentSection.className = "detail-description";

            const heading = document.createElement("h4");
            heading.textContent = "Technician Assignment";

            const select = document.createElement("select");
            select.id = "ticketTechnicianSelect";
            select.style.padding = "10px";
            select.style.marginRight = "10px";

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Select a technician";
            select.appendChild(placeholder);

            const assignButton = document.createElement("button");
            assignButton.type = "button";
            assignButton.textContent = "Assign Technician";

            const message = document.createElement("p");

            assignmentSection.append(
                heading,
                select,
                assignButton,
                message
            );

            ticketDetailsContent.appendChild(assignmentSection);

            try {
                const technicianData = await ticketApiRequest(
                    "/tickets/technicians"
                );

                (technicianData.technicians || []).forEach(technician => {
                    const option = document.createElement("option");

                    option.value = technician.id;

                    option.textContent =
                        `${technician.first_name} ${technician.last_name}` +
                        ` (${technician.department || "No department"})`;

                    if (
                        String(technician.id) ===
                        String(ticket.assignedUserId)
                    ) {
                        option.selected = true;
                    }

                    select.appendChild(option);
                });

            } catch (error) {
                message.textContent = error.message;
            }

            assignButton.addEventListener("click", async () => {
                if (!select.value) {
                    message.textContent = "Please select a technician.";
                    return;
                }

                assignButton.disabled = true;
                message.textContent = "Assigning technician...";

                try {
                    await ticketApiRequest(
                        `/tickets/${encodeURIComponent(ticket.id)}/assign`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                assignedTo: Number(select.value)
                            })
                        }
                    );

                    await loadTickets();
                    await openTicketDetails(ticket.id);

                } catch (error) {
                    message.textContent = error.message;

                } finally {
                    assignButton.disabled = false;
                }
            });
        }


        // Ticket status management.

        const canManageStatus =
            currentUser &&
            (
                ["owner", "administrator", "it_manager"].includes(
                    currentUser.role
                ) ||
                (
                    currentUser.role === "technician" &&
                    String(ticket.assignedUserId) === String(currentUser.id)
                )
            );

        if (canManageStatus) {
            const statusSection = document.createElement("div");
            statusSection.className = "detail-description";

            const heading = document.createElement("h4");
            heading.textContent = "Update Ticket Status";

            const statusLabel = document.createElement("label");
            statusLabel.textContent = "New Status";

            const statusSelect = document.createElement("select");

            statusSelect.style.display = "block";
            statusSelect.style.width = "100%";
            statusSelect.style.padding = "10px";
            statusSelect.style.margin = "8px 0 15px";

            const availableStatuses = [
                "Open",
                "In Progress",
                "Pending",
                "Resolved"
            ];

            availableStatuses.forEach(status => {
                const option = document.createElement("option");

                option.value = status;
                option.textContent = status;

                if (status === ticket.status) {
                    option.selected = true;
                }

                statusSelect.appendChild(option);
            });

            const messageLabel = document.createElement("label");
            messageLabel.textContent = "Update Message";

            const updateMessage = document.createElement("textarea");

            updateMessage.placeholder =
                "Explain the work completed or why the status is changing.";

            updateMessage.rows = 3;
            updateMessage.required = true;
            updateMessage.style.display = "block";
            updateMessage.style.width = "100%";
            updateMessage.style.padding = "10px";
            updateMessage.style.margin = "8px 0 15px";
            updateMessage.style.boxSizing = "border-box";

            const updateButton = document.createElement("button");

            updateButton.type = "button";
            updateButton.textContent = "Save Status Update";

            const statusMessage = document.createElement("p");

            statusSection.append(
                heading,
                statusLabel,
                statusSelect,
                messageLabel,
                updateMessage,
                updateButton,
                statusMessage
            );

            ticketDetailsContent.appendChild(statusSection);

            updateButton.addEventListener("click", async () => {
                const newStatus = statusSelect.value;
                const messageText = updateMessage.value.trim();

                if (!messageText) {
                    statusMessage.textContent =
                        "Please provide an update message.";

                    updateMessage.focus();

                    return;
                }

                if (messageText.length < 5) {
                    statusMessage.textContent =
                        "Please provide a more detailed update message.";

                    updateMessage.focus();

                    return;
                }

                if (newStatus === ticket.status) {
                    statusMessage.textContent =
                        "Please select a different status.";

                    return;
                }

                updateButton.disabled = true;
                statusSelect.disabled = true;
                updateMessage.disabled = true;

                statusMessage.textContent = "Saving status update...";

                try {
                    await ticketApiRequest(
                        `/tickets/${encodeURIComponent(ticket.id)}/status`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                status: newStatus,
                                message: messageText
                            })
                        }
                    );

                    await loadTickets();
                    await openTicketDetails(ticket.id);

                } catch (error) {
                    statusMessage.textContent = error.message;

                    updateButton.disabled = false;
                    statusSelect.disabled = false;
                    updateMessage.disabled = false;
                }
            });
        }


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

        const attachmentsList = result.attachments || [];

        if (attachmentsList.length > 0) {
            attachmentsList.forEach(file => {
                const attachmentItem = document.createElement("div");

                attachmentItem.className = "attachment-item";

                const attachmentName = document.createElement("p");

                attachmentName.textContent =
                    `${file.original_filename} (${(
                        Number(file.size_bytes) / 1024
                    ).toFixed(1)} KB)`;

                const downloadButton = document.createElement("button");

                downloadButton.type = "button";
                downloadButton.className = "download-attachment-button";
                downloadButton.textContent = "Download";

                downloadButton.addEventListener("click", function () {
                    downloadTicketAttachment(ticket.id, file);
                });

                attachmentItem.appendChild(attachmentName);
                attachmentItem.appendChild(downloadButton);

                attachmentSection.appendChild(attachmentItem);
            });
        } else {
            const noAttachments = document.createElement("p");

            noAttachments.textContent =
                "No attachments have been uploaded.";

            attachmentSection.appendChild(noAttachments);
        }

        ticketDetailsContent.appendChild(attachmentSection);

        // Ticket update history.

        ticketDetailsContent.appendChild(
            renderEmployeeTicketUpdates(result.updates)
        );

        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Ticket detail error:", error);

        ticketDetailsContent.textContent = error.message;
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
            timeZone: COMPANY_TIME_ZONE,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


// Initialise the ticket application.

async function initializeTicketApplication() {
    try {
        await loadTicketCurrentUser();

        await loadTickets();

    } catch (error) {
        console.error("Ticket application initialization error:", error);

        if (!error.message.includes("Authentication required")) {
            alert(
                "Unable to initialize the ticket application: " +
                error.message
            );
        }
    }
}

initializeTicketApplication();
