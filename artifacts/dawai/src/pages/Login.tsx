import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const FloatingShape = ({ className, delay, duration }: { className: string; delay: number; duration: number }) => (
  <motion.div
    className={`absolute rounded-full opacity-20 blur-2xl ${className}`}
    animate={{
      y: [0, -30, 0],
      x: [0, 20, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

export function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate(
        { data: { phone, password } },
        {
          onSuccess: (data) => {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setLocation("/");
          },
          onError: () => {
            toast({ title: "خطأ في تسجيل الدخول", description: "تأكد من رقم الجوال وكلمة المرور", variant: "destructive" });
          }
        }
      );
    } else {
      registerMutation.mutate(
        { data: { name, phone, password } },
        {
          onSuccess: (data) => {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setLocation("/");
          },
          onError: () => {
            toast({ title: "خطأ في التسجيل", description: "يرجى المحاولة مرة أخرى", variant: "destructive" });
          }
        }
      );
    }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-center px-6 overflow-hidden bg-white">
      {/* Background Shapes */}
      <FloatingShape className="w-64 h-64 bg-emerald-400 -top-20 -right-20" delay={0} duration={8} />
      <FloatingShape className="w-48 h-48 bg-teal-400 top-40 -left-10" delay={2} duration={10} />
      <FloatingShape className="w-80 h-80 bg-emerald-300 -bottom-32 right-10" delay={1} duration={12} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm mx-auto"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-3xl text-white font-bold">د</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">دوائي</h1>
          <p className="text-slate-500 font-medium">رفيقك الموثوق لإيجاد دوائك</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                isLogin ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                !isLogin ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
              }`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-slate-600">الاسم</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="bg-white/50 border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl"
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
                className="bg-white/50 border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl text-right"
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
                className="bg-white/50 border-slate-200 focus-visible:ring-emerald-500 h-12 rounded-xl text-right"
              />
            </div>

            <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/25"
                disabled={loginMutation.isPending || registerMutation.isPending}
              >
                {isLogin ? "دخول" : "إنشاء حساب"}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
