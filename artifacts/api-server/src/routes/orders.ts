import { Router, type IRouter } from "express";
import { db, ordersTable, medicationsTable, pharmaciesTable, pharmacyMedicationsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams } from "@workspace/api-zod";
import { z } from "zod";
import { isVendorRole, type VendorType } from "../lib/vendor";

// فك التوكن للحصول على معرف المستخدم (أي دور)
function decodeUserId(req: { headers: { authorization?: string } }): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString("utf-8");
    const [idStr] = decoded.split(":");
    const id = parseInt(idStr, 10);
    return isNaN(id) ? null : id;
  } catch { return null; }
}

// دالة مساعدة لإيجاد مستخدم البائع (صيدلية أو كوزماتك)
async function getVendorUser(req: { headers: { authorization?: string } }) {
  const id = decodeUserId(req);
  if (id == null) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user && isVendorRole(user.role) && user.pharmacyId ? user : null;
}

// تحويل سجل البائع المضمّن داخل الطلب
function serializeOrderVendor(p: typeof pharmaciesTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    type: (p.type ?? "pharmacy") as VendorType,
    governorate: p.governorate ?? "البصرة",
    address: p.address,
    distance: p.distance,
    isOpen: p.isOpen,
    phone: p.phone,
    whatsapp: p.whatsapp ?? null,
    instagram: p.instagram ?? null,
    tiktok: p.tiktok ?? null,
    rating: p.rating ?? null,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    imageUrl: p.imageUrl ?? null,
  };
}

