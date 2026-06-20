import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { MarkNotificationReadParams } from "@workspace/api-zod";

const router: IRouter = Router();

// قائمة الإشعارات (مستخدم تجريبي ثابت id=1)
router.get("/notifications", async (_req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, 1))
    .orderBy(notificationsTable.createdAt);

  res.json(
    notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      type: n.type,
      createdAt: n.createdAt.toISOString(),
    }))
  );
});

// تحديد إشعار كمقروء
router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, params.data.id),
        eq(notificationsTable.userId, 1)
      )
    )
    .returning();

  if (!notification) {
    res.status(404).json({ error: "الإشعار غير موجود" });
    return;
  }

  res.json({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    type: notification.type,
    createdAt: notification.createdAt.toISOString(),
  });
});

export default router;
