import React, { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import { Loader2, MessageSquare, Phone, User, Check, X } from "lucide-react";
import { Button } from "@kridaz/ui";


const InquiriesTab = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      const res = await axiosInstance.get(
        "/api/professional/user/inquiries/pro"
      );
      if (res.data.success) {
        setInquiries(res.data.inquiries);
      }
    } catch (error) {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await axiosInstance.patch(
        `/api/professional/user/inquiries/${id}`,
        { status }
      );
      if (res.data.success) {
        toast.success(`Inquiry ${status.toLowerCase()} successfully`);
        fetchInquiries();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <MessageSquare className="w-12 h-12 text-white/20 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No Inquiries Yet</h3>
        <p className="text-white/50">
          When users send you inquiries, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider">
        Inquiries
      </h2>
      <div className="grid gap-4">
        {inquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 transition-all hover:bg-white/[0.04]"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* User Info */}
              <div className="flex items-start gap-4 md:w-1/3">
                <img
                  src={
                    inquiry.user?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${inquiry.user?.name || "User"}`
                  }
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {inquiry.user?.name || "Unknown User"}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-white/50 mt-1">
                    <User size={12} />
                    <span>
                      Interest:{" "}
                      <span className="text-primary">
                        {inquiry.interestFor}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/50 mt-1">
                    <Phone size={12} />
                    <span>{inquiry.phone}</span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5">
                <p className="text-sm text-white/80 whitespace-pre-wrap">
                  {inquiry.message}
                </p>
                <div className="text-[10px] text-white/40 mt-3">
                  Received: {new Date(inquiry.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Actions & Status */}
              <div className="flex flex-col justify-center items-end gap-3 md:w-1/4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                {inquiry.status === "PENDING" ? (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate(inquiry.id, "ACCEPTED")}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-colors text-xs font-bold"
                    >
                      <Check size={14} /> Accept
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(inquiry.id, "DECLINED")}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors text-xs font-bold"
                    >
                      <X size={14} /> Decline
                    </Button>
                  </>
                ) : (
                  <div
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider w-full text-center ${
                      inquiry.status === "ACCEPTED"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {inquiry.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InquiriesTab;