// توليد رمز تتبّع فريد بالشكل #DW-XXXX مع حلقة لتفادي التكرار
async function generateTrackingCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `#DW-${suffix}`;
    const [clash] = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(eq(ordersTable.trackingCode, code))
      .limit(1);
    if (!clash) return code;
  }
  // احتياطي شبه مؤكد التفرّد
  return `#DW-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

const router: IRouter = Router();

// دالة مساعدة لتحويل الطلب مع البيانات الكاملة
async function getOrderWithDetails(orderId: number) {
  const [row] = await db
    .select({
      order: ordersTable,
      medication: medicationsTable,
      pharmacy: pharmaciesTable,
    })
    .from(ordersTable)
    .innerJoin(medicationsTable, eq(ordersTable.medicationId, medicationsTable.id))
    .innerJoin(pharmaciesTable, eq(ordersTable.pharmacyId, pharmaciesTable.id))
    .where(eq(ordersTable.id, orderId));

  if (!row) return null;

  return {
    id: row.order.id,
    status: row.order.status,
    trackingCode: row.order.trackingCode ?? null,
    createdAt: row.order.createdAt.toISOString(),
    quantity: row.order.quantity,
    totalPrice: row.order.totalPrice,
    medication: {
      id: row.medication.id,
      name: row.medication.name,
      genericName: row.medication.genericName,
      category: row.medication.category,
      description: row.medication.description ?? null,
      requiresPrescription: row.medication.requiresPrescription,
      imageUrl: row.medication.imageUrl ?? null,
    },
    pharmacy: serializeOrderVendor(row.pharmacy),
  };
}

// قائمة الطلبات (يستخدم مستخدم تجريبي ثابت id=1)
router.get("/orders", async (_req, res): Promise<void> => {
  const orders = await db
    .select({
      order: ordersTable,
      medication: medicationsTable,
      pharmacy: pharmaciesTable,
    })
    .from(ordersTable)
    .innerJoin(medicationsTable, eq(ordersTable.medicationId, medicationsTable.id))
    .innerJoin(pharmaciesTable, eq(ordersTable.pharmacyId, pharmaciesTable.id))
    .where(eq(ordersTable.userId, 1))
    .orderBy(ordersTable.createdAt);

  res.json(
    orders.map((row) => ({
      id: row.order.id,
      status: row.order.status,
      trackingCode: row.order.trackingCode ?? null,
      createdAt: row.order.createdAt.toISOString(),
      quantity: row.order.quantity,
      totalPrice: row.order.totalPrice,
      medication: {
        id: row.medication.id,
        name: row.medication.name,
        genericName: row.medication.genericName,
        category: row.medication.category,
        description: row.medication.description ?? null,
        requiresPrescription: row.medication.requiresPrescription,
        imageUrl: row.medication.imageUrl ?? null,
      },
      pharmacy: serializeOrderVendor(row.pharmacy),
    }))
  );
});

// إنشاء طلب حجز
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // الحصول على سعر الدواء في الصيدلية
  const [inventory] = await db
    .select()
    .from(pharmacyMedicationsTable)
    .where(
      and(
        eq(pharmacyMedicationsTable.pharmacyId, parsed.data.pharmacyId),
        eq(pharmacyMedicationsTable.medicationId, parsed.data.medicationId)
      )
    );

  if (!inventory) {
    res.status(404).json({ error: "الدواء غير متوفر في هذه الصيدلية" });
    return;
  }

  const totalPrice = inventory.price * parsed.data.quantity;
  const trackingCode = await generateTrackingCode();

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: 1,
      pharmacyId: parsed.data.pharmacyId,
      medicationId: parsed.data.medicationId,
      quantity: parsed.data.quantity,
      totalPrice,
      trackingCode,
      status: "pending",
    })
    .returning();

  const orderWithDetails = await getOrderWithDetails(order.id);

  res.status(201).json(orderWithDetails);
});

// GET /pharmacy/orders — طلبات واردة للصيدلية
router.get("/pharmacy/orders", async (req, res): Promise<void> => {
  const user = await getVendorUser(req as any);
  if (!user) { res.status(403).json({ error: "غير مصرح" }); return; }

  const rows = await db
    .select({ order: ordersTable, medication: medicationsTable })
    .from(ordersTable)
    .innerJoin(medicationsTable, eq(ordersTable.medicationId, medicationsTable.id))
    .where(eq(ordersTable.pharmacyId, user.pharmacyId!))
    .orderBy(desc(ordersTable.createdAt));

  res.json(rows.map((r) => ({
    id: r.order.id,
    status: r.order.status,
    trackingCode: r.order.trackingCode ?? null,
    quantity: r.order.quantity,
    totalPrice: r.order.totalPrice,
    createdAt: r.order.createdAt.toISOString(),
    updatedAt: r.order.updatedAt.toISOString(),
    medication: {
      id: r.medication.id,
      name: r.medication.name,
      genericName: r.medication.genericName,
      requiresPrescription: r.medication.requiresPrescription,
    },
  })));
});

// PUT /pharmacy/orders/:id/status — تحديث حالة الطلب
router.put("/pharmacy/orders/:id/status", async (req, res): Promise<void> => {
  const user = await getVendorUser(req as any);
  if (!user) { res.status(403).json({ error: "غير مصرح" }); return; }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const { status } = z.object({
    status: z.enum(["confirmed", "ready", "rejected", "timeout"]),
  }).parse(req.body);

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.pharmacyId, user.pharmacyId!)));

  if (!existing) { res.status(404).json({ error: "الطلب غير موجود" }); return; }

  // TODO: Connect to n8n Webhook to trigger automated WhatsApp notification to the patient
  // fetch(process.env.N8N_WEBHOOK_URL, { method: "POST", body: JSON.stringify({ orderId: id, status, patientPhone: "..." }) })

  const [updated] = await db
    .update(ordersTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();

  res.json({ id: updated.id, status: updated.status });
});

// PUT /orders/:id/received — تأكيد المريض استلام الطلب (يصبح delivered)
router.put("/orders/:id/received", async (req, res): Promise<void> => {
  const userId = decodeUserId(req as any);
  if (userId == null) { res.status(403).json({ error: "غير مصرح" }); return; }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, userId)));

  if (!existing) { res.status(404).json({ error: "الطلب غير موجود" }); return; }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "delivered", updatedAt: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();

  res.json({ id: updated.id, status: updated.status });
});

// تفاصيل طلب
router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const orderWithDetails = await getOrderWithDetails(params.data.id);

  if (!orderWithDetails) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }

  res.json(orderWithDetails);
});

export default router;
