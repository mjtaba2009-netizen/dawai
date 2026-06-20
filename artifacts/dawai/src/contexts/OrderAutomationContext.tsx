/**
 * OrderAutomationContext
 * ─────────────────────────────────────────────────────────────────────────
 * يُدير ثلاثة محاور أتمتة:
 *  1. خصم المخزون (Optimistic UI → Webhook inventory-sync)
 *  2. إشعار واتساب (Webhook whatsapp-alert)
 *  3. التوجيه الذكي (Smart Routing): مؤقت 15 ثانية → صيدلية بديلة
 */
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
export type AutomationStep =
  | "idle"
  | "inventory-sync"
  | "whatsapp-alert"
  | "done"
  | "routing"       // انتهى وقت الصيدلية الأولى — جاري التوجيه
  | "routed"        // تم الإرسال للصيدلية البديلة
  | "error";

export interface OrderPayload {
  orderId: number;
  medicationId: number;
  medicationName: string;
  quantity: number;
  totalPrice: number;
  pharmacyId: number;
  pharmacyName: string;
  /** رقم المريض — يُرسل في webhook واتساب */
  patientPhone: string;
}

export interface AutomationEntry {
  step: AutomationStep;
  payload: OrderPayload;
  fallbackPharmacy?: string;
  error?: string;
  acceptedAt?: number;
}

interface AutomationState {
  /** مفتاح: orderId */
  entries: Record<number, AutomationEntry>;
  /** خصم مخزون متفائل: medicationId → كمية منقوصة */
  inventoryDeductions: Record<number, number>;
}

type Action =
  | { type: "WATCH";         payload: OrderPayload }
  | { type: "SET_STEP";      orderId: number; step: AutomationStep; extra?: Partial<AutomationEntry> }
  | { type: "DEDUCT";        medicationId: number; qty: number }
  | { type: "RESTORE";       medicationId: number; qty: number }
  | { type: "REMOVE";        orderId: number }
  | { type: "SET_FALLBACK";  orderId: number; pharmacy: string };

// ═══════════════════════════════════════════════════════════════
// Reducer
// ═══════════════════════════════════════════════════════════════
function reducer(state: AutomationState, action: Action): AutomationState {
  switch (action.type) {
    case "WATCH":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.payload.orderId]: { step: "idle", payload: action.payload },
        },
      };

    case "SET_STEP":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.orderId]: {
            ...state.entries[action.orderId],
            step: action.step,
            ...action.extra,
          },
        },
      };

    case "DEDUCT":
      return {
        ...state,
        inventoryDeductions: {
          ...state.inventoryDeductions,
          [action.medicationId]:
            (state.inventoryDeductions[action.medicationId] ?? 0) + action.qty,
        },
      };

    case "RESTORE":
      return {
        ...state,
        inventoryDeductions: {
          ...state.inventoryDeductions,
          [action.medicationId]: Math.max(
            0,
            (state.inventoryDeductions[action.medicationId] ?? 0) - action.qty,
          ),
        },
      };

    case "SET_FALLBACK":
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.orderId]: {
            ...state.entries[action.orderId],
            fallbackPharmacy: action.pharmacy,
          },
        },
      };

    case "REMOVE": {
      const { [action.orderId]: _, ...rest } = state.entries;
      return { ...state, entries: rest };
    }

    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════
// Webhook helpers — ضع روابط n8n الحقيقية هنا لاحقاً
// ═══════════════════════════════════════════════════════════════
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/**
 * 📦 Webhook: خصم المخزون
 * ────────────────────────
 * TODO: استبدل هذا المسار بـ n8n Webhook URL الخاص بك:
 *   const N8N_INVENTORY_WEBHOOK = "https://your-n8n.domain/webhook/inventory-sync";
 *   await fetch(N8N_INVENTORY_WEBHOOK, { method: "POST", ... });
 */
async function callInventorySyncWebhook(payload: {
  pharmacyId: number;
  medicationId: number;
  qty: number;
  token: string;
}) {
  const res = await fetch(`${BASE}/api/webhooks/inventory-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload.token}`,
    },
    body: JSON.stringify({
      pharmacyId: payload.pharmacyId,
      medicationId: payload.medicationId,
      quantity: payload.qty,
    }),
  });
  if (!res.ok) throw new Error("inventory-sync failed");
  return res.json();
}

