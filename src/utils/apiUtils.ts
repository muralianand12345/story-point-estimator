export const getParamId = async (param: Promise<string> | string | undefined | null): Promise<string | null> => {
    if (param === null || param === undefined) {
        return null;
    }

    try {
        // Handle both Promise<string> and string
        return param instanceof Promise ? await param : param;
    } catch (error) {
        console.error("Error resolving param:", error);
        return null;
    }
};