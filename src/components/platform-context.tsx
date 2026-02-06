"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Platform = "YOUTUBE" | "INSTAGRAM" | "TIKTOK" | "VK";

type PlatformContextType = {
    platform: Platform;
    setPlatform: (p: Platform) => void;
};

const PlatformContext = createContext<PlatformContextType | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
    const [platform, setPlatform] = useState<Platform>("YOUTUBE");
    return (
        <PlatformContext.Provider value={{ platform, setPlatform }}>
            {children}
        </PlatformContext.Provider>
    );
}

export function usePlatform() {
    const ctx = useContext(PlatformContext);
    if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
    return ctx;
}
