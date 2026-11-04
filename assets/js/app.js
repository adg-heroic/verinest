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
  if (!API_BASE_URL) throw new Error("The VeriNest API is not connected yet. The frontend is ready for deployment, but a public API URL still needs to be configured.");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body;
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
}

async function loadAccount() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || !API_BASE_URL) return;
  try {
    const data = await api("/api/v1/account/me", { headers: { authorization: `Bearer ${token}` } });
    renderAccount(data);
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

$(".demo-action").addEventListener("click", () => showToast("Demo request created locally. No live service was contacted."));

loadAccount();