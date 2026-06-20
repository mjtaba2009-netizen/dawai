import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Upload, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionModalProps {
  medicationName: string;
  onConfirm: () => void;
  onClose: () => void;
}

// دالة التحقق من تاريخ الوصفة — تُرجع "صالح" أو رسالة الخطأ
const validatePrescriptionDate = (selectedDateStr: string): string => {
  const selectedDate = new Date(selectedDateStr);
  const currentDate  = new Date();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

  if (selectedDate > currentDate) {
    return "لا يمكن أن يكون تاريخ الوصفة في المستقبل!";
  }

  if (selectedDate < sixMonthsAgo) {
    return "عذراً، الوصفة الطبية منتهية الصلاحية (مر عليها أكثر من 6 أشهر).";
  }

  return "صالح";
};

export function PrescriptionModal({ medicationName, onConfirm, onClose }: PrescriptionModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const sixMonthsAgoDate = new Date();
  sixMonthsAgoDate.setMonth(new Date().getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgoDate.toISOString().split("T")[0];

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

  const validateDate = (value: string): boolean => {
    if (!value) { setDateError("يرجى إدخال تاريخ الوصفة"); return false; }
    const msg = validatePrescriptionDate(value);
    if (msg !== "صالح") { setDateError(msg); return false; }
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
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "رجاءً قم باحضار الوصفة معك لاستلام الدواء",
        duration: 4000,
      });
      onConfirm();
    }, 800);
  };

  return (
    <AnimatePresence>
      {/* طبقة التعتيم */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* الورقة السفلية */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
          className="w-full max-w-[430px] overflow-hidden rounded-t-3xl
            bg-white/75 backdrop-blur-2xl
            border-t border-white/60
            shadow-[0_-12px_40px_rgb(0,0,0,0.12)]"
        >
          {/* رأس المودال */}
          <div className="bg-gradient-to-br from-amber-500/90 to-orange-500/90 backdrop-blur-md px-5 pt-5 pb-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors"
                data-testid="button-close-modal"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
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
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 350 }}
                  className="relative rounded-2xl overflow-hidden border-2 border-emerald-400/60 shadow-[0_4px_20px_rgb(0,0,0,0.08)]"
                >
                  <img src={imagePreview} alt="الوصفة الطبية" className="w-full h-40 object-cover" />
                  <div className="absolute top-2 left-2">
                    <div className="w-7 h-7 bg-emerald-500/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 backdrop-blur-sm rounded-lg flex items-center justify-center"
                    data-testid="button-remove-image"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 400 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-28 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500
                      bg-white/50 backdrop-blur-md
                      border border-white/60 border-dashed
                      hover:border-emerald-400/70 hover:text-emerald-600
                      shadow-[0_4px_16px_rgb(0,0,0,0.05)]
                      transition-colors"
                    data-testid="button-upload-image"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-semibold">رفع صورة</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 400 }}
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute("capture", "environment");
                        fileInputRef.current.click();
                      }
                    }}
                    className="h-28 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500
                      bg-white/50 backdrop-blur-md
                      border border-white/60 border-dashed
                      hover:border-emerald-400/70 hover:text-emerald-600
                      shadow-[0_4px_16px_rgb(0,0,0,0.05)]
                      transition-colors"
                    data-testid="button-capture-image"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-semibold">التقاط صورة</span>
                  </motion.button>
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
                min={sixMonthsAgoStr}
                className={`w-full h-12 px-4 rounded-xl border text-sm outline-none transition-all
                  bg-white/60 backdrop-blur-md
                  shadow-[0_2px_8px_rgb(0,0,0,0.04)]
                  ${
                    dateError
                      ? "border-red-400/60 bg-red-50/60 focus:ring-1 focus:ring-red-400"
                      : "border-white/60 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40"
                  }`}
                data-testid="input-prescription-date"
              />

              <AnimatePresence>
                {dateError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
                className="flex-1 h-12 rounded-xl font-semibold text-sm text-slate-600
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
                transition={{ type: "spring", damping: 20, stiffness: 400 }}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl font-bold text-sm text-white
                  bg-gradient-to-r from-emerald-500/95 to-teal-500/95
                  backdrop-blur-sm
                  border border-white/20
                  shadow-[0_4px_16px_rgba(16,185,129,0.35)]
                  disabled:opacity-60 transition-opacity"
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
