"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function CacheClearer() {
    const pathname = usePathname();

    useEffect(() => {
        const clearEverything = async () => {
            if (typeof window === "undefined") return;

            console.log("🧹 Aggressively clearing all browser storage and cache...");

            try {
                // 1. Clear LocalStorage
                localStorage.clear();
                console.log("✅ LocalStorage cleared");

                // 2. Clear SessionStorage
                sessionStorage.clear();
                console.log("✅ SessionStorage cleared");

                // 3. Clear Cookies
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    // Try to delete cookie with various domain/path combinations to be sure
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
                }
                console.log("✅ Cookies cleared");

                // 4. Clear Cache API (Service Workers cache)
                if ("caches" in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(key => caches.delete(key)));
                    console.log("✅ Cache API cleared (" + keys.length + " caches)");
                }

            } catch (e) {
                console.error("❌ Failed to clear some storage:", e);
            }
        };

        clearEverything();

        // Warning: Clearing everything on every route change might degrade performance
        // and UX (e.g., losing scroll position or user preferences immediately),
        // but this is what was requested.

    }, [pathname]); // Depend on pathname to run on every page navigation

    return null;
}
