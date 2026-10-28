const express = require("express");

const FOOD_TYPES = ["Cooked Meals", "Fruits & Vegetables", "Bakery", "Packaged Food", "Other"];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = function donationsRouter(supabase) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      let query = supabase
        .from("donations")
        .select("id, food_name, food_type, quantity, pickup_location, donor_name, donor_contact, description, pickup_by, status, created_at")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      const type = clean(req.query.type);
      if (type && FOOD_TYPES.includes(type)) query = query.eq("food_type", type);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      res.json({ donations: data || [] });
    } catch (error) {
      console.error("List donations error:", error.message);
      res.status(500).json({ error: "Could not load donations. Check your Supabase tables and keys." });
    }
  });

  router.post("/", async (req, res) => {
    const body = req.body || {};
    const donation = {
      food_name: clean(body.food_name),
      food_type: clean(body.food_type),
      quantity: clean(body.quantity),
      pickup_location: clean(body.pickup_location),
      donor_name: clean(body.donor_name),
      donor_contact: clean(body.donor_contact),
      description: clean(body.description),
      pickup_by: body.pickup_by ? new Date(body.pickup_by).toISOString() : null,
      status: "available"
    };

    if (donation.food_name.length < 2 || donation.food_name.length > 100) {
      return res.status(400).json({ error: "Food name must be between 2 and 100 characters." });
    }
    if (!FOOD_TYPES.includes(donation.food_type)) {
      return res.status(400).json({ error: "Choose a valid food type." });
    }
    if (!donation.quantity || donation.quantity.length > 80) {
      return res.status(400).json({ error: "Please enter a quantity (maximum 80 characters)." });
    }
    if (donation.pickup_location.length < 3 || donation.pickup_location.length > 200) {
      return res.status(400).json({ error: "Pickup location must be between 3 and 200 characters." });
    }
    if (donation.donor_name.length < 2 || donation.donor_name.length > 100) {
      return res.status(400).json({ error: "Donor name must be between 2 and 100 characters." });
    }
    if (donation.donor_contact.length < 3 || donation.donor_contact.length > 100) {
      return res.status(400).json({ error: "Please enter a valid contact detail." });
    }
    if (donation.description.length > 500) {
      return res.status(400).json({ error: "Description must be 500 characters or fewer." });
    }
    if (body.pickup_by && Number.isNaN(Date.parse(body.pickup_by))) {
      return res.status(400).json({ error: "Please enter a valid pickup deadline." });
    }

    try {
      const { data, error } = await supabase.from("donations").insert(donation).select().single();
      if (error) throw error;
      res.status(201).json({ message: "Donation listed successfully.", donation: data });
    } catch (error) {
      console.error("Create donation error:", error.message);
      res.status(500).json({ error: "Could not save donation. Check your database setup." });
    }
  });

  return router;
};
