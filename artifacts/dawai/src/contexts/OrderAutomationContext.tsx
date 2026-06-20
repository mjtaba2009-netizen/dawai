/**
 * OrderAutomationContext — Full-Stack Integration
 * ─────────────────────────────────────────────────────────────────────────
 * يُدير ثلاثة محاور أتمتة عبر API Routes حقيقية:
 *
 *  1. خصم المخزون      → POST /api/inventory/sync
 *  2. إشعار واتساب    → POST /api/notifications/whatsapp
 *  3. التوجيه الذكي   → POST /api/orders/timeout  (مؤقت 15 ثانية)
 *
 * كل خطوة تدعم: loading state، error handling، واسترداد المخزون عند الفشل.
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
  | "routing"
  | "routed"
  | "error";

export interface OrderPayload {
  orderId:        number;
  medicationId:   number;
  medicationName: string;
  quantity:       number;
  totalPrice:     number;
  pharmacyId:     number;
  pharmacyName:   string;
  /** رقم المريض — يُرسل لـ /api/notifications/whatsapp */
  patientPhone:   string;
}

export interface AutomationEntry {
  step:              AutomationStep;
  payload:           OrderPayload;
  fallbackPharmacy?: string;
  /** رسالة الخطأ إن وجدت */
  error?:            string;
  /** الخطوة التي فشلت */
  failedStep?:       string;
  acceptedAt?:       number;
  /** بيانات الصيدلية البديلة من الخادم */
  fallbackData?:     {
    name: string; branch: string; address?: string;
    tiktok: string; instagram: string;
  };
}

interface AutomationState {
  entries:             Record<number, AutomationEntry>;
  inventoryDeductions: Record<number, number>;
}

type Action =
  | { type: "WATCH";        payload: OrderPayload }
  | { type: "SET_STEP";     orderId: number; step: AutomationStep; extra?: Partial<AutomationEntry> }
  | { type: "DEDUCT";       medicationId: number; qty: number }
  | { type: "RESTORE";      medicationId: number; qty: number }
  | { type: "REMOVE";       orderId: number }
  | { type: "SET_FALLBACK"; orderId: number; pharmacy: string; data?: AutomationEntry["fallbackData"] };

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
          [action.orderId]: { ...state.entries[action.orderId], step: action.step, ...action.extra },
        },
      };
    case "DEDUCT":
      return {
        ...state,
        inventoryDeductions: {
          ...state.inventoryDeductions,
          [action.medicationId]: (state.inventoryDeductions[action.medicationId] ?? 0) + action.qty,
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
            fallbackData:     action.data,
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
// API helpers — مسارات محلية حقيقية
// ═══════════════════════════════════════════════════════════════
import { API_PREFIX } from "@/lib/api-base";

const BASE = API_PREFIX;

interface ApiResult<T = unknown> {
  ok:    boolean;
  data?: T;
  error?: string;
}

async function apiPost<T>(path: string, body: object, token?: string): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
      method:  "POST",
      headers,
      body:    JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ في الاتصال بالخادم" };
  }
}

// ─── 1. خصم المخزون ─────────────────────────────────────────
/**
 * POST /api/inventory/sync
 * يخصم الكمية من Mock DB + PostgreSQL ويُعيد بيانات الصيدلية
 *
 * TODO: لربط n8n — أضف Webhook node يستقبل نفس الـ payload ثم:
 *   → Postgres node: UPDATE pharmacy_medications SET quantity = quantity - qty
 */
async function syncInventory(payload: OrderPayload, token?: string) {
  return apiPost<{
    success: boolean;
    message: string;
    remaining: number;
    branch: string;
    pharmacy?: { name: string; branch: string; tiktok: string; instagram: string };
  }>("/api/inventory/sync", {
    orderId:        payload.orderId,
    pharmacyId:     payload.pharmacyId,
    medicationId:   payload.medicationId,
    quantity:       payload.quantity,
    medicationName: payload.medicationName,
    patientPhone:   payload.patientPhone,
    totalPrice:     payload.totalPrice,
  }, token);
}

// ─── 2. إشعار واتساب ─────────────────────────────────────────
/**
 * POST /api/notifications/whatsapp
 * يُسجّل رسالة واتساب محاكاة في Console + Mock DB
 *
 * TODO: لربط Twilio/WhatsApp Business API:
 *   استبدل بـ n8n HTTP Request node أو Twilio SDK
 *   const client = twilio(accountSid, authToken);
 *   client.messages.create({ from: "whatsapp:+14155238886", to: `whatsapp:${phone}`, body })
 */
async function sendWhatsApp(payload: OrderPayload, branch: string) {
  return apiPost<{
    success: boolean;
    message: string;
    to: string;
    messageId: string;
    sentAt: string;
    preview: string;
  }>("/api/notifications/whatsapp", {
    patientPhone:  payload.patientPhone,
    medicationName: payload.medicationName,
    totalPrice:    payload.totalPrice,
    pharmacyName:  payload.pharmacyName,
    orderId:       payload.orderId,
    branch,
  });
}

// ─── 3. التوجيه الذكي ─────────────────────────────────────────
/**
 * POST /api/orders/timeout
 * يُحوّل الطلب لصيدلية بديلة في Mock DB
 *
 * TODO: للإنتاج:
 *   await db.update(ordersTable).set({ pharmacyId: fallback.id }).where(...)
 */
async function timeoutOrder(orderId: number, pharmacyId: number, reason = "timeout") {
  return apiPost<{
    success: boolean;
    message: string;
    fallbackPharmacy: {
      id: number; name: string; branch: string; address: string;
      tiktok: string; instagram: string;
    };
    originalBranch: string;
  }>("/api/orders/timeout", { orderId, originalPharmacyId: pharmacyId, reason });
}

