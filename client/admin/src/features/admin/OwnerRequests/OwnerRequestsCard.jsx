import React from "react";
import {
  Clock,
  Fingerprint,
  Briefcase,
  Mail,
  MapPin,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Phone,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";import { Button } from "@kridaz/ui";


const OwnerRequestsCard = ({
  request,
  onAccept,
  onReject,
  onReconsider,
  onViewDetail,
  isProcessing,
  type = "pending",
}) => {
  const navigate = useNavigate();
  const isRejected = type === "rejected";

  // Extract real data from businessDetails
  const businessName =
    request.businessDetails?.businessName || "Pending Verification";
  const registrationId =
    request.businessDetails?.registrationNumber || "Not Provided";
  const experience =
    request.businessDetails?.experience || "Verification Required";
  const role = request.role || "owner";
  const location = request.businessDetails?.city
    ? `${request.businessDetails.city}, ${request.businessDetails.state}`
    : "Unknown Origin";

  return (
    <div
      className={`bg-background border ${isRejected ? "border-red-500/20" : "border-border"} rounded-[8px] p-6 flex flex-col relative overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-[var(--shadow-2)] h-full`}
    >
      {/* Background Icon Watermark */}
      <Fingerprint className="absolute -right-6 -top-6 w-32 h-32 text-white/[0.02] group-hover:text-white/[0.04] transition-colors rotate-12" />

      {/* Header: User Info */}
      <div
        onClick={() => {
          const uId =
            typeof request.userId === "object"
              ? request.userId?.id
              : request.userId;
          if (uId) navigate(`/profile/${uId}`);
        }}
        className="flex items-center gap-4 mb-6 pb-6 border-b border-border/30 relative z-10 cursor-pointer group/profile"
      >
        <div
          className={`w-12 h-12 rounded-[4px] bg-border flex items-center justify-center overflow-hidden text-[16px] font-bold ${isRejected ? "text-red-500" : "text-primary"} uppercase border border-[#404040] group-hover/profile:border-primary transition-colors`}
        >
          {request.userId?.profilePicture ? (
            <img
              src={request.userId.profilePicture}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            request.name?.[0] || "U"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-white uppercase tracking-tight truncate group-hover/profile:text-primary transition-colors">
              {request.name}
            </h3>
            <span
              className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-wider ${isRejected ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"}`}
            >
              {role}
            </span>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 text-[10px] font-normal text-muted-foreground uppercase tracking-widest truncate">
              <Mail
                size={10}
                className={isRejected ? "text-red-500/50" : "text-primary/50"}
              />
              <span className="truncate">{request.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-normal text-muted-foreground uppercase tracking-widest truncate">
              <Phone
                size={10}
                className={isRejected ? "text-red-500/50" : "text-primary/50"}
              />
              <span className="truncate">{request.phone}</span>
            </div>
          </div>
        </div>
        {isRejected && (
          <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-[4px]">
            <AlertTriangle size={14} className="text-red-500" />
          </div>
        )}
      </div>

      {/* Body: Business Dossier */}
      <div className="space-y-4 flex-1 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[2px]">
            Verification Dossier
          </span>
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 ${isRejected ? "bg-red-500/5 border-red-500/10" : "bg-primary/5 border-primary/10"} border rounded-[6px]`}
          >
            <div
              className={`w-1 h-1 rounded-full ${isRejected ? "bg-red-500" : "bg-primary"} animate-pulse`}
            />
            <span
              className={`text-[8px] font-bold ${isRejected ? "text-red-500" : "text-primary"} uppercase tracking-widest`}
            >
              {isRejected ? "Access Revoked" : "Awaiting Scan"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <InfoRow icon={Briefcase} label="Entity Name" value={businessName} />
          <InfoRow icon={Award} label="Identity Ref" value={registrationId} />
          <InfoRow icon={Clock} label="Operational Tenure" value={experience} />
          <InfoRow icon={MapPin} label="Deployment Zone" value={location} />
        </div>

        {isRejected && request.rejectionReason && (
          <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-[6px]">
            <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest mb-1">
              Rejection Basis
            </p>
            <p className="text-[11px] text-gray-400 italic">
              &quot;{request.rejectionReason}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Footer: Actions */}
      <div className="mt-8 relative z-10">
        {isRejected ? (
          <Button
            onClick={() => onReconsider(request.id)}
            disabled={isProcessing}
            className="w-full py-3 bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 text-white hover:text-primary text-[11px] font-bold uppercase tracking-[0.2em] rounded-[6px] transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50"
          >
            {isProcessing ? "..." : "Reconsider Request"}
            {!isProcessing && (
              <RotateCcw
                size={14}
                className="group-hover/btn:rotate-180 transition-transform duration-500"
              />
            )}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onReject(request.id)}
              disabled={isProcessing}
              className="py-2.5 bg-transparent border border-[#FF3B3B]/30 hover:border-[#FF3B3B] hover:bg-[#FF3B3B]/5 text-[#FF3B3B] text-[11px] font-medium uppercase tracking-[0.15em] rounded-[6px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? "..." : "Decline"}
            </Button>
            <Button
              onClick={() => onAccept(request.id)}
              disabled={isProcessing}
              className="py-2.5 bg-primary hover:bg-[#DFFF00] text-black text-[11px] font-bold uppercase tracking-[0.15em] rounded-[6px] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.2)] disabled:opacity-50 group/btn"
            >
              {isProcessing ? "..." : "Authorize"}
              {!isProcessing && (
                <ChevronRight
                  size={12}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              )}
            </Button>
          </div>
        )}

        {/* View Detailed Button */}
        <Button
          onClick={() => onViewDetail(request)}
          className="w-full mt-3 py-3 bg-card border border-border hover:border-primary/50 text-gray-400 hover:text-primary text-[9px] font-black uppercase tracking-[0.3em] rounded-[6px] transition-all flex items-center justify-center gap-2 group/dossier"
        >
          <Fingerprint
            size={12}
            className="group-hover/dossier:scale-110 transition-transform"
          />
          Scan Full Dossier
        </Button>
      </div>

      {/* Edge Accents */}
      <div
        className={`absolute top-0 left-0 w-[1px] h-0 group-hover:h-full bg-gradient-to-b ${isRejected ? "from-red-500" : "from-primary"} to-transparent transition-all duration-700`}
      />
      <div
        className={`absolute bottom-0 right-0 w-0 group-hover:w-full h-[1px] bg-gradient-to-l ${isRejected ? "from-red-500" : "from-primary"} to-transparent transition-all duration-700`}
      />
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="bg-[#151617] p-3 rounded-[6px] border border-border/50 flex items-center gap-3 hover:border-primary/10 transition-colors">
    <div className="p-1.5 bg-primary/5 rounded-[4px] text-primary">
      <Icon size={12} />
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-normal text-muted-foreground uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-[12px] font-semibold text-white uppercase tracking-tight truncate max-w-[140px]">
        {value}
      </p>
    </div>
  </div>
);

export default OwnerRequestsCard;
