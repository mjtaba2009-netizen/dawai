import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  User,
  Bell,
  Lock,
  HelpCircle,
  Star,
  LogOut,
  ChevronLeft,
  Shield,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// بند الإعدادات
function SettingItem({
  icon: Icon,
  label,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
  onClick,
  index,
}: {
  icon: React.ElementType;
  label: string;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
      data-testid={`button-setting-${index}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className="flex-1 text-slate-700 font-medium text-sm text-right">
        {label}
      </span>
      <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </motion.button>
  );
}

export function Account() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // بيانات المستخدم من localStorage
  let user = { name: "المستخدم", phone: "" };
  try {
    const stored = localStorage.getItem("user");
    if (stored) user = JSON.parse(stored);
  } catch {
    // تجاهل الأخطاء
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({ title: "تم تسجيل الخروج" });
    setLocation("/login");
  };

  const settingsGroups = [
    {
      title: "الحساب",
      items: [
        { icon: User, label: "معلومات الملف الشخصي", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
        { icon: Phone, label: "رقم الجوال", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
        { icon: Lock, label: "كلمة المرور", iconBg: "bg-purple-50", iconColor: "text-purple-600" },
      ],
    },
    {
      title: "التفضيلات",
      items: [
        { icon: Bell, label: "إعدادات الإشعارات", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
        { icon: Shield, label: "الخصوصية والأمان", iconBg: "bg-teal-50", iconColor: "text-teal-600" },
      ],
    },
    {
      title: "الدعم",
      items: [
        { icon: Star, label: "قيّم التطبيق", iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
        { icon: HelpCircle, label: "المساعدة والدعم", iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
      ],
    },
  ];

  let globalIndex = 0;

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      {/* الرأس مع صورة الملف الشخصي */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-10 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/40">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{user.name}</h2>
            {user.phone && (
              <p className="text-emerald-100 text-sm mt-0.5" dir="ltr">
                {user.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-4 space-y-5 overflow-y-auto">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.items.map((item) => {
                const idx = globalIndex++;
                return (
                  <SettingItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    iconBg={item.iconBg}
                    iconColor={item.iconColor}
                    index={idx}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* زر تسجيل الخروج */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={handleLogout}
          className="w-full h-13 py-4 flex items-center justify-center gap-2 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-bold"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </motion.button>
      </div>
    </div>
  );
}
