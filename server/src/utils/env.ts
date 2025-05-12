import { load } from "https://deno.land/std@0.204.0/dotenv/mod.ts";

// Function to load environment variables from .env file
export async function loadEnv() {
    try {
        const envData = await load();

        // Set environment variables that weren't already set
        for (const [key, value] of Object.entries(envData)) {
            if (Deno.env.get(key) === undefined) {
                Deno.env.set(key, value);
            }
        }

        console.log("Environment variables loaded");
    } catch (error) {
        console.warn("Failed to load .env file:", (error as Error).message);
    }
}

// Function to get environment variable with default
export function getEnv(key: string, defaultValue: string = ""): string {
    return Deno.env.get(key) || defaultValue;
}