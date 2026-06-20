import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import useTurfManagement from "@hooks/venue-owner/useTurfManagement";
import TurfCardSkeleton from "./TurfCardSkeleton";
import TurfCard from "./TurfCard";import { Button } from "@kridaz/ui";


const TurfManagement = () => {
  const navigate = useNavigate();
  const { turfs, isLoading, error, fetchTurfs, deleteTurf, toggleVisibility } =
    useTurfManagement();

  useEffect(() => {
    fetchTurfs();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <p className="text-red-500 font-bold uppercase tracking-widest">
          {error}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4 text-primary text-xs uppercase font-bold border-b border-primary"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full custom-scrollbar bg-background text-white w-full max-w-full overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none z-0" />

      <div className="px-1 lg:px-3 lg:pt-2 lg:pb-3 flex flex-col gap-6 md:gap-8 animate-fade-in pt-0 pb-4 h-full relative z-10 w-full max-w-full overflow-x-hidden">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 xl:gap-6 relative z-10 border-b border-white/10 pb-6 w-full max-w-full mt-2 md:mt-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 w-full">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-bold font-open-sans tracking-tight uppercase leading-none whitespace-nowrap">
                Inventory Management
              </h2>
            </div>
            <p className="text-white/70 font-inter text-[14px] md:text-[20px] mt-2 md:ml-4 leading-tight">
              Control your multisport facility roster.
            </p>
          </div>

          <div className="flex flex-row items-center gap-2 xl:gap-4 shrink-0 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none bg-background px-3 py-2 rounded-[16px] border border-white/10 flex items-center justify-center sm:justify-start gap-2 shadow-[var(--shadow-2)] shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
                {turfs.length} Active Arenas
              </span>
            </div>

            <Link
              to="/venue-owner/add-turf"
              className="flex-1 sm:flex-none justify-center sm:justify-start bg-gradient-to-r from-secondary to-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none hover:opacity-90 text-black px-4 py-2 rounded-[16px] text-[9px] md:text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-[var(--shadow-2)] shrink-0 whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={3} className="shrink-0" />
              <span>Add New Venue</span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <TurfCardSkeleton key={index} />
            ))}
          </div>
        ) : turfs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {turfs.map((turf) => (
              <TurfCard
                key={turf._id}
                turf={turf}
                onDelete={() => deleteTurf(turf._id)}
                onToggleVisibility={() => toggleVisibility(turf._id)}
                onEdit={() => navigate(`/venue-owner/edit-turf/${turf._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-card border border-white/10 rounded-[16px] border-dashed shadow-[var(--shadow-2)]">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-6 text-border">
              <Plus size={32} />
            </div>
            <p className="text-[12px] font-normal text-white/70 uppercase tracking-[0.5px]">
              No active arenas found in your roster.
            </p>
            <Link
              to="/venue-owner/add-turf"
              className="mt-6 text-primary text-[11px] font-bold uppercase tracking-widest border-b border-primary/40 hover:border-primary transition-all pb-1"
            >
              Initialize First Venue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurfManagement;
