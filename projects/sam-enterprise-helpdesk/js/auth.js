
/**
 * Sam Enterprise Authentication Manager
 * Handles current-user information, authentication checks,
 * role permissions and user logout.
 */

(function () {
    "use strict";

    const API_BASE_URL = "http://127.0.0.1:5000/api";

    const ROLE_HIERARCHY = {
        owner: 6,
        administrator: 5,
        it_manager: 4,
        technician: 3,
        employee: 2,
        auditor: 1
    };

    let currentUser = null;

    /**
     * Retrieves the currently authenticated user from the backend.
     */
    async function getCurrentUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                currentUser = null;

                return {
                    success: false,
                    message: data.message || "Unable to retrieve user information.",
                    user: null
                };
            }

            currentUser = data.user;

            return {
                success: true,
                message: data.message,
                user: currentUser
            };

        } catch (error) {
            console.error("Authentication error:", error);

            currentUser = null;

            return {
                success: false,
                message: "Unable to connect to the authentication server.",
                user: null
            };
        }
    }

    /**
     * Returns the currently cached user.
     */
    function getUser() {
        return currentUser;
    }

    /**
     * Checks whether a user is authenticated.
     * Redirects unauthenticated users to the login page.
     */
    async function requireAuth() {
        const result = await getCurrentUser();

        if (!result.success) {
            const isPagesDirectory = window.location.pathname.includes("/pages/");

            const loginUrl = isPagesDirectory
                ? "login.html"
                : "pages/login.html";

            window.location.replace(loginUrl);

            return null;
        }

        return result.user;
    }

    /**
     * Checks whether the current user has one of the specified roles.
     */
    function hasRole(...allowedRoles) {
        if (!currentUser) {
            return false;
        }

        return allowedRoles.includes(currentUser.role);
    }

    /**
     * Checks whether the current user meets a minimum role level.
     */
    function hasMinimumRole(requiredRole) {
        if (!currentUser || !ROLE_HIERARCHY[requiredRole]) {
            return false;
        }

        const userLevel = ROLE_HIERARCHY[currentUser.role];
        const requiredLevel = ROLE_HIERARCHY[requiredRole];

        return Boolean(userLevel && userLevel >= requiredLevel);
    }

    /**
     * Logs out the current user and ends the backend session.
     */
    async function logout() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to log out.");
            }

            currentUser = null;

            const isPagesDirectory = window.location.pathname.includes("/pages/");

            const loginUrl = isPagesDirectory
                ? "login.html"
                : "pages/login.html";

            window.location.replace(loginUrl);

            return {
                success: true,
                message: data.message
            };

        } catch (error) {
            console.error("Logout error:", error);

            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Makes authentication functions available throughout the frontend.
     */
    window.SamAuth = {
        getCurrentUser,
        getUser,
        requireAuth,
        hasRole,
        hasMinimumRole,
        logout
    };

})();
