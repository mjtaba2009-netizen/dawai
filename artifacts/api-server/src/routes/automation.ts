/**
 * Automation Routes — Full-Stack Integration
 * ──────────────────────────────────────────────────────────────
 * مسارات الأتمتة الحقيقية — تستخدم Mock DB المحلية + PostgreSQL
 *
 *   POST /api/inventory/sync       — خصم المخزون
 *   POST /api/notifications/whatsapp — إشعار واتساب (محاكاة)
 *   POST /api/orders/timeout        — التوجيه الذكي لصيدلية بديلة
 *   GET  /api/pharmacies/mock       — قائمة الصيدليات مع روابط TikTok/Instagram
 *   GET  /api/inventory/mock        — عرض المخزون الكامل
 *   GET  /api/whatsapp/log          — سجل الرسائل المحاكاة
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  pharmacies,
  inventory,
  orders,
  whatsappLog,
  deductInventory,
  routeOrderToFallback,
  addOrder,
  logWhatsApp,
  getPharmacy,
  getFallbackPharmacy,
} from "../data/mockDb.js";

const router: IRouter = Router();

// ══════════════════════════════════════════════════════════════════════
// POST /api/inventory/sync — خصم المخزون
// ══════════════════════════════════════════════════════════════════════
/**
 * يستقبل: { orderId, pharmacyId, medicationId, quantity, medicationName }
 * يُنفّذ: خصم من المخزون الوهمي + تسجيل الطلب
 *
 * TODO: للإنتاج، أضف هنا UPDATE على جدول pharmacy_medications في PostgreSQL
 *   await db.update(pharmacyMedicationsTable)
 *     .set({ quantity: newQty })
 *     .where(eq(pharmacyMedicationsTable.id, item.id));
 */
const InventorySyncSchema = z.object({
  orderId:        z.number().int().positive(),
  pharmacyId:     z.number().int().positive(),
  medicationId:   z.number().int().positive(),
  quantity:       z.number().int().positive(),
  medicationName: z.string().min(1),
  patientPhone:   z.string().optional(),
  totalPrice:     z.number().optional(),
});

