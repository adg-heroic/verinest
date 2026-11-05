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
const viewAllActivity = $("#view-all-activity");
let recentRequests = [];
let authMode = "login";
let currentUser = null;
const detailsModal = $("#details-modal");
const profileModal = $("#profile-modal");
const securityModal = $("#security-modal");

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
  const labels = { PENDING: "Demo pending", PROCESSING: "Demo processing", COMPLETED: "Demo completed" };
  return labels[status] || status.replaceAll("_", " ");
}

function statusClass(status) {
  return status === "COMPLETED" ? "complete" : status === "PROCESSING" ? "processing" : "pending";
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function updateStats(requests) {
  $("#request-count").textContent = String(requests.length);
  const completed = requests.filter(request => request.status === "COMPLETED").length;
  $("#completion-rate").textContent = requests.length ? `${Math.round((completed / requests.length) * 100)}%` : "—";
  $("#latest-request").textContent = requests.length ? formatDate(requests[0].createdAt) : "—";
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
    row.className = "table-row request-row";
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.innerHTML = `<span class="reference"></span><span></span><span></span><span><b class="badge pending"></b></span><span class="request-date"></span>`;
    row.children[0].textContent = request.reference;
    row.children[1].textContent = request.service;
    row.children[2].textContent = request.country;
    row.querySelector("b").className = `badge ${statusClass(request.status)}`;
    row.querySelector("b").textContent = statusLabel(request.status);
    row.querySelector(".request-date").textContent = formatDate(request.createdAt);
    row.addEventListener("click", () => openRequestDetails(request));
    row.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRequestDetails(request); } });
    requestHistory.appendChild(row);
  }
}

async function loadRequests() {
  const token = getToken();
  if (!token) return;
  try {
    const data = await api("/api/v1/requests?limit=10", { headers: { authorization: `Bearer ${token}` } });
    recentRequests = data.requests || [];
    renderRequests(recentRequests);
    updateStats(recentRequests);
  } catch (error) {
    console.error("Could not load demo requests:", error);
  }
}

function openRequestDetails(request) {
  $("#details-content").innerHTML = `<dl class="details-list"><div><dt>Reference</dt><dd>${request.reference}</dd></div><div><dt>Service category</dt><dd>${request.service}</dd></div><div><dt>Region</dt><dd>${request.country}</dd></div><div><dt>Status</dt><dd><b class="badge ${statusClass(request.status)}">${statusLabel(request.status)}</b></dd></div><div><dt>Created</dt><dd>${formatDate(request.createdAt)}</dd></div></dl>`;
  detailsModal.classList.add("open"); detailsModal.setAttribute("aria-hidden", "false");
}
function closeDetails() { detailsModal.classList.remove("open"); detailsModal.setAttribute("aria-hidden", "true"); }
function openProfile() { if (!currentUser) return; $("#profile-name").value = currentUser.name || ""; $("#profile-email").value = currentUser.email || ""; $("#profile-message").textContent = ""; profileModal.classList.add("open"); profileModal.setAttribute("aria-hidden", "false"); }
function closeProfile() { profileModal.classList.remove("open"); profileModal.setAttribute("aria-hidden", "true"); }
function openSecurity() { $("#security-message").textContent=""; $("#password-form").reset(); passwordFeedback(""); securityModal.classList.add("open"); securityModal.setAttribute("aria-hidden","false"); window.setTimeout(() => $("#current-password").focus(), 50); }
function closeSecurity() { securityModal.classList.remove("open"); securityModal.setAttribute("aria-hidden","true"); }
function passwordFeedback(password) {
  const help = $("#password-strength");
  if (!password) { help.textContent = "Use 12–128 characters. A unique passphrase is recommended."; return; }
  const strong = password.length >= 16 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[^A-Za-z0-9]/.test(password);
  help.textContent = password.length < 12 ? `${password.length}/12 characters — add more characters.` : strong ? "Strong password length and character mix." : "Password meets the minimum length. Consider using a longer, unique passphrase.";
}

function renderAccount(data) {
  const { user, account } = data;
  currentUser = user;
  document.body.classList.add("signed-in");
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
  currentUser = null;
  document.body.classList.remove("signed-in");
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
$("#avatar").addEventListener("click", openProfile);
document.querySelectorAll("[data-close-details]").forEach(element => element.addEventListener("click", closeDetails));
document.querySelectorAll("[data-close-profile]").forEach(element => element.addEventListener("click", closeProfile));
document.querySelectorAll("[data-close-security]").forEach(element => element.addEventListener("click", closeSecurity));
$("#security-button").addEventListener("click", openSecurity);
$("#new-password").addEventListener("input", event => passwordFeedback(event.target.value));

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

$("#profile-form").addEventListener("submit", async event => {
  event.preventDefault();
  const name = $("#profile-name").value.trim();
  if (name.length < 2) { $("#profile-message").textContent = "Please enter at least 2 characters."; return; }
  try {
    const data = await api("/api/v1/account/profile", { method: "PATCH", headers: { authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ name }) });
    currentUser = data.user; $("#account-name").textContent = data.user.name;
    $("#avatar").textContent = data.user.name.split(/\s+/).map(part => part[0]).slice(0,2).join("").toUpperCase();
    closeProfile(); showToast("Profile updated successfully.");
  } catch (error) { $("#profile-message").textContent = error.message; }
});

$("#password-form").addEventListener("submit", async event => { event.preventDefault(); const currentPassword=$("#current-password").value; const newPassword=$("#new-password").value; const message=$("#security-message"); const submit=event.currentTarget.querySelector("button[type=submit]"); message.textContent=""; if(newPassword.length<12){message.textContent="Your new password must contain at least 12 characters."; return;} if(currentPassword===newPassword){message.textContent="Choose a new password that is different from your current password."; return;} submit.disabled=true; submit.textContent="Updating password…"; try { const result=await api("/api/v1/account/password",{method:"PATCH",headers:{authorization:`Bearer ${getToken()}`},body:JSON.stringify({currentPassword,newPassword})}); $("#password-form").reset(); passwordFeedback(""); closeSecurity(); showToast(result.message || "Password updated successfully."); } catch(error){message.textContent=error.message;} finally {submit.disabled=false; submit.textContent="Update password";} });

$("#logout-button").addEventListener("click", () => {
  clearAccount();
  showToast("You have been signed out.");
});

viewAllActivity.addEventListener("click", async () => {
  const token = getToken();
  if (!token) { showToast("Please sign in to view your activity."); openAuth("login"); return; }
  const showingAll = viewAllActivity.dataset.all === "true";
  try {
    if (showingAll) {
      renderRequests(recentRequests);
      viewAllActivity.dataset.all = "false";
      viewAllActivity.textContent = "View all activity";
    } else {
      const data = await api("/api/v1/requests?limit=100", { headers: { authorization: `Bearer ${token}` } });
      renderRequests(data.requests || []);
      updateStats(data.requests || []);
      viewAllActivity.dataset.all = "true";
      viewAllActivity.textContent = "Show recent activity";
      showToast(`Showing ${data.requests?.length || 0} saved demo requests.`);
    }
  } catch (error) { showToast(error.message); }
});

requestButton.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    showToast("Please sign in before creating a demo request.");
    openAuth("login");
    return;
  }
  requestButton.disabled = true;
  requestButton.setAttribute("aria-busy", "true");
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
    requestButton.removeAttribute("aria-busy");
  }
});

loadAccount();