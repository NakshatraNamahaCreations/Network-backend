require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Static uploads — absolute path + explicit CORS headers for cross-origin img src
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(require("path").join(__dirname, "uploads")));

// Routes
app.use("/api/user",         require("./Routes/Auth/User"));
app.use("/api/admin",        require("./Routes/Auth/Admin"));
app.use("/api/profile",      require("./Routes/Auth/Profile"));
app.use("/api/category",     require("./Routes/Auth/Category"));
app.use("/api/enquiry",      require("./Routes/Auth/Enquiry"));
app.use("/api/favorite",     require("./Routes/Auth/Favorite"));
app.use("/api/Payment",      require("./Routes/Auth/Payment"));
app.use("/api/review",       require("./Routes/Auth/Review"));
app.use("/api/like",         require("./Routes/Auth/Like"));
app.use("/api/block",        require("./Routes/Auth/Block"));
app.use("/api/notification", require("./Routes/Auth/Notification"));
app.use("/api/plan",         require("./Routes/Auth/Plan"));

const PORT = process.env.CONTENT_PORT || 8080;
const MONGO_URI = process.env.CONTENT_MONGO_URI;

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

app.get("/", (_req, res) => res.send("Sell Your Time API — Running ✅"));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
