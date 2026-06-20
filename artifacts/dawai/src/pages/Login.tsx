import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Store } from "lucide-react";

const FloatingShape = ({
  className,
  delay,
  duration,
}: {
  className: string;
  delay: number;
  duration: number;
}) => (
  <motion.div
    className={`absolute rounded-full opacity-20 blur-2xl ${className}`}
    animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

export function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { apiLogin, apiRegister } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<UserRole>("patient");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let authUser;
      if (mode === "login") {
        authUser = await apiLogin(phone, password);
      } else {
        authUser = await apiRegister(name, phone, password, role);
      }
      // Redirect based on role
      setLocation(authUser.role === "pharmacy" ? "/pharmacy-dashboard" : "/");
    } catch (err) {
      toast({
        title: mode === "login" ? "خطأ في تسجيل الدخول" : "خطأ في التسجيل",
        description: String(err).replace("Error: ", ""),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-center px-6 overflow-hidden bg-white">
      {/* خلفية متحركة */}
      <FloatingShape className="w-64 h-64 bg-emerald-400 -top-20 -right-20" delay={0} duration={8} />
      <FloatingShape className="w-48 h-48 bg-teal-400 top-40 -left-10" delay={2} duration={10} />
      <FloatingShape className="w-80 h-80 bg-emerald-300 -bottom-32 right-10" delay={1} duration={12} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm mx-auto"
      >
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-3xl text-white font-bold">د</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">دوائي</h1>
          <p className="text-slate-500 font-medium">رفيقك الموثوق لإيجاد دوائك</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50">
          {/* تبويبات تسجيل دخول / حساب جديد */}
          <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-5">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  mode === m ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
                }`}
                data-testid={`tab-${m}`}
              >
                {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          {/* اختيار نوع الحساب — فقط عند إنشاء الحساب */}
          <AnimatePresence mode="popLayout">
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5"
              >
                <p className="text-slate-600 text-sm font-semibold mb-2">نوع الحساب</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "patient", label: "مستخدم عادي", icon: User, sub: "أبحث عن دواء" },
                      { value: "pharmacy", label: "صيدلية", icon: Store, sub: "أدير صيدلية" },
                    ] as const
                  ).map(({ value, label, icon: Icon, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`p-3 rounded-2xl border-2 transition-all text-right ${
                        role === value
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white"
                      }`}
                      data-testid={`role-${value}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                          role === value ? "bg-emerald-500" : "bg-slate-100"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${role === value ? "text-white" : "text-slate-500"}`} />
                      </div>
                      <p className={`text-xs font-bold ${role === value ? "text-emerald-700" : "text-slate-700"}`}>
                        {label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* الاسم — عند التسجيل فقط */}
            <AnimatePresence mode="popLayout">
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-slate-600">
                    {role === "pharmacy" ? "اسم الصيدلية" : "الاسم الكامل"}
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "register"}
                    className="bg-white/50 border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl"
                    data-testid="input-name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-600">رقم الجوال</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                dir="ltr"
                autoComplete="tel"
                className="bg-white/50 border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl text-right"
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-600">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="bg-white/50 border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl text-right"
                data-testid="input-password"
              />
            </div>

            <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/25"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "..." : mode === "login" ? "دخول" : "إنشاء حساب"}
              </Button>
            </motion.div>

            {/* بيانات تجريبية */}
            <div className="pt-1 space-y-1 text-center">
              <p className="text-slate-400 text-[11px]">بيانات تجريبية:</p>
              <p className="text-slate-500 text-[11px]">مريض: 0501234567 / 123456</p>
              <p className="text-slate-500 text-[11px]">صيدلية: 0509999999 / 123456</p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
