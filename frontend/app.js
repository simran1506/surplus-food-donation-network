const donationList = document.querySelector("#donation-list");
const donationForm = document.querySelector("#donation-form");
const notice = document.querySelector("#notice");
const statusFilter = document.querySelector("#status-filter");

const foodIcons = {
  cooked: "🍲",
  uncooked: "🌾",
  packaged: "🥫",
  produce: "🥬",
  other: "🍽️"
};

function showNotice(message, type = "success") {
  notice.textContent = message;
  notice.className = `notice ${type === "error" ? "error" : ""}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatDate(value) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function donationCard(donation) {
  const status = ["available", "claimed", "completed"].includes(donation.status) ? donation.status : "available";
  const icon = foodIcons[donation.food_type] || foodIcons.other;
  const description = donation.description
    ? `<p class="description">${escapeHtml(donation.description)}</p>`
    : "";
  const actions = status === "available"
    ? `<div class="card-actions"><button class="small-button" data-action="claim" data-id="${Number(donation.id)}">Mark as claimed</button></div>`
    : status === "claimed"
      ? `<div class="card-actions"><button class="small-button" data-action="complete" data-id="${Number(donation.id)}">Mark completed</button></div>`
      : "";

  return `
    <article class="donation-card">
      <div class="donation-top"><span class="food-icon">${icon}</span><span class="status ${status}">${statusLabel(status)}</span></div>
      <h3>${escapeHtml(donation.food_name)}</h3>
      <p class="donor">Shared by ${escapeHtml(donation.donor_name)}</p>
      ${description}
      <div class="donation-details">
        <div class="detail"><span>📦</span><span><b>Quantity:</b> ${escapeHtml(donation.quantity)}</span></div>
        <div class="detail"><span>📍</span><span>${escapeHtml(donation.pickup_location)}</span></div>
        <div class="detail"><span>⏰</span><span><b>Use by:</b> ${escapeHtml(formatDate(donation.expiry_time))}</span></div>
        <div class="detail"><span>☎</span><span><b>Contact:</b> ${escapeHtml(donation.donor_contact)}</span></div>
      </div>
      ${actions}
    </article>`;
}

async function loadDonations() {
  donationList.innerHTML = '<div class="loading-card">Loading donations…</div>';
  try {
    const status = statusFilter.value;
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await fetch(`/api/donations${query}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load donations.");
    if (!Array.isArray(result.donations) || result.donations.length === 0) {
      donationList.innerHTML = '<div class="empty-state">No donations here yet. If you have safe surplus food, be the first to share it.</div>';
      return;
    }
    donationList.innerHTML = result.donations.map(donationCard).join("");
  } catch (error) {
    donationList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}<br><br>Check that the backend is running and your Supabase table is set up.</div>`;
  }
}

donationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = donationForm.querySelector('button[type="submit"]');
  const formData = new FormData(donationForm);
  const payload = Object.fromEntries(formData.entries());

  // Convert the browser's local datetime value to an ISO timestamp for PostgreSQL.
  if (payload.expiry_time) {
    const expiryDate = new Date(payload.expiry_time);
    if (Number.isNaN(expiryDate.getTime())) {
      showNotice("Please choose a valid expiry date and time.", "error");
      return;
    }
    payload.expiry_time = expiryDate.toISOString();
  } else {
    payload.expiry_time = null;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Publishing…";
  try {
    const response = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not publish donation.");
    donationForm.reset();
    statusFilter.value = "available";
    showNotice("Your donation has been published. Thank you for sharing!");
    await loadDonations();
    document.querySelector("#available").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Publish donation <span>→</span>';
  }
});

donationList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const status = button.dataset.action === "claim" ? "claimed" : "completed";
  button.disabled = true;
  try {
    const response = await fetch(`/api/donations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not update status.");
    showNotice(result.message);
    await loadDonations();
  } catch (error) {
    showNotice(error.message, "error");
    button.disabled = false;
  }
});

statusFilter.addEventListener("change", loadDonations);
loadDonations();
