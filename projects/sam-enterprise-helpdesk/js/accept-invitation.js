
const acceptInvitationForm = document.getElementById("acceptInvitationForm");
const message = document.getElementById("message");
const acceptButton = document.getElementById("acceptButton");

const urlParams = new URLSearchParams(window.location.search);
const invitationToken = urlParams.get("token");

if (!invitationToken) {
    message.textContent = "Invalid invitation link. No invitation token was provided.";
    message.style.color = "red";
    acceptButton.disabled = true;
}

acceptInvitationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 12) {
        message.textContent = "Your password must contain at least 12 characters.";
        message.style.color = "red";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Your passwords do not match.";
        message.style.color = "red";
        return;
    }

    acceptButton.disabled = true;
    acceptButton.textContent = "Activating Account...";

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/accept-invitation",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: invitationToken,
                    password: password
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to activate your account.");
        }

        message.textContent = "Your account has been activated successfully. You can now log in.";
        message.style.color = "green";

        acceptInvitationForm.reset();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";

    } finally {
        acceptButton.disabled = false;
        acceptButton.textContent = "Activate Account";
    }
});
