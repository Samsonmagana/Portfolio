
const API_BASE_URL = "http://127.0.0.1:5000/api";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("togglePassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const rememberMeCheckbox = document.getElementById("rememberMe");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

function showMessage(message, type = "error") {
    loginMessage.textContent = message;
    loginMessage.classList.add("visible");

    loginMessage.classList.remove("success", "error");
    loginMessage.classList.add(type);
}

function clearMessages() {
    emailError.textContent = "";
    passwordError.textContent = "";

    loginMessage.textContent = "";
    loginMessage.classList.remove("visible", "success", "error");
}

togglePasswordButton.addEventListener("click", function () {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";

    togglePasswordButton.textContent =
        isPasswordHidden ? "Hide" : "Show";

    togglePasswordButton.setAttribute(
        "aria-label",
        isPasswordHidden ? "Hide password" : "Show password"
    );
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    clearMessages();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let isValid = true;

    if (!email) {
        emailError.textContent =
            "Please enter your work email address.";

        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent =
            "Please enter a valid email address.";

        isValid = false;
    }

    if (!password) {
        passwordError.textContent =
            "Please enter your password.";

        isValid = false;
    }

    if (!isValid) {
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/login`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        let result = {};

        try {
            result = await response.json();
        } catch {
            result = {};
        }

        if (!response.ok) {
            throw new Error(
                result.message || "Login failed. Please check your credentials."
            );
        }

        if (!result.success) {
            throw new Error(
                result.message || "Unable to sign in."
            );
        }

        showMessage(
            "Login successful. Redirecting to your dashboard...",
            "success"
        );

        loginButton.textContent = "Success";

        window.location.href = "../index.html";

    } catch (error) {
        console.error("Login error:", error);

        showMessage(
            error.message ||
            "Unable to connect to the server. Please try again."
        );

        loginButton.disabled = false;
        loginButton.innerHTML =
            'Sign In <span aria-hidden="true">→</span>';
    }
});

document.getElementById("forgotPassword").addEventListener(
    "click",
    function (event) {
        event.preventDefault();

        showMessage(
            "Password recovery is not available yet. Please contact your system administrator."
        );
    }
);
