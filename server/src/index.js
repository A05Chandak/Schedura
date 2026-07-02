import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import eventTypeRoutes from "./routes/eventTypeRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { pingDatabase } from "./config/db.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ 
    message: "Calendly-clone API Server",
    status: "running",
    endpoints: {
      health: "/api/health",
      eventTypes: "/api/event-types",
      availability: "/api/availability",
      meetings: "/api/meetings",
      public: "/api/public"
    }
  });
});

app.get("/api/health", async (_req, res, next) => {
  try {
    await pingDatabase();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use("/api/event-types", eventTypeRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/public", publicRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  let status = error.status || 500;
  let message = error.message || "Something went wrong";
  
  // PostgreSQL error codes
  if (error.code === "23505") {
    // Unique constraint violation
    status = 409;
    message = "Duplicate value";
  }
  
  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
