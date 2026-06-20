import React, { useState, useEffect } from "react";
import { Copy, RotateCw, XCircle, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";import { Button } from "@kridaz/ui";


const InviteDashboard = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchInvites = async () => {
    try {
      const res = await axiosInstance.get("/api/admin/venue-invites");
      setInvites(res.data.invites);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch invites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const resendInvite = async (id) => {
    try {
      const res = await axiosInstance.post(
        `/api/admin/venue-invites/${id}/resend`
      );
      toast.success(res.data.message);
      fetchInvites();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend invite");
    }
  };

  const revokeInvite = async (id) => {
    try {
      const res = await axiosInstance.post(
        `/api/admin/venue-invites/${id}/revoke`
      );
      toast.success(res.data.message);
      fetchInvites();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke invite");
    }
  };

  const copyMagicLink = (token) => {
    const magicLink = `https://user.kridaz.com/signup?inviteToken=${token}`;
    navigator.clipboard.writeText(magicLink);
    toast.success("Magic Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
        <div className="text-sm font-bold tracking-widest uppercase animate-pulse">
          Loading Invites...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white leading-none">
            Invite <span className="text-primary">Management</span>
          </h1>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-3">
            Monitor and manage venue owner invitations
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/admin/turfs")}
            className="px-6 py-2 rounded-[8px] border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5"
          >
            Back to Venues
          </Button>
          <Button
            onClick={() => navigate("/admin/turfs/invite/new")}
            className="px-6 py-2 flex items-center gap-2 rounded-[8px] bg-gradient-to-r from-secondary to-primary text-black text-xs font-bold uppercase tracking-widest shadow-[0_4px_12px_rgba(179,220,38,0.2)]"
          >
            <Plus size={16} /> New Invite
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-[16px] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-white/50 text-[10px] uppercase tracking-widest border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-bold">Venue Details</th>
                <th className="px-6 py-4 font-bold">Sent To</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created / Expires</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {invites.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-white/40 text-xs font-bold uppercase tracking-widest"
                  >
                    No invites found
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr
                    key={invite.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white truncate max-w-[200px]">
                        {invite.turf?.name || "N/A"}
                      </div>
                      <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                        {invite.turf?.city || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white/80 font-mono text-xs">
                        {invite.email || invite.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-[16px] text-[10px] font-bold uppercase tracking-widest ${
                          invite.status === "PENDING"
                            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                            : invite.status === "ACCEPTED"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {invite.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-white/70">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">
                        Exp: {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invite.status === "PENDING" && (
                          <>
                            <Button
                              onClick={() => copyMagicLink(invite.token)}
                              className="p-2 bg-card hover:bg-border rounded-lg border border-white/5 hover:border-white/20 transition-all group"
                              title="Copy Magic Link"
                            >
                              <Copy
                                size={14}
                                className="text-white/70 group-hover:text-white"
                              />
                            </Button>
                            <Button
                              onClick={() => resendInvite(invite.id)}
                              className="p-2 bg-card hover:bg-border rounded-lg border border-white/5 hover:border-white/20 transition-all group"
                              title="Resend"
                            >
                              <RotateCw
                                size={14}
                                className="text-blue-400 group-hover:text-blue-300"
                              />
                            </Button>
                            <Button
                              onClick={() => revokeInvite(invite.id)}
                              className="p-2 bg-card hover:bg-border rounded-lg border border-white/5 hover:border-white/20 transition-all group"
                              title="Revoke"
                            >
                              <XCircle
                                size={14}
                                className="text-red-400 group-hover:text-red-300"
                              />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InviteDashboard;
