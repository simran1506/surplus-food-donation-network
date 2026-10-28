
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const donationsRouter = require("./routes/donations");
const requestsRouter = require("./routes/requests");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase configuration. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the .env file in the project root."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

app.use(cors());
app.use(express.json({ limit: "50kb" }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "..", "frontend")));

// API health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Surplus Food Donation Network API is running."
  });
});

// Dashboard statistics
app.get("/api/stats", async (_req, res) => {
  try {
    const [availableResult, allResult, requestResult] =
      await Promise.all([
        supabase
          .from("donations")
          .select("id", { count: "exact", head: true })
          .eq("status", "available"),

        supabase
          .from("donations")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("donation_requests")
          .select("id", { count: "exact", head: true })
      ]);

    const error =
      availableResult.error ||
      allResult.error ||
      requestResult.error;

    if (error) throw error;

    res.json({
      availableDonations: availableResult.count || 0,
      totalDonations: allResult.count || 0,
      totalRequests: requestResult.count || 0
    });
  } catch (error) {
    console.error("Stats error:", error.message);

    res.status(500).json({
      error: "Could not load dashboard statistics. Check your database setup."
    });
  }
});

// API routes
app.use("/api/donations", donationsRouter(supabase));
app.use("/api/requests", requestsRouter(supabase));

// Return JSON for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({
    error: "API route not found."
  });
});

// Handle other page requests without a wildcard route
app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  res.sendFile(
    path.join(__dirname, "..", "frontend", "index.html"),
    (error) => {
      if (error) next(error);
    }
  );
});

// Final error handler
app.use((err, _req, res, _next) => {
  console.error("Unexpected server error:", err.message);

  if (res.headersSent) return;

  res.status(500).json({
    error: "Unexpected server error."
  });
});

app.listen(PORT, () => {
  console.log(
    `Surplus Food Donation Network running at http://localhost:${PORT}`
  );
});
