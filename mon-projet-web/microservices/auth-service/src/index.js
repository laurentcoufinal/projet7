import { createAuthApp } from "./app.js";

const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:8081,http://localhost:4200")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = createAuthApp({ jwtSecret, allowedOrigins });

app.listen(port, () => {
  console.log(`auth-service started on port ${port}`);
});
