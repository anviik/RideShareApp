// cruze-backend/src/index.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Root health check
app.get("/", (req, res) => {
  res.send("Cruze backend is running 🚗");
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

// TODO: later add /trips, /ride-requests, /maps/route, etc.

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
