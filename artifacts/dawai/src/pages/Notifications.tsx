import { motion } from "framer-motion";
import { Bell, Package, Tag, Info } from "lucide-react";
import {
  useGetNotifications,
  useMarkNotificationRead,
  getGetNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// أيقونة حسب نوع الإشعار
function NotificationIcon({ type }: { type: string }) {
  const base = "w-5 h-5";
  if (type === "order_update")
    return <Package className={`${base} text-emerald-600`} />;
  if (type === "promotion")
    return <Tag className={`${base} text-amber-500`} />;
  return <Info className={`${base} text-blue-500`} />;
}

// ألوان خلفية الأيقونة
function iconBg(type: string) {
  if (type === "order_update") return "bg-emerald-50";
  if (type === "promotion") return "bg-amber-50";
  return "bg-blue-50";
}

// تنسيق التاريخ
function formatDate(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return "أمس";
  return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

// Skeleton loader
function NotifSkeleton() {
  return (
    <div className="animate-pulse flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100">
      <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-2.5 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetNotifications();
  const markRead = useMarkNotificationRead();

  const handleMarkRead = (id: number) => {
    markRead.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
        },
      }
    );
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      {/* الرأس */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-10 pb-6">
        <h1 className="text-white text-xl font-bold">الإشعارات</h1>
        {unreadCount > 0 && (
          <p className="text-emerald-100 text-sm mt-1">
            {unreadCount} إشعار غير مقروء
          </p>
        )}
      </div>

      <div className="flex-1 px-4 pt-5 pb-4 space-y-3 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <NotifSkeleton key={i} />)
        ) : notifications?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-slate-700 font-bold text-lg mb-2">لا توجد إشعارات</h3>
            <p className="text-slate-400 text-sm">ستظهر هنا تحديثات طلباتك والعروض</p>
          </motion.div>
        ) : (
          notifications?.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              className={`relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                notif.isRead
                  ? "bg-white border-slate-100"
                  : "bg-emerald-50/60 border-emerald-100"
              }`}
              data-testid={`card-notification-${notif.id}`}
            >
              {/* نقطة غير مقروء */}
              {!notif.isRead && (
                <span className="absolute top-4 left-4 w-2 h-2 bg-emerald-500 rounded-full" />
              )}

              {/* الأيقونة */}
              <div
                className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${iconBg(
                  notif.type
                )}`}
              >
                <NotificationIcon type={notif.type} />
              </div>

              {/* المحتوى */}
              <div className="flex-1 min-w-0 pr-2">
                <p className={`text-sm leading-tight mb-0.5 ${notif.isRead ? "text-slate-700 font-medium" : "text-slate-800 font-bold"}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1.5">{formatDate(notif.createdAt)}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
