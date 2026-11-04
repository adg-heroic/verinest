document.getElementById("year").textContent = new Date().getFullYear();
const action = document.querySelector(".demo-action");
const toast = document.querySelector(".toast");
action.addEventListener("click", () => {
  toast.classList.add("show");
  action.textContent = "Demo request created ✓";
  action.disabled = true;
  setTimeout(() => {
    toast.classList.remove("show");
    action.innerHTML = "Create demo request <span>→</span>";
    action.disabled = false;
  }, 3500);
});