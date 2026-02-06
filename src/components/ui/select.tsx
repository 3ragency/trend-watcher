"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
    value: string;
    label: string;
}

export interface PremiumSelectProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export function PremiumSelect({
    options,
    value,
    onChange,
    placeholder = "Выберите...",
    label,
    disabled = false,
    className
}: PremiumSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "Enter":
            case " ":
                e.preventDefault();
                if (isOpen && highlightedIndex >= 0) {
                    onChange?.(options[highlightedIndex].value);
                    setIsOpen(false);
                } else {
                    setIsOpen(true);
                }
                break;
            case "ArrowDown":
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev =>
                        prev < options.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (isOpen) {
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : options.length - 1
                    );
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={cn(
                    "group relative w-full flex items-center justify-between",
                    "px-4 py-3 rounded-xl",
                    "bg-card/50 backdrop-blur-sm",
                    "border border-border/50",
                    "text-left text-foreground",
                    "transition-all duration-300 ease-out",
                    "hover:border-primary/50 hover:bg-card/70",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/50",
                    isOpen && "border-primary ring-2 ring-primary/20"
                )}
            >
                <span className={cn(
                    "truncate",
                    !selectedOption && "text-muted-foreground"
                )}>
                    {selectedOption?.label || placeholder}
                </span>

                {/* Animated Arrow */}
                <div className={cn(
                    "relative flex items-center justify-center",
                    "w-6 h-6 ml-2 rounded-md",
                    "bg-gradient-to-br from-primary/20 to-primary/5",
                    "transition-all duration-300 ease-out",
                    "group-hover:from-primary/30 group-hover:to-primary/10",
                    isOpen && "rotate-180"
                )}>
                    <ChevronDown className={cn(
                        "w-4 h-4 text-primary",
                        "transition-transform duration-300 ease-out"
                    )} />
                </div>
            </button>

            {/* Dropdown Menu */}
            <div className={cn(
                "absolute z-50 w-full mt-2",
                "rounded-xl overflow-hidden",
                "bg-card/95 backdrop-blur-xl",
                "border border-border/50",
                "shadow-2xl shadow-black/20",
                "origin-top transition-all duration-200 ease-out",
                isOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}>
                <ul
                    role="listbox"
                    className="py-1 max-h-60 overflow-auto"
                >
                    {options.map((option, index) => (
                        <li
                            key={option.value}
                            role="option"
                            aria-selected={option.value === value}
                            className={cn(
                                "px-4 py-2.5 cursor-pointer",
                                "transition-colors duration-150",
                                "hover:bg-primary/10",
                                option.value === value && "bg-primary/20 text-primary font-medium",
                                highlightedIndex === index && "bg-primary/10"
                            )}
                            onClick={() => {
                                onChange?.(option.value);
                                setIsOpen(false);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <div className="flex items-center gap-3">
                                {/* Selection indicator */}
                                <div className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-200",
                                    option.value === value
                                        ? "bg-primary scale-100"
                                        : "bg-transparent scale-0"
                                )} />
                                <span>{option.label}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