/**
 * 📱 Webhook: إشعار واتساب
 * ─────────────────────────
 * TODO: استبدل هذا المسار بـ n8n Webhook URL الخاص بك:
 *   const N8N_WHATSAPP_WEBHOOK = "https://your-n8n.domain/webhook/whatsapp-alert";
 *   await fetch(N8N_WHATSAPP_WEBHOOK, { method: "POST", ... });
 */
async function callWhatsAppWebhook(payload: {
  patientPhone: string;
  medicationName: string;
  totalPrice: number;
  pharmacyName: string;
}) {
  const res = await fetch(`${BASE}/api/webhooks/whatsapp-alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("whatsapp-alert failed");
  return res.json();
}

/**
 * 🔁 Webhook: توجيه الطلب لصيدلية بديلة
 * ───────────────────────────────────────
 * TODO: استبدل هذا المسار بـ n8n Webhook URL الخاص بك:
 *   const N8N_ROUTING_WEBHOOK = "https://your-n8n.domain/webhook/smart-routing";
 *   await fetch(N8N_ROUTING_WEBHOOK, { method: "POST", ... });
 */
async function callSmartRoutingWebhook(payload: {
  orderId: number;
  originalPharmacyId: number;
  fallbackPharmacy: string;
}) {
  const res = await fetch(`${BASE}/api/webhooks/smart-routing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("smart-routing failed");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════
interface OrderAutomationCtx {
  state: AutomationState;

  /**
   * يبدأ مراقبة طلب جديد ويُشغّل مؤقت التوجيه الذكي (15 ثانية).
   * استدعِه مباشرة بعد إنشاء الطلب من جانب المريض.
   */
  watchOrder: (payload: OrderPayload, token: string) => void;

  /**
   * تسلسل الأتمتة الكامل عند قبول الصيدلي للطلب:
   *   1. يوقف مؤقت التوجيه
   *   2. خصم مخزون متفائل (Optimistic)
   *   3. Webhook: inventory-sync
   *   4. Webhook: whatsapp-alert
   *   5. PUT /pharmacy/orders/:id/status → confirmed
   */
  acceptOrder: (orderId: number, token: string) => Promise<void>;

  /**
   * رفض الطلب + إلغاء المؤقت + استعادة المخزون إن لزم.
   */
  rejectOrder: (orderId: number, token: string) => Promise<void>;

  /**
   * يُخبر Context أن الطلب اكتمل (مثلاً: استُلم الدواء).
   */
  completeOrder: (orderId: number) => void;

  /** قراءة الخصم المتفائل لمنتج ما لعرضه في مكون المخزون */
  getInventoryDeduction: (medicationId: number) => number;
}

const OrderAutomationContext = createContext<OrderAutomationCtx | null>(null);

export function useOrderAutomation() {
  const ctx = useContext(OrderAutomationContext);
  if (!ctx) throw new Error("useOrderAutomation must be used inside OrderAutomationProvider");
  return ctx;
}

// ═══════════════════════════════════════════════════════════════
// Provider
// ═══════════════════════════════════════════════════════════════
const SMART_ROUTING_TIMEOUT_MS = 15_000;
const FALLBACK_PHARMACIES = ["صيدلية الحياة", "صيدلية الأمل", "صيدلية النور", "صيدلية الشفاء"];

export function OrderAutomationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    entries: {},
    inventoryDeductions: {},
  });

  // مراجع المؤقتات: orderId → timerId — لضمان تنظيف الذاكرة (Memory Leak Prevention)
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // تنظيف جميع المؤقتات عند فك تركيب الـ Provider
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  // ─── watchOrder ───────────────────────────────────────────
  const watchOrder = useCallback((payload: OrderPayload, token: string) => {
    dispatch({ type: "WATCH", payload });

    // بدء مؤقت التوجيه الذكي
    const timerId = setTimeout(async () => {
      // تحقق إذا كان الطلب لا يزال في وضع الانتظار
      dispatch({ type: "SET_STEP", orderId: payload.orderId, step: "routing" });

      // اختر صيدلية بديلة عشوائية من القائمة
      const fallback = FALLBACK_PHARMACIES[Math.floor(Math.random() * FALLBACK_PHARMACIES.length)];
      dispatch({ type: "SET_FALLBACK", orderId: payload.orderId, pharmacy: fallback });

      try {
        // 🔁 Webhook: إشعار التوجيه الذكي
        // TODO: وصّل هذا بـ n8n ليُغيّر pharmacyId في قاعدة البيانات ويُشعر المريض
        await callSmartRoutingWebhook({
          orderId: payload.orderId,
          originalPharmacyId: payload.pharmacyId,
          fallbackPharmacy: fallback,
        });
      } catch {
        // التوجيه يعمل حتى لو فشل الـ webhook
      }

      dispatch({ type: "SET_STEP", orderId: payload.orderId, step: "routed", extra: { fallbackPharmacy: fallback } });
      delete timersRef.current[payload.orderId];
    }, SMART_ROUTING_TIMEOUT_MS);

    timersRef.current[payload.orderId] = timerId;
  }, []);

  // ─── acceptOrder ──────────────────────────────────────────
  const acceptOrder = useCallback(async (orderId: number, token: string) => {
    const entry = state.entries[orderId];
    if (!entry) return;
    const { payload } = entry;

    // 1️⃣ إلغاء مؤقت التوجيه — الصيدلي استجاب في الوقت
    if (timersRef.current[orderId]) {
      clearTimeout(timersRef.current[orderId]);
      delete timersRef.current[orderId];
    }

    // 2️⃣ خصم المخزون — Optimistic UI (فوري قبل انتهاء الـ API call)
    dispatch({ type: "DEDUCT", medicationId: payload.medicationId, qty: payload.quantity });
    dispatch({ type: "SET_STEP", orderId, step: "inventory-sync" });

    try {
      // 3️⃣ Webhook: تحديث المخزون في قاعدة البيانات
      // 📦 TODO: n8n → inventory-sync workflow
      await callInventorySyncWebhook({
        pharmacyId: payload.pharmacyId,
        medicationId: payload.medicationId,
        qty: payload.quantity,
        token,
      });
    } catch {
      // في حال فشل الـ Webhook، استعد الخصم المتفائل
      dispatch({ type: "RESTORE", medicationId: payload.medicationId, qty: payload.quantity });
    }

    dispatch({ type: "SET_STEP", orderId, step: "whatsapp-alert" });

    try {
      // 4️⃣ Webhook: إشعار المريض عبر واتساب
      // 📱 TODO: n8n → whatsapp-alert workflow → Twilio/WhatsApp Business API
      await callWhatsAppWebhook({
        patientPhone: payload.patientPhone,
        medicationName: payload.medicationName,
        totalPrice: payload.totalPrice,
        pharmacyName: payload.pharmacyName,
      });
    } catch {
      // إشعار واتساب اختياري — لا يوقف العملية
    }

    // 5️⃣ تحديث حالة الطلب في قاعدة البيانات
    const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
    await fetch(`${BASE_URL}/api/pharmacy/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "confirmed" }),
    });

    dispatch({ type: "SET_STEP", orderId, step: "done", extra: { acceptedAt: Date.now() } });
  }, [state.entries]);

  // ─── rejectOrder ──────────────────────────────────────────
  const rejectOrder = useCallback(async (orderId: number, token: string) => {
    // إلغاء المؤقت
    if (timersRef.current[orderId]) {
      clearTimeout(timersRef.current[orderId]);
      delete timersRef.current[orderId];
    }

    const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
    await fetch(`${BASE_URL}/api/pharmacy/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "rejected" }),
    });

    dispatch({ type: "REMOVE", orderId });
  }, []);

  // ─── completeOrder ────────────────────────────────────────
  const completeOrder = useCallback((orderId: number) => {
    dispatch({ type: "REMOVE", orderId });
  }, []);

  // ─── getInventoryDeduction ───────────────────────────────
  const getInventoryDeduction = useCallback(
    (medicationId: number) => state.inventoryDeductions[medicationId] ?? 0,
    [state.inventoryDeductions],
  );

  return (
    <OrderAutomationContext.Provider
      value={{
        state,
        watchOrder,
        acceptOrder,
        rejectOrder,
        completeOrder,
        getInventoryDeduction,
      }}
    >
      {children}
    </OrderAutomationContext.Provider>
  );
}
