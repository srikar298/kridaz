import React, { useState, useMemo } from "react";
import { X, Shield, ShieldOff, Search, Crown } from "lucide-react";
import { Button, Input } from "@kridaz/ui";

import {
  useMakeGroupAdminMutation,
  useDismissGroupAdminMutation,
} from "@redux/api/chatApi";

/**
 * ManageCommunityAdminsModal
 * Allows the community creator to view all members across all community groups
 * and promote/demote them as admins of the community.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - community: the community chat object (transformed by chatApi, with `users` and `groupAdmins` arrays)
 *  - allChats: full chat list from chatData.chats (to find sub-group members)
 */
const ManageCommunityAdminsModal = ({
  isOpen,
  onClose,
  community,
  allChats,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUserId, setLoadingUserId] = useState(null);

  const [makeGroupAdmin] = useMakeGroupAdminMutation();
  const [dismissGroupAdmin] = useDismissGroupAdminMutation();

  // Collect all unique members from community + its sub-groups.
  // `users` in a transformed chat is the participants array with each entry's .user resolved.
  const communityMembers = useMemo(() => {
    if (!community) return [];
    const memberMap = new Map();

    const addParticipant = (p) => {
      const member = p.user;
      // Use both id and _id for UUID compatibility
      const memberId = (member?.id || member?._id)?.toString();
      if (member && memberId && !memberMap.has(memberId)) {
        memberMap.set(memberId, { ...p, user: member });
      }
    };

    // Members of the community itself
    (community.users || []).forEach(addParticipant);

    // Members of child groups
    const communityId = (community._id || community.id)?.toString();
    const childGroups = (allChats || []).filter(
      (c) =>
        (c.parentCommunityId || c.parentCommunity)?.toString() === communityId
    );
    childGroups.forEach((group) => {
      (group.users || []).forEach(addParticipant);
    });

    return Array.from(memberMap.values());
  }, [community, allChats]);

  // Build a set of current admin IDs for quick lookup
  const currentAdminIds = useMemo(
    () =>
      new Set(
        (community?.groupAdmins || [])
          .map((a) => (a.user?.id || a.user?._id)?.toString())
          .filter(Boolean)
      ),
    [community?.groupAdmins]
  );

  const filtered = searchQuery.trim()
    ? communityMembers.filter(
        (p) =>
          p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : communityMembers;

  if (!isOpen || !community) return null;

  const communityId = (community._id || community.id)?.toString();

  const handleToggleAdmin = async (member, isCurrentlyAdmin) => {
    const userId = (member.id || member._id)?.toString();
    if (!userId || !communityId) return;
    setLoadingUserId(userId);
    try {
      if (isCurrentlyAdmin) {
        await dismissGroupAdmin({ chatId: communityId, userId }).unwrap();
      } else {
        await makeGroupAdmin({ chatId: communityId, userId }).unwrap();
      }
    } catch (err) {
      console.error("Failed to update admin status:", err);
      alert(err.data?.message || "Failed to update admin status");
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-card border border-white/10 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center">
              <Crown size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Manage Admins
              </h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {community.chatName}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 p-3 bg-primary/5 border border-primary/20 rounded-[8px] shrink-0">
          <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
            Admins can post in Announcements, add groups, and manage community
            settings.
          </p>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-[8px] px-4 py-2.5 focus-within:border-primary/40 transition-all">
            <Search size={14} className="text-white/30 shrink-0" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/20 text-sm italic">
              {searchQuery
                ? "No members found."
                : "No members in this community yet."}
            </div>
          ) : (
            filtered.map((p) => {
              const member = p.user;
              const memberId = (member?.id || member?._id)?.toString();
              const isAdmin = currentAdminIds.has(memberId);
              const isLoading = loadingUserId === memberId;

              return (
                <div
                  key={memberId}
                  className={`flex items-center gap-3 p-3 rounded-[8px] border transition-all ${isAdmin ? "bg-primary/5 border-primary/20" : "bg-white/[0.02] border-transparent hover:border-white/10"}`}
                >
                  <img
                    src={
                      member?.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || "U")}&background=random`
                    }
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm truncate">
                        {member?.name}
                      </p>
                      {isAdmin && (
                        <span className="shrink-0 text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-white/30 text-[11px] truncate">
                      @{member?.username || "user"}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleToggleAdmin(member, isAdmin)}
                    disabled={isLoading}
                    title={isAdmin ? "Remove admin" : "Make admin"}
                    className={`shrink-0 p-2 rounded-[8px] transition-all flex items-center gap-1.5 text-[11px] font-black uppercase ${isAdmin ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300" : "bg-primary/10 text-primary hover:bg-primary hover:text-black"} disabled:opacity-40`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isAdmin ? (
                      <ShieldOff size={14} />
                    ) : (
                      <Shield size={14} />
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <Button
            onClick={onClose}
            className="w-full py-3 bg-white/5 text-white/60 font-bold rounded-[8px] hover:bg-white/10 transition-all text-sm"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageCommunityAdminsModal;
