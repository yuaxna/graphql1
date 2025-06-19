const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usernameOrEmail = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // Validate inputs
  if (!usernameOrEmail || !password) {
    errorDiv.textContent = "Please fill in both fields.";
    return;
  }

  // Prepare Basic Auth header
  const credentials = btoa(`${usernameOrEmail}:${password}`);
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${credentials}`,
  };

  try {
    const response = await fetch("https://learn.reboot01.com/api/auth/signin", {
      method: "POST",
      headers: headers,
    });

    if (!response.ok) {
      // Handle invalid credentials
      const errorData = await response.json();
      errorDiv.textContent = errorData.message || "Invalid credentials.";
      return;
    }

    // Inside your successful login response handler in login.js:
    const data = await response.json();
    const token = data;

    // Save both the JWT and the username
    localStorage.setItem("jwt", token);
    localStorage.setItem("username", usernameOrEmail);  // Add this line

    // Redirect to profile page
    window.location.href = "profile.html";
  } catch (error) {
    console.error("Login error:", error);
    errorDiv.textContent = "An error occurred. Please try again later.";
  }
});
