
const SETTINGS_STORAGE_KEY = "samEnterpriseSettings";

const defaultSettings = {

    company: {
        name: "Sam Enterprise",
        website: "",
        supportEmail: "support@samenterprise.co.za",
        supportPhone: "",
        address: "",
        country: "South Africa",
        description: "IT Service Management Platform"
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

    ticket: {
        prefix: "SAM",
        nextNumber: 1001,
        defaultPriority: "Medium",
        maxAttachments: 5,
        maxAttachmentSize: 5
    },

    sla: {
        Critical: {
            response: 1,
            resolution: 4
        },
        High: {
            response: 4,
            resolution: 8
        },
        Medium: {
            response: 8,
            resolution: 24
        },
        Low: {
            response: 24,
            resolution: 72
        }
    },

    notifications: {
        newTicket: true,
        assignment: true,
        status: true,
        resolution: true,
        sla: true
    },

    system: {
        timezone: "Africa/Johannesburg",
        currency: "ZAR",
        maintenanceMode: false,
        allowTicketSubmission: true
    }

};


function getSystemSettings() {

    try {

        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

        if (!saved) {

            localStorage.setItem(
                SETTINGS_STORAGE_KEY,
                JSON.stringify(defaultSettings)
            );

            return JSON.parse(JSON.stringify(defaultSettings));

        }

        const parsed = JSON.parse(saved);

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Invalid settings record.");
        }

        return {

            ...defaultSettings,

            ...parsed,

            company: {
                ...defaultSettings.company,
                ...(parsed.company || {})
            },

            departments: Array.isArray(parsed.departments)
                ? parsed.departments
                : [...defaultSettings.departments],

            ticket: {
                ...defaultSettings.ticket,
                ...(parsed.ticket || {})
            },

            sla: {
                ...defaultSettings.sla,
                ...(parsed.sla || {})
            },

            notifications: {
                ...defaultSettings.notifications,
                ...(parsed.notifications || {})
            },

            system: {
                ...defaultSettings.system,
                ...(parsed.system || {})
            }

        };

    } catch (error) {

        console.error("Could not load system settings:", error);

        return JSON.parse(JSON.stringify(defaultSettings));

    }

}


function saveSystemSettings(settings) {

    try {

        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );

        return true;

    } catch (error) {

        console.error("Could not save system settings:", error);

        return false;

    }

}


let settings = getSystemSettings();


function showSettingsToast(message) {

    const toast = document.getElementById("settingsToast");

    const messageElement =
        document.getElementById("settingsToastMessage");

    messageElement.textContent = message;

    toast.classList.add("show");

    window.clearTimeout(window.settingsToastTimer);

    window.settingsToastTimer = window.setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


function saveSettingsSection(section, values) {

    const updatedSettings = getSystemSettings();

    updatedSettings[section] = values;

    const saved = saveSystemSettings(updatedSettings);

    if (!saved) {

        alert("Unable to save settings. Please try again.");

        return false;

    }

    settings = getSystemSettings();

    const indicator =
        document.getElementById("settingsSaveIndicator");

    if (indicator) {

        indicator.innerHTML =
            '<i data-lucide="cloud-check"></i> Settings saved locally';

        if (window.lucide) {
            lucide.createIcons();
        }

    }

    showSettingsToast("Settings saved successfully.");

    return true;

}


// Populate the company profile form.

function populateCompanySettings() {

    const company = settings.company;

    document.getElementById("companyName").value = company.name;

    document.getElementById("companyWebsite").value = company.website;

    document.getElementById("companyEmail").value =
        company.supportEmail;

    document.getElementById("companyPhone").value =
        company.supportPhone;

    document.getElementById("companyAddress").value =
        company.address;

    document.getElementById("companyCountry").value =
        company.country;

    document.getElementById("companyDescription").value =
        company.description;

}


// Save company information.

document.getElementById("companySettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        if (!this.reportValidity()) {
            return;
        }

        const company = {

            name: document.getElementById("companyName").value.trim(),

            website: document.getElementById("companyWebsite").value.trim(),

            supportEmail: document.getElementById("companyEmail").value.trim(),

            supportPhone: document.getElementById("companyPhone").value.trim(),

            address: document.getElementById("companyAddress").value.trim(),

            country: document.getElementById("companyCountry").value,

            description: document.getElementById("companyDescription").value.trim()

        };

        if (saveSettingsSection("company", company)) {

            document.title = `${company.name} | System Settings`;

        }

    });


