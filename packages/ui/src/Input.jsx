import React, { forwardRef } from 'react';
import { cn } from './lib/utils.js';

const Input = forwardRef(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] ring-offset-[var(--background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500/80 focus-visible:ring-red-500/50",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
