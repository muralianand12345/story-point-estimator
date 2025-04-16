'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * ClientOnly is a wrapper component that renders its children only on the client side.
 * This helps avoid hydration mismatches in Next.js when using browser-specific APIs.
 * 
 * @param children The content to be rendered on the client side
 * @param fallback Optional content to be shown during server-side rendering
 */
const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient ? <>{children}</> : <>{fallback}</>;
}

export default ClientOnly;