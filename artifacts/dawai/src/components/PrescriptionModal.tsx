import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Upload, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionModalProps {
  medicationName: string;
  onConfirm: () => void;
  onClose: () => void;
}

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export function PrescriptionModal({ medicationName, onConfirm, onClose }: PrescriptionModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS).toISOString().split("T")[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "نوع الملف غير مدعوم", description: "يرجى رفع صورة فقط (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateDate = (value: string) => {
    if (!value) { setDateError("يرجى إدخال تاريخ الوصفة"); return false; }
    const selected = new Date(value);
    const now = new Date();
    if (selected > now) { setDateError("تاريخ الوصفة لا يمكن أن يكون في المستقبل"); return false; }
    if (selected < new Date(Date.now() - SIX_MONTHS_MS)) {
      setDateError("عذراً، الوصفة الطبية منتهية الصلاحية. يجب ألا يتجاوز تاريخها 6 أشهر");
      return false;
    }
    setDateError("");
    return true;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrescriptionDate(e.target.value);
    if (dateError) validateDate(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview) {
      toast({ title: "الوصفة الطبية مطلوبة", description: "يرجى رفع صورة الوصفة الطبية", variant: "destructive" });
      return;
    }

    if (!validateDate(prescriptionDate)) return;

    setIsSubmitting(true);
    // Simulate brief validation delay
    setTimeout(() => {
      setIsSubmitting(false);
      onConfirm();
    }, 800);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        >
          {/* رأس المودال */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-5 pt-5 pb-6">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                data-testid="button-close-modal"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-white font-bold text-lg">وصفة طبية مطلوبة</h2>
            <p className="text-orange-100 text-sm mt-1">
              دواء <span className="font-semibold">{medicationName}</span> يستلزم وصفة طبية
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* رفع صورة الوصفة */}
            <div>
              <p className="text-slate-700 font-semibold text-sm mb-2">
                صورة الوصفة الطبية <span className="text-red-500">*</span>
              </p>

              {imagePreview ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-2xl overflow-hidden border-2 border-emerald-400"
                >
                  <img src={imagePreview} alt="الوصفة الطبية" className="w-full h-40 object-cover" />
                  <div className="absolute top-2 left-2">
                    <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center"
                    data-testid="button-remove-image"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* رفع من المعرض */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                    data-testid="button-upload-image"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-medium">رفع صورة</span>
                  </button>

                  {/* التقاط صورة */}
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute("capture", "environment");
                        fileInputRef.current.click();
                      }
                    }}
                    className="h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                    data-testid="button-capture-image"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">التقاط صورة</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-file"
              />
            </div>

            {/* تاريخ الوصفة */}
            <div>
              <label className="text-slate-700 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                تاريخ الوصفة الطبية <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                value={prescriptionDate}
                onChange={handleDateChange}
                max={today}
                min={sixMonthsAgo}
                className={`w-full h-12 px-4 rounded-xl border text-sm outline-none transition-colors ${
                  dateError
                    ? "border-red-400 bg-red-50 focus:ring-1 focus:ring-red-400"
                    : "border-slate-200 bg-slate-50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                }`}
                data-testid="input-prescription-date"
              />

              <AnimatePresence>
                {dateError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-1.5 mt-2 text-red-600"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-snug">{dateError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-slate-400 text-xs mt-1.5">
                يجب ألا يتجاوز تاريخ الوصفة 6 أشهر من تاريخ اليوم
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3 pt-2 pb-safe">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm"
              >
                إلغاء
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm disabled:opacity-60"
                data-testid="button-confirm-prescription"
              >
                {isSubmitting ? "جاري التحقق..." : "تأكيد الطلب"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
