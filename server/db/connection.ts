import { Pool } from "../deps.ts";
import type { ClientOptions, TLSOptions, QueryObjectResult } from "../deps.ts";

// Maximum retry attempts
const MAX_RETRIES = 5;
// Initial retry delay in ms (will be doubled each attempt)
const INITIAL_RETRY_DELAY = 1000;
// Pool size
const POOL_CONNECTIONS = 10; // Reduced from 20 to reduce connection pressure

// Create a properly typed connection configuration
function createClientOptions(): ClientOptions {
    // Get configuration from environment variables
    const user = Deno.env.get("POSTGRES_USER") || "postgres";
    const password = Deno.env.get("POSTGRES_PASSWORD") || "postgres";
    const database = Deno.env.get("POSTGRES_DB") || "story_point_estimator";
    const hostname = Deno.env.get("POSTGRES_HOST") || "localhost";
    const port = Number(Deno.env.get("POSTGRES_PORT") || 5432);
    const sslEnabled = Deno.env.get("POSTGRES_SSL") === "true";

    // Configure TLS options
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

// Create connection pool
const pool = new Pool(createClientOptions(), POOL_CONNECTIONS);

// Define DB interface with proper type parameters and retry logic
export const db = {
    async query<T>(text: string, params: unknown[] = []): Promise<QueryObjectResult<T>> {
        let retries = 0;
        let lastError;

        while (retries < MAX_RETRIES) {
            const client = await pool.connect();
            try {
                return await client.queryObject<T>(text, params);
            } catch (error) {
                lastError = error;
                console.error(`DB query error (attempt ${retries + 1}/${MAX_RETRIES}):`, error);

                // Check if it's a connection-related error
                if ((error as { name: string; code?: string }).name === "BrokenPipe" || (error as { name: string; code?: string }).code === "EPIPE") {
                    // Wait before retry with exponential backoff
                    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries++;
                } else {
                    // If it's not a connection error, don't retry
                    throw error;
                }
            } finally {
                client.release();
            }
        }

        // If we've exhausted retries, throw the last error
        console.error(`Failed after ${MAX_RETRIES} attempts`);
        throw lastError;
    },

    async transaction<T>(
        callback: (transaction: { query: <U>(text: string, params?: unknown[]) => Promise<QueryObjectResult<U>> }) => Promise<T>
    ): Promise<T> {
        let retries = 0;
        let lastError;

        while (retries < MAX_RETRIES) {
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
                await client.queryObject("ROLLBACK").catch(() => {
                    // Ignore rollback errors
                });

                lastError = error;
                console.error(`Transaction error (attempt ${retries + 1}/${MAX_RETRIES}):`, error);

                // Only retry for connection errors
                if ((error as { name: string; code?: string }).name === "BrokenPipe" || (error as { name: string; code?: string }).code === "EPIPE") {
                    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
                    console.log(`Retrying transaction in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries++;
                } else {
                    throw error;
                }
            } finally {
                client.release();
            }
        }

        throw lastError;
    },

    // Add a method to test connection
    async testConnection(): Promise<boolean> {
        try {
            const client = await pool.connect();
            try {
                await client.queryObject("SELECT 1");
                return true;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error("Database connection test failed:", error);
            return false;
        }
    }
};