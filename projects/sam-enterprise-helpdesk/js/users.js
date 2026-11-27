
const API_BASE_URL = "http://127.0.0.1:5000/api";

let users = [];
let currentStatusFilter = "all";
let editingUser = null;

const usersTableBody = document.getElementById("usersTableBody");
const userSearch = document.getElementById("userSearch");
const roleFilter = document.getElementById("roleFilter");
const departmentFilter = document.getElementById("departmentFilter");

const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");

const userIdInput = document.getElementById("userId");
const firstNameInput = document.getElementById("userFirstName");
const lastNameInput = document.getElementById("userLastName");
const emailInput = document.getElementById("userEmail");
const employeeNumberInput = document.getElementById("employeeNumber");
const phoneInput = document.getElementById("userPhone");
const departmentInput = document.getElementById("userDepartment");
const roleInput = document.getElementById("userRole");
const statusInput = document.getElementById("userStatus");

const emptyState = document.getElementById("usersEmptyState");
const emptyMessage = document.getElementById("usersEmptyMessage");

const addUserButton = document.getElementById("addUserButton");
const emptyAddUserButton = document.getElementById("emptyAddUserButton");

const ROLE_LABELS = {
    owner: "Owner",
    administrator: "Administrator",
    it_manager: "IT Manager",
    technician: "Technician",
    employee: "Employee",
    auditor: "Auditor"
};

const STATUS_LABELS = {
    pending: "Pending",
    active: "Active",
    suspended: "Suspended",
    disabled: "Disabled"
};

const allowedRoles = Object.keys(ROLE_LABELS);
const allowedStatuses = Object.keys(STATUS_LABELS);

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

function normalizeUser(user) {
    return {
        id: String(user.id),
        employeeNumber: user.employee_number || "",
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        department: user.department || "",
        jobTitle: user.job_title || "",
        role: String(user.role || "employee").toLowerCase(),
        status: String(user.status || "pending").toLowerCase(),
        createdAt: user.created_at || null
    };
}

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let result = {};

    try {
        result = await response.json();
    } catch {
        result = {};
    }

    if (response.status === 401) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "login.html";
        throw new Error("Your session has expired.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || "The requested operation could not be completed."
        );
    }

    return result;
}

function showError(error) {
    console.error("User management error:", error);

    if (error.message !== "Your session has expired.") {
        alert(error.message || "Something went wrong.");
    }
}

function getUserStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}

function getUserRoleLabel(role) {
    return ROLE_LABELS[role] || role;
}

function formatDate(date) {
    if (!date) {
        return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not available";
    }

    return parsedDate.toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function populateRoleDropdowns() {
    if (roleFilter) {
        const selectedRole = roleFilter.value;

        roleFilter.innerHTML = `
            <option value="all">All Roles</option>
            ${allowedRoles.map(role => `
                <option value="${role}">${ROLE_LABELS[role]}</option>
            `).join("")}
        `;

        roleFilter.value = selectedRole || "all";
    }

    if (roleInput) {
        const selectedRole = roleInput.value;

        roleInput.innerHTML = allowedRoles.map(role => `
            <option value="${role}">${ROLE_LABELS[role]}</option>
        `).join("");

        if (allowedRoles.includes(selectedRole)) {
            roleInput.value = selectedRole;
        }
    }
}

function populateStatusDropdown() {
    if (!statusInput) {
        return;
    }

    statusInput.innerHTML = allowedStatuses.map(status => `
        <option value="${status}">${STATUS_LABELS[status]}</option>
    `).join("");
}

function populateDepartmentFilter() {
    if (!departmentFilter) {
        return;
    }

    const selectedDepartment = departmentFilter.value;

    const departments = [
        ...new Set(
            users
                .map(user => user.department)
                .filter(department => department)
        )
    ].sort();

    departmentFilter.innerHTML = `
        <option value="all">All Departments</option>
        ${departments.map(department => `
            <option value="${escapeHTML(department)}">
                ${escapeHTML(department)}
            </option>
        `).join("")}
    `;

    departmentFilter.value = departments.includes(selectedDepartment)
        ? selectedDepartment
        : "all";
}

function updateStatistics() {
    const totalUsers = users.length;

    const totalEmployees = users.filter(user =>
        user.role === "employee"
    ).length;

    const totalTechnicians = users.filter(user =>
        user.role === "technician"
    ).length;

    const totalInactiveUsers = users.filter(user =>
        user.status !== "active"
    ).length;

    document.getElementById("totalUsers").textContent = totalUsers;
    document.getElementById("totalEmployees").textContent = totalEmployees;
    document.getElementById("totalTechnicians").textContent = totalTechnicians;
    document.getElementById("totalInactiveUsers").textContent =
        totalInactiveUsers;
}

function getFilteredUsers() {
    const searchTerm = userSearch?.value.trim().toLowerCase() || "";
    const selectedRole = roleFilter?.value || "all";
    const selectedDepartment = departmentFilter?.value || "all";

    return users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();

        const matchesSearch =
            fullName.includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.employeeNumber.toLowerCase().includes(searchTerm) ||
            user.department.toLowerCase().includes(searchTerm) ||
            getUserRoleLabel(user.role).toLowerCase().includes(searchTerm);

        const matchesRole =
            selectedRole === "all" || user.role === selectedRole;

        const matchesDepartment =
            selectedDepartment === "all" ||
            user.department === selectedDepartment;

        let matchesStatus = true;

        if (currentStatusFilter === "active") {
            matchesStatus = user.status === "active";
        } else if (currentStatusFilter === "inactive") {
            matchesStatus = user.status !== "active";
        }

        return (
            matchesSearch &&
            matchesRole &&
            matchesDepartment &&
            matchesStatus
        );
    });
}

