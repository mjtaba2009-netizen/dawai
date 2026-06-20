import { Router, type IRouter } from "express";
import { db, pharmaciesTable, pharmacyMedicationsTable, medicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetNearbyPharmaciesQueryParams, GetPharmacyParams, GetPharmacyMedicationsParams } from "@workspace/api-zod";

const router: IRouter = Router();

// الصيدليات القريبة
router.get("/pharmacies/nearby", async (req, res): Promise<void> => {
  const parsed = GetNearbyPharmaciesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

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
  const params = GetPharmacyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [pharmacy] = await db
    .select()
    .from(pharmaciesTable)
    .where(eq(pharmaciesTable.id, params.data.id));

  if (!pharmacy) {
    res.status(404).json({ error: "الصيدلية غير موجودة" });
    return;
  }

  res.json({
    id: pharmacy.id,
    name: pharmacy.name,
    address: pharmacy.address,
    distance: pharmacy.distance,
    isOpen: pharmacy.isOpen,
    phone: pharmacy.phone,
    whatsapp: pharmacy.whatsapp ?? null,
    rating: pharmacy.rating ?? null,
    lat: pharmacy.lat ?? null,
    lng: pharmacy.lng ?? null,
    imageUrl: pharmacy.imageUrl ?? null,
  });
});

// أدوية صيدلية معينة
router.get("/pharmacies/:id/medications", async (req, res): Promise<void> => {
  const params = GetPharmacyMedicationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      pm: pharmacyMedicationsTable,
      med: medicationsTable,
    })
    .from(pharmacyMedicationsTable)
    .innerJoin(medicationsTable, eq(pharmacyMedicationsTable.medicationId, medicationsTable.id))
    .where(eq(pharmacyMedicationsTable.pharmacyId, params.data.id));

  res.json(
    rows.map((row) => ({
      id: row.pm.id,
      medicationId: row.pm.medicationId,
      pharmacyId: row.pm.pharmacyId,
      price: row.pm.price,
      quantity: row.pm.quantity,
      medication: {
        id: row.med.id,
        name: row.med.name,
        genericName: row.med.genericName,
        category: row.med.category,
        description: row.med.description ?? null,
        requiresPrescription: row.med.requiresPrescription,
        imageUrl: row.med.imageUrl ?? null,
      },
    }))
  );
});

export default router;
