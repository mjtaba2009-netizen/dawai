/**
 * Webhook Routes — دوائي Automation System
 * ─────────────────────────────────────────────────────────────────────
 * هذه المسارات تعمل كـ stubs محلية تُسجّل الطلبات وتُعيد نجاحاً.
 * لربطها بـ n8n أو أي أتمتة خارجية:
 *
 *   1. inventory-sync:
 *      في n8n → أنشئ HTTP Webhook node → استقبل POST
 *      → Postgres node لتحديث pharmacy_medications.quantity
 *
 *   2. whatsapp-alert:
 *      في n8n → Webhook → Twilio / WhatsApp Business API node
 *      → أرسل رسالة للمريض مع تفاصيل الطلب
 *
 *   3. smart-routing:
 *      في n8n → Webhook → Postgres node (UPDATE orders SET pharmacy_id = ?)
 *      → HTTP node لإشعار الصيدلية البديلة
 */

import { Router, type IRouter } from "express";
import { db, pharmacyMedicationsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// ─── مساعد التحقق من الهوية ────────────────────────────────
async function getUserFromToken(authHeader?: string) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = Buffer.from(authHeader.slice(7), "base64").toString("utf-8");
    const [idStr] = decoded.split(":");
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return null;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user ?? null;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════════
// POST /webhooks/inventory-sync
// ═══════════════════════════════════════════════════════════════════════
/**
 * 📦 خصم المخزون بعد قبول الطلب
 *
 * Body: { pharmacyId: number, medicationId: number, quantity: number }
 *
 * TODO: استبدل هذا المسار المحلي بـ n8n Webhook:
 *   N8N_INVENTORY_WEBHOOK = "https://your-n8n.domain/webhook/inventory-sync"
 *   يستقبل n8n الطلب ثم يُحدّث قاعدة البيانات مباشرةً
 */
router.post("/webhooks/inventory-sync", async (req, res): Promise<void> => {
  const user = await getUserFromToken(req.headers.authorization);

  const { pharmacyId, medicationId, quantity } = req.body as {
    pharmacyId: number;
    medicationId: number;
    quantity: number;
  };

  if (!pharmacyId || !medicationId || !quantity) {
    res.status(400).json({ error: "بيانات ناقصة" });
    return;
  }

  console.log(`[inventory-sync] pharmacy=${pharmacyId} medication=${medicationId} deduct=${quantity}`);

  try {
    // خصم الكمية من المخزون الفعلي
    const [item] = await db
      .select()
      .from(pharmacyMedicationsTable)
      .where(
        and(
          eq(pharmacyMedicationsTable.pharmacyId, pharmacyId),
          eq(pharmacyMedicationsTable.medicationId, medicationId),
        ),
      );

    if (item) {
      const newQty = Math.max(0, item.quantity - quantity);
      await db
        .update(pharmacyMedicationsTable)
        .set({ quantity: newQty })
        .where(eq(pharmacyMedicationsTable.id, item.id));

      console.log(`[inventory-sync] ✅ quantity updated: ${item.quantity} → ${newQty}`);
    }

    res.json({
      success: true,
      message: "تم تحديث المخزون",
      // TODO: في n8n، أضف هنا إشعاراً آلياً عند وصول الكمية إلى صفر
    });
  } catch (err) {
    console.error("[inventory-sync] error:", err);
    res.status(500).json({ error: "فشل تحديث المخزون" });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// POST /webhooks/whatsapp-alert
// ═══════════════════════════════════════════════════════════════════════
/**
 * 📱 إرسال إشعار واتساب للمريض
 *
 * Body: { patientPhone, medicationName, totalPrice, pharmacyName }
 *
 * TODO: في n8n، أضف HTTP Webhook node ثم:
 *   → Twilio node: أرسل رسالة WhatsApp
 *   أو → HTTP Request node إلى WhatsApp Business API
 *
 * نموذج الرسالة المقترح:
 *   "مرحباً 👋 دواءك *{{medicationName}}* جاهز للاستلام
 *    من {{pharmacyName}}. السعر: {{totalPrice}} ر.س.
 *    يُرجى الحضور خلال ساعتين."
 */
router.post("/webhooks/whatsapp-alert", async (req, res): Promise<void> => {
  const { patientPhone, medicationName, totalPrice, pharmacyName } = req.body as {
    patientPhone: string;
    medicationName: string;
    totalPrice: number;
    pharmacyName: string;
  };

  // التحقق من البيانات
  if (!patientPhone || !medicationName) {
    res.status(400).json({ error: "بيانات الإشعار ناقصة" });
    return;
  }

  // تسجيل للتطوير (stub)
  console.log("[whatsapp-alert] 📱 Payload received:");
  console.log(`  → Phone:    ${patientPhone}`);
  console.log(`  → Medicine: ${medicationName}`);
  console.log(`  → Price:    ${totalPrice} IQD`);
  console.log(`  → Pharmacy: ${pharmacyName}`);
  console.log("[whatsapp-alert] TODO: Connect to n8n → Twilio / WhatsApp Business API");

  // محاكاة تأخير الإرسال
  await new Promise((r) => setTimeout(r, 300));

  res.json({
    success: true,
    message: "تم إرسال إشعار واتساب للمريض",
    to: patientPhone,
    // TODO: في الإنتاج، أضف هنا messageId من Twilio/WhatsApp API
  });
});

// ═══════════════════════════════════════════════════════════════════════
// POST /webhooks/smart-routing
// ═══════════════════════════════════════════════════════════════════════
/**
 * 🔁 التوجيه الذكي — إعادة توجيه الطلب لصيدلية بديلة
 *
 * Body: { orderId, originalPharmacyId, fallbackPharmacy }
 *
 * TODO: في n8n:
 *   1. HTTP Webhook node يستقبل الطلب
 *   2. Postgres node: UPDATE orders SET pharmacy_id = ? WHERE id = ?
 *   3. HTTP node: إشعار الصيدلية الجديدة (Push Notification / WebSocket)
 *   4. WhatsApp node: إشعار المريض بالصيدلية البديلة
 */
router.post("/webhooks/smart-routing", async (req, res): Promise<void> => {
  const { orderId, originalPharmacyId, fallbackPharmacy } = req.body as {
    orderId: number;
    originalPharmacyId: number;
    fallbackPharmacy: string;
  };

  console.log("[smart-routing] 🔁 Routing order to fallback:");
  console.log(`  → Order:            ${orderId}`);
  console.log(`  → Original Pharmacy: ${originalPharmacyId}`);
  console.log(`  → Fallback Pharmacy: ${fallbackPharmacy}`);
  console.log("[smart-routing] TODO: n8n → UPDATE orders.pharmacy_id → notify fallback pharmacy");

  await new Promise((r) => setTimeout(r, 200));

  res.json({
    success: true,
    message: "تم توجيه الطلب للصيدلية البديلة",
    fallbackPharmacy,
    // TODO: في الإنتاج، أعد pharmacyId الجديد من قاعدة البيانات
  });
});

export default router;
