import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { accountService, adminService } from "./services/index.js";
import apiRouter from "./routes/index.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: config.appName });
});

// API routes
app.use("/api", apiRouter);

// Initialize services
function initializeServices(): void {
  console.log("Initializing services...");
  console.log(`Database path: ${config.dbPath}`);

  accountService.initialize();
  adminService.initialize();

  console.log("Services initialized successfully");
}

// Start server
function startServer(): void {
  initializeServices();

  app.listen(config.port, () => {
    console.log(`${config.appName} running on port ${config.port}`);
    console.log(`CORS origins: ${config.corsOrigins.join(", ")}`);
  });
}

startServer();
