import { motion } from 'framer-motion';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Lock, HelpCircle, Star, LogOut,
  ChevronLeft, Shield, Phone, MapPin,
} from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function SettingItem({
  icon: Icon, label, iconBg = 'bg-slate-100', iconColor = 'text-slate-600',
  onClick, index, danger = false,
}: {
  icon: React.ElementType; label: string; iconBg?: string;
  iconColor?: string; onClick?: () => void; index: number; danger?: boolean;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 bg-white rounded-2xl border shadow-sm ${
        danger ? 'border-red-100' : 'border-slate-100'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className={`flex-1 font-medium text-sm text-right ${danger ? 'text-red-600' : 'text-slate-700'}`}>
        {label}
      </span>
      {!danger && <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />}
    </motion.button>
  );
}

export function Account() {
  const { user, logout } = useContext(AuthContext)!;
  const navigate         = useNavigate();
  const { toast }        = useToast();

  const soon = (feature: string) => () => {
    toast({ title: feature, description: 'هذه الميزة قيد التطوير 🔧', duration: 2500 });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const settingsGroups = [
    {
      title: 'الحساب',
      items: [
        {
          icon: User,  label: 'معلومات الملف الشخصي',
          iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
          onClick: soon('معلومات الملف الشخصي'),
        },
        {
          icon: Phone, label: 'رقم الجوال',
          iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',
          onClick: soon('تغيير رقم الجوال'),
        },
        {
          icon: Lock,  label: 'كلمة المرور',
          iconBg: 'bg-purple-50',  iconColor: 'text-purple-600',
          onClick: soon('تغيير كلمة المرور'),
        },
        {
          icon: MapPin, label: 'العنوان والمحافظة',
          iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',
          onClick: soon('تعديل العنوان'),
        },
      ],
    },
    {
      title: 'التفضيلات',
      items: [
        {
          icon: Bell,   label: 'إعدادات الإشعارات',
          iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',
          onClick: soon('إعدادات الإشعارات'),
        },
        {
          icon: Shield, label: 'الخصوصية والأمان',
          iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',
          onClick: soon('الخصوصية والأمان'),
        },
      ],
    },
    {
      title: 'الدعم',
      items: [
        {
          icon: Star,       label: 'قيّم التطبيق',
          iconBg: 'bg-yellow-50',  iconColor: 'text-yellow-600',
          onClick: soon('تقييم التطبيق'),
        },
        {
          icon: HelpCircle, label: 'المساعدة والدعم',
          iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600',
          onClick: soon('المساعدة والدعم'),
        },
      ],
    },
  ];

  let globalIndex = 0;

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      {/* ── رأس الصفحة ── */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-10 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/40">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{user?.name ?? 'المستخدم'}</h2>
            {user?.phone && (
              <p className="text-emerald-100 text-sm mt-0.5" dir="ltr">{user.phone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-4 space-y-5 overflow-y-auto">
        {/* ── مجموعات الإعدادات ── */}
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">
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
                    onClick={item.onClick}
                    index={idx}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* ── روابط التواصل الاجتماعي ── */}
        <div>
          <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">
            تابعنا
          </h3>
          <motion.a
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            whileTap={{ scale: 0.98 }}
            href="https://www.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-900">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.18 8.18 0 004.78 1.53V7.01a4.85 4.85 0 01-1.01-.32z" />
              </svg>
            </div>
            <span className="flex-1 font-medium text-sm text-right text-slate-700">تابعنا على TikTok</span>
            <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />
          </motion.a>
        </div>

        {/* ── تسجيل الخروج ── */}
        <SettingItem
          icon={LogOut}
          label="تسجيل الخروج"
          iconBg="bg-red-50"
          iconColor="text-red-500"
          onClick={handleLogout}
          index={globalIndex++}
          danger
        />
      </div>
    </div>
  );
}
