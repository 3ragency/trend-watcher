"use client";

import { useState } from "react";
import { TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PremiumSelect } from "@/components/ui/select";

const REGIONS = [
    { value: "RU", label: "Russia" },
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "JP", label: "Japan" },
    { value: "KR", label: "South Korea" },
    { value: "BR", label: "Brazil" },
    { value: "IN", label: "India" },
    { value: "UA", label: "Ukraine" },
    { value: "KZ", label: "Kazakhstan" },
    { value: "BY", label: "Belarus" },
    { value: "UZ", label: "Uzbekistan" }
];

const DURATIONS = [
    { value: "any", label: "Любая" },
    { value: "short", label: "Короткие (< 4 мин)" },
    { value: "medium", label: "Средние (4-20 мин)" },
    { value: "long", label: "Длинные (> 20 мин)" }
];

const SORT_OPTIONS = [
    { value: "viewCount", label: "По просмотрам" },
    { value: "date", label: "По дате" },
    { value: "rating", label: "По рейтингу" },
    { value: "relevance", label: "По релевантности" }
];

export type TrendsSearchParams = {
    region: string;
    query: string;
    duration: string;
    sortBy: string;
    maxResults: number;
};

type TrendsSearchFormProps = {
    onSearch: (params: TrendsSearchParams) => Promise<void>;
    isLoading?: boolean;
};

export function TrendsSearchForm({ onSearch, isLoading = false }: TrendsSearchFormProps) {
    const [region, setRegion] = useState("RU");
    const [query, setQuery] = useState("");
    const [duration, setDuration] = useState("any");
    const [sortBy, setSortBy] = useState("viewCount");
    const [maxResults, setMaxResults] = useState("50");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        await onSearch({ region, query: query.trim(), duration, sortBy, maxResults: parseInt(maxResults) || 50 });
    };

    return (
        <div className="rounded-xl border border-border bg-card/30 p-6">
            <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="h-5 w-5 text-red-500" />
                Поиск трендовых видео
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PremiumSelect
                        label="Регион"
                        options={REGIONS}
                        value={region}
                        onChange={setRegion}
                        placeholder="Выберите регион"
                    />

                    <Input
                        label="Поисковый запрос"
                        placeholder="Введите ключевые слова"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <PremiumSelect
                        label="Длительность"
                        options={DURATIONS}
                        value={duration}
                        onChange={setDuration}
                        placeholder="Выберите длительность"
                    />
                </div>

                {/* Row 2: 2 elements in 3-column grid (only take 2 cells) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PremiumSelect
                        label="Сортировка"
                        options={SORT_OPTIONS}
                        value={sortBy}
                        onChange={setSortBy}
                        placeholder="Выберите сортировку"
                    />

                    <Input
                        label="Макс. результатов"
                        type="number"
                        min={1}
                        max={100}
                        value={maxResults}
                        onChange={(e) => setMaxResults(e.target.value)}
                    />

                    {/* Empty third cell - not stretched */}
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl"
                >
                    {isLoading ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Поиск...
                        </>
                    ) : (
                        <>
                            <Search className="h-4 w-4" />
                            Найти видео
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
