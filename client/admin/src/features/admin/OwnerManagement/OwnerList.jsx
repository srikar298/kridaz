import React from "react";
import OwnerCard from "./OwnerCard";
import { Building } from "lucide-react";

const OwnerList = ({
  owners,
  selectedIds,
  onSelect,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div className="relative">
      {owners.length === 0 ? (
        <div className="bg-background p-20 rounded-[8px] border border-border text-center relative overflow-hidden group min-h-[400px] flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/5 opacity-100 transition-opacity blur-[80px]" />
          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-border flex items-center justify-center text-gray-500 border border-[#404040]">
              <Building size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white uppercase tracking-tight">
                Database Empty
              </h2>
              <p className="text-[12px] font-normal text-muted-foreground uppercase tracking-widest mt-1">
                No verified venue owners found in the master ledger.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {owners.map((owner) => (
            <div key={owner._id} className="animate-fade-in-up">
              <OwnerCard
                owner={owner}
                isSelected={selectedIds.includes(owner._id)}
                onSelect={onSelect}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerList;
