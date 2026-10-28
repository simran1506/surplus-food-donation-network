const donationList = document.getElementById("donation-list");
const donationForm = document.getElementById("donation-form");
const requestDialog = document.getElementById("request-dialog");
const requestForm = document.getElementById("request-form");
const notice = document.getElementById("notice");
const foodFilter = document.getElementById("food-filter");

const FOOD_EMOJI = {
  "Cooked Meals": "🍲",
  "Fruits & Vegetables": "🥦",
  "Bakery": "🥖",
  "Packaged Food": "🥫",
  "Other": "🍱"
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;
  notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideNotice() {
  notice.hidden = true;
  notice.textContent = "";
  notice.classList.remove("error");
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

function formatDate(value) {
  if (!value) return "Coordinate with donor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Coordinate with donor";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function renderDonations(donations) {
  if (!donations.length) {
    donationList.innerHTML = '<div class="empty-state">No food donations found yet. If you have surplus food, be the first to share.</div>';
    return;
  }

  donationList.innerHTML = donations.map((item) => `
    <article class="donation-card">
      <div class="donation-top">
        <span class="donation-emoji" aria-hidden="true">${FOOD_EMOJI[item.food_type] || "🍱"}</span>
        <span class="food-badge">${escapeHTML(item.food_type)}</span>
      </div>
      <h3>${escapeHTML(item.food_name)}</h3>
      <p class="donation-quantity">${escapeHTML(item.quantity)}</p>
      ${item.description ? `<p class="donation-description">${escapeHTML(item.description)}</p>` : ""}
      <div class="donation-meta">
        <span><b>⌖</b> ${escapeHTML(item.pickup_location)}</span>
        <span><b>♧</b> Shared by ${escapeHTML(item.donor_name)}</span>
        <span><b>◷</b> Collect by ${escapeHTML(formatDate(item.pickup_by))}</span>
      </div>
      <button class="button button-primary request-button" type="button" data-id="${Number(item.id)}" data-name="${escapeHTML(item.food_name)}">Request this food <span aria-hidden="true">→</span></button>
    </article>
  `).join("");

  donationList.querySelectorAll(".request-button").forEach((button) => {
    button.addEventListener("click", () => openRequestDialog(button.dataset.id, button.dataset.name));
  });
}

async function loadDonations() {
  donationList.innerHTML = '<div class="loading-card">Loading available food…</div>';
  try {
    const type = foodFilter.value;
    const url = type ? `/api/donations?type=${encodeURIComponent(type)}` : "/api/donations";
    const result = await apiRequest(url);
    renderDonations(result.donations || []);
  } catch (error) {
    donationList.innerHTML = `<div class="empty-state">${escapeHTML(error.message)} Check that the server and Supabase are configured.</div>`;
  }
}

async function loadStats() {
  try {
    const stats = await apiRequest("/api/stats");
    document.getElementById("available-count").textContent = stats.availableDonations;
    document.getElementById("total-count").textContent = stats.totalDonations;
    document.getElementById("request-count").textContent = stats.totalRequests;
  } catch (_error) {
    document.getElementById("available-count").textContent = "—";
    document.getElementById("total-count").textContent = "—";
    document.getElementById("request-count").textContent = "—";
  }
}

function openRequestDialog(id, foodName) {
  requestForm.reset();
  document.getElementById("request-donation-id").value = id;
  document.getElementById("request-food-title").textContent = foodName;
  if (typeof requestDialog.showModal === "function") requestDialog.showModal();
  else showNotice("Your browser does not support the request dialog. Please use a recent browser.", true);
}

document.getElementById("close-dialog").addEventListener("click", () => requestDialog.close());
requestDialog.addEventListener("click", (event) => {
  if (event.target === requestDialog) requestDialog.close();
});

foodFilter.addEventListener("change", loadDonations);

donationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideNotice();
  const submitButton = donationForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Publishing…";

  const formData = new FormData(donationForm);
  const payload = Object.fromEntries(formData.entries());
  if (!payload.pickup_by) payload.pickup_by = null;

  try {
    await apiRequest("/api/donations", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    donationForm.reset();
    foodFilter.value = "";
    await Promise.all([loadDonations(), loadStats()]);
    showNotice("Your donation has been published. Thank you for sharing!");
    document.getElementById("available").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Publish donation <span aria-hidden="true">→</span>';
  }
});

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = requestForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";

  const formData = new FormData(requestForm);
  const payload = Object.fromEntries(formData.entries());
  payload.donation_id = Number(payload.donation_id);

  try {
    const result = await apiRequest("/api/requests", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    requestDialog.close();
    showNotice(result.message || "Your request has been submitted.");
    await loadStats();
  } catch (error) {
    const errorMessage = error.message;
    requestDialog.close();
    showNotice(errorMessage, true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = "Send request →";
  }
});

Promise.all([loadDonations(), loadStats()]);
