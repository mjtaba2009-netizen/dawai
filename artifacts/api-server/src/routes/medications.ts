import { Router, type IRouter } from "express";
import { db, medicationsTable, pharmaciesTable, pharmacyMedicationsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { SearchMedicationsQueryParams, GetMedicationParams } from "@workspace/api-zod";

const router: IRouter = Router();

// البحث عن دواء في الصيدليات القريبة
router.get("/medications/search", async (req, res): Promise<void> => {
  const parsed = SearchMedicationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q } = parsed.data;

  // البحث عن الدواء بالاسم أو المادة الفعّالة
  const [medication] = await db
    .select()
    .from(medicationsTable)
    .where(ilike(medicationsTable.name, `%${q}%`))
    .limit(1);

  if (!medication) {
    res.json({ medication: null, pharmacies: [] });
    return;
  }

  // البحث عن الصيدليات التي تحتوي على الدواء
  const inventoryRows = await db
    .select({
      pharmacyMedication: pharmacyMedicationsTable,
      pharmacy: pharmaciesTable,
    })
    .from(pharmacyMedicationsTable)
    .innerJoin(pharmaciesTable, eq(pharmacyMedicationsTable.pharmacyId, pharmaciesTable.id))
    .where(
      and(
        eq(pharmacyMedicationsTable.medicationId, medication.id),
      )
    )
    .orderBy(pharmaciesTable.distance);

  const pharmacies = inventoryRows.map((row) => ({
    pharmacy: {
      id: row.pharmacy.id,
      name: row.pharmacy.name,
      address: row.pharmacy.address,
      distance: row.pharmacy.distance,
      isOpen: row.pharmacy.isOpen,
      phone: row.pharmacy.phone,
      whatsapp: row.pharmacy.whatsapp ?? null,
      rating: row.pharmacy.rating ?? null,
      lat: row.pharmacy.lat ?? null,
      lng: row.pharmacy.lng ?? null,
      imageUrl: row.pharmacy.imageUrl ?? null,
    },
    price: row.pharmacyMedication.price,
    quantity: row.pharmacyMedication.quantity,
  }));

  res.json({
    medication: {
      id: medication.id,
      name: medication.name,
      genericName: medication.genericName,
      category: medication.category,
      description: medication.description ?? null,
      requiresPrescription: medication.requiresPrescription,
      imageUrl: medication.imageUrl ?? null,
    },
    pharmacies,
  });
});

// الأدوية الشائعة
router.get("/medications/popular", async (_req, res): Promise<void> => {
  const medications = await db
    .select()
    .from(medicationsTable)
    .limit(10);

  res.json(
    medications.map((m) => ({
      id: m.id,
      name: m.name,
      genericName: m.genericName,
      category: m.category,
      description: m.description ?? null,
      requiresPrescription: m.requiresPrescription,
      imageUrl: m.imageUrl ?? null,
    }))
  );
});

// تفاصيل دواء
router.get("/medications/:id", async (req, res): Promise<void> => {
  const params = GetMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [medication] = await db
    .select()
    .from(medicationsTable)
    .where(eq(medicationsTable.id, params.data.id));

  if (!medication) {
    res.status(404).json({ error: "الدواء غير موجود" });
    return;
  }

  res.json({
    id: medication.id,
    name: medication.name,
    genericName: medication.genericName,
    category: medication.category,
    description: medication.description ?? null,
    requiresPrescription: medication.requiresPrescription,
    imageUrl: medication.imageUrl ?? null,
  });
});

export default router;
