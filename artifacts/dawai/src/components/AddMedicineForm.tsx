import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pill, DollarSign, Hash, ShieldCheck } from 'lucide-react';

interface AddMedicineFormProps {
  onAdd: (data: {
    medicationName: string;
    price: number;
    quantity: number;
    requiresPrescription: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ width: '52px' }}
      className={`relative inline-flex h-7 flex-shrink-0 cursor-pointer rounded-full
        border border-white/30
        transition-colors duration-200 focus:outline-none
        backdrop-blur-sm
        ${checked ? 'bg-emerald-500/90' : 'bg-slate-300/70'}`}
      data-testid="toggle-prescription"
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-block h-6 w-6 rounded-full bg-white shadow-md ring-0 mt-[1px]
          ${checked ? 'translate-x-[25px]' : 'translate-x-[1px]'}`}
      />
    </button>
  );
}

export function AddMedicineForm({ onAdd, onClose }: AddMedicineFormProps) {
  const [medicationName, setMedicationName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim() || !price || !quantity) return;

    setIsLoading(true);
    try {
      await onAdd({
        medicationName: medicationName.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        requiresPrescription,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    `w-full h-12 px-4 rounded-xl text-sm text-slate-800 outline-none transition-all
    bg-white/50 backdrop-blur-md
    border border-white/60
    shadow-[0_2px_8px_rgb(0,0,0,0.04)]
    placeholder-slate-300
    focus:border-slate-600/40 focus:ring-1 focus:ring-slate-600/20`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
        className="w-full max-w-[430px] overflow-hidden rounded-t-3xl
          bg-white/75 backdrop-blur-2xl
          border-t border-white/60
          shadow-[0_-12px_40px_rgb(0,0,0,0.12)]"
      >
        {/* رأس النموذج */}
        <div className="bg-slate-900/80 backdrop-blur-xl px-5 pt-5 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/10"
              data-testid="button-close-add-form"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-white font-bold text-lg">إضافة دواء جديد</h2>
          <p className="text-slate-400 text-sm mt-0.5">أدخل بيانات الدواء يدوياً لإضافته للمخزون</p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

          {/* اسم الدواء */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Pill className="w-3.5 h-3.5 text-slate-400" />
              اسم الدواء <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              required
              placeholder="مثال: باراسيتامول 500mg"
              className={inputClass}
              data-testid="input-medication-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* السعر */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                السعر (IQD) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                placeholder="0"
                className={inputClass}
                data-testid="input-price"
              />
            </div>

            {/* الكمية */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                الكمية <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0"
                step="1"
                placeholder="0"
                className={inputClass}
                data-testid="input-quantity"
              />
            </div>
          </div>

          {/* تبديل وصفة طبية */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            className="flex items-center justify-between p-4 rounded-2xl
              bg-white/50 backdrop-blur-md
              border border-white/60
              shadow-[0_2px_8px_rgb(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${requiresPrescription ? 'bg-emerald-100/80' : 'bg-slate-100/80'}`}>
                <ShieldCheck
                  className={`transition-colors ${requiresPrescription ? 'text-emerald-600' : 'text-slate-400'}`}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
              <div>
                <p className="text-slate-800 font-semibold text-sm">يحتاج وصفة طبية</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {requiresPrescription ? 'نعم، يستلزم وصفة' : 'لا، يُصرف بحرية'}
                </p>
              </div>
            </div>
            <ToggleSwitch checked={requiresPrescription} onChange={setRequiresPrescription} />
          </motion.div>

          {/* الأزرار */}
          <div className="flex gap-3 pt-1 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-slate-600 font-semibold text-sm
                bg-white/60 backdrop-blur-md
                border border-white/60
                shadow-[0_2px_8px_rgb(0,0,0,0.05)]
                hover:bg-white/80 transition-colors"
            >
              إلغاء
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400 }}
              disabled={isLoading || !medicationName.trim() || !price || !quantity}
              className="flex-1 h-12 rounded-xl text-white font-bold text-sm
                bg-slate-800/90 backdrop-blur-md
                border border-white/10
                shadow-[0_4px_16px_rgb(0,0,0,0.2)]
                hover:bg-slate-700/90 transition-colors
                disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="button-add-medicine"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                  />
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    إضافة الدواء
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
