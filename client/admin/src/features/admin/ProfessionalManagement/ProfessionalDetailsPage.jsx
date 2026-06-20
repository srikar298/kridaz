import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Shield,
  Calendar,
  IndianRupee,
  Star,
  Briefcase,
  Award,
  Clock,
  Activity,
  CreditCard,
  Trash2,
} from "lucide-react";
import useProfessionals from "@hooks/admin/useProfessionals";
import ConfirmationModal from "@components/shared/ConfirmationModal";

import axiosInstance from "@hooks/useAxiosInstance";import { Button } from "@kridaz/ui";


const ProfessionalDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { deleteProfessional } = useProfessionals();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/api/admin/professionals/${id}`
        );
        if (response.data.success) {
          setDetails(response.data);
        }
      } catch (error) {
        console.error("Error fetching professional details:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-400 font-medium tracking-wide">
          Loading detailed profile...
        </p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-red-500 mb-4">
          <Shield size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
          Profile Not Found
        </h2>
        <p className="text-gray-500">
          The requested professional could not be found or you don&apos;t have
          access.
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2 bg-primary text-black font-bold uppercase rounded-[6px] hover:bg-[#65a30d] transition-colors"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const { profile, matches } = details;

  const handleDelete = async () => {
    const success = await deleteProfessional(id);
    if (success) {
      navigate(-1);
    }
    setShowDeleteModal(false);
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-64 bg-primary/5 blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation / Header */}
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 uppercase text-sm font-bold tracking-wider"
        >
          <ArrowLeft size={16} /> Back to Professionals
        </Button>

        <div className="bg-background border border-border rounded-[8px] shadow-2xl flex flex-col overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] pointer-events-none" />

          {/* Profile Header */}
          <div className="p-8 pb-0 flex flex-col sm:flex-row gap-8 items-start sm:items-end justify-between border-b border-border">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 pb-8 text-center sm:text-left">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[8px] bg-primary/10 flex items-center justify-center text-primary font-black text-4xl sm:text-5xl uppercase border-2 border-primary/20 shadow-[0_0_40px_rgba(204,255,0,0.15)] overflow-hidden shrink-0">
                {profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.name?.charAt(0)
                )}
              </div>
              <div className="mt-2 sm:mt-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-3">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-wide">
                    {profile?.name}
                  </h1>
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs sm:text-sm font-bold tracking-wider border border-primary/20 uppercase">
                    ACTIVE {profile?.role}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Star size={16} className="text-primary" />
                    <span>
                      {profile?.rating || "N/A"} ({profile?.numReviews || 0}{" "}
                      reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    <span>
                      Joined{" "}
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" }
                          )
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8 sm:mb-0">
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-black text-xs uppercase tracking-[0.15em] rounded-[8px] hover:bg-red-500/20 transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete Record
                </Button>
              </div>
            </div>

            {/* Quick Stats on Header Right */}
            <div className="hidden lg:flex gap-6 pb-8 text-right">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  Total Matches
                </p>
                <p className="text-2xl font-bold text-white">
                  {matches?.length || 0}
                </p>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  Match Rate
                </p>
                <p className="text-2xl font-bold text-primary">
                  ₹{profile?.price || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-border bg-background/50 custom-scrollbar">
            {["overview", "finances", "matches"].map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative whitespace-nowrap ${activeTab === tab ? "text-primary" : "text-white/40 hover:text-white"}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
                )}
              </Button>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-8 lg:p-10 min-h-[500px]">
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                {/* Contact Info */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <Mail className="text-primary" size={24} /> Contact
                    Details
                  </h3>
                  <div className="bg-white/5 border border-white/10 rounded-[8px] p-6 space-y-5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-500 text-sm">Email</span>
                      <span className="text-gray-200">{profile?.email}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-500 text-sm">Phone</span>
                      <span className="text-gray-200">
                        {profile?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-500 text-sm">Gender</span>
                      <span className="text-gray-200">
                        {profile?.gender || "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Location</span>
                      <span className="text-gray-200 text-right">
                        {[profile?.city, profile?.state]
                          .filter(Boolean)
                          .join(", ") ||
                          profile?.location ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Background */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <Briefcase className="text-primary" size={24} />{" "}
                    Professional Background
                  </h3>
                  <div className="bg-white/5 border border-white/10 rounded-[8px] p-6 space-y-5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-500 text-sm">Experience</span>
                      <span className="text-gray-200">
                        {profile?.businessDetails?.experience || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-500 text-sm">
                        Specialization
                      </span>
                      <span className="text-gray-200">
                        {profile?.businessDetails?.specialization || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-500 text-sm">Match Rate</span>
                      <span className="text-primary font-bold text-lg">
                        ₹{profile?.price || 0}
                      </span>
                    </div>
                    {profile?.gameTypes?.length > 0 && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-gray-500 text-sm">
                          Game Types
                        </span>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {profile.gameTypes.map((type) => (
                            <span
                              key={type}
                              className="px-3 py-1 bg-white/10 rounded-md text-xs text-gray-300 font-medium"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-6 lg:col-span-2 mt-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <Award className="text-primary" size={24} />{" "}
                    Certifications
                  </h3>
                  {profile?.certifications?.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {profile.certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="bg-card border border-primary/30 text-gray-200 px-5 py-3 rounded-[6px] text-sm flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                        >
                          <Shield size={18} className="text-primary" />
                          <span className="font-medium tracking-wide">
                            {cert}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-dashed border-white/20 rounded-[8px] p-8 text-center text-gray-500">
                      <Award size={32} className="mx-auto mb-3 opacity-50" />
                      <p>No certifications listed for this professional.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: FINANCES */}
            {activeTab === "finances" && (
              <div className="space-y-10">
                {/* Financial Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/40 rounded-[8px] p-6 relative overflow-hidden shadow-[0_0_30px_rgba(132,204,22,0.1)]">
                    <div className="absolute -right-4 -bottom-4 opacity-20 text-primary">
                      <IndianRupee size={100} />
                    </div>
                    <p className="text-white/80 text-xs uppercase tracking-widest font-bold mb-3 relative z-10">
                      Usable Balance
                    </p>
                    <p className="text-4xl font-bold text-primary relative z-10">
                      ₹{profile?.walletBalance?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="bg-card border border-white/10 rounded-[8px] p-6">
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3">
                      In Progress
                    </p>
                    <p className="text-3xl font-bold text-blue-400">
                      ₹{profile?.inProgressBalance?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="bg-card border border-white/10 rounded-[8px] p-6">
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3">
                      Pending
                    </p>
                    <p className="text-3xl font-bold text-yellow-400">
                      ₹{profile?.pendingBalance?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="bg-card border border-white/10 rounded-[8px] p-6">
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3">
                      Total Withdrawn
                    </p>
                    <p className="text-3xl font-bold text-gray-300">
                      ₹{profile?.withdrawnBalance?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>

                {/* Banking Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <CreditCard className="text-primary" size={24} /> Banking
                    & KYC
                  </h3>
                  <div className="bg-white/5 border border-white/10 rounded-[8px] p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-8 border-b border-white/10">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">KYC Status</p>
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-[6px] text-xs font-bold uppercase tracking-wider border ${profile?.bankingDetails?.kycStatus === "VERIFIED" ? "bg-green-500/10 text-green-400 border-green-500/30" : profile?.bankingDetails?.kycStatus === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${profile?.bankingDetails?.kycStatus === "VERIFIED" ? "bg-green-400" : profile?.bankingDetails?.kycStatus === "REJECTED" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`}
                          ></div>
                          {profile?.bankingDetails?.kycStatus ||
                            "NOT SUBMITTED"}
                        </div>
                      </div>
                      <div className="mt-6 sm:mt-0 text-left sm:text-right">
                        <p className="text-gray-400 text-sm">Payout Mode</p>
                        <p className="text-white text-xl font-bold uppercase tracking-wider mt-1">
                          {profile?.bankingDetails?.payoutMode ||
                            "BANK TRANSFER"}
                        </p>
                      </div>
                    </div>

                    {profile?.bankingDetails?.payoutMode === "UPI" ? (
                      <div className="bg-card p-6 rounded-[8px] border border-white/5 flex justify-between items-center">
                        <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">
                          UPI ID
                        </span>
                        <span className="text-white font-mono text-lg tracking-wider">
                          {profile?.bankingDetails?.upiId || "N/A"}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="bg-card p-5 rounded-[8px] border border-white/5">
                          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">
                            Account Name
                          </p>
                          <p className="text-white font-medium">
                            {profile?.bankingDetails?.accountName || "N/A"}
                          </p>
                        </div>
                        <div className="bg-card p-5 rounded-[8px] border border-white/5">
                          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">
                            Bank Name
                          </p>
                          <p className="text-white font-medium">
                            {profile?.bankingDetails?.bankName || "N/A"}
                          </p>
                        </div>
                        <div className="bg-card p-5 rounded-[8px] border border-white/5">
                          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">
                            Account Number
                          </p>
                          <p className="text-white font-mono tracking-wider">
                            {profile?.bankingDetails?.accountNumber || "N/A"}
                          </p>
                        </div>
                        <div className="bg-card p-5 rounded-[8px] border border-white/5">
                          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">
                            IFSC Code
                          </p>
                          <p className="text-white font-mono tracking-wider">
                            {profile?.bankingDetails?.ifscCode || "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MATCHES */}
            {activeTab === "matches" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <Activity className="text-primary" size={24} /> Match
                    History
                  </h3>
                  <span className="px-4 py-1.5 bg-white/10 rounded-full text-white font-bold text-sm">
                    {matches?.length || 0} Total Games
                  </span>
                </div>

                {matches?.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/20 rounded-[8px] p-16 text-center">
                    <Calendar
                      size={64}
                      className="mx-auto text-gray-700 mb-6"
                    />
                    <p className="text-white font-bold text-2xl tracking-wide mb-2">
                      No Match History
                    </p>
                    <p className="text-gray-500 text-lg">
                      This professional hasn&apos;t officiated any matches yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matches?.map((match) => (
                      <div
                        key={match._id}
                        className="bg-card border border-white/10 rounded-[8px] p-6 hover:border-primary/50 hover:bg-white/5 transition-all duration-300 relative group"
                      >
                        {/* Status Indicator */}
                        <div
                          className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl rounded-tr-xl opacity-20 transition-opacity group-hover:opacity-40 ${match.status === "COMPLETED" ? "bg-green-500" : match.status === "CANCELLED" ? "bg-red-500" : "bg-blue-500"}`}
                        ></div>

                        <div className="flex items-center gap-3 mb-4">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${match.status === "COMPLETED" ? "bg-green-500/10 text-green-400 border-green-500/30" : match.status === "CANCELLED" ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"}`}
                          >
                            {match.status}
                          </span>
                          <span className="text-primary text-sm font-bold uppercase tracking-wider">
                            {match.gameType}
                          </span>
                        </div>

                        <h4 className="text-white font-bold text-lg mb-2">
                          {match.ground?.name || "Unknown Ground"}
                        </h4>

                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                          <MapPin size={14} className="text-gray-500" />
                          <span className="truncate">
                            {match.ground?.location || "No location specified"}
                          </span>
                        </div>

                        <div className="flex items-end justify-between pt-4 border-t border-white/5">
                          <div>
                            <p className="text-white font-medium mb-1">
                              {new Date(match.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                            <p className="text-gray-500 text-sm flex items-center gap-1.5">
                              <Clock size={12} /> {match.time}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                              Fee
                            </p>
                            <div className="text-primary font-bold text-xl">
                              ₹{match.umpireCost || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${profile?.role || "Professional"}`}
        message={`Are you sure you want to PERMANENTLY delete ${profile?.name}? This action cannot be undone.`}
        confirmText="Confirm Delete"
        type="danger"
      />
    </div>
  );
};

export default ProfessionalDetailsPage;
