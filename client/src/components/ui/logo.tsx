import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
  variant?: "full" | "icon";
  light?: boolean;
}

export function Logo({ 
  className, 
  size = "medium", 
  variant = "full",
  light = false
}: LogoProps) {
  const sizeClasses = {
    small: variant === "icon" ? "h-8 w-8" : "h-8",
    medium: variant === "icon" ? "h-10 w-10" : "h-10",
    large: variant === "icon" ? "h-16 w-16" : "h-14"
  };

  const iconSize = {
    small: 20,
    medium: 28,
    large: 40
  };

  const textSize = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl"
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(
        "relative rounded-lg overflow-hidden flex items-center justify-center",
        sizeClasses[size],
        variant === "icon" ? "" : "mr-2.5"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-orange-500 opacity-90"></div>
        <div className="relative z-10 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            width={iconSize[size]} 
            height={iconSize[size]} 
            fill="none" 
            stroke={light ? "#ffffff" : "#ffffff"} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transform -rotate-12"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
            <line x1="9" y1="7" x2="17" y2="7" />
            <line x1="9" y1="11" x2="13" y2="11" />
            
            {/* Lightning bolt for "zap" */}
            <path 
              d="M13 7l-2 4h3l-1 3l2-4h-3z" 
              fill="#ffffff" 
              stroke="#ffffff" 
              strokeWidth="0.5"
            />
          </svg>
        </div>
      </div>
      
      {variant === "full" && (
        <div className={cn(
          "font-bold tracking-tighter",
          textSize[size],
          light ? "text-white" : "bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent"
        )}>
          Auto<span className="text-orange-500">mizap</span>
        </div>
      )}
    </div>
  );
}