function renderUsers() {
    const filteredUsers = getFilteredUsers();

    usersTableBody.innerHTML = "";

    if (filteredUsers.length === 0) {
        emptyState.classList.add("show");

        emptyMessage.textContent = users.length === 0
            ? "No users have been registered yet."
            : "No users match your search or filters.";

        return;
    }

    emptyState.classList.remove("show");

    filteredUsers.forEach(user => {
        const row = document.createElement("tr");

        const fullName = `${user.firstName} ${user.lastName}`.trim();

        row.innerHTML = `
            <td>
                <div class="user-name">
                    ${escapeHTML(fullName)}
                </div>
                <div class="employee-number">
                    ${escapeHTML(user.employeeNumber || "No employee number")}
                </div>
            </td>

            <td>
                <div class="user-email">
                    ${escapeHTML(user.email)}
                </div>
            </td>

            <td>
                <span class="user-role ${escapeHTML(user.role)}">
                    ${escapeHTML(getUserRoleLabel(user.role))}
                </span>
            </td>

            <td>${escapeHTML(user.department || "Not assigned")}</td>

            <td>
                <span class="user-account-status ${escapeHTML(user.status)}">
                    ${escapeHTML(getUserStatusLabel(user.status))}
                </span>
            </td>

            <td>${formatDate(user.createdAt)}</td>

            <td>
                <button
                    type="button"
                    class="view-ticket-button edit-user-button"
                    data-user-id="${escapeHTML(user.id)}"
                >
                    Edit
                </button>
            </td>
        `;

        usersTableBody.appendChild(row);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

async function loadUsers() {
    try {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7">Loading employees...</td>
            </tr>
        `;

        const result = await apiRequest("/employees");

        const employeeList = Array.isArray(result)
            ? result
            : result.employees || result.users || result.data || [];

        if (!Array.isArray(employeeList)) {
            throw new Error("The server returned an invalid employee list.");
        }

        users = employeeList.map(normalizeUser);

        populateRoleDropdowns();
        populateStatusDropdown();
        populateDepartmentFilter();

        updateStatistics();
        renderUsers();

    } catch (error) {
        showError(error);

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load employees. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

function getStatusFieldContainer() {
    return statusInput?.closest(".form-group") ||
        statusInput?.parentElement;
}

function openUserModal(user = null) {
    editingUser = user;

    userForm.reset();

    userIdInput.value = user ? user.id : "";

    const statusContainer = getStatusFieldContainer();

    if (user) {
        firstNameInput.value = user.firstName;
        lastNameInput.value = user.lastName;
        emailInput.value = user.email;
        employeeNumberInput.value = user.employeeNumber;
        departmentInput.value = user.department;
        roleInput.value = user.role;
        statusInput.value = user.status;

        if (statusContainer) {
            statusContainer.style.display = "";
        }
    } else {
        roleInput.value = "employee";
        statusInput.value = "pending";

        if (statusContainer) {
            statusContainer.style.display = "none";
        }
    }

    if (phoneInput) {
        phoneInput.disabled = true;
        phoneInput.value = "";
        phoneInput.placeholder = "Not supported yet";
    }

    employeeNumberInput.required = false;

    const modalTitle = userModal.querySelector("h2");

    if (modalTitle) {
        modalTitle.textContent = user
            ? "Edit User"
            : "Invite New User";
    }

    userModal.classList.add("show");
}

function closeUserModal() {
    userModal.classList.remove("show");
    editingUser = null;
    userForm.reset();

    const statusContainer = getStatusFieldContainer();

    if (statusContainer) {
        statusContainer.style.display = "";
    }
}

function getInvitationLink(result) {
    return (
        result.invitationLink ||
        result.invitation_url ||
        result.inviteLink ||
        result.link ||
        result.invitation?.link ||
        result.invitation?.url ||
        null
    );
}

async function inviteUser() {
    const invitationData = {
        first_name: firstNameInput.value.trim(),
        last_name: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        role: roleInput.value,
        department: departmentInput.value.trim() || null
    };

    const result = await apiRequest("/auth/invite", {
        method: "POST",
        body: JSON.stringify(invitationData)
    });

    closeUserModal();

    await loadUsers();

    const invitationLink = getInvitationLink(result);

    if (invitationLink) {
        window.prompt(
            "The invitation was created successfully. Copy this link and share it with the employee:",
            invitationLink
        );
    } else {
        alert(
            result.message ||
            "Invitation created. The employee account is awaiting acceptance."
        );
    }
}

async function updateUser() {
    const user = editingUser;

    if (!user) {
        return;
    }

    const updatedData = {
        first_name: firstNameInput.value.trim(),
        last_name: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        employee_number: employeeNumberInput.value.trim() || null,
        department: departmentInput.value.trim() || null,
        job_title: user.jobTitle || null
    };

    await apiRequest(`/employees/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedData)
    });

    const newRole = roleInput.value;
    const newStatus = statusInput.value;

    if (newRole !== user.role) {
        await apiRequest(`/employees/${user.id}/role`, {
            method: "PATCH",
            body: JSON.stringify({
                role: newRole
            })
        });
    }

    if (newStatus !== user.status) {
        await apiRequest(`/employees/${user.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status: newStatus
            })
        });
    }

    closeUserModal();

    await loadUsers();

    alert("User information updated successfully.");
}

userForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();

    if (!firstName || !lastName || !email) {
        alert("Please complete all required fields.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    const submitButton = userForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        if (editingUser) {
            await updateUser();
        } else {
            await inviteUser();
        }
    } catch (error) {
        showError(error);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

usersTableBody.addEventListener("click", function (event) {
    const editButton = event.target.closest(".edit-user-button");

    if (!editButton) {
        return;
    }

    const user = users.find(
        item => item.id === editButton.dataset.userId
    );

    if (user) {
        openUserModal(user);
    }
});

addUserButton?.addEventListener("click", function () {
    openUserModal();
});

emptyAddUserButton?.addEventListener("click", function () {
    openUserModal();
});

userSearch?.addEventListener("input", renderUsers);
roleFilter?.addEventListener("change", renderUsers);
departmentFilter?.addEventListener("change", renderUsers);

document.querySelectorAll("[data-user-filter]").forEach(button => {
    button.addEventListener("click", function () {
        currentStatusFilter =
            this.dataset.userFilter.toLowerCase();

        document.querySelectorAll("[data-user-filter]").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");

        renderUsers();
    });
});

document.querySelectorAll(
    "[data-close-modal], .modal-close, #closeUserModal, #cancelUserButton"
).forEach(button => {
    button.addEventListener("click", closeUserModal);
});

userModal.addEventListener("click", function (event) {
    if (event.target === userModal) {
        closeUserModal();
    }
});

document.addEventListener("DOMContentLoaded", loadUsers);

if (document.readyState !== "loading") {
    loadUsers();
}