router.post("/inventory/sync", async (req, res): Promise<void> => {
  const parsed = InventorySyncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "بيانات غير صالحة",
      details: parsed.error.flatten(),
    });
    return;
  }

  const { orderId, pharmacyId, medicationId, quantity, medicationName, patientPhone, totalPrice } = parsed.data;

  // جلب بيانات الصيدلية
  const pharmacy = getPharmacy(pharmacyId) ?? pharmacies[0]; // Gmunden افتراضياً
  const branchName = pharmacy.branch;

  // خصم من Mock DB
  const result = deductInventory(pharmacyId, medicationId, quantity);

  // تسجيل الطلب في Mock DB (إذا لم يُسجَّل مسبقاً)
  const existing = orders.find((o) => o.id === orderId);
  if (!existing) {
    addOrder({
      id: orderId,
      pharmacyId,
      medicationId,
      quantity,
      totalPrice: totalPrice ?? 0,
      patientPhone: patientPhone ?? "غير محدد",
      status: "confirmed",
    });
  } else {
    existing.status = "confirmed";
    existing.updatedAt = new Date().toISOString();
  }

  // طباعة واضحة في الـ Console للتطوير
  console.log("\n📦 [inventory/sync] ──────────────────────────────");
  console.log(`   Branch:     ${branchName} (ID: ${pharmacyId})`);
  console.log(`   Medication: ${medicationName} (ID: ${medicationId})`);
  console.log(`   Deducted:   ${quantity} units`);
  console.log(`   Result:     ${result.message}`);
  console.log(`   Order ID:   ${orderId}`);
  console.log("─────────────────────────────────────────────────\n");

  if (!result.success) {
    // خصم فشل — لكن نُكمل العملية بتحذير
    res.json({
      success: true, // نُكمل للـ whatsapp خطوة
      warning: result.message,
      remaining: result.remaining,
      branch: branchName,
    });
    return;
  }

  res.json({
    success: true,
    message: result.message,
    remaining: result.remaining,
    branch: branchName,
    pharmacy: {
      name: pharmacy.name,
      branch: pharmacy.branch,
      tiktok: pharmacy.tiktok,
      instagram: pharmacy.instagram,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/notifications/whatsapp — محاكاة إشعار واتساب
// ══════════════════════════════════════════════════════════════════════
/**
 * يستقبل: { patientPhone, medicationName, totalPrice, pharmacyName, orderId, branch }
 * يُنفّذ: طباعة رسالة واتساب في الـ Console + تسجيل في سجل المحاكاة
 *
 * TODO: للإنتاج، استبدل console.log بـ:
 *   - Twilio API: client.messages.create({ from: "whatsapp:+14155238886", to: "whatsapp:+phone", body })
 *   - أو: n8n HTTP Request node → WhatsApp Business API
 */
const WhatsAppSchema = z.object({
  patientPhone:  z.string().min(5),
  medicationName: z.string().min(1),
  totalPrice:    z.number(),
  pharmacyName:  z.string().min(1),
  orderId:       z.number().int().positive(),
  branch:        z.string().optional().default("Gmunden"),
});

router.post("/notifications/whatsapp", async (req, res): Promise<void> => {
  const parsed = WhatsAppSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "بيانات الإشعار غير مكتملة",
      details: parsed.error.flatten(),
    });
    return;
  }

  const { patientPhone, medicationName, totalPrice, pharmacyName, orderId, branch } = parsed.data;

  // ─── محاكاة تأخير الإرسال (300ms) ───────────────────────
  await new Promise((r) => setTimeout(r, 300));

  // ─── الرسالة المحاكاة ─────────────────────────────────────
  const message = [
    `مرحباً 👋 طلبك جاهز!`,
    `💊 الدواء: ${medicationName}`,
    `🏪 الصيدلية: ${pharmacyName} — فرع ${branch}`,
    `💰 السعر: ${totalPrice.toFixed(2)} IQD`,
    `✅ يُرجى الحضور خلال ساعتين لاستلام دوائك.`,
    `📍 تابعنا: TikTok & Instagram @dawai.${branch.toLowerCase()}`,
  ].join("\n");

  // ─── طباعة واضحة في Console ──────────────────────────────
  console.log("\n📱 [notifications/whatsapp] ─────────────────────");
  console.log(`   ✅ WhatsApp Message Sent to ${patientPhone}:`);
  console.log(`   ┌─────────────────────────────────────────┐`);
  message.split("\n").forEach((line) => {
    console.log(`   │ ${line.padEnd(41)}│`);
  });
  console.log(`   └─────────────────────────────────────────┘`);
  console.log(`   Order ID: ${orderId}`);
  console.log("─────────────────────────────────────────────────\n");

  // ─── تسجيل في سجل المحاكاة ────────────────────────────────
  const log = logWhatsApp({
    phone: patientPhone,
    message,
    orderId,
    status: "sent",
  });

  res.json({
    success: true,
    message: "تم إرسال إشعار واتساب للمريض",
    to: patientPhone,
    messageId: `mock-${log.id}-${Date.now()}`,
    sentAt: log.sentAt,
    preview: message,
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/orders/timeout — التوجيه الذكي لصيدلية بديلة
// ══════════════════════════════════════════════════════════════════════
/**
 * يستقبل: { orderId, originalPharmacyId, reason? }
 * يُنفّذ: تغيير pharmacy_id في Mock DB + إعادة بيانات الصيدلية البديلة
 *
 * TODO: للإنتاج:
 *   await db.update(ordersTable)
 *     .set({ pharmacyId: fallback.id, status: "routed" })
 *     .where(eq(ordersTable.id, orderId));
 */
const OrderTimeoutSchema = z.object({
  orderId:           z.number().int().positive(),
  originalPharmacyId: z.number().int().positive(),
  reason:            z.enum(["timeout", "rejected", "unavailable"]).optional().default("timeout"),
});

router.post("/orders/timeout", async (req, res): Promise<void> => {
  const parsed = OrderTimeoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "بيانات التوجيه غير صالحة",
      details: parsed.error.flatten(),
    });
    return;
  }

  const { orderId, originalPharmacyId, reason } = parsed.data;

  const originalPharmacy = getPharmacy(originalPharmacyId) ?? pharmacies[0];
  const fallback = getFallbackPharmacy(originalPharmacyId);

  if (!fallback) {
    res.status(503).json({
      success: false,
      error: "لا توجد صيدليات بديلة متاحة حالياً",
    });
    return;
  }

  // توجيه في Mock DB
  const routingResult = routeOrderToFallback(orderId, originalPharmacyId);

  // طباعة في Console
  console.log("\n🔁 [orders/timeout] ──────────────────────────────");
  console.log(`   Reason:    ${reason}`);
  console.log(`   Order ID:  ${orderId}`);
  console.log(`   From:      ${originalPharmacy.branch} (ID: ${originalPharmacyId})`);
  console.log(`   To:        ${fallback.branch} (ID: ${fallback.id})`);
  console.log(`   Message:   ${routingResult.message}`);
  console.log(`   TikTok:    ${fallback.tiktok}`);
  console.log(`   Instagram: ${fallback.instagram}`);
  console.log("─────────────────────────────────────────────────\n");

  res.json({
    success: true,
    message: routingResult.message,
    fallbackPharmacy: {
      id:         fallback.id,
      name:       fallback.name,
      branch:     fallback.branch,
      address:    fallback.address,
      phone:      fallback.phone,
      tiktok:     fallback.tiktok,
      instagram:  fallback.instagram,
    },
    originalBranch: originalPharmacy.branch,
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/pharmacies/mock — قائمة الصيدليات
// ══════════════════════════════════════════════════════════════════════
router.get("/pharmacies/mock", (_req, res): void => {
  res.json(pharmacies);
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/inventory/mock — عرض المخزون
// ══════════════════════════════════════════════════════════════════════
router.get("/inventory/mock", (_req, res): void => {
  res.json(inventory);
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/whatsapp/log — سجل رسائل واتساب المحاكاة
// ══════════════════════════════════════════════════════════════════════
router.get("/whatsapp/log", (_req, res): void => {
  res.json(whatsappLog);
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/orders/mock — الطلبات في Mock DB
// ══════════════════════════════════════════════════════════════════════
router.get("/orders/mock", (_req, res): void => {
  res.json(orders);
});

export default router;
