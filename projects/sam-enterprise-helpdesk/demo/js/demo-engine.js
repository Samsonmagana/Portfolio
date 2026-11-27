
(function () {
    "use strict";

    const STORAGE_KEY = "samEnterpriseDemo";
    const SESSION_KEY = "samEnterpriseDemoSession";
    const DEMO_PASSWORD = "Demo123!";

    const ROLE_HIERARCHY = {
        owner: 6,
        administrator: 5,
        it_manager: 4,
        technician: 3,
        employee: 2,
        auditor: 1
    };

    const demoUsers = [
        {
            id: 1,
            employee_number: "DEMO001",
            first_name: "Alex",
            last_name: "Morgan",
            email: "owner@demo.samenterprise.co.za",
            role: "owner",
            department: "Executive",
            job_title: "Company Owner",
            status: "active"
        },
        {
            id: 2,
            employee_number: "DEMO002",
            first_name: "Jordan",
            last_name: "Smith",
            email: "admin@demo.samenterprise.co.za",
            role: "administrator",
            department: "IT",
            job_title: "System Administrator",
            status: "active"
        },
        {
            id: 3,
            employee_number: "DEMO003",
            first_name: "Taylor",
            last_name: "Brown",
            email: "manager@demo.samenterprise.co.za",
            role: "it_manager",
            department: "IT",
            job_title: "IT Manager",
            status: "active"
        },
        {
            id: 4,
            employee_number: "DEMO004",
            first_name: "Casey",
            last_name: "Williams",
            email: "technician@demo.samenterprise.co.za",
            role: "technician",
            department: "IT Support",
            job_title: "IT Technician",
            status: "active"
        },
        {
            id: 5,
            employee_number: "DEMO005",
            first_name: "Riley",
            last_name: "Davis",
            email: "employee@demo.samenterprise.co.za",
            role: "employee",
            department: "Finance",
            job_title: "Finance Officer",
            status: "active"
        },
        {
            id: 6,
            employee_number: "DEMO006",
            first_name: "Jamie",
            last_name: "Wilson",
            email: "auditor@demo.samenterprise.co.za",
            role: "auditor",
            department: "Compliance",
            job_title: "Internal Auditor",
            status: "active"
        }
    ];

    const initialData = {
        users: demoUsers,

        tickets: [
            {
                id: 1001,
                ticket_reference: "TKT-1001",
                creator_id: 5,
                creator_first_name: "Riley",
                creator_last_name: "Davis",
                creator_email: "employee@demo.samenterprise.co.za",
                department: "Finance",
                contact_number: "082 000 1001",
                issue_title: "Laptop cannot connect to Wi-Fi",
                issue_category: "Network",
                priority: "High",
                location: "Head Office",
                asset_number: "AST-001",
                description: "Unable to connect to the office wireless network.",
                status: "Open",
                assigned_to: 4,
                assignee_first_name: "Casey",
                assignee_last_name: "Williams",
                created_at: "2026-11-25T08:30:00.000Z",
                updated_at: "2026-11-25T08:30:00.000Z",
                resolved_at: null
            },
            {
                id: 1002,
                ticket_reference: "TKT-1002",
                creator_id: 5,
                creator_first_name: "Riley",
                creator_last_name: "Davis",
                creator_email: "employee@demo.samenterprise.co.za",
                department: "Finance",
                contact_number: "082 000 1001",
                issue_title: "Request for software installation",
                issue_category: "Software",
                priority: "Medium",
                location: "Head Office",
                asset_number: "AST-001",
                description: "Please install the approved office productivity software.",
                status: "In Progress",
                assigned_to: 4,
                assignee_first_name: "Casey",
                assignee_last_name: "Williams",
                created_at: "2026-11-24T10:15:00.000Z",
                updated_at: "2026-11-25T09:00:00.000Z",
                resolved_at: null
            },
            {
                id: 1003,
                ticket_reference: "TKT-1003",
                creator_id: 5,
                creator_first_name: "Riley",
                creator_last_name: "Davis",
                creator_email: "employee@demo.samenterprise.co.za",
                department: "Finance",
                contact_number: "082 000 1001",
                issue_title: "Printer not responding",
                issue_category: "Hardware",
                priority: "Low",
                location: "Accounts Department",
                asset_number: "",
                description: "The accounts department printer is not responding.",
                status: "Resolved",
                assigned_to: 4,
                assignee_first_name: "Casey",
                assignee_last_name: "Williams",
                created_at: "2026-11-20T12:00:00.000Z",
                updated_at: "2026-11-21T14:00:00.000Z",
                resolved_at: "2026-11-21T14:00:00.000Z"
            }
        ],

        assets: [
            {
                id: 2001,
                asset_tag: "AST-001",
                asset_name: "Dell Latitude 5440",
                category: "Laptop",
                manufacturer: "Dell",
                model: "Latitude 5440",
                serial_number: "DEMO-DL-001",
                status: "Assigned",
                location: "Head Office",
                assigned_user_id: 5,
                assigned_first_name: "Riley",
                assigned_last_name: "Davis"
            },
            {
                id: 2002,
                asset_tag: "AST-002",
                asset_name: "HP ProDesk Desktop",
                category: "Desktop",
                manufacturer: "HP",
                model: "ProDesk 400",
                serial_number: "DEMO-HP-002",
                status: "Available",
                location: "IT Department",
                assigned_user_id: null,
                assigned_first_name: null,
                assigned_last_name: null
            },
            {
                id: 2003,
                asset_tag: "AST-003",
                asset_name: "Samsung Office Monitor",
                category: "Monitor",
                manufacturer: "Samsung",
                model: "S24R",
                serial_number: "DEMO-SA-003",
                status: "Maintenance",
                location: "IT Department",
                assigned_user_id: null,
                assigned_first_name: null,
                assigned_last_name: null
            }
        ],

        activity: [],
        maintenance: [],
        ticketUpdates: [],
        attachments: [],
        invitations: []
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function loadData() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

            if (
                saved &&
                Array.isArray(saved.users) &&
                Array.isArray(saved.tickets) &&
                Array.isArray(saved.assets)
            ) {
                return {
                    ...clone(initialData),
                    ...saved
                };
            }
        } catch (error) {
            console.warn("Demo data could not be loaded.");
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(initialData)
        );

        return clone(initialData);
    }

    let data = loadData();

    function saveData() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    }

    function currentUser() {
        const id = Number(
            localStorage.getItem(SESSION_KEY)
        );

        return data.users.find(user =>
            user.id === id &&
            user.status === "active"
        ) || null;
    }

    function response(body, status = 200) {
        return new Response(JSON.stringify(body), {
            status,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    function hasRole(...roles) {
        const user = currentUser();

        return Boolean(
            user && roles.includes(user.role)
        );
    }

    function authenticated() {
        return currentUser()
            ? null
            : response({
                success: false,
                message: "You must be logged in."
            }, 401);
    }

    function denied() {
        return response({
            success: false,
            message: "You do not have permission to perform this action."
        }, 403);
    }

    function getBody(options) {
        try {
            if (!options.body) return {};

            if (typeof options.body === "string") {
                return JSON.parse(options.body);
            }

            return {};
        } catch {
            return {};
        }
    }

    function findTicket(id) {
        return data.tickets.find(
            ticket => String(ticket.id) === String(id)
        );
    }

    function findAsset(id) {
        return data.assets.find(
            asset => String(asset.id) === String(id)
        );
    }

    function recordActivity(action, description, user = currentUser()) {
        data.activity.unshift({
            id: Date.now(),
            action,
            description,
            user_id: user ? user.id : null,
            first_name: user ? user.first_name : "System",
            last_name: user ? user.last_name : "",
            created_at: new Date().toISOString()
        });

        saveData();
    }

    function getTicketUpdates(ticketId) {
        return data.ticketUpdates
            .filter(item => String(item.ticket_id) === String(ticketId))
            .map(item => ({
                ...item,
                first_name: item.first_name || "IT Support",
                last_name: item.last_name || ""
            }));
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (resource, options = {}) {
        const url = typeof resource === "string"
            ? resource
            : resource.url;

        const isDemoAPI =
            url.includes("127.0.0.1:5000/api") ||
            url.includes("localhost:5000/api") ||
            url.startsWith("/api/");

        if (!isDemoAPI) {
            return originalFetch(resource, options);
        }

        const parsedURL = new URL(
            url,
            window.location.origin
        );

        const path = parsedURL.pathname.replace(
            /^.*\/api/,
            ""
        ) || "/";

        const method = (
            options.method || "GET"
        ).toUpperCase();

        const body = getBody(options);

        // AUTHENTICATION

        if (path === "/auth/login" && method === "POST") {
            const email = String(
                body.email || ""
            ).trim().toLowerCase();

            const user = data.users.find(
                item => item.email.toLowerCase() === email
            );

            if (
                !user ||
                user.status !== "active" ||
                body.password !== DEMO_PASSWORD
            ) {
                return response({
                    success: false,
                    message: "Invalid demo login details."
                }, 401);
            }

            localStorage.setItem(
                SESSION_KEY,
                String(user.id)
            );

            return response({
                success: true,
                message: "Demo login successful.",
                user
            });
        }

        if (path === "/auth/me" && method === "GET") {
            const user = currentUser();

            return user
                ? response({
                    success: true,
                    message: "Current user retrieved successfully.",
                    user
                })
                : response({
                    success: false,
                    message: "You must be logged in."
                }, 401);
        }

        if (path === "/auth/logout" && method === "POST") {
            localStorage.removeItem(SESSION_KEY);

            return response({
                success: true,
                message: "You have been logged out."
            });
        }

        const authError = authenticated();

        if (authError) return authError;

        const user = currentUser();

        // EMPLOYEES

        if (path === "/employees" && method === "GET") {
            if (!hasRole(
                "owner",
                "administrator",
                "it_manager",
                "auditor"
            )) return denied();

            const search = (
                parsedURL.searchParams.get("search") || ""
            ).toLowerCase();

            const employees = data.users.filter(item =>
                [
                    item.first_name,
                    item.last_name,
                    item.email,
                    item.employee_number,
                    item.department
                ].join(" ").toLowerCase().includes(search)
            );

            return response({
                success: true,
                count: employees.length,
                employees
            });
        }

        // TICKETS

        if (path === "/tickets" && method === "GET") {
            let tickets = data.tickets;

            if (user.role === "employee") {
                tickets = tickets.filter(
                    ticket => Number(ticket.creator_id) === user.id
                );
            }

            if (parsedURL.searchParams.has("status")) {
                tickets = tickets.filter(ticket =>
                    ticket.status === parsedURL.searchParams.get("status")
                );
            }

            return response({
                success: true,
                count: tickets.length,
                tickets
            });
        }

        if (path === "/tickets" && method === "POST") {
            if (!hasRole(
                "owner",
                "administrator",
                "it_manager",
                "technician",
                "employee"
            )) return denied();

            const id = Date.now();

            const ticket = {
                id,
                ticket_reference: `TKT-${id}`,
                creator_id: user.id,
                creator_first_name: user.first_name,
                creator_last_name: user.last_name,
                creator_email: user.email,
                department: user.department || "",
                contact_number: body.contactNumber || "",
                issue_title: body.issueTitle || "New support request",
                issue_category: body.issueCategory || "Other",
                priority: body.priority || "Medium",
                location: body.location || "",
                asset_number: body.assetNumber || "",
                description: body.description || "",
                status: "Open",
                assigned_to: null,
                assignee_first_name: null,
                assignee_last_name: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                resolved_at: null
            };

            data.tickets.unshift(ticket);
            saveData();

            recordActivity(
                "Ticket Created",
                `${ticket.ticket_reference}: ${ticket.issue_title}`
            );

            return response({
                success: true,
                message: "Ticket created successfully.",
                ticket
            }, 201);
        }

        const ticketMatch = path.match(/^\/tickets\/(\d+)$/);

        if (ticketMatch && method === "GET") {
            const ticket = findTicket(ticketMatch[1]);

            if (!ticket) {
                return response({
                    success: false,
                    message: "Ticket not found."
                }, 404);
            }

            if (
                user.role === "employee" &&
                Number(ticket.creator_id) !== user.id
            ) return denied();

            return response({
                success: true,
                ticket,
                updates: getTicketUpdates(ticket.id),
                attachments: data.attachments.filter(
                    item => String(item.ticket_id) === String(ticket.id)
                )
            });
        }

        if (path === "/tickets/technicians" && method === "GET") {
            if (!hasRole("owner", "administrator", "it_manager")) {
                return denied();
            }

            return response({
                success: true,
                technicians: data.users.filter(
                    item => item.role === "technician" &&
                        item.status === "active"
                )
            });
        }

        const assignMatch = path.match(
            /^\/tickets\/(\d+)\/assign$/
        );

        if (assignMatch && method === "PATCH") {
            if (!hasRole("owner", "administrator", "it_manager")) {
                return denied();
            }

            const ticket = findTicket(assignMatch[1]);

            const technician = data.users.find(item =>
                Number(item.id) === Number(body.assignedTo) &&
                item.role === "technician" &&
                item.status === "active"
            );

            if (!ticket || !technician) {
                return response({
                    success: false,
                    message: "Ticket or technician not found."
                }, 404);
            }

            ticket.assigned_to = technician.id;
            ticket.assignee_first_name = technician.first_name;
            ticket.assignee_last_name = technician.last_name;
            ticket.updated_at = new Date().toISOString();

            saveData();

            recordActivity(
                "Ticket Assigned",
                `${ticket.ticket_reference} assigned to ${technician.first_name} ${technician.last_name}`
            );

            return response({
                success: true,
                message: "Technician assigned successfully.",
                ticket
            });
        }

        const statusMatch = path.match(
            /^\/tickets\/(\d+)\/status$/
        );

        if (statusMatch && method === "PATCH") {
            if (!hasRole(
                "owner",
                "administrator",
                "it_manager",
                "technician"
            )) return denied();

            const ticket = findTicket(statusMatch[1]);

            if (!ticket) {
                return response({
                    success: false,
                    message: "Ticket not found."
                }, 404);
            }

            if (
                user.role === "technician" &&
                Number(ticket.assigned_to) !== user.id
            ) return denied();

            const allowedStatuses = [
                "Open",
                "In Progress",
                "Pending",
                "Resolved"
            ];

            if (!allowedStatuses.includes(body.status)) {
                return response({
                    success: false,
                    message: "Invalid ticket status."
                }, 400);
            }

            const previousStatus = ticket.status;

            ticket.status = body.status;
            ticket.updated_at = new Date().toISOString();
            ticket.resolved_at = body.status === "Resolved"
                ? ticket.updated_at
                : null;

            data.ticketUpdates.unshift({
                id: Date.now(),
                ticket_id: ticket.id,
                previous_status: previousStatus,
                new_status: body.status,
                message: body.message || "Ticket updated.",
                first_name: user.first_name,
                last_name: user.last_name,
                created_at: ticket.updated_at
            });

            saveData();

            recordActivity(
                "Ticket Updated",
                `${ticket.ticket_reference}: ${previousStatus} → ${body.status}`
            );

            return response({
                success: true,
                message: "Ticket status updated successfully.",
                ticket
            });
        }

        // ASSETS

        if (path === "/assets" && method === "GET") {
            if (!hasRole(
                "owner",
                "administrator",
                "it_manager",
                "technician",
                "auditor"
            )) return denied();

            return response({
                success: true,
                count: data.assets.length,
                assets: data.assets
            });
        }

        if (path === "/assets/activity" && method === "GET") {
            if (!hasRole(
                "owner",
                "administrator",
                "it_manager",
                "technician",
                "auditor"
            )) return denied();

            return response({
                success: true,
                count: data.activity.length,
                activity: data.activity
            });
        }

        const assetMatch = path.match(/^\/assets\/(\d+)$/);

        if (assetMatch && method === "GET") {
            const asset = findAsset(assetMatch[1]);

            return asset
                ? response({ success: true, asset })
                : response({
                    success: false,
                    message: "Asset not found."
                }, 404);
        }

        // ASSET EMPLOYEES

        if (path === "/assets/employees" && method === "GET") {
            if (!hasRole("owner", "administrator", "it_manager")) {
                return denied();
            }

            const employees = data.users.filter(item =>
                item.status === "active" &&
                item.role === "employee"
            );

            return response({
                success: true,
                count: employees.length,
                employees
            });
        }

        // ASSET MAINTENANCE

        const maintenanceMatch = path.match(
            /^\/assets\/(\d+)\/maintenance$/
        );

        if (maintenanceMatch && method === "GET") {
            const asset = findAsset(maintenanceMatch[1]);

            if (!asset) {
                return response({
                    success: false,
                    message: "Asset not found."
                }, 404);
            }

            return response({
                success: true,
                maintenance: data.maintenance.filter(
                    item => String(item.asset_id) === String(asset.id)
                )
            });
        }

        // DEMO FALLBACK

        return response({
            success: false,
            message: "This demo action is not yet available."
        }, 501);
    };

    window.SamEnterpriseDemo = {
        reset: function () {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(SESSION_KEY);

            data = clone(initialData);
            saveData();

            window.location.reload();
        },

        getCurrentUser: currentUser,

        getData: function () {
            return data;
        },

        getRoles: function () {
            return { ...ROLE_HIERARCHY };
        }
    };

    saveData();

    console.info(
        "Sam Enterprise frontend demo engine loaded successfully."
    );

})();
