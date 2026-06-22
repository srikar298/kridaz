import React from "react";
import { Search, IndianRupee, CalendarDays, X } from "lucide-react";import { Button, Input } from "@kridaz/ui";


const inputCls =
  "h-9 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-secondary/50 focus:bg-white/8 transition-all px-3 w-full";

const TransactionFilters = ({ filters, onFilterChange, onClear }) => {
  const hasActiveFilter = Object.values(filters).some((v) => v !== "");

  return (
    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap bg-background border border-white/8 rounded-[8px] px-3 py-2.5">
      {/* Search */}
      <div className="relative flex-1 min-w-[140px]">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <Input
          type="text"
          placeholder="Search..."
          name="search"
          value={filters.search}
          onChange={onFilterChange}
          className={`${inputCls} pl-8`}
        />
      </div>

      <div className="w-px h-6 bg-white/10 hidden lg:block" />

      {/* Min Amount */}
      <div className="relative flex-1 min-w-[110px]">
        <IndianRupee
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <Input
          type="number"
          placeholder="Min Amount"
          name="minAmount"
          value={filters.minAmount}
          onChange={onFilterChange}
          className={`${inputCls} pl-8`}
        />
      </div>

      {/* Max Amount */}
      <div className="relative flex-1 min-w-[110px]">
        <IndianRupee
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <Input
          type="number"
          placeholder="Max Amount"
          name="maxAmount"
          value={filters.maxAmount}
          onChange={onFilterChange}
          className={`${inputCls} pl-8`}
        />
      </div>

      <div className="w-px h-6 bg-white/10 hidden lg:block" />

      {/* Start Date */}
      <div className="relative flex-1 min-w-[130px]">
        <CalendarDays
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <Input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={onFilterChange}
          className={`${inputCls} pl-8 [color-scheme:dark]`}
        />
      </div>

      {/* End Date */}
      <div className="relative flex-1 min-w-[130px]">
        <CalendarDays
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <Input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={onFilterChange}
          className={`${inputCls} pl-8 [color-scheme:dark]`}
        />
      </div>

      {/* Clear Button — only shown when filters are active */}
      {hasActiveFilter && onClear && (
        <Button
          onClick={onClear}
          title="Clear filters"
          className="flex items-center gap-1.5 h-9 px-3 rounded-[8px] bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all text-[11px] font-bold uppercase tracking-wider shrink-0"
        >
          <X size={12} />
          Clear
        </Button>
      )}
    </div>
  );
};

export default TransactionFilters;
