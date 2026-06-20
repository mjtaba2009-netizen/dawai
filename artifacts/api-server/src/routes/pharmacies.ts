import { Router, type IRouter } from "express";
import { db, pharmaciesTable, pharmacyMedicationsTable, medicationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// -------- Auth helper --------
async function getAuthUser(req: Parameters<typeof router.get>[1] extends (req: infer R, ...a: never[]) => unknown ? R : never) {
  const auth = (req as { headers: Record<string, string> }).headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = Buffer.from(auth.slice(7), "base64").toString("utf-8");
    const [idStr] = decoded.split(":");
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return null;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  } catch {
    return null;
  }
}

// -------- Public routes --------

// الصيدليات القريبة
router.get("/pharmacies/nearby", async (_req, res): Promise<void> => {
  const pharmacies = await db
    .select()
    .from(pharmaciesTable)
    .orderBy(pharmaciesTable.distance)
    .limit(20);

  res.json(
    pharmacies.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      distance: p.distance,
      isOpen: p.isOpen,
      phone: p.phone,
      whatsapp: p.whatsapp ?? null,
      rating: p.rating ?? null,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      imageUrl: p.imageUrl ?? null,
    }))
  );
});

// تفاصيل صيدلية
router.get("/pharmacies/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const [pharmacy] = await db.select().from(pharmaciesTable).where(eq(pharmaciesTable.id, id));

  if (!pharmacy) { res.status(404).json({ error: "الصيدلية غير موجودة" }); return; }

  res.json({
    id: pharmacy.id, name: pharmacy.name, address: pharmacy.address,
    distance: pharmacy.distance, isOpen: pharmacy.isOpen, phone: pharmacy.phone,
    whatsapp: pharmacy.whatsapp ?? null, rating: pharmacy.rating ?? null,
    lat: pharmacy.lat ?? null, lng: pharmacy.lng ?? null, imageUrl: pharmacy.imageUrl ?? null,
  });
});

// أدوية صيدلية معينة
router.get("/pharmacies/:id/medications", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const rows = await db
    .select({ pm: pharmacyMedicationsTable, med: medicationsTable })
    .from(pharmacyMedicationsTable)
    .innerJoin(medicationsTable, eq(pharmacyMedicationsTable.medicationId, medicationsTable.id))
    .where(eq(pharmacyMedicationsTable.pharmacyId, id));

  res.json(
    rows.map((row) => ({
      id: row.pm.id, medicationId: row.pm.medicationId, pharmacyId: row.pm.pharmacyId,
      price: row.pm.price, quantity: row.pm.quantity,
      medication: {
        id: row.med.id, name: row.med.name, genericName: row.med.genericName,
        category: row.med.category, description: row.med.description ?? null,
        requiresPrescription: row.med.requiresPrescription, imageUrl: row.med.imageUrl ?? null,
      },
    }))
  );
});

// -------- Pharmacy Dashboard (protected) --------

const UpsertInventoryBody = z.object({
  medicationId: z.number().int().positive(),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
});

const UpdateInventoryBody = z.object({
  price: z.number().positive().optional(),
  quantity: z.number().int().min(0).optional(),
});

// GET /pharmacy/inventory — قائمة مخزون الصيدلية
router.get("/pharmacy/inventory", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as Parameters<typeof getAuthUser>[0]);
  if (!user || user.role !== "pharmacy" || !user.pharmacyId) {
    res.status(403).json({ error: "غير مصرح" }); return;
  }

  const rows = await db
    .select({ pm: pharmacyMedicationsTable, med: medicationsTable })
    .from(pharmacyMedicationsTable)
    .innerJoin(medicationsTable, eq(pharmacyMedicationsTable.medicationId, medicationsTable.id))
    .where(eq(pharmacyMedicationsTable.pharmacyId, user.pharmacyId));

  res.json(rows.map((row) => ({
    id: row.pm.id, medicationId: row.pm.medicationId, pharmacyId: row.pm.pharmacyId,
    price: row.pm.price, quantity: row.pm.quantity,
    medication: {
      id: row.med.id, name: row.med.name, genericName: row.med.genericName,
      category: row.med.category, requiresPrescription: row.med.requiresPrescription,
    },
  })));
});

// POST /pharmacy/inventory — إضافة دواء للمخزون
router.post("/pharmacy/inventory", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as Parameters<typeof getAuthUser>[0]);
  if (!user || user.role !== "pharmacy" || !user.pharmacyId) {
    res.status(403).json({ error: "غير مصرح" }); return;
  }

  const parsed = UpsertInventoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Check if already exists
  const [existing] = await db
    .select()
    .from(pharmacyMedicationsTable)
    .where(eq(pharmacyMedicationsTable.pharmacyId, user.pharmacyId!));

  if (existing && existing.medicationId === parsed.data.medicationId) {
    res.status(409).json({ error: "الدواء موجود بالفعل في المخزون" }); return;
  }

  const [row] = await db
    .insert(pharmacyMedicationsTable)
    .values({
      pharmacyId: user.pharmacyId!,
      medicationId: parsed.data.medicationId,
      price: parsed.data.price,
      quantity: parsed.data.quantity,
    })
    .returning();

  res.status(201).json(row);
});

// PUT /pharmacy/inventory/:id — تعديل سعر أو كمية دواء
router.put("/pharmacy/inventory/:id", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as Parameters<typeof getAuthUser>[0]);
  if (!user || user.role !== "pharmacy" || !user.pharmacyId) {
    res.status(403).json({ error: "غير مصرح" }); return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const parsed = UpdateInventoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db
    .select()
    .from(pharmacyMedicationsTable)
    .where(eq(pharmacyMedicationsTable.id, id));

  if (!existing || existing.pharmacyId !== user.pharmacyId) {
    res.status(404).json({ error: "العنصر غير موجود" }); return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.price !== undefined) updates.price = parsed.data.price;
  if (parsed.data.quantity !== undefined) updates.quantity = parsed.data.quantity;

  const [updated] = await db
    .update(pharmacyMedicationsTable)
    .set(updates)
    .where(eq(pharmacyMedicationsTable.id, id))
    .returning();

  res.json(updated);
});

// DELETE /pharmacy/inventory/:id — حذف دواء من المخزون
router.delete("/pharmacy/inventory/:id", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as Parameters<typeof getAuthUser>[0]);
  if (!user || user.role !== "pharmacy" || !user.pharmacyId) {
    res.status(403).json({ error: "غير مصرح" }); return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صالح" }); return; }

  const [existing] = await db
    .select()
    .from(pharmacyMedicationsTable)
    .where(eq(pharmacyMedicationsTable.id, id));

  if (!existing || existing.pharmacyId !== user.pharmacyId) {
    res.status(404).json({ error: "العنصر غير موجود" }); return;
  }

  await db.delete(pharmacyMedicationsTable).where(eq(pharmacyMedicationsTable.id, id));

  res.status(204).send();
});

export default router;
