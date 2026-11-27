
/**
 * Sam Enterprise
 * Main Frontend Application
 *
 * Handles shared interface functionality, including:
 * - Current date display
 * - Mobile sidebar navigation
 * - Sidebar overlay interactions
 * - Lucide icon initialization
 */

"use strict";

/**
 * Displays the current date in the South African date format.
 */
function initializeCurrentDate() {
    const dateElement = document.getElementById("currentDate");

    if (!dateElement) {
        return;
    }

    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

/**
 * Initializes the responsive sidebar and its overlay.
 */
function initializeMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");

    if (!sidebar || !menuToggle) {
        return;
    }

    const overlay = document.createElement("div");

    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    function openSidebar() {
        sidebar.classList.add("open");
        overlay.classList.add("show");
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    }

    menuToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener("click", closeSidebar);
}

/**
 * Initializes Lucide icons when the library is available.
 */
function initializeIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Initializes the shared application interface.
 */
function initializeApplication() {
    initializeCurrentDate();
    initializeMobileSidebar();
    initializeIcons();
}

initializeApplication();
