import React from "react";
import { Search, Command } from "lucide-react";

const SearchBar = ({ searchTerm, handleSearch }) => {
  return (
    <div className="relative w-full lg:w-[450px] group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#CCFF00] transition-colors">
        <Search size={18} />
      </div>
      <input
        type="text"
        placeholder="Search partners by name or email..."
        className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/50 transition-all font-inter shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] group-hover:border-white/20"
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

export default SearchBar;
