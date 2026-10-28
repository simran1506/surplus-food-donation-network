require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const donationsRouter = require("./routes/donations");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "50kb" }));

// Serve the static frontend from the project root's frontend folder.
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Surplus Food Donation Network API is running." });
});

app.use("/api/donations", donationsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err.message);
  res.status(500).json({ error: "Unexpected server error. Check the server terminal." });
});

app.listen(PORT, () => {
  console.log(`Surplus Food Donation Network running at http://localhost:${PORT}`);
});
