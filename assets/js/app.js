const API_BASE_URL = window.VERINEST_API_URL || "https://verinest.onrender.com";
const TOKEN_KEY = "verinest_access_token";

const $ = selector => document.querySelector(selector);
const toast = $(".toast");
const modal = $("#auth-modal");
const authForm = $("#auth-form");
const authTrigger = $("#auth-trigger");
const heroAuth = $("#hero-auth");
const authSwitch = $("#auth-switch");
const formMessage = $("#form-message");
const accountStrip = $("#account-strip");
const requestButton = $(".demo-action");
const requestHistory = $("#request-history");
let authMode = "login";

$("#year").textContent = new Date().getFullYear();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3500);
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "register";
  $(".signup-only").hidden = !signup;
  $("#auth-title").textContent = signup ? "Create your account" : "Welcome back";
  $("#auth-description").textContent = signup ? "Create an account to connect your profile to the VeriNest prototype." : "Sign in to access your VeriNest account.";
  $("#auth-submit").innerHTML = signup ? "Create account <span>→</span>" : "Sign in <span>→</span>";
  $("#auth-switch-copy").textContent = signup ? "Already have an account?" : "New to VeriNest?";
  authSwitch.textContent = signup ? "Sign in" : "Create an account";
  $("#auth-password").autocomplete = signup ? "new-password" : "current-password";
  $("#password-help").textContent = signup ? "Use 12–128 characters." : "Use your existing account password.";
  formMessage.textContent = "";
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => $("#auth-email").focus(), 50);
}

function closeAuth() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  formMessage.textContent = "";
}

function setLoading(loading) {
  $("#auth-submit").disabled = loading;
  $("#auth-submit").textContent = loading ? "Please wait…" : "";
  if (!loading) setAuthMode(authMode);
}

async function api(path, options = {}) {
  if (!API_BASE_URL) throw new Error("The VeriNest API is not connected yet.");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function statusLabel(status) {
  return status === "PENDING" ? "Demo pending" : status.replaceAll("_", " ");
}

function renderRequests(requests) {
  if (!requestHistory) return;
  requestHistory.innerHTML = "";
  if (!requests.length) {
    requestHistory.innerHTML = '<div class="table-row"><span class="reference">—</span><span>No demo requests yet</span><span>—</span><span><b class="badge pending">Ready</b></span></div>';
    return;
  }
  for (const request of requests) {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `<span class="reference"></span><span></span><span></span><span><b class="badge pending"></b></span>`;
    row.children[0].textContent = request.reference;
    row.children[1].textContent = request.service;
    row.children[2].textContent = request.country;
    row.querySelector("b").textContent = statusLabel(request.status);
    requestHistory.appendChild(row);
  }
}

async function loadRequests() {
  const token = getToken();
  if (!token) return;
  try {
    const data = await api("/api/v1/requests", { headers: { authorization: `Bearer ${token}` } });
    renderRequests(data.requests || []);
  } catch (error) {
    console.error("Could not load demo requests:", error);
  }
}

function renderAccount(data) {
  const { user, account } = data;
  $("#balance").innerHTML = `$${Number(account?.balance || 0).toFixed(2)} <small>${account?.currency || "USD"}</small>`;
  $("#balance-note").innerHTML = '<span class="pulse"></span> Account data loaded securely';
  $("#account-badge").textContent = "ACCOUNT";
  $("#account-status").textContent = "Signed in";
  $("#auth-trigger").hidden = true;
  $("#avatar").hidden = false;
  $("#avatar").textContent = (user.name || "VN").split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
  $("#account-name").textContent = user.name;
  $("#account-email").textContent = user.email;
  accountStrip.hidden = false;
  requestButton.disabled = false;
}

function clearAccount() {
  localStorage.removeItem(TOKEN_KEY);
  $("#balance").innerHTML = '$0.00 <small>USD</small>';
  $("#balance-note").innerHTML = '<span class="pulse"></span> Sign in to load your account';
  $("#account-badge").textContent = "DEMO";
  $("#account-status").textContent = "Demo mode";
  $("#auth-trigger").hidden = false;
  $("#avatar").hidden = true;
  accountStrip.hidden = true;
  requestButton.disabled = false;
  if (requestHistory) requestHistory.innerHTML = '<div class="table-row"><span class="reference">VN-DEMO-1042</span><span>Application testing</span><span>United States</span><span><b class="badge complete">Completed demo</b></span></div><div class="table-row"><span class="reference">VN-DEMO-1039</span><span>Sandbox / test workflow</span><span>United Kingdom</span><span><b class="badge complete">Completed demo</b></span></div><div class="table-row"><span class="reference">VN-DEMO-1036</span><span>Authorized business verification</span><span>Canada</span><span><b class="badge pending">Illustrative</b></span></div>';
}

async function loadAccount() {
  const token = getToken();
  if (!token || !API_BASE_URL) return;
  try {
    const data = await api("/api/v1/account/me", { headers: { authorization: `Bearer ${token}` } });
    renderAccount(data);
    await loadRequests();
  } catch {
    clearAccount();
  }
}

authTrigger.addEventListener("click", () => openAuth("login"));
heroAuth.addEventListener("click", () => openAuth("register"));
document.querySelectorAll("[data-close-auth]").forEach(element => element.addEventListener("click", closeAuth));
authSwitch.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  const name = $("#auth-name").value.trim();
  if (authMode === "register" && name.length < 2) {
    formMessage.textContent = "Please enter your name.";
    return;
  }
  setLoading(true);
  formMessage.textContent = "";
  try {
    const path = authMode === "register" ? "/api/v1/auth/register" : "/api/v1/auth/login";
    const payload = authMode === "register" ? { name, email, password } : { email, password };
    const result = await api(path, { method: "POST", body: JSON.stringify(payload) });
    localStorage.setItem(TOKEN_KEY, result.token);
    authForm.reset();
    closeAuth();
    await loadAccount();
    showToast(authMode === "register" ? "Your VeriNest account has been created." : "Welcome back to VeriNest.");
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    setLoading(false);
  }
});

$("#logout-button").addEventListener("click", () => {
  clearAccount();
  showToast("You have been signed out.");
});

requestButton.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    showToast("Please sign in before creating a demo request.");
    openAuth("login");
    return;
  }
  requestButton.disabled = true;
  const original = requestButton.innerHTML;
  requestButton.textContent = "Creating demo request…";
  try {
    const result = await api("/api/v1/requests", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ country: $("#country").value, service: $("#service").value })
    });
    await loadRequests();
    showToast(result.message || "Demo request created.");
  } catch (error) {
    showToast(error.message);
  } finally {
    requestButton.disabled = false;
    requestButton.innerHTML = original;
  }
});

loadAccount();