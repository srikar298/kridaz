import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Mail,
  Phone,
  Briefcase,
  Award,
  Clock,
  MapPin,
  FileText,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  User,
  Image as ImageIcon,
  Globe,
  Zap,
  Database,
  AlertCircle,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";import { Button } from "@kridaz/ui";


const VerificationDetailModal = ({
  request,
  onClose,
  onAccept,
  onReject,
  isProcessing,
  type = "pending",
}) => {
  const [grounds, setGrounds] = useState([]);
  const [loadingGrounds, setLoadingGrounds] = useState(false);
  const isRejected = type === "rejected";

  useEffect(() => {
    const fetchGrounds = async () => {
      if (!request?.email && !request?.userId) return;
      setLoadingGrounds(true);
      try {
        const response = await axiosInstance.get("/api/admin/turf/all");
        const allTurfs = response.data.turfs || [];

        const filteredGrounds = allTurfs.filter(
          (turf) =>
            turf.owner?.id === request.userId ||
            turf.owner?.email === request.email
        );

        setGrounds(filteredGrounds);
      } catch (err) {
        console.error("Error fetching grounds:", err);
      } finally {
        setLoadingGrounds(false);
      }
    };

    fetchGrounds();
  }, [request]);

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-[#080808] border border-border rounded-[12px] overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header Section */}
        <div className="p-6 border-b border-border bg-background flex items-center justify-between sticky top-0 z-20">
          <div
            onClick={() =>
              request.userId &&
              (window.location.href = `/profile/${request.userId}`)
            }
            className="flex items-center gap-4 cursor-pointer group/header"
          >
            <div
              className={`w-12 h-12 rounded-[6px] bg-border border border-[#404040] flex items-center justify-center overflow-hidden text-[20px] font-bold ${isRejected ? "text-red-500" : "text-primary"} uppercase group-hover/header:border-primary transition-colors`}
            >
              {request.userId?.profilePicture ? (
                <img
                  src={request.userId.profilePicture}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                request.name?.[0]
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-tight group-hover/header:text-primary transition-colors">
                  {request.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-[0.2em] ${isRejected ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"}`}
                >
                  {request.role}
                </span>
                <ExternalLink
                  size={14}
                  className="text-primary opacity-0 group-hover/header:opacity-100 transition-opacity"
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <Zap size={10} className="text-primary" /> PARTNER
                VERIFICATION DOSSIER #{request.id?.slice(-8)}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Column: Core Identity & Business Details */}
            <div className="lg:col-span-4 border-r border-border p-8 space-y-10 bg-[#090909]">
              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <User size={14} className="text-primary" />
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                    Identity Core
                  </h3>
                </div>
                <div className="space-y-4">
                  <IdentityItem
                    label="Legal Name"
                    value={request.name}
                    icon={User}
                  />
                  <IdentityItem
                    label="Registry Email"
                    value={request.email}
                    icon={Mail}
                  />
                  <IdentityItem
                    label="Contact Vector"
                    value={request.phone}
                    icon={Phone}
                  />
                </div>
              </section>

              <section className="space-y-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={14} className="text-primary" />
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                    Entity Operations
                  </h3>
                </div>
                <div className="space-y-4">
                  <IdentityItem
                    label="Entity Name"
                    value={request.businessDetails?.businessName || "N/A"}
                    icon={Briefcase}
                  />
                  <IdentityItem
                    label="Identity Ref"
                    value={request.businessDetails?.registrationNumber || "N/A"}
                    icon={Award}
                  />
                  <IdentityItem
                    label="Deployment Zone"
                    value={
                      request.businessDetails?.city
                        ? `${request.businessDetails.city}, ${request.businessDetails.state}`
                        : "N/A"
                    }
                    icon={MapPin}
                  />
                  <IdentityItem
                    label="Tenure / Exp"
                    value={request.businessDetails?.experience || "N/A"}
                    icon={Clock}
                  />
                </div>
              </section>

              {isRejected && (
                <section className="p-4 bg-red-500/5 border border-red-500/20 rounded-[8px] space-y-2">
                  <h4 className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={12} /> Access Denied Reason
                  </h4>
                  <p className="text-[11px] text-gray-400 italic">
                    &quot;{request.rejectionReason}&quot;
                  </p>
                </section>
              )}
            </div>

            {/* Right Column: Verification Documents & Grounds */}
            <div className="lg:col-span-8 p-8 space-y-12">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-primary" />
                    <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">
                      Verification Dossier
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-card px-2 py-1 rounded-[4px] border border-border">
                    {request.documents?.length || 0} Artifacts Loaded
                  </span>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentSlot
                      label="PAN CARD"
                      doc={request.documents?.find((d) =>
                        d.name?.toLowerCase().includes("pan")
                      )}
                    />
                    <DocumentSlot
                      label="AADHAR CARD"
                      doc={request.documents?.find((d) =>
                        d.name?.toLowerCase().includes("aadhar")
                      )}
                    />
                    <DocumentSlot
                      label="BUSINESS REGISTRATION"
                      doc={request.documents?.find((d) =>
                        d.name?.toLowerCase().includes("business")
                      )}
                    />
                    <DocumentSlot
                      label="GST CERTIFICATE"
                      doc={request.documents?.find((d) =>
                        d.name?.toLowerCase().includes("gst")
                      )}
                    />
                    <DocumentSlot
                      label="GOOGLE MY BUSINESS"
                      doc={request.documents?.find(
                        (d) =>
                          d.name?.toLowerCase().includes("google") ||
                          d.name?.toLowerCase().includes("gmb")
                      )}
                    />
                    <DocumentSlot
                      label="VENUE / PROPERTY DOCS"
                      doc={request.documents?.find(
                        (d) =>
                          d.name?.toLowerCase().includes("venue") ||
                          d.name?.toLowerCase().includes("property")
                      )}
                    />
                  </div>

                  {request.documents?.filter(
                    (d) =>
                      ![
                        "pan",
                        "aadhar",
                        "business",
                        "gst",
                        "google",
                        "gmb",
                        "venue",
                        "property",
                      ].some((keyword) =>
                        d.name?.toLowerCase().includes(keyword)
                      )
                  ).length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-border/50">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        Supplemental Artifacts
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {request.documents
                          ?.filter(
                            (d) =>
                              ![
                                "pan",
                                "aadhar",
                                "business",
                                "gst",
                                "google",
                                "gmb",
                                "venue",
                                "property",
                              ].some((keyword) =>
                                d.name?.toLowerCase().includes(keyword)
                              )
                          )
                          .map((doc, idx) => (
                            <DocumentCard key={idx} doc={doc} />
                          ))}
                      </div>
                    </div>
                  )}

                  {!request.documents?.length && (
                    <div className="p-10 border-2 border-dashed border-border rounded-[12px] text-center bg-white/[0.02]">
                      <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        No Documents Provided
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="pt-10 border-t border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary" />
                    <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">
                      Associated Assets / Grounds
                    </h3>
                  </div>
                  {grounds.length > 0 && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-[4px] border border-primary/20">
                      {grounds.length} Detected
                    </span>
                  )}
                </div>

                {loadingGrounds ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : grounds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {grounds.map((ground) => (
                      <GroundCard key={ground.id} ground={ground} />
                    ))}
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed border-border rounded-[12px] text-center bg-white/[0.02]">
                    <Globe className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                      No Active Asset Integration Detected
                    </p>
                    <p className="text-[10px] text-gray-600 uppercase mt-2">
                      Assets will be integrated post-verification
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-background border-t border-border flex items-center justify-between sticky bottom-0 z-20">
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <Shield size={14} /> SECURITY CLEARANCE: LEVEL 3 ADMIN
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isRejected ? (
              <Button
                onClick={() => onAccept(request.id)}
                disabled={isProcessing}
                className="px-8 py-3 bg-primary text-black text-[12px] font-black uppercase tracking-[0.2em] rounded-[6px] hover:bg-[#DFFF00] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:opacity-50"
              >
                Authorize Partner
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => onReject(request.id)}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-transparent border border-red-500/30 text-red-500 text-[12px] font-black uppercase tracking-[0.2em] rounded-[6px] hover:bg-red-500/5 hover:border-red-500 transition-all disabled:opacity-50"
                >
                  Decline
                </Button>
                <Button
                  onClick={() => onAccept(request.id)}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-primary text-black text-[12px] font-black uppercase tracking-[0.2em] rounded-[6px] hover:bg-[#DFFF00] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:opacity-50"
                >
                  Approve Authorization <ChevronRight size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const IdentityItem = ({ label, value, icon: Icon }) => (
  <div className="group">
    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
      {label}
    </p>
    <div className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-[6px] border border-border group-hover:border-primary/30 transition-colors">
      <Icon
        size={14}
        className="text-primary/60 group-hover:text-primary"
      />
      <span className="text-[13px] font-semibold text-white tracking-tight break-all uppercase">
        {value || "NOT PROVIDED"}
      </span>
    </div>
  </div>
);

const DocumentSlot = ({ label, doc }) => (
  <div
    className={`group relative p-4 rounded-[8px] border transition-all ${doc ? "bg-card border-border hover:border-primary/40" : "bg-black/40 border-border border-dashed opacity-60"}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-[4px] flex items-center justify-center ${doc ? "bg-primary/10 text-primary" : "bg-gray-800 text-gray-500"}`}
        >
          <FileText size={16} />
        </div>
        <div>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">
            {label}
          </p>
          <p
            className={`text-[11px] font-bold uppercase tracking-tight ${doc ? "text-white" : "text-gray-700"}`}
          >
            {doc ? doc.name || "Attached" : "Pending Upload"}
          </p>
        </div>
      </div>
      {doc ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <AlertCircle size={14} className="text-gray-800" />
      )}
    </div>
  </div>
);

const DocumentCard = ({ doc }) => (
  <a
    href={doc.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group bg-card border border-border rounded-[8px] p-4 flex items-center justify-between hover:border-primary/40 transition-all hover:bg-primary/5"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-[4px] bg-card border border-border flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
        <FileText size={20} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-white uppercase tracking-tight mb-0.5">
          {doc.name}
        </p>
        <p className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">
          Verified Artifact
        </p>
      </div>
    </div>
    <ExternalLink
      size={14}
      className="text-gray-600 group-hover:text-primary transition-colors"
    />
  </a>
);

const GroundCard = ({ ground }) => (
  <div className="group bg-card border border-border rounded-[8px] overflow-hidden hover:border-primary/40 transition-all">
    <div className="h-32 bg-card relative overflow-hidden">
      <img
        src={ground.image}
        alt={ground.name}
        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
      />
      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[2px] bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black text-primary uppercase tracking-widest">
        {ground.status}
      </div>
    </div>
    <div className="p-4">
      <h4 className="text-[12px] font-bold text-white uppercase tracking-tight mb-1">
        {ground.name}
      </h4>
      <p className="text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
        <MapPin size={8} /> {ground.city}, {ground.state}
      </p>
    </div>
  </div>
);

export default VerificationDetailModal;
