/**
 * PharmacyDashboard — لوحة تحكم الصيدلية
 * ─────────────────────────────────────────────────────────────────────────
 * تبويبان:
 *   1. "الطلبات الواردة" — يستخدم OrderAutomationContext لكل إجراء
 *   2. "المخزون"         — إضافة / تعديل / حذف
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Package, ShoppingBag, Check, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrderAutomation, type OrderPayload } from "@/contexts/OrderAutomationContext";
import { useToast } from "@/hooks/use-toast";
import { AddMedicineForm } from "@/components/AddMedicineForm";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════
interface InventoryItem {
  id: number;
  medicationId: number;
  price: number;
  quantity: number;
  medication: {
    id: number; name: string; genericName: string;
    category: string; requiresPrescription: boolean;
  };
}

interface PharmacyOrder {
  id: number;
  status: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  medication: {
    id: number; name: string; genericName: string; requiresPrescription: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════
// usePharmacyApi — مساعد طلبات HTTP مع Bearer token
// ═══════════════════════════════════════════════════════════════════
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function usePharmacyApi(token: string | undefined) {
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` };

  const get  = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { headers: h });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ");
    return res.json();
  };
  const post = async <T>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { method: "POST", headers: h, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ");
    return res.json();
  };
  const put  = async <T>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { method: "PUT", headers: h, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ");
    return res.json();
  };
  const del  = async (path: string) => {
    const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers: h });
    if (!res.ok && res.status !== 204) throw new Error((await res.json())?.error ?? "خطأ");
  };

  return { get, post, put, del };
}

// ═══════════════════════════════════════════════════════════════════
// Edit modal for existing inventory items
// ═══════════════════════════════════════════════════════════════════
function ItemFormModal({
  item, onSave, onClose,
}: {
  item: InventoryItem;
  onSave: (data: { price: number; quantity: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [price, setPrice]       = useState(item.price.toString());
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave({ price: parseFloat(price), quantity: parseInt(quantity, 10) }); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
        className="w-full max-w-[430px] rounded-t-3xl p-5 pb-8
          bg-white/80 backdrop-blur-2xl border-t border-white/60
          shadow-[0_-12px_40px_rgb(0,0,0,0.10)]"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-800 font-bold text-lg">تعديل الدواء</h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">السعر (IQD)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              required min="0.01" step="0.01"
              className="w-full h-12 px-4 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md text-slate-800 text-sm outline-none focus:border-emerald-400"
              data-testid="input-price" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">الكمية المتاحة</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              required min="0" step="1"
              className="w-full h-12 px-4 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md text-slate-800 text-sm outline-none focus:border-emerald-400"
              data-testid="input-quantity" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">إلغاء</button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm disabled:opacity-60"
              data-testid="button-save-item">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// IncomingOrderCard — بطاقة الطلب الوارد مع عداد 15 ثانية (مرئي فقط)
// ═══════════════════════════════════════════════════════════════════
const VISUAL_COUNTDOWN_SECS = 15; // يطابق مؤقت التوجيه في OrderAutomationContext

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  ready:     "bg-emerald-50 text-emerald-700",
  rejected:  "bg-red-50 text-red-500",
  timeout:   "bg-orange-50 text-orange-600",
  routing:   "bg-orange-50 text-orange-600",
  routed:    "bg-amber-50 text-amber-600",
};
const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:   "قيد المراجعة",
  confirmed: "تم التأكيد",
  ready:     "جاهز للاستلام",
  rejected:  "مرفوض",
  timeout:   "انتهى الوقت",
  routing:   "جاري التوجيه...",
  routed:    "تم التوجيه",
};

function IncomingOrderCard({
  order,
  onAccept,
  onReject,
}: {
  order: PharmacyOrder;
  onAccept: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
}) {
  // عداد مرئي فقط — الإجراء الفعلي يتم عبر OrderAutomationContext
  const [countdown, setCountdown] = useState(VISUAL_COUNTDOWN_SECS);
  const [actioning, setActioning] = useState<"accept" | "reject" | null>(null);

  // استخدام Context لقراءة حالة التوجيه الذكي
  const { state: autoState } = useOrderAutomation();
  const autoEntry = autoState.entries[order.id];
  const isRouting = autoEntry?.step === "routing" || autoEntry?.step === "routed";

  useEffect(() => {
    if (order.status !== "pending") return;
    // المؤقت المرئي — يعمل بالتوازي مع مؤقت Context
    const interval = setInterval(() => {
      setCountdown((c) => (c <= 1 ? (clearInterval(interval), 0) : c - 1));
    }, 1000);
    return () => clearInterval(interval); // Cleanup لمنع Memory Leak
  }, [order.status]);

  const handleAccept = async () => {
    setActioning("accept");
    try { await onAccept(order.id); } finally { setActioning(null); }
  };
  const handleReject = async () => {
    setActioning("reject");
    try { await onReject(order.id); } finally { setActioning(null); }
  };

  const isPending   = order.status === "pending";
  const statusStyle = ORDER_STATUS_STYLES[autoEntry?.step ?? order.status] ?? "bg-slate-100 text-slate-600";
  const statusLabel = ORDER_STATUS_LABELS[autoEntry?.step ?? order.status] ?? order.status;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="rounded-2xl overflow-hidden
        bg-white/75 backdrop-blur-2xl border border-white/60
        shadow-[0_4px_20px_rgb(0,0,0,0.06)]"
    >
      {/* معلومات الطلب */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            💊
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="font-bold text-slate-800 text-sm truncate">{order.medication.name}</p>
              <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-slate-400 text-xs">{order.medication.genericName}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-emerald-700 font-bold text-sm">{order.totalPrice.toFixed(2)} IQD</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-xs">الكمية: {order.quantity}</span>
              {order.medication.requiresPrescription && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">وصفة</span>
              )}
            </div>
          </div>
        </div>

        {/* شريط العد التنازلي المرئي — للطلبات المعلّقة */}
        {isPending && !isRouting && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                وقت الاستجابة المتبقي
              </span>
              <motion.span
                key={countdown}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className={`text-xs font-bold tabular-nums ${countdown <= 5 ? "text-red-500" : "text-slate-500"}`}
              >
                {countdown}s
              </motion.span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full origin-right"
                style={{
                  background: countdown <= 5
                    ? "linear-gradient(to right, #ef4444, #f97316)"
                    : "linear-gradient(to right, #34d399, #2dd4bf)",
                }}
                animate={{ width: `${(countdown / VISUAL_COUNTDOWN_SECS) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
          </div>
        )}

        {/* رسالة التوجيه الذكي — من Context */}
        {isRouting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "spring", damping: 22 }}
            className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100"
          >
            <p className="text-amber-700 text-xs font-semibold mb-1">
              🔁 {autoEntry?.step === "routed"
                ? `تم التوجيه إلى: ${autoEntry.fallbackPharmacy}`
                : "جاري البحث عن صيدلية بديلة لضمان أسرع استجابة..."}
            </p>
            {autoEntry?.step === "routing" && (
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="flex-1 h-1 rounded-full bg-amber-300"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* أزرار القبول / الرفض — للطلبات المعلّقة فقط */}
      <AnimatePresence>
        {isPending && !isRouting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/60 grid grid-cols-2"
          >
            <motion.button whileTap={{ scale: 0.96 }}
              onClick={handleReject} disabled={!!actioning}
              className="py-3 flex items-center justify-center gap-1.5
                text-red-500 font-semibold text-sm
                border-l border-white/60
                hover:bg-red-50/60 transition-colors disabled:opacity-50"
              data-testid={`button-reject-${order.id}`}
            >
              <X className="w-4 h-4" />
              {actioning === "reject" ? "جاري..." : "رفض / غير متوفر"}
            </motion.button>

            <motion.button whileTap={{ scale: 0.96 }}
              onClick={handleAccept} disabled={!!actioning}
              className="py-3 flex items-center justify-center gap-1.5
                text-emerald-600 font-bold text-sm
                hover:bg-emerald-50/60 transition-colors disabled:opacity-50"
              data-testid={`button-accept-${order.id}`}
            >
              <Check className="w-4 h-4" />
              {actioning === "accept" ? "جاري..." : "قبول وتجهيز"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PharmacyOrdersTab — تبويب الطلبات الواردة (يستخدم OrderAutomationContext)
// ═══════════════════════════════════════════════════════════════════
function PharmacyOrdersTab({
  api,
  token,
  pharmacyName,
}: {
  api: ReturnType<typeof usePharmacyApi>;
  token: string;
  pharmacyName: string;
}) {
  const { toast } = useToast();
  const { state: autoState, watchOrder, acceptOrder, rejectOrder } = useOrderAutomation();

  const [orders, setOrders]       = useState<PharmacyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // نتابع الطلبات التي أضفناها للـ Context لتجنب التكرار
  const watchedRef = useRef<Set<number>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get<PharmacyOrder[]>("/api/pharmacy/orders");
      setOrders(data);

      // ── ابدأ مراقبة الطلبات المعلّقة الجديدة (لم تُضاف للـ Context بعد) ──
      // هذا يُطلق مؤقت التوجيه الذكي (15 ثانية) لكل طلب جديد
      data
        .filter((o) => o.status === "pending" && !watchedRef.current.has(o.id))
        .forEach((order) => {
          watchedRef.current.add(order.id);

          // بناء payload الأتمتة الكاملة
          const payload: OrderPayload = {
            orderId:        order.id,
            medicationId:   order.medication.id,
            medicationName: order.medication.name,
            quantity:       order.quantity,
            totalPrice:     order.totalPrice,
            pharmacyId:     0, // يُملأ من بيانات المستخدم الحالي
            pharmacyName,
            // رقم هاتف المريض — محاكاة للتجربة
            // TODO: في الإنتاج، أضف patientPhone لاستجابة GET /pharmacy/orders
            patientPhone: "+9647700000000",
          };

          watchOrder(payload, token);
        });
    } catch { /* صامت */ }
    finally { setIsLoading(false); }
  }, [pharmacyName, token, watchOrder]);

  // Polling كل 5 ثوانٍ
  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 5000);
    return () => clearInterval(id); // Cleanup — منع Memory Leak
  }, [fetchOrders]);

  // ── قبول الطلب — تسلسل الأتمتة الكامل عبر Context ──────────────
  const handleAccept = useCallback(async (orderId: number) => {
    try {
      await acceptOrder(orderId, token);

      // تحديث الحالة محلياً فوراً (Optimistic)
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "confirmed" } : o));

      toast({
        title: "✅ تم قبول الطلب",
        description: "تم تجهيز الطلب وإرسال رسالة للمريض عبر واتساب",
      });
    } catch (err) {
      toast({ title: "خطأ في القبول", description: String(err), variant: "destructive" });
    }
  }, [acceptOrder, token, toast]);

  // ── رفض الطلب عبر Context ────────────────────────────────────────
  const handleReject = useCallback(async (orderId: number) => {
    try {
      await rejectOrder(orderId, token);

      // تحديث الحالة محلياً
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "rejected" } : o));

      toast({ title: "تم رفض الطلب", description: "تم إشعار المريض بعدم توفر الدواء" });
    } catch (err) {
      toast({ title: "خطأ في الرفض", description: String(err), variant: "destructive" });
    }
  }, [rejectOrder, token, toast]);

  // ── تقسيم الطلبات ────────────────────────────────────────────────
  const pending  = orders.filter((o) => o.status === "pending");
  const active   = orders.filter((o) => o.status === "confirmed" || o.status === "ready");
  const archived = orders.filter((o) => ["rejected", "timeout", "completed", "cancelled"].includes(o.status));

  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-white/70 rounded-2xl h-24 border border-white/60" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center px-4"
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
          <ShoppingBag className="w-8 h-8 text-emerald-300" />
        </div>
        <h3 className="text-slate-700 font-bold mb-1">لا توجد طلبات واردة</h3>
        <p className="text-slate-400 text-sm">ستظهر هنا طلبات المرضى عند ورودها</p>
      </motion.div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 overflow-y-auto">
      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-slate-600 text-xs font-semibold">تنتظر ردّك</p>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold flex items-center justify-center"
            >
              {pending.length}
            </motion.span>
          </div>
          <AnimatePresence>
            {pending.map((o) => (
              <IncomingOrderCard key={o.id} order={o} onAccept={handleAccept} onReject={handleReject} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-slate-500 text-xs font-semibold">جارية التجهيز</p>
          <AnimatePresence>
            {active.map((o) => (
              <IncomingOrderCard key={o.id} order={o} onAccept={handleAccept} onReject={handleReject} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {archived.length > 0 && (
        <div className="space-y-3">
          <p className="text-slate-400 text-xs font-semibold">السابقة</p>
          <AnimatePresence>
            {archived.map((o) => (
              <IncomingOrderCard key={o.id} order={o} onAccept={handleAccept} onReject={handleReject} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PharmacyDashboard — الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════
export function PharmacyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = usePharmacyApi(user?.token);

  const [activeTab, setActiveTab]     = useState<"inventory" | "orders">("orders");
  const [inventory, setInventory]     = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | null | "new">(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  const pharmacyName = user?.name ?? "الصيدلية";

  const fetchInventory = useCallback(async () => {
    try {
      const data = await api.get<InventoryItem[]>("/api/pharmacy/inventory");
      setInventory(data);
    } catch {
      toast({ title: "خطأ في تحميل المخزون", variant: "destructive" });
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchInventory(); }, []);

  const handleAddCustom = async (data: {
    medicationName: string; price: number; quantity: number; requiresPrescription: boolean;
  }) => {
    try {
      await api.post("/api/pharmacy/inventory/add-custom", data);
      await fetchInventory();
      toast({ title: "✅ تمت إضافة الدواء بنجاح", description: `تم إضافة "${data.medicationName}" للمخزون` });
    } catch (err) {
      toast({ title: "خطأ في الإضافة", description: String(err), variant: "destructive" });
      throw err;
    }
  };

  const handleEdit = async (id: number, data: { price: number; quantity: number }) => {
    try {
      await api.put(`/api/pharmacy/inventory/${id}`, data);
      await fetchInventory();
      toast({ title: "تم التحديث بنجاح" });
    } catch (err) {
      toast({ title: "خطأ في التحديث", description: String(err), variant: "destructive" });
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.del(`/api/pharmacy/inventory/${id}`);
      setInventory((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "تم حذف الدواء من المخزون" });
    } catch (err) {
      toast({ title: "خطأ في الحذف", description: String(err), variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const TABS = [
    { key: "orders",    label: "الطلبات الواردة", icon: ShoppingBag },
    { key: "inventory", label: "المخزون",          icon: Package     },
  ] as const;

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-6 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-emerald-100 text-xs mb-0.5">لوحة التحكم</p>
            <h1 className="text-white text-xl font-bold">{pharmacyName}</h1>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 flex items-center justify-center text-2xl">
            🏪
          </div>
        </div>

        {/* التبويبات */}
        <div className="flex p-1 bg-black/15 backdrop-blur-sm rounded-2xl gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === key
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* محتوى التبويب */}
      <AnimatePresence mode="wait">
        {activeTab === "orders" ? (
          <motion.div key="orders"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="flex-1 overflow-y-auto"
          >
            <PharmacyOrdersTab api={api} token={user?.token ?? ""} pharmacyName={pharmacyName} />
          </motion.div>
        ) : (
          <motion.div key="inventory"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="flex-1 flex flex-col"
          >
            {/* زر إضافة دواء */}
            <div className="px-4 pt-4">
              <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
                onClick={() => setEditingItem("new")}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl
                  bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold
                  shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                data-testid="button-add-medication"
              >
                <Plus className="w-5 h-5" /> إضافة دواء جديد
              </motion.button>
            </div>

            {/* قائمة المخزون */}
            <div className="flex-1 px-4 pt-4 pb-6 space-y-3 overflow-y-auto">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/70 rounded-2xl h-20 border border-white/60" />
                  ))
                : inventory.length === 0
                ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                      <Package className="w-8 h-8 text-emerald-300" />
                    </div>
                    <h3 className="text-slate-700 font-bold mb-1">المخزون فارغ</h3>
                    <p className="text-slate-400 text-sm">ابدأ بإضافة أدوية لمخزون صيدليتك</p>
                  </motion.div>
                )
                : inventory.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", damping: 22 }}
                    className="rounded-2xl p-4 bg-white/75 backdrop-blur-2xl border border-white/60 shadow-[0_4px_16px_rgb(0,0,0,0.05)]"
                    data-testid={`card-inventory-${item.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl flex items-center justify-center text-xl">💊</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{item.medication.name}</p>
                        <p className="text-slate-400 text-xs truncate">{item.medication.genericName}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-emerald-700 font-bold text-sm">{item.price.toFixed(2)} IQD</span>
                          <span className="text-slate-400 text-xs">الكمية: {item.quantity}</span>
                          {item.quantity === 0 && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded-full font-medium">نفد</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditingItem(item)}
                          className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"
                          data-testid={`button-edit-${item.id}`}>
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center disabled:opacity-50"
                          data-testid={`button-delete-${item.id}`}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نموذج إضافة دواء جديد */}
      <AnimatePresence>
        {editingItem === "new" && (
          <AddMedicineForm onAdd={handleAddCustom} onClose={() => setEditingItem(null)} />
        )}
      </AnimatePresence>

      {/* نافذة تعديل دواء موجود */}
      <AnimatePresence>
        {editingItem !== null && editingItem !== "new" && (
          <ItemFormModal
            item={editingItem as InventoryItem}
            onSave={(data) => handleEdit((editingItem as InventoryItem).id, data)}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
