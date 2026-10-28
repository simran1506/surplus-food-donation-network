
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/donations - list donations
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List donations error:", error.message);
      return res.status(500).json({
        error: "Could not load donations",
        details: error.message
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("List donations error:", error.message);
    return res.status(500).json({
      error: "Server error while loading donations"
    });
  }
});

// POST /api/donations - create a donation
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    const donation = {
      donor_name: body.donor_name ?? body.donorName,
      donor_contact: body.donor_contact ?? body.donorContact,
      food_name:
        body.food_name ?? body.foodName ?? body.foodType,
      quantity: body.quantity,
      expiry_date: body.expiry_date ?? body.expiryDate ?? null,
      pickup_address:
        body.pickup_address ?? body.pickupAddress,
      description: body.description ?? null
    };

    const requiredFields = [
      "donor_name",
      "donor_contact",
      "food_name",
      "quantity",
      "pickup_address"
    ];

    const missingFields = requiredFields.filter(
      field =>
        donation[field] === undefined ||
        donation[field] === null ||
        String(donation[field]).trim() === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Please provide all required donation details",
        missingFields
      });
    }

    if (donation.expiry_date === "") {
      donation.expiry_date = null;
    }

    const { data, error } = await supabase
      .from("donations")
      .insert([donation])
      .select()
      .single();

    if (error) {
      console.error("Create donation error:", error.message);
      return res.status(500).json({
        error: "Could not create donation",
        details: error.message
      });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error("Create donation error:", error.message);
    return res.status(500).json({
      error: "Server error while creating donation"
    });
  }
});

module.exports = router;

