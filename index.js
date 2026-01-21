require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
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

const user = require("./Routes/Auth/User");
const admin = require("./Routes/Auth/Admin");
const profile = require("./Routes/Auth/Profile");
const enquiry = require("./Routes/Auth/Enquiry");
const Favorite = require("./Routes/Auth/Favorite");
const Payment = require("./Routes/Auth/Payment");

app.use("/uploads", express.static("uploads"));

// Rotes End Points
app.use("/api/user", user);
app.use("/api/admin", admin);
app.use("/api/profile", profile);
app.use("/api/enquiry", enquiry);
app.use("/api/Favorite", Favorite);
app.use("/api/Payment", Payment);

const PORT = process.env.CONTENT_PORT || 8080;
const MONGO_URI = process.env.CONTENT_MONGO_URI;

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

app.get("/", (req, res) => {
  res.send("Hello, Dating App!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
