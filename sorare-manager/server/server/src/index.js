import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import { signIn, getCurrentUserCards } from "./sorare.js";
import { simulateTeams } from "./simulator.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

const tokenSchema = z.object({
  token: z.string().min(10)
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await signIn(input.email, input.password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: cleanError(error) });
  }
});

app.post("/api/sorare/cards", async (req, res) => {
  try {
    const { token } = tokenSchema.parse(req.body);
    const cards = await getCurrentUserCards(token);
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: cleanError(error) });
  }
});

app.post("/api/simulate", async (req, res) => {
  try {
    const schema = z.object({
      cards: z.array(z.any()),
      confirmations: z.array(z.any()).default([]),
      riskMode: z.enum(["safe", "balanced", "aggressive"]).default("balanced"),
      iterations: z.number().min(100).max(10000).default(1500)
    });

    const input = schema.parse(req.body);

    const teams = simulateTeams({
      cards: input.cards,
      confirmations: input.confirmations,
      riskMode: input.riskMode,
      iterations: input.iterations
    });

    res.json({ teams });
  } catch (error) {
    res.status(400).json({ error: cleanError(error) });
  }
});

function cleanError(error) {
  if (error?.issues) return error.issues.map(i => i.message).join(", ");
  return error?.message || "Unexpected server error";
}

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});