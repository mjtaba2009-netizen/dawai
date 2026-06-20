import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody } from "@workspace/api-zod";

const router: IRouter = Router();

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

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar ?? null,
    },
  });
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
    })
    .returning();

  const token = Buffer.from(`${user.id}:${user.phone}`).toString("base64");

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar ?? null,
    },
  });
});

export default router;
