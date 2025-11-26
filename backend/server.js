// File: backend/server.js

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: "../.env" });

// Import Routes
const apiRoutes = require("./routes/apiRoutes");

const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files (รูปภาพ/PDF)
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use(
  "/api",
  (req, res, next) => {
    console.log(`Incoming ${req.method} request to ${req.originalUrl}`);
    next();
  },
  apiRoutes
);

// Test Endpoint
app.get("/", (req, res) => {
  res.send("Personnel Evaluation System API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
