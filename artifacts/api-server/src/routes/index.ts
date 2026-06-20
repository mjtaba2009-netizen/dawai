import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import medicationsRouter from "./medications";
import pharmaciesRouter from "./pharmacies";
import ordersRouter from "./orders";
import notificationsRouter from "./notifications";
import webhooksRouter from "./webhooks";
import automationRouter from "./automation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
// يجب تسجيل automationRouter قبل pharmaciesRouter لتجنب التعارض مع GET /pharmacies/:id
router.use(automationRouter);
router.use(medicationsRouter);
router.use(pharmaciesRouter);
router.use(ordersRouter);
router.use(notificationsRouter);
router.use(webhooksRouter);

export default router;