// Display department records.

function renderDepartments() {

    const departmentList =
        document.getElementById("departmentList");

    departmentList.replaceChildren();

    settings = getSystemSettings();

    settings.departments.forEach(department => {

        const item = document.createElement("div");

        item.className = "department-item";

        const nameContainer = document.createElement("div");

        nameContainer.className = "department-item-name";

        const icon = document.createElement("i");

        icon.setAttribute("data-lucide", "building-2");

        const name = document.createElement("span");

        name.textContent = department;

        nameContainer.appendChild(icon);

        nameContainer.appendChild(name);

        const removeButton = document.createElement("button");

        removeButton.type = "button";

        removeButton.className = "department-remove";

        const removeIcon = document.createElement("i");

        removeIcon.setAttribute("data-lucide", "trash-2");

        removeButton.appendChild(removeIcon);

        removeButton.appendChild(
            document.createTextNode("Remove")
        );

        removeButton.addEventListener("click", () => {

            removeDepartment(department);

        });

        item.appendChild(nameContainer);

        item.appendChild(removeButton);

        departmentList.appendChild(item);

    });

    if (window.lucide) {
        lucide.createIcons();
    }

}


// Add a department.

document.getElementById("departmentForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const input = document.getElementById("newDepartment");

        const department = input.value.trim();

        if (!department) {
            return;
        }

        settings = getSystemSettings();

        const alreadyExists = settings.departments.some(item =>

            item.toLowerCase() === department.toLowerCase()

        );

        if (alreadyExists) {

            alert("This department already exists.");

            return;

        }

        settings.departments.push(department);

        if (saveSettingsSection("departments", settings.departments)) {

            input.value = "";

            renderDepartments();

        }

    });


// Prevent removing departments that are already assigned to users.

function removeDepartment(department) {

    const users = JSON.parse(
        localStorage.getItem("samEnterpriseUsers") || "[]"
    );

    const departmentInUse = users.some(user =>

        user.department &&
        user.department.toLowerCase() === department.toLowerCase()

    );

    if (departmentInUse) {

        alert(
            "This department is assigned to existing user records. " +
            "Reassign those users before removing the department."
        );

        return;

    }

    const confirmed = window.confirm(
        `Are you sure you want to remove ${department}?`
    );

    if (!confirmed) {
        return;
    }

    settings = getSystemSettings();

    const updatedDepartments = settings.departments.filter(item =>

        item.toLowerCase() !== department.toLowerCase()

    );

    if (saveSettingsSection("departments", updatedDepartments)) {

        renderDepartments();

    }

}


// Populate ticket configuration.

function populateTicketSettings() {

    const ticket = settings.ticket;

    document.getElementById("ticketPrefix").value = ticket.prefix;

    document.getElementById("ticketNextNumber").value =
        ticket.nextNumber;

    document.getElementById("defaultTicketPriority").value =
        ticket.defaultPriority;

    document.getElementById("maxAttachments").value =
        ticket.maxAttachments;

    document.getElementById("maxAttachmentSize").value =
        ticket.maxAttachmentSize;

}


// Save ticket configuration.

document.getElementById("ticketSettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        if (!this.reportValidity()) {
            return;
        }

        const ticket = {

            prefix: document.getElementById("ticketPrefix")
                .value.trim().toUpperCase(),

            nextNumber: Number(
                document.getElementById("ticketNextNumber").value
            ),

            defaultPriority: document.getElementById(
                "defaultTicketPriority"
            ).value,

            maxAttachments: Number(
                document.getElementById("maxAttachments").value
            ),

            maxAttachmentSize: Number(
                document.getElementById("maxAttachmentSize").value
            )

        };

        if (!/^[A-Z0-9]+$/.test(ticket.prefix)) {

            alert("Use only letters and numbers in the ticket prefix.");

            return;

        }

        if (
            !Number.isInteger(ticket.nextNumber) ||
            ticket.nextNumber < 1 ||
            !Number.isInteger(ticket.maxAttachments) ||
            ticket.maxAttachments < 1 ||
            !Number.isInteger(ticket.maxAttachmentSize) ||
            ticket.maxAttachmentSize < 1
        ) {

            alert("Enter valid positive whole-number configuration values.");

            return;

        }

        if (saveSettingsSection("ticket", ticket)) {

            document.getElementById("ticketPrefix").value =
                ticket.prefix;

        }

    });


