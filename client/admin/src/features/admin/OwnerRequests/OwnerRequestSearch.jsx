import React from "react";
import { Search } from "lucide-react";

const OwnerRequestSearch = ({ searchTerm, handleSearch }) => {
  return (
    <div className="relative w-full max-w-2xl">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]"
        size={14}
      />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="SEARCH AUTHORIZATION QUEUE BY NAME, EMAIL OR BUSINESS..."
        className="w-full bg-[#2D2D2D] border border-[#404040] rounded-[6px] py-2.5 pl-9 pr-4 text-[14px] text-white focus:outline-none focus:border-[#CCFF00] transition-all font-inter placeholder:text-[#999999] uppercase tracking-wider"
      />
    </div>
  );
};

export default OwnerRequestSearch;
