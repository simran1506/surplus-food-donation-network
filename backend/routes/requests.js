const express = require("express");

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = function requestsRouter(supabase) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const body = req.body || {};
    const donationId = Number(body.donation_id);
    const requesterName = clean(body.requester_name);
    const requesterContact = clean(body.requester_contact);
    const message = clean(body.message);

    if (!Number.isSafeInteger(donationId) || donationId < 1) {
      return res.status(400).json({ error: "A valid donation is required." });
    }
    if (requesterName.length < 2 || requesterName.length > 100) {
      return res.status(400).json({ error: "Name must be between 2 and 100 characters." });
    }
    if (requesterContact.length < 3 || requesterContact.length > 100) {
      return res.status(400).json({ error: "Please enter a valid contact detail." });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: "Message must be 500 characters or fewer." });
    }

    try {
      const { data: donation, error: lookupError } = await supabase
        .from("donations")
        .select("id, status")
        .eq("id", donationId)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!donation || donation.status !== "available") {
        return res.status(404).json({ error: "This donation is no longer available." });
      }

      const { data, error } = await supabase
        .from("donation_requests")
        .insert({
          donation_id: donationId,
          requester_name: requesterName,
          requester_contact: requesterContact,
          message,
          status: "pending"
        })
        .select("id, donation_id, status, created_at")
        .single();

      if (error) throw error;
      res.status(201).json({ message: "Request submitted. The donor can contact you using the details you provided.", request: data });
    } catch (error) {
      console.error("Create request error:", error.message);
      res.status(500).json({ error: "Could not submit request. Check your database setup." });
    }
  });

  return router;
};
