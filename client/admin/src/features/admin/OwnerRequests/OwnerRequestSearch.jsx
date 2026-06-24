import React from "react";
import { Search } from "lucide-react";
import { Input } from "@kridaz/ui";


const OwnerRequestSearch = ({ searchTerm, handleSearch }) => {
  return (
    <div className="relative w-full max-w-2xl">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={14}
      />
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="SEARCH AUTHORIZATION QUEUE BY NAME, EMAIL OR BUSINESS..."
        className="w-full bg-border border border-[#404040] rounded-[6px] py-2.5 pl-9 pr-4 text-[14px] text-white focus:outline-none focus:border-primary transition-all font-inter placeholder:text-muted-foreground uppercase tracking-wider"
      />
    </div>
  );
};

export default OwnerRequestSearch;
