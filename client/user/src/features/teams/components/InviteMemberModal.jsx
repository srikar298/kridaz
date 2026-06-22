import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Search,
  UserPlus,
  Phone,
  Loader2,
  Sparkles,
  MessageCircle,
  Users,
} from "lucide-react";
import {
  useSearchPlayersQuery,
  useInviteMemberMutation,
  useAddCustomMemberMutation,
} from "@redux/api/teamApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { countryCodes } from "../../../utils/countryCodes";
import { useEffect } from "react";import { Button, Input, Select } from "@kridaz/ui";


const InviteMemberModal = ({ isOpen, onClose, teamId, teamName }) => {
  const [activeTab, setActiveTab] = useState("search"); // 'search' or 'custom'
  const [searchTerm, setSearchTerm] = useState("");

  // Custom Player Fields
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customCountryCode, setCustomCountryCode] = useState("91");
  const [customInviteData, setCustomInviteData] = useState(null);

  const [supportsContacts, setSupportsContacts] = useState(false);

  useEffect(() => {
    const isMobileView =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(
        navigator.userAgent
      );
    if (isMobileView) {
      setSupportsContacts(true);
    }
  }, []);

  const handleImportFromContacts = async () => {
    try {
      if (!("contacts" in navigator && "ContactsManager" in window)) {
        toast.error(
          "Contacts API is only supported on a real mobile device. Please test this on your phone."
        );
        return;
      }
      const props = ["name", "tel"];
      const opts = { multiple: false };
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && contact.name.length > 0) {
          setCustomName(contact.name[0]);
        }
        if (contact.tel && contact.tel.length > 0) {
          const rawPhone = contact.tel[0].replace(/\D/g, "");
          if (rawPhone.length >= 10) {
            setCustomPhone(rawPhone.slice(-10));
          } else {
            setCustomPhone(rawPhone);
          }
        }
      }
    } catch (ex) {
      console.log("Contacts API failed:", ex);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_calling_code) {
            const code = data.country_calling_code.replace("+", "");
            setCustomCountryCode(code);
          }
        })
        .catch((err) => console.error("Failed to fetch country code", err));
    }
  }, [isOpen]);

  const { user: currentUser } = useSelector((state) => state.auth);

  const { data: searchResults, isLoading: isSearching } = useSearchPlayersQuery(
    searchTerm,
    {
      skip: !searchTerm || activeTab !== "search",
    }
  );

  const [invitePlayer, { isLoading: isInviting }] = useInviteMemberMutation();
  const [addCustomPlayer, { isLoading: isAddingCustom }] =
    useAddCustomMemberMutation();

  const handleInvite = async (userId) => {
    try {
      const result = await invitePlayer({ teamId, userId }).unwrap();
      if (result.success) {
        toast.success("Invitation sent to player!");
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to send invitation");
    }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return toast.error("Player Name is required");

    if (customPhone && customPhone.replace(/\D/g, "").length !== 10) {
      return toast.error("Phone number must be exactly 10 digits");
    }

    try {
      const result = await addCustomPlayer({
        teamId,
        name: customName,
        phone: customPhone,
      }).unwrap();

      if (result.success) {
        const inviteResult = result.results?.[0];

        if (inviteResult?.status === "auto_added_existing_user") {
          toast.success(
            `User exists (${inviteResult.existingUserName}) and was automatically added to your team!`
          );
          setCustomName("");
          setCustomPhone("");
          return;
        }

        if (inviteResult?.status === "error" && inviteResult?.existingUserId) {
          toast.success(
            `User exists (${inviteResult.existingUserName}). Inviting them now...`
          );
          handleInvite(inviteResult.existingUserId);
          return;
        }

        if (inviteResult?.status === "invited_custom") {
          setCustomInviteData({
            token: inviteResult.token,
            phone: customPhone,
            countryCode: customCountryCode,
            name: customName,
          });
          toast.success("Player added! Send them a WhatsApp invite.");
        } else {
          toast.success("Custom player added to team!");
          setCustomName("");
          setCustomPhone("");
          onClose();
        }
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to add player");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-background border border-white/10 rounded-[8px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
              Add Roster
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
              Grow {teamName || "your"} team squad
            </p>
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-[8px] transition-colors"
          >
            <X size={20} className="text-white/40" />
          </Button>
        </div>

        {/* Tab switch */}
        <div className="p-6 pb-2">
          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-[8px]">
            <Button
              onClick={() => setActiveTab("search")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "search" ? "bg-primary text-black shadow-lg shadow-[var(--primary)]/10" : "text-white/40 hover:text-white"}`}
            >
              Search Players
            </Button>
            <Button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "custom" ? "bg-primary text-black shadow-lg shadow-[var(--primary)]/10" : "text-white/40 hover:text-white"}`}
            >
              Add Custom Player
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          {activeTab === "search" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                  size={16}
                />
                <Input
                  type="text"
                  placeholder="SEARCH USERNAME OR EMAIL..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] py-3.5 pl-12 pr-4 text-white text-sm font-bold placeholder-white/20 focus:outline-none focus:border-primary/50 uppercase transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Results List */}
              <div className="max-h-[30vh] overflow-y-auto space-y-2 custom-scrollbar">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8 text-primary">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : searchResults?.players?.length > 0 ? (
                  searchResults.players.map((player) => (
                    <div
                      key={player._id}
                      className="flex items-center justify-between p-3 rounded-[8px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden">
                          <img
                            src={
                              player.profilePic ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white uppercase">
                            @{player.username}
                          </p>
                          <p className="text-[9px] text-white/40 uppercase mt-0.5">
                            {player.city || "N/A"}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleInvite(player._id)}
                        disabled={isInviting}
                        className="p-2.5 bg-primary hover:bg-[#b8e600] disabled:bg-white/5 disabled:text-white/20 text-black rounded-[8px] transition-all"
                      >
                        <UserPlus size={16} />
                      </Button>
                    </div>
                  ))
                ) : (
                  searchTerm && (
                    <p className="text-center py-6 text-white/30 text-xs">
                      No active players found
                    </p>
                  )
                )}
              </div>
            </div>
          ) : customInviteData ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#25D366]/20">
                <MessageCircle size={32} className="text-[#25D366]" />
              </div>
              <h3 className="text-white text-lg font-black uppercase tracking-tight">
                Invite via WhatsApp
              </h3>
              <p className="text-white/60 text-sm">
                Send an invite link to {customInviteData.name} (
                {customInviteData.phone}).
              </p>

              <Button
                onClick={() => {
                  const myName =
                    currentUser?.name || currentUser?.username || "Someone";
                  const domain = window.location.origin;
                  const link = `${domain}/signup?inviteToken=${customInviteData.token}&inviter=${encodeURIComponent(myName)}&teamId=${teamId}`;
                  const message = `Hey ${customInviteData.name}, you are invited by ${myName} to join ${teamName} on Kridaz! Click here to join: ${link}`;
                  window.open(
                    `https://wa.me/${customInviteData.countryCode}${customInviteData.phone}?text=${encodeURIComponent(message)}`,
                    "_blank"
                  );
                  onClose();
                  setCustomInviteData(null);
                }}
                className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black uppercase tracking-[0.2em] rounded-[8px] shadow-xl shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 mt-6"
              >
                <MessageCircle size={18} />
                Send WhatsApp Invite
              </Button>
              <Button
                onClick={() => setCustomInviteData(null)}
                className="w-full py-2 mt-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Back to form
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAddCustom} className="space-y-4">
              {supportsContacts && (
                <Button
                  type="button"
                  onClick={handleImportFromContacts}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors mb-2"
                >
                  <Users size={16} /> Add player from your contacts
                </Button>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">
                  Player Name
                </label>
                <Input
                  type="text"
                  placeholder="EX: RAHUL SHARMA"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] py-3.5 px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 uppercase transition-all"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">
                  Contact Number (Optional)
                </label>
                <div className="flex gap-2">
                  <Select
                    value={customCountryCode}
                    onChange={(e) => setCustomCountryCode(e.target.value)}
                    className="bg-white/[0.03] border border-white/10 rounded-[8px] py-3.5 px-2 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-all cursor-pointer w-24 appearance-none text-center"
                  >
                    {countryCodes.map((c) => (
                      <option
                        key={c.code}
                        value={c.dial_code}
                        className="text-black"
                      >
                        {c.code} (+{c.dial_code})
                      </option>
                    ))}
                  </Select>
                  <div className="relative flex-1">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                      size={16}
                    />
                    <Input
                      type="tel"
                      placeholder="10-digit number"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] py-3.5 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-all"
                      value={customPhone}
                      onChange={(e) =>
                        setCustomPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isAddingCustom}
                className="w-full py-4 bg-primary hover:bg-[#b8e600] disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase tracking-[0.2em] rounded-[8px] shadow-xl shadow-[var(--primary)]/10 transition-all flex items-center justify-center gap-2 mt-6"
              >
                {isAddingCustom ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Add Player to Roster
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InviteMemberModal;
