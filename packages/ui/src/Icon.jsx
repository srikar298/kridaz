import React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "./lib/utils";

export const Icon = ({ name, size = "md", className = "", color = "currentColor", ...props }) => {
  const LucideIcon = LucideIcons[name];

  if (!LucideIcon) {
    console.warn(`Icon ${name} not found in lucide-react`);
    return null;
  }

  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const iconSize = sizes[size] || size;

  return (
    <LucideIcon
      size={iconSize}
      color={color}
      className={cn("inline-block", className)}
      {...props}
    />
  );
};
