import { Router } from "../deps.ts";
import { roomsRouter } from "./rooms.ts";

const router = new Router();

// Health check
router.get("/health", (ctx) => {
    ctx.response.body = { status: "ok" };
});

// Add routes
router.use("/api", roomsRouter.routes(), roomsRouter.allowedMethods());

export { router };