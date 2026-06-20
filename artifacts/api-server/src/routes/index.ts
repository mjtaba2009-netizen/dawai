import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import medicationsRouter from "./medications";
import pharmaciesRouter from "./pharmacies";
import ordersRouter from "./orders";
import notificationsRouter from "./notifications";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(medicationsRouter);
router.use(pharmaciesRouter);
router.use(ordersRouter);
router.use(notificationsRouter);
router.use(webhooksRouter);

export default router;
