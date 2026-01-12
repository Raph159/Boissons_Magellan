import Fastify from "fastify";
import cors from "@fastify/cors";
import { initDB } from "./db/db.js";
import { healthRoutes } from "./routes/health.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true
});

initDB();

app.register(healthRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
