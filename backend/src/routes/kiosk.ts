import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getDB } from "../db/db.js";

export async function kioskRoutes(app: FastifyInstance) {
  app.post("/api/kiosk/identify", async (req, reply) => {
    const bodySchema = z.object({
      uid: z.string().min(1),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid payload" });
    }

    const uid = parsed.data.uid.trim();

    const db = getDB();
    const user = db
      .prepare(
        `SELECT id, name, email, rfid_uid, is_active
         FROM users
         WHERE rfid_uid = ?`
      )
      .get(uid);

    if (!user) {
      return reply.code(404).send({ error: "Badge not recognized" });
    }

    if (user.is_active !== 1) {
      return reply.code(403).send({ error: "User disabled", user });
    }

    return reply.send({ user });
  });
}
