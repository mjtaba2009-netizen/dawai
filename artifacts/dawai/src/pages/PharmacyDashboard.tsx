import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AddMedicineForm } from "@/components/AddMedicineForm";

interface InventoryItem {
  id: number;
  medicationId: number;
  price: number;
  quantity: number;
  medication: {
    id: number;
    name: string;
    genericName: string;
    category: string;
    requiresPrescription: boolean;
  };
}

interface AllMedication {
  id: number;
  name: string;
  genericName: string;
  category: string;
  requiresPrescription: boolean;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function usePharmacyApi(token: string | undefined) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? ""}`,
  };

  const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { headers });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ في الخادم");
    return res.json();
  };

  const post = async <T>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ في الخادم");
    return res.json();
  };

  const put = async <T>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { method: "PUT", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json())?.error ?? "خطأ في الخادم");
    return res.json();
  };

  const del = async (path: string): Promise<void> => {
    const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers });
    if (!res.ok && res.status !== 204) throw new Error((await res.json())?.error ?? "خطأ في الخادم");
  };

  return { get, post, put, del };
}

// نافذة إضافة / تعديل دواء
function ItemFormModal({
  item,
  allMeds,
  onSave,
  onClose,
}: {
  item: InventoryItem | null;
  allMeds: AllMedication[];
  onSave: (data: { medicationId?: number; price: number; quantity: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [medicationId, setMedicationId] = useState(item?.medicationId ?? 0);
  const [price, setPrice] = useState(item?.price.toString() ?? "");
  const [quantity, setQuantity] = useState(item?.quantity.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...(item ? {} : { medicationId }),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 pb-8"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-800 font-bold text-lg">
            {item ? "تعديل الدواء" : "إضافة دواء جديد"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اختيار الدواء — فقط عند الإضافة */}
          {!item && (
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1.5 block">اسم الدواء</label>
              <div className="relative">
                <select
                  value={medicationId}
                  onChange={(e) => setMedicationId(Number(e.target.value))}
                  required
                  className="w-full h-12 pr-4 pl-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm appearance-none outline-none focus:border-emerald-400"
                  data-testid="select-medication"
                >
                  <option value={0} disabled>اختر الدواء...</option>
                  {allMeds.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.genericName})</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* السعر */}
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">السعر (ر.س)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-emerald-400"
              data-testid="input-price"
            />
          </div>

          {/* الكمية */}
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">الكمية المتاحة</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="0"
              step="1"
              placeholder="0"
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-emerald-400"
              data-testid="input-quantity"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
              إلغاء
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm disabled:opacity-60"
              data-testid="button-save-item"
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function PharmacyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = usePharmacyApi(user?.token);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allMeds, setAllMeds] = useState<AllMedication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | null | "new">(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const data = await api.get<InventoryItem[]>("/api/pharmacy/inventory");
      setInventory(data);
    } catch (err) {
      toast({ title: "خطأ في تحميل المخزون", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllMeds = useCallback(async () => {
    try {
      const data = await api.get<AllMedication[]>("/api/medications/popular?limit=100");
      setAllMeds(data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchAllMeds();
  }, []);

  const handleAddCustom = async (data: {
    medicationName: string;
    price: number;
    quantity: number;
    requiresPrescription: boolean;
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
    } finally {
      setDeletingId(null);
    }
  };

  const pharmacyName = user?.name ?? "الصيدلية";

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      {/* الرأس */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-emerald-100 text-xs mb-1">لوحة التحكم</p>
            <h1 className="text-white text-xl font-bold">{pharmacyName}</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {inventory.length} دواء في المخزون
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
            🏪
          </div>
        </div>
      </div>

      {/* زر إضافة */}
      <div className="px-4 pt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => setEditingItem("new")}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/20"
          data-testid="button-add-medication"
        >
          <Plus className="w-5 h-5" />
          إضافة دواء جديد
        </motion.button>
      </div>

      {/* قائمة المخزون */}
      <div className="flex-1 px-4 pt-4 pb-6 space-y-3 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-20 border border-slate-100" />
          ))
        ) : inventory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <Package className="w-8 h-8 text-emerald-300" />
            </div>
            <h3 className="text-slate-700 font-bold mb-1">المخزون فارغ</h3>
            <p className="text-slate-400 text-sm">ابدأ بإضافة أدوية لمخزون صيدليتك</p>
          </motion.div>
        ) : (
          inventory.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              data-testid={`card-inventory-${item.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl flex items-center justify-center text-xl">
                  💊
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{item.medication.name}</p>
                  <p className="text-slate-400 text-xs truncate">{item.medication.genericName}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-emerald-700 font-bold text-sm">{item.price.toFixed(2)} ر.س</span>
                    <span className="text-slate-400 text-xs">الكمية: {item.quantity}</span>
                    {item.quantity === 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded-full font-medium">
                        نفد
                      </span>
                    )}
                  </div>
                </div>

                {/* أزرار التعديل والحذف */}
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingItem(item)}
                    className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"
                    data-testid={`button-edit-${item.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center disabled:opacity-50"
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* نموذج إضافة دواء جديد */}
      <AnimatePresence>
        {editingItem === "new" && (
          <AddMedicineForm
            onAdd={handleAddCustom}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>

      {/* نافذة تعديل دواء موجود */}
      <AnimatePresence>
        {editingItem !== null && editingItem !== "new" && (
          <ItemFormModal
            item={editingItem}
            onSave={(data) => handleEdit((editingItem as InventoryItem).id, data)}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
