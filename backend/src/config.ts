import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseCorsOrigins(envValue: string | undefined): string[] {
  if (!envValue) {
    return ["http://localhost:3000", "http://localhost:5173"];
  }
  // Try JSON first, fall back to comma-separated
  if (envValue.startsWith("[")) {
    return JSON.parse(envValue);
  }
  return envValue.split(",").map((s) => s.trim());
}

export const config = {
  appName: "Budget Viewer API",
  port: parseInt(process.env.PORT || "8000", 10),
  // Default to root data/ folder (3 levels up from dist/config.js)
  dbPath: process.env.BUDGET_DB_PATH || join(__dirname, "..", "..", "..", "data"),
  corsOrigins: parseCorsOrigins(process.env.BUDGET_CORS_ORIGINS),
};
