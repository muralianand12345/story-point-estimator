import { Pool, load } from "../deps.ts";
import type { ClientOptions, TLSOptions, QueryObjectResult } from "../deps.ts";

// Load environment variables
await load({ export: true });

const POOL_CONNECTIONS = 20;

// Create a properly typed connection configuration
function createClientOptions(): ClientOptions {
    // Otherwise build from separate params
    const user = Deno.env.get("POSTGRES_USER") || "postgres";
    const password = Deno.env.get("POSTGRES_PASSWORD") || "postgres";
    const database = Deno.env.get("POSTGRES_DB") || "story_point_estimator";
    const hostname = Deno.env.get("POSTGRES_HOST") || "localhost";
    const port = Number(Deno.env.get("POSTGRES_PORT") || 5432);
    const sslEnabled = Deno.env.get("POSTGRES_SSL") === "true";

    // Properly define TLS options
    const tlsOptions: Partial<TLSOptions> = sslEnabled ? {
        enabled: true,
        enforce: true
    } : {
        enabled: false
    };

    return {
        user,
        password,
        database,
        hostname,
        port,
        tls: tlsOptions
    };
}

// Create pool with proper options
const pool = new Pool(createClientOptions(), POOL_CONNECTIONS);

// Define DB interface with proper type parameters
export const db = {
    async query<T>(text: string, params: unknown[] = []): Promise<QueryObjectResult<T>> {
        const client = await pool.connect();
        try {
            return await client.queryObject<T>(text, params);
        } finally {
            client.release();
        }
    },

    async transaction<T>(
        callback: (transaction: { query: <U>(text: string, params?: unknown[]) => Promise<QueryObjectResult<U>> }) => Promise<T>
    ): Promise<T> {
        const client = await pool.connect();
        try {
            await client.queryObject("BEGIN");

            const transaction = {
                query: async <U>(text: string, params: unknown[] = []): Promise<QueryObjectResult<U>> => {
                    return await client.queryObject<U>(text, params);
                }
            };

            const result = await callback(transaction);
            await client.queryObject("COMMIT");
            return result;
        } catch (error) {
            await client.queryObject("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
};