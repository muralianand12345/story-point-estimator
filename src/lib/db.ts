// This file is deprecated - use prisma.ts instead
// keeping the file to avoid import errors until all references are updated
import prisma from './prisma';

export const db = {
    query: () => {
        console.warn('db.query is deprecated - use prisma directly');
        return Promise.resolve({ rows: [] });
    },
};