// ═══════════════════════════════════════════════════════════════
// Context interface
// ═══════════════════════════════════════════════════════════════
interface OrderAutomationCtx {
  state:                 AutomationState;
  watchOrder:            (payload: OrderPayload, token: string) => void;
  acceptOrder:           (orderId: number, token: string) => Promise<void>;
  rejectOrder:           (orderId: number, token: string) => Promise<void>;
  completeOrder:         (orderId: number) => void;
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

export function OrderAutomationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    entries: {},
    inventoryDeductions: {},
  });

  // مراجع المؤقتات — لضمان تنظيف الذاكرة (Memory Leak Prevention)
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => { Object.values(timersRef.current).forEach(clearTimeout); };
  }, []);

  // ─── watchOrder ───────────────────────────────────────────────
  const watchOrder = useCallback((payload: OrderPayload, token: string) => {
    // تجنب إعادة المراقبة لنفس الطلب
    if (state.entries[payload.orderId]) return;

    dispatch({ type: "WATCH", payload });

    const timerId = setTimeout(async () => {
      delete timersRef.current[payload.orderId];

      dispatch({ type: "SET_STEP", orderId: payload.orderId, step: "routing" });

      // POST /api/orders/timeout — الخادم يختار الصيدلية البديلة
      const result = await timeoutOrder(payload.orderId, payload.pharmacyId, "timeout");

      if (result.ok && result.data?.fallbackPharmacy) {
        const fb = result.data.fallbackPharmacy;
        dispatch({
          type:     "SET_FALLBACK",
          orderId:  payload.orderId,
          pharmacy: fb.name,
          data:     { name: fb.name, branch: fb.branch, address: fb.address, tiktok: fb.tiktok, instagram: fb.instagram },
        });
        dispatch({ type: "SET_STEP", orderId: payload.orderId, step: "routed" });
      } else {
        dispatch({
          type: "SET_STEP", orderId: payload.orderId, step: "error",
          extra: { error: result.error ?? "فشل التوجيه", failedStep: "smart-routing" },
        });
      }
    }, SMART_ROUTING_TIMEOUT_MS);

    timersRef.current[payload.orderId] = timerId;
  }, [state.entries]);

  // ─── acceptOrder — تسلسل الأتمتة الكامل ─────────────────────
  const acceptOrder = useCallback(async (orderId: number, token: string) => {
    const entry = state.entries[orderId];
    if (!entry) return;
    const { payload } = entry;

    // 1️⃣ إلغاء مؤقت التوجيه — الصيدلي استجاب في الوقت
    if (timersRef.current[orderId]) {
      clearTimeout(timersRef.current[orderId]);
      delete timersRef.current[orderId];
    }

    // 2️⃣ Optimistic UI — خصم فوري في الواجهة
    dispatch({ type: "DEDUCT", medicationId: payload.medicationId, qty: payload.quantity });
    dispatch({ type: "SET_STEP", orderId, step: "inventory-sync" });

    // 3️⃣ POST /api/inventory/sync — خصم حقيقي في الخادم
    const invResult = await syncInventory(payload, token);

    if (!invResult.ok) {
      // فشل الخصم — استعادة Optimistic update
      dispatch({ type: "RESTORE", medicationId: payload.medicationId, qty: payload.quantity });
      dispatch({
        type: "SET_STEP", orderId, step: "error",
        extra: { error: invResult.error, failedStep: "inventory-sync" },
      });
      return;
    }

    const branch = invResult.data?.branch ?? "البصرة";

    // 4️⃣ POST /api/notifications/whatsapp — إشعار المريض
    dispatch({ type: "SET_STEP", orderId, step: "whatsapp-alert" });

    const waResult = await sendWhatsApp(payload, branch);

    if (!waResult.ok) {
      // إشعار واتساب اختياري — لا يوقف العملية، لكن نُسجّل الخطأ
      console.warn("[OrderAutomation] WhatsApp notification failed:", waResult.error);
    }

    // 5️⃣ تحديث حالة الطلب في PostgreSQL → confirmed
    await fetch(`${BASE}/api/pharmacy/orders/${orderId}/status`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ status: "confirmed" }),
    });

    dispatch({ type: "SET_STEP", orderId, step: "done", extra: { acceptedAt: Date.now() } });
  }, [state.entries]);

  // ─── rejectOrder ─────────────────────────────────────────────
  const rejectOrder = useCallback(async (orderId: number, token: string) => {
    if (timersRef.current[orderId]) {
      clearTimeout(timersRef.current[orderId]);
      delete timersRef.current[orderId];
    }

    await fetch(`${BASE}/api/pharmacy/orders/${orderId}/status`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ status: "rejected" }),
    });

    dispatch({ type: "REMOVE", orderId });
  }, []);

  // ─── completeOrder ────────────────────────────────────────────
  const completeOrder = useCallback((orderId: number) => {
    dispatch({ type: "REMOVE", orderId });
  }, []);

  // ─── getInventoryDeduction ────────────────────────────────────
  const getInventoryDeduction = useCallback(
    (medicationId: number) => state.inventoryDeductions[medicationId] ?? 0,
    [state.inventoryDeductions],
  );

  return (
    <OrderAutomationContext.Provider
      value={{ state, watchOrder, acceptOrder, rejectOrder, completeOrder, getInventoryDeduction }}
    >
      {children}
    </OrderAutomationContext.Provider>
  );
}
