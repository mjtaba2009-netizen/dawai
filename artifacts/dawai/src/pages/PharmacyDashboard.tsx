/**
 * PharmacyDashboard — لوحة تحكم الصيدلية
 * ─────────────────────────────────────────────────────────────────────────
 * تبويبان:
 *   1. "الطلبات الواردة" — يستخدم OrderAutomationContext لكل إجراء
 *   2. "المخزون"         — إضافة / تعديل / حذف
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Plus, Pencil, Trash2, X, Package, ShoppingBag, Check, Clock, BadgeCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AddMedicineForm } from "@/components/AddMedicineForm";
import { OrdersBoard } from "@/components/OrdersBoard";

// ═══════════════════════════════════════════════════════════════════
// fireWelcomeConfetti — احتفال أنيق هادئ بألوان المنصة الزمردية
// ═══════════════════════════════════════════════════════════════════
function fireWelcomeConfetti() {
  const colors = ["#10b981", "#2dd4bf", "#34d399", "#a7f3d0", "#ffffff"];
  const fire = (particleRatio: number, opts: confetti.Options) =>
    confetti({
      origin: { y: 0.35 },
      colors,
      disableForReducedMotion: true,
      ...opts,
      particleCount: Math.floor(200 * particleRatio),
    });

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// ═══════════════════════════════════════════════════════════════════
// WelcomeActivation — شاشة الترحيب الاحتفالية بعد التفعيل (المرحلة 2)
// ═══════════════════════════════════════════════════════════════════
function WelcomeActivation({ onAddFirst }: { onAddFirst: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      dir="rtl"
      className="fixed inset-0 z-[90] flex items-center justify-center px-6 overflow-hidden
        bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[440px] h-[440px]
          rounded-full bg-emerald-500 blur-[120px]"
      />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 24, stiffness: 240, delay: 0.15 }}
        className="relative w-full max-w-[400px] rounded-[32px] p-7 text-center
          bg-white/90 backdrop-blur-2xl border border-white/60
          shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      >
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.4 }}
          className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600
            flex items-center justify-center mb-5 shadow-[0_10px_30px_rgba(16,185,129,0.5)]"
        >
          <BadgeCheck className="w-11 h-11 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-slate-900 text-2xl mb-2"
          style={{ fontWeight: 800 }}
        >
          مرحباً بك في شبكة دوائي!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="text-slate-500 text-sm leading-relaxed mb-6"
        >
          حسابك الآن نشط وموثّق ✦ أصبحت صيدليتك جزءاً من شبكة دوائي الطبية.
          ابدأ ببناء مخزونك ليصلك المرضى فوراً.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddFirst}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2
            bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-base
            shadow-[0_8px_28px_rgba(16,185,129,0.45)]"
          style={{ fontWeight: 800 }}
          data-testid="button-add-first-medicine"
        >
          <Sparkles className="w-5 h-5" />
          أضف أول دواء لمخزونك
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

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

  const get  = async <T,>(path: string): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { headers: h });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ");
    return res.json();
  };
  const post = async <T,>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { method: "POST", headers: h, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ");
    return res.json();
  };
  const put  = async <T,>(path: string, body: object): Promise<T> => {
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
// PharmacyDashboard — الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════════
export function PharmacyDashboard() {
  const { user, justActivated, clearJustActivated } = useAuth();
  const { toast } = useToast();
  const api = usePharmacyApi(user?.token);

  const [activeTab, setActiveTab]     = useState<"inventory" | "orders">("orders");
  const [inventory, setInventory]     = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | null | "new">(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const pharmacyName = user?.name ?? "الصيدلية";

  // المرحلة 2 — احتفال لمرة واحدة بعد التفعيل: Confetti + شاشة الترحيب
  useEffect(() => {
    if (!justActivated) return;
    setShowWelcome(true);
    fireWelcomeConfetti();
    clearJustActivated(); // نستهلك العلامة فوراً حتى لا يتكرر الاحتفال
  }, [justActivated, clearJustActivated]);

  // CTA شاشة الترحيب — يفتح نموذج إضافة أول دواء مباشرةً
  const handleAddFirstMedicine = () => {
    setShowWelcome(false);
    setActiveTab("inventory");
    setEditingItem("new");
  };

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
    category: string; imageUrl?: string;
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
            <OrdersBoard token={user?.token ?? ""} />
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

      {/* المرحلة 2 — شاشة الترحيب الاحتفالية بعد التفعيل */}
      <AnimatePresence>
        {showWelcome && <WelcomeActivation onAddFirst={handleAddFirstMedicine} />}
      </AnimatePresence>
    </div>
  );
}
