import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors());
app.use(express.json());

const users = [
  { id: "client-1", username: "client", password: "client123", role: "client", fullName: "Client Demo" },
  { id: "agent-1", username: "agent", password: "agent123", role: "agent", fullName: "Conseiller Demo" }
];

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  const user = users.find((entry) => entry.username === username && entry.password === password);

  if (!user) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, username: user.username, fullName: user.fullName },
    jwtSecret,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    }
  });
});

app.get("/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const decoded = jwt.verify(token, jwtSecret);
    return res.json({
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      fullName: decoded.fullName
    });
  } catch {
    return res.status(401).json({ message: "Token invalide" });
  }
});

app.listen(port, () => {
  console.log(`auth-service started on port ${port}`);
});
