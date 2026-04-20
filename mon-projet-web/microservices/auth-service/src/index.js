const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
import { createAuthApp } from "./app.js";

const app = createAuthApp({ jwtSecret });

app.listen(port, () => {
  console.log(`auth-service started on port ${port}`);
});
