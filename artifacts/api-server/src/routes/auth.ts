import { Router, type IRouter } from "express";
import { db, usersTable, pharmaciesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isVendorRole, isFacebookUrl } from "../lib/vendor";

const router: IRouter = Router();

const LoginBody = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

const RegisterBody = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["patient", "pharmacy", "cosmetic"]).default("patient"),
  vendorName: z.string().optional(),
  address: z.string().optional(),
  governorate: z.string().optional(),
  workingHours: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar ?? null,
    role: user.role as "patient" | "pharmacy" | "cosmetic",
    status: (user.status ?? "active") as "active" | "approved_pending_signature",
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

  const { name, phone, password, role, vendorName, address, governorate, instagram, tiktok } = parsed.data;

  // المرضى — حساب عادي نشط مباشرةً
  if (!isVendorRole(role)) {
    const [user] = await db
      .insert(usersTable)
      .values({ name, phone, password, role })
      .returning();

    const token = Buffer.from(`${user.id}:${user.phone}`).toString("base64");
    res.status(201).json({ token, user: formatUser(user) });
    return;
  }

  // البائعون (صيدلية / كوزماتك) — نرفض روابط فيسبوك ونشترط إنستغرام للكوزماتك
  if (isFacebookUrl(instagram) || isFacebookUrl(tiktok)) {
    res.status(400).json({ error: "روابط فيسبوك غير مدعومة — استخدم إنستغرام أو تيك توك" });
    return;
  }
  if (role === "cosmetic" && !instagram?.trim()) {
    res.status(400).json({ error: "رابط حساب إنستغرام مطلوب لتسجيل متجر الكوزماتك" });
    return;
  }

  // ننشئ سجل البائع في جدول pharmacies (هو جدول البائعين الموحّد)
  const [vendor] = await db
    .insert(pharmaciesTable)
    .values({
      name: vendorName?.trim() || name,
      type: role,
      address: address?.trim() || "",
      governorate: governorate?.trim() || "البصرة",
      phone,
      instagram: instagram?.trim() || null,
      tiktok: tiktok?.trim() || null,
    })
    .returning();

  // المستخدم البائع — يبقى بانتظار التوقيع الرقمي قبل التفعيل
  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      phone,
      password,
      role,
      status: "approved_pending_signature",
      pharmacyId: vendor.id,
    })
    .returning();

  const token = Buffer.from(`${user.id}:${user.phone}`).toString("base64");

  res.status(201).json({ token, user: formatUser(user) });
});

export default router;
