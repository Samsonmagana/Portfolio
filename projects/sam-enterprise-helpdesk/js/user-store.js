
// ============================================
// SAM ENTERPRISE - SHARED USER DATA MANAGER
// ============================================

(function () {

    const STORAGE_KEY = "samEnterpriseUsers";


    // Initial demonstration users

    const defaultUsers = [

        {
            id: "USR-001",
            employeeNumber: "SE-EMP-001",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@samenterprise.co.za",
            phone: "+27 11 000 0001",
            department: "Finance",
            role: "Employee",
            status: "Active",
            createdAt: "2026-01-10T08:00:00.000Z"
        },

        {
            id: "USR-002",
            employeeNumber: "SE-EMP-002",
            firstName: "Sarah",
            lastName: "Jones",
            email: "sarah.jones@samenterprise.co.za",
            phone: "+27 11 000 0002",
            department: "Human Resources",
            role: "Employee",
            status: "Active",
            createdAt: "2026-01-12T08:00:00.000Z"
        },

        {
            id: "USR-003",
            employeeNumber: "SE-TECH-001",
            firstName: "Alex",
            lastName: "Morgan",
            email: "alex.morgan@samenterprise.co.za",
            phone: "+27 11 000 0003",
            department: "Information Technology",
            role: "Technician",
            status: "Active",
            createdAt: "2026-01-15T08:00:00.000Z"
        },

        {
            id: "USR-004",
            employeeNumber: "SE-TECH-002",
            firstName: "David",
            lastName: "Brown",
            email: "david.brown@samenterprise.co.za",
            phone: "+27 11 000 0004",
            department: "Information Technology",
            role: "Technician",
            status: "Active",
            createdAt: "2026-01-18T08:00:00.000Z"
        },

        {
            id: "USR-005",
            employeeNumber: "SE-TECH-003",
            firstName: "Peter",
            lastName: "Wilson",
            email: "peter.wilson@samenterprise.co.za",
            phone: "+27 11 000 0005",
            department: "Information Technology",
            role: "Technician",
            status: "Active",
            createdAt: "2026-01-20T08:00:00.000Z"
        },

        {
            id: "USR-006",
            employeeNumber: "SE-ADM-001",
            firstName: "System",
            lastName: "Admin",
            email: "admin@samenterprise.co.za",
            phone: "+27 11 000 0006",
            department: "Administration",
            role: "Administrator",
            status: "Active",
            createdAt: "2026-01-01T08:00:00.000Z"
        },

        {
            id: "USR-007",
            employeeNumber: "SE-EMP-003",
            firstName: "Emily",
            lastName: "Davis",
            email: "emily.davis@samenterprise.co.za",
            phone: "+27 11 000 0007",
            department: "Operations",
            role: "Employee",
            status: "Inactive",
            createdAt: "2026-01-22T08:00:00.000Z"
        }

    ];


    function getAll() {

        try {

            let savedUsers = localStorage.getItem(STORAGE_KEY);


            // Initialise sample users only once

            if (savedUsers === null) {

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(defaultUsers)
                );

                return [...defaultUsers];

            }


            const users = JSON.parse(savedUsers);

            return Array.isArray(users) ? users : [];

        } catch (error) {

            console.error("Unable to retrieve user records:", error);

            return [];

        }

    }


    function save(users) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(users)
            );

            return true;

        } catch (error) {

            console.error("Unable to save user records:", error);

            return false;

        }

    }


    // Expose the shared data functions

    window.SamUserStore = {

        getAll,

        save,

        storageKey: STORAGE_KEY

    };

})();
