import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const LoginBody = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

const RegisterBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["patient", "pharmacy"]).default("patient"),
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar ?? null,
    role: user.role as "patient" | "pharmacy",
    pharmacyId: user.pharmacyId ?? null,
  };
}

// تسجيل الدخول
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, parsed.data.phone));

  if (!user || user.password !== parsed.data.password) {
    res.status(401).json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    return;
  }

  const token = Buffer.from(`${user.id}:${user.phone}`).toString("base64");

  res.json({ token, user: formatUser(user) });
});

// إنشاء حساب جديد
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, parsed.data.phone));

  if (existing) {
    res.status(400).json({ error: "رقم الهاتف مسجل مسبقاً" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      password: parsed.data.password,
      role: parsed.data.role,
    })
    .returning();

  const token = Buffer.from(`${user.id}:${user.phone}`).toString("base64");

  res.status(201).json({ token, user: formatUser(user) });
});

export default router;
