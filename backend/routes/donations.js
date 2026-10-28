const express = require("express");
const supabase = require("../lib/supabase");

const router = express.Router();

const allowedStatuses = new Set(["available", "claimed", "completed"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function requireDatabase(res) {
  if (!supabase) {
    res.status(503).json({
      error: "Supabase is not configured. Add your project URL and service-role key to backend .env."
    });
    return false;
  }
  return true;
}

// GET /api/donations?status=available
router.get("/", async (req, res) => {
  if (!requireDatabase(res)) return;

  try {
    let query = supabase
      .from("donations")
      .select("id, donor_name, donor_contact, food_name, quantity, food_type, description, pickup_location, expiry_time, status, created_at")
      .order("created_at", { ascending: false });

    const status = cleanString(req.query.status).toLowerCase();
    if (status && allowedStatuses.has(status)) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      console.error("List donations error:", error.message);
      return res.status(500).json({
        error: "Could not load donations. Check that the SQL setup was run in Supabase.",
        details: error.message
      });
    }

    res.json({ donations: data || [] });
  } catch (error) {
    console.error("Unexpected list donations error:", error.message);
    res.status(500).json({ error: "Could not load donations." });
  }
});

// POST /api/donations
router.post("/", async (req, res) => {
  if (!requireDatabase(res)) return;

  const body = req.body || {};
  const donation = {
    donor_name: cleanString(body.donor_name),
    donor_contact: cleanString(body.donor_contact),
    food_name: cleanString(body.food_name),
    quantity: cleanString(body.quantity),
    food_type: cleanString(body.food_type),
    description: cleanString(body.description),
    pickup_location: cleanString(body.pickup_location),
    expiry_time: cleanString(body.expiry_time) || null,
    status: "available"
  };

  const required = ["donor_name", "donor_contact", "food_name", "quantity", "food_type", "pickup_location"];
  const missing = required.filter((field) => !donation[field]);
  if (missing.length) {
    return res.status(400).json({ error: `Please fill in: ${missing.join(", ")}.` });
  }
  if (donation.donor_name.length > 100 || donation.food_name.length > 120) {
    return res.status(400).json({ error: "Name fields are too long." });
  }
  if (donation.donor_contact.length > 120) {
    return res.status(400).json({ error: "Contact must be 120 characters or fewer." });
  }
  if (donation.quantity.length > 80 || donation.pickup_location.length > 250) {
    return res.status(400).json({ error: "Quantity or pickup location is too long." });
  }
  if (!["email", "phone"].some((kind) =>
    kind === "email" ? isValidEmail(donation.donor_contact) : /^[+()\d\s.-]{7,25}$/.test(donation.donor_contact)
  )) {
    return res.status(400).json({ error: "Enter a valid email address or phone number." });
  }
  if (!["cooked", "uncooked", "packaged", "produce", "other"].includes(donation.food_type)) {
    return res.status(400).json({ error: "Choose a valid food type." });
  }
  if (donation.expiry_time && Number.isNaN(Date.parse(donation.expiry_time))) {
    return res.status(400).json({ error: "Expiry time is not a valid date/time." });
  }

  try {
    const { data, error } = await supabase
      .from("donations")
      .insert(donation)
      .select("id, donor_name, donor_contact, food_name, quantity, food_type, description, pickup_location, expiry_time, status, created_at")
      .single();

    if (error) {
      console.error("Create donation error:", error.message);
      return res.status(500).json({
        error: "Could not save donation. Check the Supabase table columns and SQL setup.",
        details: error.message
      });
    }

    res.status(201).json({ donation: data, message: "Donation published successfully." });
  } catch (error) {
    console.error("Unexpected create donation error:", error.message);
    res.status(500).json({ error: "Could not save donation." });
  }
});

// PATCH /api/donations/:id/status
router.patch("/:id/status", async (req, res) => {
  if (!requireDatabase(res)) return;

  const id = Number(req.params.id);
  const status = cleanString(req.body?.status).toLowerCase();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid donation ID." });
  }
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: "Status must be available, claimed, or completed." });
  }

  try {
    const { data, error } = await supabase
      .from("donations")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("Update donation status error:", error.message);
      return res.status(500).json({ error: "Could not update donation status.", details: error.message });
    }
    if (!data) return res.status(404).json({ error: "Donation not found." });

    res.json({ donation: data, message: `Donation marked as ${status}.` });
  } catch (error) {
    console.error("Unexpected update error:", error.message);
    res.status(500).json({ error: "Could not update donation status." });
  }
});

module.exports = router;