// Populate SLA values.

function populateSLASettings() {

    ["Critical", "High", "Medium", "Low"].forEach(priority => {

        const values = settings.sla[priority];

        document.getElementById(
            priority.toLowerCase() + "Response"
        ).value = values.response;

        document.getElementById(
            priority.toLowerCase() + "Resolution"
        ).value = values.resolution;

    });

}


// Save SLA configuration.

document.getElementById("slaSettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        if (!this.reportValidity()) {
            return;
        }

        const sla = {};

        const priorities = ["Critical", "High", "Medium", "Low"];

        for (const priority of priorities) {

            const key = priority.toLowerCase();

            const response = Number(
                document.getElementById(key + "Response").value
            );

            const resolution = Number(
                document.getElementById(key + "Resolution").value
            );

            if (
                !Number.isFinite(response) ||
                !Number.isFinite(resolution) ||
                response <= 0 ||
                resolution < response
            ) {

                alert(
                    `${priority}: the resolution target must be greater than or equal to the response target.`
                );

                return;

            }

            sla[priority] = {

                response,

                resolution

            };

        }

        saveSettingsSection("sla", sla);

    });


// Populate notification preferences.

function populateNotificationSettings() {

    const notifications = settings.notifications;

    document.getElementById("notifyNewTicket").checked =
        notifications.newTicket;

    document.getElementById("notifyAssignment").checked =
        notifications.assignment;

    document.getElementById("notifyStatus").checked =
        notifications.status;

    document.getElementById("notifyResolution").checked =
        notifications.resolution;

    document.getElementById("notifySLA").checked =
        notifications.sla;

}


// Save notification preferences.

document.getElementById("notificationSettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const notifications = {

            newTicket: document.getElementById("notifyNewTicket").checked,

            assignment: document.getElementById("notifyAssignment").checked,

            status: document.getElementById("notifyStatus").checked,

            resolution: document.getElementById("notifyResolution").checked,

            sla: document.getElementById("notifySLA").checked

        };

        saveSettingsSection("notifications", notifications);

    });


// Populate general system preferences.

function populateSystemSettings() {

    const system = settings.system;

    document.getElementById("systemTimezone").value =
        system.timezone;

    document.getElementById("systemCurrency").value =
        system.currency;

    document.getElementById("maintenanceMode").checked =
        system.maintenanceMode;

    document.getElementById("allowTicketSubmission").checked =
        system.allowTicketSubmission;

}


// Save general system preferences.

document.getElementById("systemSettingsForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const system = {

            timezone: document.getElementById("systemTimezone").value,

            currency: document.getElementById("systemCurrency").value,

            maintenanceMode:
                document.getElementById("maintenanceMode").checked,

            allowTicketSubmission:
                document.getElementById("allowTicketSubmission").checked

        };

        saveSettingsSection("system", system);

    });


// Reset configuration to initial demonstration defaults.

document.getElementById("resetSettings")
    .addEventListener("click", function() {

        const confirmed = window.confirm(

            "Reset all system configuration settings to their original defaults? " +
            "Tickets, users and assets will not be deleted."

        );

        if (!confirmed) {
            return;
        }

        const success = saveSystemSettings(
            JSON.parse(JSON.stringify(defaultSettings))
        );

        if (!success) {

            alert("Unable to reset system settings.");

            return;

        }

        settings = getSystemSettings();

        populateAllSettings();

        showSettingsToast("System settings restored to defaults.");

    });


// Keep the settings navigation highlight in sync.

document.querySelectorAll(".settings-nav-link")
    .forEach(link => {

        link.addEventListener("click", function() {

            document.querySelectorAll(".settings-nav-link")
                .forEach(item => item.classList.remove("active"));

            this.classList.add("active");

        });

    });


// Populate every settings section.

function populateAllSettings() {

    settings = getSystemSettings();

    populateCompanySettings();

    renderDepartments();

    populateTicketSettings();

    populateSLASettings();

    populateNotificationSettings();

    populateSystemSettings();

}


// Display current date.

document.getElementById("settingsDate").textContent =
    new Date().toLocaleDateString("en-ZA", {

        weekday: "long",

        year: "numeric",

        month: "long",

        day: "numeric"

    });


// Initialise settings.

populateAllSettings();

if (window.lucide) {
    lucide.createIcons();
}
