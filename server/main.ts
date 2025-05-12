import { Application, oakCors, load } from "./deps.ts";
import { router } from "./routes/mod.ts";
import { handleWs } from "./ws/mod.ts";
import { runMigrations } from "./db/migrations.ts";

// Load environment variables
await load({ export: true });

const app = new Application();

try {
    await runMigrations();
    console.log("Database migrations completed");
} catch (error) {
    console.error("Failed to run migrations:", error);
}

// CORS configuration
app.use(oakCors({
    origin: Deno.env.get("ALLOWED_ORIGINS") || "*",
    optionsSuccessStatus: 200
}));

// Error handling
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        console.error(err);
        ctx.response.status = 500;
        ctx.response.body = { error: "Internal server error" };
    }
});

// Logging middleware
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.request.method} ${ctx.request.url} - ${ctx.response.status} - ${ms}ms`);
});

// WebSocket handler
app.use(async (ctx, next) => {
    if (ctx.request.url.pathname === "/ws") {
        if (!ctx.isUpgradable) {
            ctx.response.status = 400;
            ctx.response.body = "Cannot upgrade connection to WebSocket";
            return;
        }

        const socket = ctx.upgrade();
        handleWs(socket);
        return;
    }

    await next();
});

// API routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = Number(Deno.env.get("PORT") || 8000);
const host = Deno.env.get("HOST") || "0.0.0.0";

console.log(`Server running on ${host}:${port}`);
await app.listen({ port, hostname: host });