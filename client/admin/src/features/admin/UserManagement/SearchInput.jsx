import React from "react";
import { Search, Command } from "lucide-react";import { Input } from "@kridaz/ui";


const SearchInput = ({ searchTerm, handleSearch }) => {
  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
        <Search size={18} />
      </div>
      <Input
        type="text"
        placeholder="Search identity database..."
        className="w-full bg-background border border-white/10 rounded-[12px] py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-inter shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] group-hover:border-white/20"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-[6px] border border-white/10">
          <Command size={11} className="text-white/40" />
          <span className="text-[10px] font-black text-white/40">K</span>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
