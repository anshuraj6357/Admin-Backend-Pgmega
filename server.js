const express = require("express");
const { mongoose } = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const userRouter = require("./router/user");
const propertyRouter = require("./router/property");
const tenantRouter = require("./router/tenenant");
const complainRouter = require("./router/complain");
const analyticsRouter = require("./router/analysis");
const staffRouter = require("./router/staff");
const paymentRouter = require("./router/payment");
const cookieparser = require("cookie-parser");

// Load env variables FIRST
dotenv.config();

// Initialize app
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));

// CORS CONFIG
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://admin-frontend-pgmega.vercel.app",
      "https://www.roomgi.com", // add your domain
      "https://roomgi.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());  // ✅ FIXED

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/property", propertyRouter);
app.use("/api/tenant", tenantRouter);
app.use("/api", complainRouter);
app.use("/api", analyticsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/payment", paymentRouter);

// Database
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Database connected"))
  .catch((error) => {
    console.log("Database connection error");
    console.error(error);
    process.exit(1);
  });

// Default route
app.get("/", (req, res) => {
  res.send("Server is running on this port");
});

// PORT must be dynamic for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
