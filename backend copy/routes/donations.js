
const express = require("express");
const { randomUUID } = require("crypto");

const FOOD_TYPES = [
  "Cooked Meals",
  "Fruits & Vegetables",
  "Bakery",
  "Packaged Food",
  "Other"
];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDonation(row) {
  return {
    id: row.id,
    food_name: row.food_name,
    food_type: row.category,
    quantity: `${row.quantity} ${row.unit}`,
    pickup_location: row.pickup_address,
    description: row.notes || "",
    pickup_by: row.pickup_deadline,
    status: row.status,
    created_at: row.created_at,
    donor_name: "",
    donor_contact: ""
  };
}

module.exports = function donationsRouter(supabase) {
  const router = express.Router();

  // Get available donations
  router.get("/", async (req, res) => {
    try {
      let query = supabase
        .from("donations")
        
.select(
  "id, food_name, category, quantity, unit, pickup_address, pickup_deadline, notes, status, created_at"
)

        .eq("status", "available")
        .order("created_at", { ascending: false });

      const type = clean(req.query.type);

      if (type && FOOD_TYPES.includes(type)) {
        query = query.eq("category", type);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      res.json({
        donations: (data || []).map(formatDonation)
      });
    } catch (error) {
      console.error("List donations error:", error.message);

      res.status(500).json({
        error: "Could not load donations. Check your Supabase table and permissions."
      });
    }
  });

  // Create a donation
  router.post("/", async (req, res) => {
    const body = req.body || {};

    const foodName = clean(body.food_name);
    const foodType = clean(body.food_type || body.category);
    const pickupLocation = clean(
      body.pickup_location || body.pickup_address
    );
    const description = clean(body.description || body.notes);

    // Accept quantities such as "10 plates" or "5 kg".
    const quantityText = clean(body.quantity);
    const match = quantityText.match(/^(\d+(?:\.\d+)?)(?:\s+(.+))?$/);

    const quantity = match ? Number(match[1]) : NaN;
    const unit = clean(body.unit || (match && match[2])) || "units";

    if (foodName.length < 2 || foodName.length > 100) {
      return res.status(400).json({
        error: "Food name must be between 2 and 100 characters."
      });
    }

    if (!FOOD_TYPES.includes(foodType)) {
      return res.status(400).json({
        error: "Please choose a valid food category."
      });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        error: "Enter a quantity greater than zero, such as 10 plates."
      });
    }

    if (unit.length > 50) {
      return res.status(400).json({
        error: "The quantity unit must be 50 characters or fewer."
      });
    }

    if (pickupLocation.length < 3 || pickupLocation.length > 200) {
      return res.status(400).json({
        error: "Pickup address must be between 3 and 200 characters."
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        error: "Description must be 500 characters or fewer."
      });
    }

    let pickupDeadline = null;

    if (body.pickup_by || body.pickup_deadline) {
      const deadline = new Date(body.pickup_by || body.pickup_deadline);

      if (Number.isNaN(deadline.getTime())) {
        return res.status(400).json({
          error: "Please enter a valid pickup deadline."
        });
      }

      pickupDeadline = deadline.toISOString();
    } else {
      // Use a default deadline 24 hours from now.
      pickupDeadline = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
    }

    try {
      const donation = {
        // Placeholder ID until donor authentication is implemented.
        donor_id: randomUUID(),
        food_name: foodName,
        category: foodType,
        quantity,
        unit,
        pickup_address: pickupLocation,
        pickup_deadline: pickupDeadline,
        notes: description || null,
        status: "available"
      };

      const { data, error } = await supabase
        .from("donations")
        .insert(donation)

.select(
  "id, food_name, category, quantity, unit, pickup_address, pickup_deadline, notes, status, created_at"
)

        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Donation listed successfully.",
        donation: formatDonation(data)
      });
    } catch (error) {
      console.error("Create donation error:", error.message);

      res.status(500).json({
        error: "Could not save donation. Check the database columns and permissions."
      });
    }
  });

  return router;
};
