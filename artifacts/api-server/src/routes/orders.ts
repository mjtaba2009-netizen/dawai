import { Router, type IRouter } from "express";
import { db, ordersTable, medicationsTable, pharmaciesTable, pharmacyMedicationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams } from "@workspace/api-zod";

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

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: 1,
      pharmacyId: parsed.data.pharmacyId,
      medicationId: parsed.data.medicationId,
      quantity: parsed.data.quantity,
      totalPrice,
      status: "pending",
    })
    .returning();

  const orderWithDetails = await getOrderWithDetails(order.id);

  res.status(201).json(orderWithDetails);
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
