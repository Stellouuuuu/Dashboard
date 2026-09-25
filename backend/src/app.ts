import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import aboutRoutes from "./modules/about/about.routes.js";
import widgetsRoutes from "./modules/widgets/widgets.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import servicesRoutes from "./modules/services/services.routes.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

export const app = express();

// Derrière nginx : req.ip doit être l'IP réelle du client, pas celle du proxy
// (PLAN.md §10, piège 2 — nécessaire pour client.host dans /about.json).
app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(apiLimiter);

app.use("/about.json", aboutRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/services", servicesRoutes);
app.use("/api/v1/widgets", widgetsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
