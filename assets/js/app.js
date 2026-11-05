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
const adminModal = $("#admin-modal");

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
  const labels = { PENDING: "Demo request received", PROCESSING: "Processing", COMPLETED: "Completed", FAILED: "Failed" };
  return labels[status] || status.replaceAll("_", " ");
}

function statusClass(status) {
  return status === "COMPLETED" ? "complete" : status === "PROCESSING" ? "processing" : status === "FAILED" ? "failed" : "pending";
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
function closeAdmin() { adminModal.classList.remove("open"); adminModal.setAttribute("aria-hidden","true"); }
async function loadAdminSummary() {
  const list = $("#admin-recent");
  list.innerHTML = '<p class="admin-empty">Loading administrator data…</p>';
  const data = await api("/api/v1/admin/summary", { headers: { authorization: `Bearer ${getToken()}` } });
  $("#admin-users").textContent = String(data.users ?? 0);
  $("#admin-requests").textContent = String(data.requests ?? 0);
  $("#admin-events").textContent = String((data.recent || []).length);
  list.innerHTML = "";
  if (!(data.recent || []).length) { list.innerHTML = '<p class="admin-empty">No recent audit events yet.</p>'; return; }
  for (const event of data.recent) {
    const row = document.createElement("div"); row.className = "admin-event";
    const who = event.user?.name || event.user?.email || "System";
    const action = event.action || event.type || "Account activity";
    row.innerHTML = "<div><strong></strong><span></span></div><time></time>";
    row.querySelector("strong").textContent = who;
    row.querySelector("span").textContent = String(action).replaceAll("_"," ");
    row.querySelector("time").textContent = formatDate(event.createdAt);
    list.appendChild(row);
  }
}
async function loadAdminRequests() {
  const list = $("#admin-requests-list");
  list.innerHTML = '<p class="admin-empty">Loading demo requests…</p>';
  const data = await api("/api/v1/admin/requests?limit=100", { headers: { authorization: `Bearer ${getToken()}` } });
  list.innerHTML = "";
  if (!(data.requests || []).length) { list.innerHTML = '<p class="admin-empty">No demo requests have been created yet.</p>'; return; }
  for (const item of data.requests) {
    const row = document.createElement("div");
    row.className = "admin-request";
    row.innerHTML = '<div class="admin-request-info"><strong></strong><span></span><small></small></div><b class="badge"></b>';
    const info = row.querySelector(".admin-request-info");
    info.querySelector("strong").textContent = item.reference + " · " + (item.user?.name || "Unknown user");
    info.querySelector("span").textContent = item.service + " · " + item.country;
    info.querySelector("small").textContent = item.user?.email || "";
    const badge = row.querySelector("b");
    badge.className = `badge ${statusClass(item.status)}`;
    badge.textContent = statusLabel(item.status);
    list.appendChild(row);
  }
}\nasync function openAdmin() {
  if (!currentUser || currentUser.role !== "ADMIN") { showToast("Administrator access is required."); return; }
  adminModal.classList.add("open"); adminModal.setAttribute("aria-hidden","false");
  try { await loadAdminSummary(); } catch (error) { $("#admin-recent").innerHTML = '<p class="admin-empty"></p>'; $("#admin-recent").firstChild.textContent = error.message; }
}
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
  $("#admin-button").hidden = user.role !== "ADMIN";
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
  $("#admin-button").hidden = true;
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
$("#admin-button").addEventListener("click", openAdmin);
$("#admin-refresh").addEventListener("click", () => loadAdminSummary().catch(error => showToast(error.message)));
$("#admin-load-requests").addEventListener("click", () => loadAdminRequests().catch(error => showToast(error.message)));
document.querySelectorAll("[data-close-admin]").forEach(element => element.addEventListener("click", closeAdmin));
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

const menuToggle = $("#menu-toggle");
const sideMenu = $("#side-menu");
const infoModal = $("#info-modal");
function openMenu() { sideMenu.classList.add("open"); sideMenu.setAttribute("aria-hidden","false"); menuToggle.setAttribute("aria-expanded","true"); }
function closeMenu() { sideMenu.classList.remove("open"); sideMenu.setAttribute("aria-hidden","true"); menuToggle.setAttribute("aria-expanded","false"); }
function closeInfo() { infoModal.classList.remove("open"); infoModal.setAttribute("aria-hidden","true"); }
function openInfo(type) {
  const title=$("#info-title"), kicker=$("#info-kicker"), content=$("#info-content"), disclaimer=$("#info-disclaimer");
  const pages={
    support:{kicker:"Support center",title:"How can we help?",content:"<p>If you need help with your account or a demo request, start by checking the FAQ below. Support for live verification services will be added only when those services are officially available.</p><div class='info-callout'><strong>Account help</strong><span>Use your Profile and Security settings to manage your account. If you cannot sign in, contact the VeriNest team through the support channel that will be published before public launch.</span></div>"},
    faq:{kicker:"Help center",title:"Frequently asked questions",content:"<div class='faq-item'><strong>Is VeriNest live?</strong><p>VeriNest is currently a prototype. No live verification provider is connected yet.</p></div><div class='faq-item'><strong>What does Demo request received mean?</strong><p>Your request was saved successfully, but no real verification service has been contacted.</p></div><div class='faq-item'><strong>Can I change my account details?</strong><p>Yes. Open your profile from your account avatar to update your name, and use Security to change your password.</p></div><div class='faq-item'><strong>When will live services be available?</strong><p>Only after an appropriate authorized provider is selected and the necessary compliance and integration work is complete.</p></div>"},
    about:{kicker:"About",title:"About VeriNest",content:"<p>VeriNest is being developed as a professional platform for legitimate, authorized verification and testing workflows.</p><p>Our current focus is building a trustworthy user experience, secure account infrastructure, and a responsible foundation before introducing any live provider services.</p>"},privacy:{kicker:"Privacy",title:"Privacy overview",content:"<p>VeriNest currently collects the information needed to operate the prototype, including your name, email address, account credentials, and demo request records.</p><div class='faq-item'><strong>How information is used</strong><p>Account information is used to provide sign-in, profile management, security features, and request history.</p></div><div class='faq-item'><strong>Prototype status</strong><p>No live verification provider is currently connected through this prototype.</p></div>",disclaimer:"This prototype privacy notice should be reviewed and replaced with a jurisdiction-appropriate policy before public launch."},terms:{kicker:"Terms",title:"Terms of use",content:"<p>VeriNest is currently a development prototype. Use is limited to legitimate, authorized testing and business workflows.</p><div class='faq-item'><strong>Acceptable use</strong><p>You must not use the platform for fraud, unauthorized access, evasion of security controls, or unlawful activity.</p></div><div class='faq-item'><strong>Prototype features</strong><p>Features and request activity may be simulated while the platform is under development.</p></div>",disclaimer:"These prototype terms should be reviewed for your business model and applicable laws before public launch."},responsible:{kicker:"Responsible use",title:"Built for authorized workflows",content:"<p>VeriNest is intended for legitimate verification, testing, and authorized business workflows.</p><div class='faq-item'><strong>What we support</strong><p>Authorized testing and business processes permitted by the relevant service provider.</p></div><div class='faq-item'><strong>What we do not support</strong><p>Fraud, impersonation, account takeover, bypassing security controls, or other unauthorized activity.</p></div><div class='faq-item'><strong>Future providers</strong><p>Any future live provider must explicitly permit the intended use and be integrated with appropriate compliance and security controls.</p></div>",disclaimer:"No live verification provider is currently connected to VeriNest."}
  };
  const page=pages[type]; if(!page)return; kicker.textContent=page.kicker; title.textContent=page.title; content.innerHTML=page.content; disclaimer.textContent=page.disclaimer || ""; infoModal.classList.add("open"); infoModal.setAttribute("aria-hidden","false");
}
menuToggle?.addEventListener("click", openMenu);
document.querySelectorAll("[data-close-menu]").forEach(el=>el.addEventListener("click",closeMenu));
document.querySelectorAll("[data-menu-link]").forEach(el=>el.addEventListener("click",closeMenu));
document.querySelectorAll("[data-menu-action]").forEach(el=>el.addEventListener("click",()=>{const action=el.dataset.menuAction;closeMenu();openInfo(action);}));
document.querySelectorAll("[data-open-menu-support]").forEach(el=>el.addEventListener("click",()=>openInfo("support")));
document.querySelectorAll("[data-open-menu-faq]").forEach(el=>el.addEventListener("click",()=>openInfo("faq")));
document.querySelectorAll("[data-open-menu-about]").forEach(el=>el.addEventListener("click",()=>openInfo("about")));\ndocument.querySelectorAll("[data-open-menu-privacy]").forEach(el=>el.addEventListener("click",()=>openInfo("privacy")));\ndocument.querySelectorAll("[data-open-menu-terms]").forEach(el=>el.addEventListener("click",()=>openInfo("terms")));\ndocument.querySelectorAll("[data-open-menu-responsible]").forEach(el=>el.addEventListener("click",()=>openInfo("responsible")));
document.querySelectorAll("[data-close-info]").forEach(el=>el.addEventListener("click",closeInfo));
