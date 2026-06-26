import { useState, useEffect, useRef } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  MapPin,
  Clock,
  Zap,
  ArrowRight,
  Camera,
  Edit2,
  MessageSquare,
  Heart,
  Loader2,
  MessageCircle,
  Award,
  Plus,
  TrendingUp,
  CheckCircle2,
  Crown,
  BarChart3,
  Medal,
  Users,
  Share2,
  Wifi,
  Radio,
  User,
  UserPlus,
  ChevronLeft,
  Globe,
  Layers,
  Tv,
  Building,
  Layout,
  Eye,
  Play,
  Shield,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useGoogleLogin } from "@react-oauth/google";
import {
  logout,
  updateUser,
  followUser,
  unfollowUser,
} from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { StoryViewer } from "@features/networking";
import EditProfileModal from "@components/modals/EditProfileModal";
import RequestProModal from "../components/RequestProModal";
import { useSocket } from "@context/SocketContext";
import { isProfessionalRole, getDynamicProfileRoute } from "@utils/routeUtils";
import { Button, Input, Select } from "@kridaz/ui";
import SEO from "@/shared/components/common/SEO";


const PRI = "var(--primary)"; // New primary lime accent matching the gradient vibrant stop
const SEC = "var(--primary)"; // Secondary cyan accent matching the gradient cool stop

// --- STYLE TOKENS ---
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const QuickStatCard = ({ icon: Icon, label, value, showDivider }) => (
  <div
    className={`flex-1 flex items-center justify-center gap-4 py-4 ${showDivider ? "border-r border-white/10" : ""}`}
  >
    <div className="flex items-center justify-center">
      <Icon size={20} strokeWidth={2.5} stroke="url(#cyan-lime-gradient)" />
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent tracking-tighter leading-none">
        {value}
      </div>
    </div>
  </div>
);

const AchievementCard = ({ icon: Icon, title, rarity, year }) => {
  const rarityColors = {
    platinum: "from-cyan-400 to-blue-400",
    gold: "from-primary to-primary",
    silver: "from-gray-300 to-gray-400",
  };
  return (
    <div className="group relative rounded-[8px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden">
      {/* Gradient Border Overlay - Only visible on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[8px]" />

      {/* Normal Border Overlay - Fades out on hover */}
      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[8px] animate-in" />

      {/* Card Content Wrapper */}
      <div className="relative bg-background rounded-[8px] p-4 h-full flex flex-col justify-between">
        <div className="relative">
          <div
            className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${rarityColors[rarity]} p-[2px]`}
          >
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6" stroke="url(#cyan-lime-gradient)" />
            </div>
          </div>
          <h3
            className="text-white text-center mb-1 line-clamp-2 min-h-[2.5rem] font-bold text-xs"
            style={HEADING_STYLE}
          >
            {title}
          </h3>
          <p
            className={`text-[9px] text-center bg-gradient-to-r ${rarityColors[rarity]} bg-clip-text text-transparent uppercase tracking-wider font-bold`}
          >
            {rarity} • {year}
          </p>
        </div>
      </div>
    </div>
  );
};
const MatchDetailModal = ({ isOpen, onClose, match, userId }) => {
  const [activeSubTab, setActiveSubTab] = useState("impact");
  if (!isOpen || !match) return null;

  // Find player's stat in this match
  const playerStat =
    match.cricketMatch?.playerStats?.find((s) => s.userId === userId) || {};
  const isBatting = playerStat.battingBalls > 0 || playerStat.battingRuns > 0;
  const isBowling = playerStat.bowlingOvers > 0 || playerStat.bowlingBalls > 0;

  // Determine user's team
  const userTeamSlot = match.teams?.find((t) =>
    t.slots?.some((s) => s.userId === userId)
  );
  const userTeamName = userTeamSlot ? userTeamSlot.name : "My Team";
  const userTeamKey = userTeamSlot ? userTeamSlot.teamKey : "";

  // Determine opponent team
  const opponentTeamSlot = match.teams?.find((t) => t.teamKey !== userTeamKey);
  const opponentTeamName = opponentTeamSlot
    ? opponentTeamSlot.name
    : "Opponents";

  // Determine outcome
  const inningsUser = match.cricketMatch?.innings?.find(
    (i) => i.battingTeam === userTeamKey
  );
  const inningsOpponent = match.cricketMatch?.innings?.find(
    (i) => i.battingTeam !== userTeamKey
  );

  const userRuns = inningsUser ? inningsUser.totalRuns : 0;
  const userWickets = inningsUser ? inningsUser.totalWickets : 0;
  const opponentRuns = inningsOpponent ? inningsOpponent.totalRuns : 0;
  const opponentWickets = inningsOpponent ? inningsOpponent.totalWickets : 0;

  let outcomeText = "Match Tied";
  let won = false;
  if (userRuns > opponentRuns) {
    outcomeText = "Won";
    won = true;
  } else if (opponentRuns > userRuns) {
    outcomeText = "Lost";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-background border border-white/10 rounded-[8px] p-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              {match.name || "Match Details"}
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {match.turf?.name || match.customVenue || "Local Ground"} •{" "}
              {new Date(match.date).toLocaleDateString("en-GB")}
            </p>
          </div>
          <Button
            onClick={onClose}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[8px] font-black uppercase tracking-wider text-[9px] transition-all"
          >
            Close
          </Button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          <Button
            onClick={() => setActiveSubTab("impact")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[11px] border-b-2 transition-all ${activeSubTab === "impact" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
          >
            My Impact
          </Button>
          <Button
            onClick={() => setActiveSubTab("scorecard")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[11px] border-b-2 transition-all ${activeSubTab === "scorecard" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
          >
            Match Scorecard
          </Button>
        </div>

        {/* Tab Content */}
        <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
          {activeSubTab === "impact" ? (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div
                className={`p-6 rounded-[8px] border ${won ? "bg-primary/5 border-primary/10 text-primary" : "bg-red-500/5 border-red-500/10 text-red-400"} flex items-center justify-between`}
              >
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                    Result
                  </p>
                  <p className="text-xl font-black uppercase tracking-tight">
                    {outcomeText}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                    Contribution
                  </p>
                  <p className="text-sm font-bold text-white">
                    {isBatting ? `${playerStat.battingRuns} Runs ` : ""}
                    {isBowling ? `& ${playerStat.bowlingWickets} Wkts` : ""}
                    {!isBatting && !isBowling ? "Fielded / DNP" : ""}
                  </p>
                </div>
              </div>

              {/* Milestones celebrations */}
              {playerStat.battingRuns >= 100 && (
                <div className="p-4 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/20 rounded-[8px] flex items-center gap-3">
                  <Crown className="text-yellow-400 animate-bounce" size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-yellow-400">
                      Magnificent Century!
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Played a sensational innings of {playerStat.battingRuns}{" "}
                      runs.
                    </p>
                  </div>
                </div>
              )}
              {playerStat.bowlingWickets >= 5 && (
                <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-[8px] flex items-center gap-3">
                  <Zap className="text-red-500 animate-pulse" size={24} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-red-500">
                      Five-Wicket Haul!
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Sensational bowling display taking{" "}
                      {playerStat.bowlingWickets} wickets.
                    </p>
                  </div>
                </div>
              )}

              {/* Batting Card */}
              {isBatting && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                    Batting Performance
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Runs
                      </p>
                      <p className="text-lg font-black text-white">
                        {playerStat.battingRuns}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Balls
                      </p>
                      <p className="text-lg font-black text-white">
                        {playerStat.battingBalls}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Strike Rate
                      </p>
                      <p className="text-lg font-black text-primary">
                        {playerStat.battingBalls > 0
                          ? (
                              (playerStat.battingRuns /
                                playerStat.battingBalls) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Boundaries
                      </p>
                      <p className="text-lg font-black text-white">
                        {playerStat.battingFours}x4 / {playerStat.battingSixes}
                        x6
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bowling Card */}
              {isBowling && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                    Bowling Performance
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Overs
                      </p>
                      <p className="text-lg font-black text-white">
                        {playerStat.bowlingOvers ||
                          (playerStat.bowlingBalls / 6).toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Runs
                      </p>
                      <p className="text-lg font-black text-white">
                        {playerStat.bowlingRuns}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Wickets
                      </p>
                      <p className="text-lg font-black text-primary">
                        {playerStat.bowlingWickets}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                        Economy
                      </p>
                      <p className="text-lg font-black text-white">
                        {playerStat.bowlingBalls > 0
                          ? (
                              (playerStat.bowlingRuns /
                                playerStat.bowlingBalls) *
                              6
                            ).toFixed(2)
                          : "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scoreboard Overall */}
              <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 rounded-[8px] p-6 text-center relative overflow-hidden">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    {userTeamName}
                  </p>
                  <p className="text-3xl font-black text-white">
                    {userRuns}/{userWickets}
                  </p>
                </div>
                <div className="border-l border-white/5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    {opponentTeamName}
                  </p>
                  <p className="text-3xl font-black text-white">
                    {opponentRuns}/{opponentWickets}
                  </p>
                </div>
              </div>

              {/* Roster & Performances */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Team Lineup & Performance
                </h4>
                <div className="space-y-2">
                  {match.teams
                    ?.flatMap((t) => t.slots || [])
                    .map((slot, index) => {
                      if (!slot.user) return null;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-[8px] hover:border-white/10 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                slot.user.profilePicture ||
                                "https://ui-avatars.com/api/?name=" +
                                  slot.user.name
                              }
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                            <div>
                              <p className="text-xs font-bold text-white tracking-tight">
                                {slot.user.name}
                              </p>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                                Player
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-white">
                              {match.cricketMatch?.playerStats?.find(
                                (s) => s.userId === slot.userId
                              )
                                ? `${match.cricketMatch.playerStats.find((s) => s.userId === slot.userId).battingRuns} Runs`
                                : "DNP"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConnectionsModal = ({
  isOpen,
  onClose,
  followersList = [],
  followingList = [],
  commonConnections = [],
  followingIds = [],
  currentUser,
  handlePlayerFollowToggle,
  activeTab,
  setActiveTab,
}) => {
  if (!isOpen) return null;

  const getList = () => {
    switch (activeTab) {
      case "followers":
        return followersList;
      case "following":
        return followingList;
      case "common":
        return commonConnections;
      default:
        return [];
    }
  };

  const list = getList();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-background border border-white/10 rounded-[8px] p-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              className="text-2xl font-black uppercase tracking-tight text-white"
              style={HEADING_STYLE}
            >
              Connections
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Network details & mutual links
            </p>
          </div>
          <Button
            onClick={onClose}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[8px] font-black uppercase tracking-wider text-[9px] transition-all"
          >
            Close
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          <Button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === "followers" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
          >
            Followers ({followersList.length})
          </Button>
          <Button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === "following" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
          >
            Following ({followingList.length})
          </Button>
          <Button
            onClick={() => setActiveTab("common")}
            className={`flex-1 py-3 text-center font-black uppercase tracking-widest text-[10px] border-b-2 transition-all ${activeTab === "common" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
          >
            Common ({commonConnections.length})
          </Button>
        </div>

        {/* List Content */}
        <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {list.length > 0 ? (
            list.map((player) => (
              <div
                key={player.id || player._id}
                className="flex items-center justify-between p-3 bg-background border border-white/5 rounded-[8px] hover:border-white/10 transition-all"
              >
                <Link
                  to={`/profile/${player.id || player._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 hover:opacity-80"
                >
                  <img
                    src={
                      player.profilePicture ||
                      "https://ui-avatars.com/api/?name=" + player.name
                    }
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    alt={player.name}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white tracking-tight truncate">
                      {player.name}
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">
                      @{player.username || "player"}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  {player.sportTypes && player.sportTypes.length > 0 && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 text-[8px] font-black uppercase">
                      {player.sportTypes[0]}
                    </span>
                  )}
                  {player.id !== (currentUser?.id || currentUser?._id) && (
                    <Button
                      onClick={() => handlePlayerFollowToggle(player)}
                      className={`px-3 py-1.5 rounded-[12px] font-black uppercase tracking-wider text-[9px] transition-all ${followingIds.includes(player.id) ? "bg-white/10 text-white/40 border border-white/5" : "bg-gradient-to-r from-primary to-primary text-black hover:scale-105 active:scale-95"}`}
                    >
                      {followingIds.includes(player.id)
                        ? "Following"
                        : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-black/40 rounded-[8px] border border-white/5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {activeTab === "followers" && "No followers yet"}
                {activeTab === "following" && "Not following anyone yet"}
                {activeTab === "common" && "No common connections"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, followingIds } = useSelector(
    (/** @type {any} */ state) => state.auth
  );
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [sportFilter, setSportFilter] = useState("CRICKET");
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [connectionsActiveTab, setConnectionsActiveTab] = useState("followers");
  const [isCareerStatsExpanded, setIsCareerStatsExpanded] = useState(true);
  const [isFormGuideExpanded, setIsFormGuideExpanded] = useState(true);
  const [isMatchHistoryExpanded, setIsMatchHistoryExpanded] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("matches");
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [proReviews, setProReviews] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [otpState, setOtpState] = useState("idle");
  const [otpCode, setOtpCode] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [hasRecentInquiry, setHasRecentInquiry] = useState(false);
  const handleEditEmailClick = () => {
    setEditingEmail(true);
    setOtpState("idle");
    setTempEmail(profileUser?.email || currentUser?.email || "");
  };

  const handleSendOTP = async () => {
    const emailToVerify = editingEmail
      ? tempEmail
      : profileUser?.email || currentUser?.email;
    if (!emailToVerify) {
      toast.error("Please enter an email");
      return;
    }
    try {
      setSendingVerification(true);
      if (editingEmail && tempEmail) {
        try {
          await axiosInstance.put("/api/user/auth/updateProfile", {
            email: emailToVerify,
          });
          dispatch(updateUser({ email: emailToVerify, isEmailVerified: false }));
          setProfileUser((prev) => ({
            ...prev,
            email: emailToVerify,
            isEmailVerified: false,
          }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to save email");
          setSendingVerification(false);
          return;
        }
      }
      
      const res = await axiosInstance.post("/api/user/auth/send-otp", {
        email: emailToVerify,
      });
      if (res.data?.success) {
        toast.success("OTP sent successfully!");
        setOtpState("sent");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerifyOTP = async () => {
    const emailToVerify = editingEmail
      ? tempEmail
      : profileUser?.email || currentUser?.email;
    if (otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    try {
      setVerifyingEmail(true);
      const res = await axiosInstance.post(
        "/api/user/auth/profile/verify-email-otp",
        {
          email: emailToVerify,
          otp: otpCode,
        }
      );
      if (res.data?.success) {
        toast.success("Email verified successfully!");
        dispatch(updateUser({ email: emailToVerify, isEmailVerified: true }));
        setEditingEmail(false);
        setOtpState("idle");
        setOtpCode("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const verifyWithGoogle = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      const emailToVerify = editingEmail ? tempEmail : currentUser.email;
      if (!emailToVerify) {
        toast.error("Please enter an email to verify");
        return;
      }
      try {
        setVerifyingEmail(true);
        const res = await axiosInstance.post(
          "/api/user/auth/profile/verify-email-google",
          {
            accessToken: tokenResponse.access_token,
            expectedEmail: emailToVerify,
          }
        );
        if (res.data?.success) {
          toast.success("Email verified successfully via Google!");
          dispatch(updateUser({ email: emailToVerify, isEmailVerified: true }));
          setEditingEmail(false);
          setOtpState("idle");
        } else {
          toast.error(res.data?.message || "Google verification failed");
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to verify via Google"
        );
      } finally {
        setVerifyingEmail(false);
      }
    },
    onError: (error) => {
      console.error("Google verify error:", error);
      toast.error("Google verification cancelled");
    },
  });

  const { isUserOnline } = useSocket();
  const isOwnProfile =
    !userId ||
    (currentUser && (userId === currentUser.id || userId === currentUser._id));
  const targetUserId = isOwnProfile
    ? currentUser?.id || currentUser?._id
    : userId;

  // Redirect removed: Allow professionals to view their own profile with full data here.
  useEffect(() => {
    if (isOwnProfile && currentUser) setProfileUser(currentUser);
  }, [currentUser, isOwnProfile]);

  const [profileUser, setProfileUser] = useState(
    isOwnProfile ? currentUser : null
  );
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  const commonConnections = [];
  if (!isOwnProfile && profileUser) {
    const seenIds = new Set();
    const myFollowingSet = new Set(followingIds || []);
    if (profileUser.followersList) {
      profileUser.followersList.forEach((p) => {
        const currentUserId = currentUser?.id || currentUser?._id;
        if (
          p.id !== currentUserId &&
          myFollowingSet.has(p.id) &&
          !seenIds.has(p.id)
        ) {
          commonConnections.push(p);
          seenIds.add(p.id);
        }
      });
    }
    if (profileUser.followingList) {
      profileUser.followingList.forEach((p) => {
        const currentUserId = currentUser?.id || currentUser?._id;
        if (
          p.id !== currentUserId &&
          myFollowingSet.has(p.id) &&
          !seenIds.has(p.id)
        ) {
          commonConnections.push(p);
          seenIds.add(p.id);
        }
      });
    }
  }

  const dispatch = useDispatch();

  const connectionsList = (() => {
    switch (connectionsActiveTab) {
      case "followers":
        return profileUser?.followersList || [];
      case "following":
        return profileUser?.followingList || [];
      case "common":
        return commonConnections || [];
      default:
        return [];
    }
  })();

  const baseProfileTabs = [
    { id: "matches", label: "Matches" },
    { id: "stats", label: "Stats" },
    { id: "badges", label: "Badges" },
    { id: "teams", label: "Teams" },
    { id: "posts", label: "Posts" },
    { id: "connections", label: "Connections" },
  ];

  const professionalTabs = [
    { id: "overview", label: "Overview" },
    { id: "gallery", label: "Gallery" },
    { id: "certificates", label: "Certificates" },
    { id: "reviews", label: "Reviews" },
  ];

  const profileTabs = isProfessionalRole(profileUser?.role)
    ? [...professionalTabs, ...baseProfileTabs]
    : baseProfileTabs;

  const handlePlayerFollowToggle = async (player) => {
    const isFollowing = followingIds.includes(player.id);

    // Optimistic Update
    dispatch(isFollowing ? unfollowUser(player.id) : followUser(player.id));

    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      await axiosInstance.post(`/api/user/players/${player.id}/${endpoint}`);
    } catch (error) {
      // Revert on error
      dispatch(isFollowing ? followUser(player.id) : unfollowUser(player.id));
      toast.error("Action failed");
    }
  };

  const [grounds, setGrounds] = useState([]);

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const res = await axiosInstance.get("/api/user/turf/all");
        if (res.data && res.data.turfs) {
          setGrounds(
            res.data.turfs.map((t) => ({
              id: t.id,
              name: t.name,
              city: t.city,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching grounds:", err);
      }
    };
    fetchGrounds();
  }, []);

  const [userStories, setUserStories] = useState([]);
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0)
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOwnProfile && currentUser) setProfileUser(currentUser);
  }, [currentUser, isOwnProfile]);

  useEffect(() => {
    const fetchTargetProfile = async () => {
      try {
        setLoadingProfile(true);
        setLoadingPosts(true);
        const [res, postsRes] = await Promise.all([
          axiosInstance.get(`/api/user/players/${targetUserId}`),
          axiosInstance
            .get(`/api/user/community/user-posts/${targetUserId}`)
            .catch(() => ({ data: { success: false } })),
        ]);
        if (res.data.success) {
          let profileData = res.data.profile;

          if (
            isProfessionalRole(profileData.role) &&
            profileData.ownerProfile
          ) {
            try {
              const professional = profileData.ownerProfile;
              const reviews = professional.reviews || [];

              const parseField = (fieldVal) => {
                if (!fieldVal) return [];
                if (typeof fieldVal === "string") {
                  try {
                    return JSON.parse(fieldVal);
                  } catch {
                    return [fieldVal];
                  }
                }
                return fieldVal;
              };

              const parsedCertifications = parseField(
                professional.certifications
              ).map((cert) => {
                if (typeof cert === "string") {
                  try {
                    return JSON.parse(cert);
                  } catch {
                    return { title: cert, description: "", image: null };
                  }
                }
                return cert;
              });

              const parsedPortfolio = parseField(professional.portfolio).map(
                (item) => {
                  if (typeof item === "string") {
                    try {
                      return JSON.parse(item);
                    } catch {
                      return {
                        mediaType: "image",
                        mediaUrl: item,
                        title: "",
                        description: "",
                      };
                    }
                  }
                  return item;
                }
              );

              const parsedStructuredAchievements = parseField(
                professional.structuredAchievements
              ).map((ach) => {
                if (typeof ach === "string") {
                  try {
                    return JSON.parse(ach);
                  } catch {
                    return { title: ach, description: "" };
                  }
                }
                return ach;
              });

              profileData.ownerProfile = {
                ...professional,
                availabilityMode:
                  professional.businessDetails?.availabilityMode ||
                  professional.availabilityMode,
                availabilityTimings:
                  professional.businessDetails?.availabilityTimings ||
                  professional.availabilityTimings,
                preferredLocations: professional.businessDetails
                  ?.preferredLocations || { grounds: [], customLocations: [] },
                certifications: parsedCertifications,
                portfolio: parsedPortfolio,
                structuredAchievements: parsedStructuredAchievements,
                role: profileData.role,
                name: profileData.name,
                profilePicture: profileData.profilePicture,
                isOnline: profileData.isOnline,
              };

              setProReviews(reviews);
            } catch (err) {
              console.error("Failed to parse professional details", err);
            }
          }

          setProfileUser(profileData);
          if (isOwnProfile) dispatch(updateUser(profileData));
          
          if (currentUser && isProfessionalRole(profileData.role)) {
            axiosInstance.get(`/api/professional/user/inquiries/check/${targetUserId}`)
              .then(res => {
                if (res.data.success) {
                  setHasRecentInquiry(res.data.hasRecentInquiry);
                }
              })
              .catch(err => console.error("Error checking recent inquiry", err));
          }

        }
        if (postsRes.data.success) {
          setUserPosts(postsRes.data.posts || []);
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoadingProfile(false);
        setLoadingPosts(false);
      }
    };
    if (targetUserId) fetchTargetProfile();
  }, [targetUserId, isOwnProfile, dispatch]);

  const handleFollowToggle = async () => {
    const isFollowing = followingIds.includes(targetUserId);
    const currentUserId = currentUser?.id || currentUser?._id;

    // Optimistic Update
    dispatch(
      isFollowing ? unfollowUser(targetUserId) : followUser(targetUserId)
    );
    setProfileUser((prev) => ({
      ...prev,
      followers: isFollowing
        ? prev.followers.filter((id) => id !== currentUserId)
        : [...(prev.followers || []), currentUserId],
    }));

    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      await axiosInstance.post(`/api/user/players/${targetUserId}/${endpoint}`);
    } catch (error) {
      // Revert on error
      dispatch(
        isFollowing ? followUser(targetUserId) : unfollowUser(targetUserId)
      );
      setProfileUser((prev) => ({
        ...prev,
        followers: isFollowing
          ? [...(prev.followers || []), currentUserId]
          : prev.followers.filter((id) => id !== currentUserId),
      }));
      toast.error("Action failed");
    }
  };

  const verifyAttempted = useRef(false);

  useEffect(() => {
    const verifyToken = searchParams.get("verifyToken");
    if (
      verifyToken &&
      currentUser &&
      !currentUser.isEmailVerified &&
      isOwnProfile &&
      !verifyAttempted.current
    ) {
      verifyAttempted.current = true;
      const verifyEmail = async () => {
        setVerifyingEmail(true);
        try {
          const res = await axiosInstance.post("/api/user/auth/verify-email", {
            token: verifyToken,
          });
          if (res.data.success) {
            toast.success("Email verified successfully!");
            dispatch(updateUser({ isEmailVerified: true }));

            // Clean up url
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete("verifyToken");
            navigate(
              `/profile${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""}`,
              { replace: true }
            );
          }
        } catch (error) {
          toast.error(
            error.response?.data?.message ||
              "Failed to verify email. Link may be expired."
          );
        } finally {
          setVerifyingEmail(false);
        }
      };
      verifyEmail();
    }
  }, [searchParams, navigate, currentUser, isOwnProfile, dispatch]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      navigate("/", { replace: true });
      toast.success("Signed out successfully!");
    } catch (error) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  const handleShare = async () => {
    const { getShareLink } = await import("@utils/shareUtils");
    const url = getShareLink(window.location.href);
    if (navigator.share) {
      navigator
        .share({
          title: `${profileUser?.name}'s Profile`,
          url: url,
        })
        .catch(() => toast.error("Share failed"));
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const handleAvatarClick = async () => {
    if (
      !profileUser?.hasActiveStory &&
      (!userStories || userStories.length === 0)
    )
      return;
    setInitialStoryIndex(0);
    try {
      const res = await axiosInstance.get(
        `/api/user/community/user-stories/${targetUserId}`
      );
      if (res.data.success && res.data.stories?.length > 0) {
        setViewingStoryGroup({ user: profileUser, stories: res.data.stories });
      }
    } catch (error) {
      toast.error("Failed to load stories");
    }
  };

  if (loadingProfile)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );

  const pro = profileUser?.ownerProfile || profileUser || {};

  return (
    <div className="profile-page-bg min-h-screen bg-black text-white pb-24 overflow-x-hidden">
      <SEO 
        title={`${profileUser?.name || 'Profile'} | Kridaz`}
        description={profileUser?.bio || `View ${profileUser?.name || 'this user'}'s profile on Kridaz.`}
        image={profileUser?.profilePicture || profileUser?.profileImage}
        url={window.location.href}
      />
      {/* ── Gradient SVG Definition for Lucide Icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient
            id="cyan-lime-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--secondary)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Inter:wght@100..900&display=swap');
      `}</style>

      <div className="relative">
        <div className="w-full aspect-[16/9] md:aspect-[24/7] max-h-[320px] md:max-h-[360px] relative overflow-hidden rounded-b-[32px] group/banner">
          <img
            src={
              profileUser?.bannerPicture ||
              profileUser?.ownerProfile?.bannerUrl ||
              "https://images.unsplash.com/photo-1742610569389-687ba54287f3?q=80&w=2070&auto=format&fit=crop"
            }
            alt="Stadium Background"
            className="w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80 transition-opacity duration-300 group-hover/banner:opacity-90"></div>

          {isOwnProfile && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-300 cursor-pointer"
              onClick={() => setIsEditModalOpen(true)}
            >
              <div className="p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-full hover:scale-110 active:scale-95 transition-all text-white flex items-center gap-2">
                <Camera size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Change Banner
                </span>
              </div>
            </div>
          )}

          {/* Back Navigation Button */}
          <Button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 z-30 p-2 md:p-3 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 text-white rounded-[8px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Button>

          {/* Share button at top right corner */}
          <Button
            onClick={handleShare}
            className="absolute top-6 right-6 p-2 md:p-3 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 text-white rounded-[8px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center z-30"
          >
            <Share2 size={20} className="text-white" />
          </Button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 -mt-14 md:-mt-20">
          <div className="flex flex-col items-start gap-4">
            <div className="relative group/avatar shrink-0 flex flex-col items-start">
              <div className="relative transition-all duration-300 hover:scale-105">
                <div
                  className="profile-avatar w-32 h-32 md:w-40 md:h-40 rounded-full border-[5px] border-black bg-gradient-to-br from-secondary to-primary p-[2px] shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_30px_rgba(179,220,38,0.2)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.8),0_0_45px_rgba(179,220,38,0.5)] overflow-hidden cursor-pointer transition-all duration-500 relative"
                  onClick={handleAvatarClick}
                >
                  {profileUser?.profilePicture || profileUser?.profileImage ? (
                    <>
                      <img
                        src={
                          profileUser.profilePicture || profileUser.profileImage
                        }
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = "flex";
                          }
                        }}
                      />
                      <div
                        className="w-full h-full rounded-full items-center justify-center bg-zinc-900"
                        style={{ display: "none" }}
                      >
                        <User
                          size={48}
                          strokeWidth={1.5}
                          stroke="url(#cyan-lime-gradient)"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center bg-zinc-900">
                      <User
                        size={48}
                        strokeWidth={1.5}
                        stroke="url(#cyan-lime-gradient)"
                      />
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                      <Camera size={24} className="text-white" />
                    </div>
                  )}
                </div>

                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="profile-avatar-edit-btn absolute bottom-2 right-2 w-9 h-9 bg-gradient-to-br from-secondary to-primary rounded-full border-[4px] border-black flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg z-20 outline-none"
                  >
                    <Edit2 size={16} strokeWidth={3} />
                  </button>
                ) : (
                  isUserOnline(targetUserId) && (
                    <span
                      className="absolute bottom-2 right-2 h-7 w-7 rounded-full border-[4px] border-black bg-gradient-to-br from-primary to-primary shadow-[0_0_16px_rgba(191,243,103,0.8)] md:h-8 md:w-8"
                      aria-label="Online"
                    />
                  )
                )}
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col justify-end pt-2 md:pt-4">
              <div className="flex flex-col mb-3">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1
                    className="profile-name text-2xl md:text-[34px] leading-tight font-black text-white tracking-tight"
                    style={HEADING_STYLE}
                  >
                    {profileUser?.name || ""}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                  <p className="profile-username text-primary text-xs md:text-sm font-sans font-bold">
                    @{profileUser?.username || "not_specified"}
                  </p>
                  <span className="profile-tag-badge flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-primary/30 bg-black/50 text-primary text-[9px] font-black tracking-widest uppercase backdrop-blur-md shrink-0">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 14a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 13V5a2 2 0 012-2h4a2 2 0 012 2v8"
                      />
                    </svg>
                    {profileUser?.role === "USER"
                      ? "PLAYER"
                      : profileUser?.role || "PLAYER"}
                  </span>
                  {profileUser?.sportTypes &&
                    profileUser.sportTypes.length > 0 && (
                      <span className="profile-tag-badge flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-secondary/30 bg-black/50 text-secondary text-[9px] font-black tracking-widest uppercase backdrop-blur-md shrink-0">
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <path
                            d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                            strokeWidth="2"
                          />
                          <path d="M2 12h20" strokeWidth="2" />
                        </svg>
                        {profileUser.sportTypes[0]}
                      </span>
                    )}
                  {profileUser?.interests?.[0] &&
                    profileUser.interests[0] !== profileUser.sportTypes?.[0] && (
                    <span className="profile-tag-badge flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.05] text-white/90 text-[9px] font-black tracking-widest uppercase backdrop-blur-md shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_4px_rgba(220,38,38,0.8)]" />
                      {profileUser.interests[0]}
                    </span>
                  )}
                </div>

                <div className="profile-stats-row flex flex-wrap items-center gap-4 text-xs text-white/90 font-sans font-bold mb-5">
                  <Button
                    onClick={() => {
                      setActiveProfileTab("connections");
                      setConnectionsActiveTab("followers");
                    }}
                    className="profile-stat-btn flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none"
                  >
                    <Users size={14} className="text-primary" />{" "}
                    {profileUser?.followers?.length || 0} Followers
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveProfileTab("connections");
                      setConnectionsActiveTab("following");
                    }}
                    className="profile-stat-btn flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none"
                  >
                    <UserPlus size={14} className="text-primary" />{" "}
                    {profileUser?.following?.length || 0} Following
                  </Button>

                  {!isOwnProfile && (
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        onClick={() => gateInteraction(handleFollowToggle)}
                        className={`profile-follow-btn px-6 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-[14px] transition-all flex items-center justify-center gap-2 ${
                          followingIds.includes(targetUserId)
                            ? "bg-neutral-800 text-white border border-white/10 hover:bg-neutral-700"
                            : "bg-white text-black hover:bg-neutral-200 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                        }`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <UserPlus size={14} strokeWidth={2.5} />{" "}
                        {followingIds.includes(targetUserId)
                          ? "Following"
                          : "Follow"}
                      </Button>
                      <Button
                        onClick={() =>
                          navigate(`/messages?userId=${targetUserId}`)
                        }
                        className="profile-message-btn p-1.5 bg-black/80 text-foreground rounded-full border border-white/10 hover:bg-neutral-800 transition-all backdrop-blur-md flex items-center justify-center"
                        title="Message"
                      >
                        <MessageCircle size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-info-row flex flex-wrap items-center gap-5 text-xs text-white/80 font-sans font-medium">
                {(profileUser?.city || profileUser?.location) && (
                  <span className="profile-info-item flex items-center gap-1.5">
                    <MapPin size={14} className="text-white" />
                    {(() => {
                      const loc =
                        profileUser?.city || profileUser?.location || "";
                      const parts = loc.split(",").map((p) => p.trim());
                      if (parts.length > 2) {
                        return `${parts[0]}, ${parts[parts.length - 1]}`;
                      }
                      return loc;
                    })()}
                  </span>
                )}
                {isProfessionalRole(profileUser?.role) && (
                  <>
                    <span className="profile-rank-badge flex items-center gap-1.5 px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold">
                      State Rank:{" "}
                      {pro.stateRank ? `#${pro.stateRank}` : "Unranked"}
                    </span>
                    <span className="profile-rank-badge flex items-center gap-1.5 px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold">
                      City Rank:{" "}
                      {pro.cityRank ? `#${pro.cityRank}` : "Unranked"}
                    </span>
                    <span className="profile-info-item flex items-center gap-1.5">
                      <Star size={14} className="fill-white text-white" />{" "}
                      {pro.rating > 0 ? pro.rating.toFixed(1) : "Not Specified"}{" "}
                      ({pro.numReviews || 0} reviews)
                    </span>
                    <span className="profile-info-item flex items-center gap-1.5">
                      <Award size={14} className="text-white" />{" "}
                      {pro.experience
                        ? /^\d+$/.test(pro.experience.trim())
                          ? `${pro.experience.trim()} Years of Experience`
                          : pro.experience
                        : "Not Specified"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Row: Specialization + Bio (Professional Only) */}
            {isProfessionalRole(profileUser?.role) && (
              <div className="mt-8 flex flex-col w-full">
                {pro.specialization && (
                  <div className="mb-4">
                    <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.15em] block mb-2">
                      Specialization
                    </span>
                    <div className="profile-spec-tag inline-flex max-w-full items-start gap-2 px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm">
                      <svg
                        className="w-3.5 h-3.5 text-white shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10l-2 1m0 0l-1-1m1 1v4m-4 0h8"
                        />
                      </svg>
                      <span className="text-xs font-semibold text-white/90 tracking-wide break-words whitespace-pre-wrap">
                        {pro.specialization}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mt-1 w-full overflow-hidden">
                  <div className="max-w-2xl">
                    <p
                      className={`profile-bio-text text-white/60 leading-relaxed text-xs font-sans break-words whitespace-pre-wrap ${!isBioExpanded ? "line-clamp-4" : ""}`}
                    >
                      {pro.bio || profileUser?.bio || "Not Specified"}
                    </p>
                    {(pro.bio || profileUser?.bio) &&
                      (pro.bio || profileUser?.bio)?.length > 150 && (
                        <Button
                          onClick={() => setIsBioExpanded(!isBioExpanded)}
                          className="mt-2 text-primary text-xs font-bold hover:underline transition-colors"
                        >
                          {isBioExpanded ? "Read less" : "Read more"}
                        </Button>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Sport Tags */}
                    {pro.gameTypes?.map((sport, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-sm ml-1"
                      >
                        {sport.toLowerCase() === "cricket" ? (
                          <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                        ) : (
                          <svg
                            className="w-3 h-3 text-white/80"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                            <path
                              stroke="currentColor"
                              strokeWidth="2"
                              d="M12 2a10 10 0 000 20m0-20a10 10 0 010 20"
                            />
                          </svg>
                        )}
                        <span className="text-[10px] font-bold text-white/80">
                          {sport}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {isOwnProfile &&
              profileUser?.email &&
              !profileUser?.isEmailVerified && (
                <div className="w-full mt-4">
                  <div className="profile-verification-box flex flex-col gap-3 p-3 bg-black border border-white/[0.08] rounded-[16px]">
                    {/* Email display / edit row */}
                    <div className="flex items-center gap-2.5">
                      <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider rounded-[6px] shrink-0">
                        Pending
                      </div>
                      {editingEmail ? (
                        <Input
                          type="email"
                          value={tempEmail}
                          onChange={(e) => {
                            setTempEmail(e.target.value);
                            if (otpState !== "idle") setOtpState("idle");
                          }}
                          className="bg-background border border-white/[0.08] rounded-[8px] px-3 py-1.5 text-xs text-white w-full sm:w-[200px] outline-none focus:border-primary transition-all placeholder:text-white/30"
                          placeholder="Enter new email"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs text-white/80 font-medium truncate inline-block max-w-[150px] sm:max-w-[200px] shrink-0">
                          {profileUser.email}
                        </span>
                      )}
                      {!editingEmail && (
                        <button
                          onClick={handleEditEmailClick}
                          className="text-white/40 hover:text-primary transition-colors p-1 flex items-center justify-center bg-transparent border-none outline-none cursor-pointer shrink-0"
                          title="Edit Email"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center gap-2 shrink-0">
                      {editingEmail && otpState === "idle" ? (
                        /* Save / Cancel buttons when editing email */
                        <>
                          <button
                            onClick={handleSendOTP}
                            disabled={
                              sendingVerification || !tempEmail ||
                              tempEmail === (profileUser?.email || currentUser?.email || "")
                            }
                            className="px-4 py-1.5 bg-gradient-to-r from-secondary to-primary text-background text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(191,243,103,0.15)] border-none outline-none cursor-pointer shrink-0"
                          >
                            {sendingVerification ? "Sending..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmail(false);
                              setOtpState("idle");
                              setTempEmail("");
                            }}
                            className="px-4 py-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:bg-white/[0.1] hover:text-white transition-all outline-none cursor-pointer shrink-0"
                          >
                            Cancel
                          </button>
                        </>
                      ) : otpState === "sent" ? (
                        /* OTP input + Verify after Save triggers OTP */
                        <>
                          <Input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) =>
                              setOtpCode(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="6-digit OTP"
                            className="bg-background border border-white/[0.08] rounded-[8px] px-3 py-1.5 text-xs text-white w-[90px] outline-none focus:border-primary text-center tracking-widest font-black transition-all"
                          />
                          <button
                            onClick={handleVerifyOTP}
                            disabled={verifyingEmail || otpCode.length !== 6}
                            className="px-4 py-1.5 bg-gradient-to-r from-secondary to-primary text-background text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(191,243,103,0.15)] border-none outline-none cursor-pointer shrink-0"
                          >
                            {verifyingEmail ? "..." : "Verify"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmail(false);
                              setOtpState("idle");
                              setOtpCode("");
                              setTempEmail("");
                            }}
                            className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:bg-white/[0.1] hover:text-white transition-all outline-none cursor-pointer shrink-0"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        /* Default: Google verify + Get OTP buttons */
                        <>
                          <button
                            onClick={() => verifyWithGoogle()}
                            disabled={sendingVerification || verifyingEmail}
                            className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] text-white text-[10px] font-black uppercase tracking-wider rounded-[8px] hover:bg-white/[0.08] transition-all disabled:opacity-50 flex items-center gap-1.5 outline-none cursor-pointer shrink-0"
                            title="Verify with Google"
                          >
                            <svg width="12" height="12" viewBox="0 0 48 48" className="shrink-0">
                              <path
                                fill="#EA4335"
                                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                              />
                              <path
                                fill="#4285F4"
                                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
                              />
                              <path
                                fill="#34A853"
                                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                              />
                              <path fill="none" d="M0 0h48v48H0z" />
                            </svg>
                            <span className="hidden sm:inline">Google</span>
                          </button>
                          <button
                            onClick={handleSendOTP}
                            disabled={sendingVerification || verifyingEmail}
                            className="px-4 py-1.5 bg-gradient-to-r from-secondary to-primary text-background text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(191,243,103,0.15)] border-none outline-none cursor-pointer shrink-0"
                          >
                            {sendingVerification ? "..." : "Get OTP"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <>
          {/* Short Bio Section */}
          {!isProfessionalRole(profileUser?.role) && profileUser?.bio ? (
            <div className="mb-6 px-2">
              <p className="text-sm text-gray-300 leading-relaxed font-bold italic">
                "{profileUser.bio}"
              </p>
            </div>
          ) : !isProfessionalRole(profileUser?.role) && isOwnProfile ? (
            <div className="mb-6 px-2">
              <p className="text-xs text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                No bio added yet. Click the edit icon to add your short sports
                bio!
              </p>
            </div>
          ) : null}
          {/* Main Profile Tabs */}
          <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar gap-2 sm:gap-6">
            {profileTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveProfileTab(t.id)}
                className={`py-3 px-3 sm:px-4 text-[12px] sm:text-[14px] font-black uppercase tracking-widest border-b-2 transition-all duration-300 flex items-center gap-1.5 shrink-0 bg-transparent border-none outline-none cursor-pointer focus:outline-none ${
                  activeProfileTab === t.id
                    ? "text-primary border-primary"
                    : "text-white/40 border-transparent hover:text-white/80"
                }`}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="space-y-6">
            {/* OVERVIEW TAB */}
            {activeProfileTab === "overview" &&
              (() => {
                const pro = profileUser?.ownerProfile || profileUser || {};
                let languagesList = [];
                if (typeof pro.languages === "string") {
                  languagesList = pro.languages
                    .split(",")
                    .map((l) => l.trim())
                    .filter(Boolean);
                } else if (Array.isArray(pro.languages)) {
                  languagesList = pro.languages;
                }
                const reviews = profileUser?.reviews || [];
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-300">
                    <div className="lg:col-span-8 space-y-6">
                      {/* Availability, Timeline & General Info */}
                      <div className="bg-black rounded-xl border border-white/5 p-4 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xl">
                        <div className="space-y-5">
                          <h3
                            style={HEADING_STYLE}
                            className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3"
                          >
                            <Clock size={14} className="text-white" /> Schedule
                            & Timings
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3.5 transition-all hover:bg-white/[0.04]">
                              <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold block mb-1.5">
                                Engagement Mode
                              </span>
                              <span className="font-bold text-sm text-white capitalize block tracking-tight">
                                {pro.availabilityMode
                                  ? pro.availabilityMode === "Both"
                                    ? "Hybrid (Online & Physical)"
                                    : pro.availabilityMode === "Offline"
                                      ? "Physical Only"
                                      : pro.availabilityMode === "Online"
                                        ? "Remote Only"
                                        : pro.availabilityMode
                                  : "Not Specified"}
                              </span>
                            </div>
                            {pro.availabilityTimings && (
                              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3.5 transition-all hover:bg-white/[0.04]">
                                <span className="text-white/40 uppercase text-[9px] tracking-wider font-bold block mb-1.5">
                                  Operation Timings
                                </span>
                                <span className="font-bold text-sm text-white block tracking-tight">
                                  {pro.availabilityTimings}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-5">
                          <h3
                            style={HEADING_STYLE}
                            className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3"
                          >
                            <Globe size={14} className="text-white" /> Languages
                            & Communication
                          </h3>
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            {languagesList.map((lang) => (
                              <span
                                key={lang}
                                className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-80" />
                                {lang}
                              </span>
                            ))}
                            {languagesList.length === 0 && (
                              <p className="text-xs text-white/40 italic">
                                No specific languages logged.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Role-conditioned specific specs */}
                      {(pro.role?.toLowerCase().includes("streamer") ||
                        pro.role?.toLowerCase().includes("commentator") ||
                        pro.role?.toLowerCase().includes("scorer") ||
                        pro.role?.toLowerCase().includes("umpire") ||
                        pro.matchesCovered ||
                        pro.matchFormats?.length > 0) && (
                        <div className="bg-black rounded-xl border border-white/5 p-4 space-y-6 shadow-xl">
                          <h3
                            style={HEADING_STYLE}
                            className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/5 pb-3"
                          >
                            <Layers size={14} className="text-white" />{" "}
                            Operational Specifications & Services
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Metric Badges */}
                            {(pro.matchesCovered ||
                              pro.matchFormats?.length > 0) && (
                              <div className="space-y-4 bg-black/40 border border-white/5 rounded-lg p-5">
                                {pro.matchesCovered && (
                                  <div>
                                    <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">
                                      Total Matches Covered
                                    </span>
                                    <span className="text-base font-black text-white uppercase tracking-tight">
                                      {pro.matchesCovered}
                                    </span>
                                  </div>
                                )}
                                {pro.matchFormats?.length > 0 && (
                                  <div>
                                    <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1.5">
                                      Match Formats Supported
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {pro.matchFormats.map((fmt) => (
                                        <span
                                          key={fmt}
                                          className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider rounded border border-primary/20"
                                        >
                                          {fmt}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Streamers Specification details */}
                            {pro.role?.toLowerCase().includes("streamer") && (
                              <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                  <Tv size={12} /> Live Broadcasting specs
                                </p>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-white/40">
                                      Max Quality:
                                    </span>
                                    <span className="font-bold text-white uppercase">
                                      {pro.streamQuality || "Not Specified"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-white/40">
                                      Cameras Supported:
                                    </span>
                                    <span className="font-bold text-white">
                                      {pro.camerasSupported != null
                                        ? `${pro.camerasSupported} Camera(s)`
                                        : "Not Specified"}
                                    </span>
                                  </div>
                                </div>
                                {pro.streamPlatforms?.length > 0 && (
                                  <div className="pt-2 border-t border-white/5">
                                    <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1.5">
                                      Stream Platforms
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {pro.streamPlatforms.map((sp) => (
                                        <span
                                          key={sp}
                                          className="px-2 py-0.5 bg-neutral-900 border border-white/5 text-[8px] font-bold uppercase rounded"
                                        >
                                          {sp}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Commentator Specification details */}
                            {pro.role
                              ?.toLowerCase()
                              .includes("commentator") && (
                              <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                  Broadcast Features
                                </p>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-white/40">
                                      Live Commentary Support:
                                    </span>
                                    <span className="font-bold text-white uppercase">
                                      {pro.liveCommentarySupported
                                        ? "🟢 Enabled"
                                        : "🔴 Disabled"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-white/40">
                                      Panel Discussion Support:
                                    </span>
                                    <span className="font-bold text-white uppercase">
                                      {pro.panelDiscussionEnabled
                                        ? "🟢 Enabled"
                                        : "🔴 Disabled"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Scorer / Umpire Specification details */}
                            {(pro.role?.toLowerCase().includes("scorer") ||
                              pro.role?.toLowerCase().includes("umpire")) && (
                              <div className="space-y-3 bg-black/40 border border-white/5 rounded-lg p-5">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                  Digital Scoring
                                </p>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-white/40">
                                      Live Kridaz App Scoring:
                                    </span>
                                    <span className="font-bold text-primary uppercase">
                                      {pro.liveScoringSupport
                                        ? "🟢 Supported"
                                        : "🔴 Independent"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SERVICE AREAS & LOCATIONS */}
                      <div className="bg-black rounded-xl border border-white/5 p-4 space-y-6 shadow-xl">
                        <h3
                          style={HEADING_STYLE}
                          className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2"
                        >
                          <MapPin size={14} className="text-white" /> Service
                          Area Coverage
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Platform Venues */}
                          <div className="bg-black/30 border border-white/5 rounded-lg p-5 space-y-3">
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                              <Building size={12} /> Active Platform Grounds
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {pro.preferredLocations?.grounds?.map(
                                (groundId) => {
                                  const gObj = grounds.find(
                                    (g) => g.id === groundId
                                  );
                                  if (!gObj) return null;
                                  return (
                                    <span
                                      key={groundId}
                                      className="px-2.5 py-1 bg-black border border-white/5 rounded text-[8px] font-black uppercase tracking-wider text-white"
                                    >
                                      {gObj.name} ({gObj.city})
                                    </span>
                                  );
                                }
                              )}
                              {(!pro.preferredLocations?.grounds ||
                                pro.preferredLocations.grounds.length ===
                                  0) && (
                                <p className="text-xs text-white/30 italic">
                                  No specific active turf linked.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Custom Cities */}
                          <div className="bg-black/30 border border-white/5 rounded-lg p-5 space-y-3">
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                              <Globe size={12} /> Covered Cities & States
                            </p>
                            <div className="space-y-3">
                              {pro.preferredLocations?.customLocations?.map(
                                (item, idx) => (
                                  <div key={idx} className="text-xs font-sans">
                                    <span className="font-bold text-primary uppercase tracking-wider block text-[9px]">
                                      {item.state}:
                                    </span>
                                    <span className="text-white/60 leading-normal">
                                      {item.cities.join(", ")}
                                    </span>
                                  </div>
                                )
                              )}
                              {(!pro.preferredLocations?.customLocations ||
                                pro.preferredLocations.customLocations
                                  .length === 0) && (
                                <p className="text-xs text-white/30 italic">
                                  No custom city boundaries configured.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Matchmaking CTA Card */}
                    <div className="lg:col-span-4">
                      <div className="sticky top-24 space-y-6">
                        {/* Matchmaking Action Card */}
                        <div className="bg-black rounded-xl p-4 sm:p-5 border border-white/10 shadow-2xl space-y-6">
                          <div className="flex items-center gap-3 justify-between">
                            <h2
                              style={HEADING_STYLE}
                              className="text-lg font-black uppercase text-white"
                            >
                              Hire Professional
                            </h2>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase tracking-wider ${
                                  pro.isOnline
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}
                              >
                                {pro.isOnline ? "🟢 Online" : "🔴 Offline"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-black/40 border border-white/5 rounded-lg p-4 font-sans text-xs space-y-3">
                            <div className="flex justify-between">
                              <span className="text-white/40">
                                Hourly/Match Rate:
                              </span>
                              <span className="text-primary font-black">
                                ₹{pro.price > 0 ? pro.price : "Not Set"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">
                                Professional Role:
                              </span>
                              <span className="text-white font-bold capitalize">
                                {pro.role}
                              </span>
                            </div>
                          </div>

                          {hasRecentInquiry ? (
                            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-lg font-bold text-xs text-center px-4">
                              You can only send one request to this professional every 24 hours.
                            </div>
                          ) : (
                            <Button
                              onClick={() => setIsRequestModalOpen(true)}
                              className="w-full bg-gradient-to-r from-primary to-primary text-black py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                              ⚡ Request
                            </Button>
                          )}
                        </div>

                        {/* Connect & Socials Card */}
                        {(pro.linkedin || pro.instagram || pro.youtube) && (
                          <div className="bg-black rounded-xl p-4 sm:p-5 border border-white/10 shadow-2xl space-y-5">
                            <h3
                              style={HEADING_STYLE}
                              className="font-sans text-sm font-bold text-white uppercase tracking-wider"
                            >
                              Connect & Socials
                            </h3>
                            <div className="flex flex-wrap items-center gap-3">
                              {/* Social Buttons */}
                              {pro.linkedin && (
                                <a
                                  href={pro.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-[#0077B5]/10 border border-[#0077B5]/30 flex items-center justify-center text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors backdrop-blur-sm"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                  </svg>
                                </a>
                              )}
                              {pro.instagram && (
                                <a
                                  href={pro.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-[#E1306C]/10 border border-[#E1306C]/30 flex items-center justify-center text-[#E1306C] hover:bg-[#E1306C]/20 transition-colors backdrop-blur-sm"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                  </svg>
                                </a>
                              )}
                              {pro.youtube && (
                                <a
                                  href={pro.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors backdrop-blur-sm"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Reviews Card */}
                        {proReviews && proReviews.length > 0 && (
                          <div className="bg-black rounded-xl p-4 border border-white/5 shadow-lg">
                            <h3
                              style={HEADING_STYLE}
                              className="font-sans text-sm font-bold text-white mb-6 uppercase tracking-wider"
                            >
                              Recent Reviews
                            </h3>
                            <div className="space-y-6 font-sans">
                              {proReviews.slice(0, 4).map((review, i) => (
                                <div key={i} className="flex items-start gap-4">
                                  <div className="w-8 h-8 rounded-full bg-neutral-900 overflow-hidden shrink-0 border border-white/5">
                                    {review.user?.profilePicture ||
                                    review.authorImage ? (
                                      <img
                                        src={
                                          review.user?.profilePicture ||
                                          review.authorImage
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white/30 text-[10px] font-bold uppercase">
                                        {(
                                          review.user?.name || review.authorName
                                        )?.slice(0, 2) || "?"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5 mb-1 justify-between">
                                      <span className="text-[10px] text-white/70 font-bold capitalize">
                                        {(
                                          review.user?.name || review.authorName
                                        )?.toLowerCase()}
                                      </span>
                                      <div className="flex items-center text-primary text-[8px] font-bold">
                                        <Star
                                          size={8}
                                          className="fill-white mr-0.5 text-white"
                                        />
                                        {review.rating > 0
                                          ? review.rating.toFixed(1)
                                          : "Not Specified"}
                                      </div>
                                    </div>
                                    <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                                      {review.comment ||
                                        review.content ||
                                        "No comment provided."}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* GALLERY TAB */}
            {activeProfileTab === "gallery" &&
              (() => {
                const pro = profileUser?.ownerProfile || profileUser || {};
                return (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-black rounded-xl border border-white/5 p-4 space-y-6 shadow-xl min-h-[400px]">
                      <div className="border-b border-white/5 pb-4">
                        <h3
                          style={HEADING_STYLE}
                          className="font-sans text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2"
                        >
                          <Layout size={14} className="text-white" /> Gallery
                        </h3>
                      </div>

                      {pro.portfolio?.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {pro.portfolio.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden group hover:border-white/10 transition-all"
                            >
                              <div className="aspect-video relative overflow-hidden bg-neutral-900 border-b border-white/5 flex items-center justify-center">
                                {item.mediaType === "image" ? (
                                  <>
                                    <img
                                      src={item.mediaUrl}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      alt="Gallery item"
                                    />
                                    <Button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white" aria-label="Show">
                                      <Eye size={18} />
                                    </Button>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black transition-colors">
                                    <Play size={24} className="text-white" />
                                    <span className="text-[7px] font-black text-neutral-600 uppercase tracking-[0.3em]">
                                      Motion Media
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="p-3.5 space-y-1">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">
                                  {item.title || "Gallery Item"}
                                </h4>
                                <p className="text-[9px] text-neutral-500 font-medium leading-relaxed line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-neutral-600">
                          <Layout size={36} />
                          <span className="text-[8px] font-black uppercase tracking-[0.4em]">
                            No media portfolio showcases uploaded yet
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* CERTIFICATES TAB */}
            {activeProfileTab === "certificates" &&
              (() => {
                const pro = profileUser?.ownerProfile || profileUser || {};
                return (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-black rounded-xl border border-white/5 p-4 shadow-xl">
                      <h3
                        style={HEADING_STYLE}
                        className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2"
                      >
                        <Shield size={14} className="text-white" /> Verified
                        Certifications Stack
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        {pro.certifications?.length > 0 ? (
                          pro.certifications.map((cert, i) => (
                            <div
                              key={i}
                              className="rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all group overflow-hidden cursor-pointer"
                            >
                              {/* Certificate Image */}
                              <div className="aspect-[16/9] relative overflow-hidden bg-neutral-900 border-b border-white/5 flex items-center justify-center">
                                {cert.image ? (
                                  <>
                                    <img
                                      src={cert.image}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      alt={cert.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                                      <span className="text-[8px] font-black text-primary uppercase tracking-[0.25em] flex items-center gap-1.5">
                                        <Eye size={12} /> View Certificate
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <Shield
                                      className="text-neutral-700"
                                      size={32}
                                    />
                                    <span className="text-[7px] font-black text-neutral-700 uppercase tracking-[0.3em]">
                                      No Image
                                    </span>
                                  </div>
                                )}
                              </div>
                              {/* Certificate Info */}
                              <div className="p-4 space-y-2">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">
                                  {cert.title}
                                </h4>
                                <p className="text-[10px] text-white/50 leading-relaxed font-sans line-clamp-2">
                                  {cert.description}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-14 bg-black/20 rounded-lg border border-dashed border-white/5 flex flex-col items-center justify-center space-y-3">
                            <Shield size={28} className="text-neutral-800" />
                            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                              No verified certifications loaded yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* REVIEWS TAB */}
            {activeProfileTab === "reviews" &&
              (() => {
                const pro = profileUser?.ownerProfile || profileUser || {};
                const reviews = proReviews;
                return (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-black rounded-xl border border-white/5 p-4 shadow-xl min-h-[400px]">
                      <h3
                        style={HEADING_STYLE}
                        className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3"
                      >
                        <Star size={14} className="text-white fill-white" />{" "}
                        Customer Ratings & Reviews
                      </h3>

                      {reviews.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-neutral-650">
                          <Star size={36} />
                          <span className="text-[8px] font-black uppercase tracking-[0.4em]">
                            No customer ratings recorded yet
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                          {reviews.map((review, i) => (
                            <div
                              key={i}
                              className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-neutral-900 overflow-hidden shrink-0 border border-white/5">
                                    {review.user?.profilePicture ||
                                    review.authorImage ? (
                                      <img
                                        src={
                                          review.user?.profilePicture ||
                                          review.authorImage
                                        }
                                        className="w-full h-full object-cover"
                                        alt="Reviewer"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white/30 text-[11px] font-black uppercase">
                                        {(
                                          review.user?.name || review.authorName
                                        )?.slice(0, 2) || "?"}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-white/70 font-bold capitalize block">
                                      {(
                                        review.user?.name || review.authorName
                                      )?.toLowerCase()}
                                    </span>
                                    <div className="flex items-center text-primary text-[8px] font-black mt-0.5">
                                      <Star
                                        size={10}
                                        className="fill-white mr-1 text-white"
                                      />
                                      {review.rating > 0
                                        ? review.rating.toFixed(1)
                                        : "Not Specified"}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed font-sans pt-1">
                                  {review.comment ||
                                    review.content ||
                                    "No comment provided."}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* MATCHES TAB */}
            {activeProfileTab === "matches" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Live Playing Matches Section */}
                {profileUser?.liveMatches &&
                  profileUser.liveMatches.length > 0 && (
                    <div className="relative overflow-hidden rounded-[8px] border border-primary/30 bg-gradient-to-br from-primary/10 via-black/80 to-primary/5 backdrop-blur-md p-2.5">
                      <div className="absolute inset-0 rounded-[8px] bg-gradient-to-r from-primary/5 to-primary/5 animate-pulse pointer-events-none" />
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5 relative z-10">
                        <span className="relative flex items-center justify-center">
                          <span className="absolute w-3 h-3 rounded-full bg-primary/30 animate-ping" />
                          <Wifi className="w-3 h-3 relative" />
                        </span>
                        Live Now — Playing a Match
                      </h3>

                      <div className="space-y-1.5 relative z-10">
                        {profileUser.liveMatches.map((match) => {
                          const teamA = match.teams?.[0]?.name || "TBD";
                          const teamB = match.teams?.[1]?.name || "TBD";
                          // Derive a readable format from what the host actually picked.
                          // Was hard-coded to "T20" if neither field was set — that turned
                          // every custom / unspecified match into "T20" on the profile card.
                          const matchFormat = (() => {
                            const fmt = String(
                              match.format || ""
                            ).toUpperCase();
                            if (fmt === "CUSTOM") return "Custom";
                            if (fmt === "THE_HUNDRED") return "The Hundred";
                            if (fmt) return fmt;
                            if (match.gameType) return match.gameType;
                            const ov = match.oversPerInnings;
                            if (ov === 20) return "T20";
                            if (ov === 50) return "ODI";
                            if (ov === 10) return "T10";
                            if (ov === 100) return "The Hundred";
                            return "Match";
                          })();
                          const location =
                            match.turf?.name ||
                            match.turf?.city ||
                            match.customVenue ||
                            match.city ||
                            "Local Ground";
                          const minutesLive = match.liveStartedAt
                            ? Math.floor(
                                (Date.now() -
                                  new Date(match.liveStartedAt).getTime()) /
                                  60000
                              )
                            : null;

                          return (
                            <Link
                              key={match.id}
                              to={`/analytics/${match.id}`}
                              className="group flex items-center justify-between gap-2 bg-black/50 border border-primary/20 hover:border-primary/60 rounded-[8px] px-2.5 py-2 transition-all duration-300 hover:bg-black/70 hover:shadow-[0_0_20px_rgba(85,222,232,0.15)]"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className="text-xs font-black text-white truncate tracking-tight"
                                    style={HEADING_STYLE}
                                  >
                                    {teamA}
                                  </span>
                                  <span className="text-[9px] font-black text-primary px-1 py-0.5 bg-primary/10 rounded border border-primary/20 shrink-0">
                                    VS
                                  </span>
                                  <span
                                    className="text-xs font-black text-white truncate tracking-tight"
                                    style={HEADING_STYLE}
                                  >
                                    {teamB}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                                    {matchFormat}
                                  </span>
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    <MapPin
                                      size={10}
                                      className="text-primary"
                                    />
                                    {location}
                                  </span>
                                  {minutesLive !== null && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                                      <Clock size={10} />
                                      {minutesLive < 1
                                        ? "Just started"
                                        : `${minutesLive}m live`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="px-2 py-1 bg-gradient-to-r from-primary to-primary text-black text-[9px] font-black uppercase tracking-widest rounded-[4px] flex items-center gap-1 group-hover:scale-105 transition-transform">
                                  <Radio size={10} strokeWidth={2.5} />
                                  Watch Live
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Match History Feed */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center select-none group">
                    <div>
                      <h2
                        className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight"
                        style={HEADING_STYLE}
                      >
                        <Clock
                          className="w-5 h-5"
                          stroke="url(#cyan-lime-gradient)"
                        />
                        Match History Feed
                      </h2>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                        Your past matches history
                      </p>
                    </div>
                  </div>

                  <div className="animate-in fade-in duration-300">
                    {profileUser?.matchHistory &&
                    profileUser.matchHistory.length > 0 ? (
                      <div className="space-y-4 max-w-4xl">
                        {profileUser.matchHistory.map((match, idx) => {
                          const stat =
                            match.cricketMatch?.playerStats?.find(
                              (s) => s.userId === profileUser.id
                            ) || {};
                          const userTeamSlot = match.teams?.find((t) =>
                            t.slots?.some((s) => s.userId === profileUser.id)
                          );
                          const userTeamKey = userTeamSlot
                            ? userTeamSlot.teamKey
                            : "";
                          const userTeamName = userTeamSlot
                            ? userTeamSlot.name
                            : "My Team";
                          const opponentTeamName =
                            match.teams?.find((t) => t.teamKey !== userTeamKey)
                              ?.name || "Opponent";

                          const inningsUser = match.cricketMatch?.innings?.find(
                            (i) => i.battingTeam === userTeamKey
                          );
                          const inningsOpponent =
                            match.cricketMatch?.innings?.find(
                              (i) => i.battingTeam !== userTeamKey
                            );
                          const won =
                            (inningsUser?.totalRuns || 0) >
                            (inningsOpponent?.totalRuns || 0);

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedMatch(match)}
                              className="group relative rounded-[8px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-[var(--primary)]/5"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[8px]" />
                              <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[8px]" />
                              <div className="relative bg-background rounded-[8px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-[8px] text-[8px] font-black uppercase tracking-widest border ${won ? "text-primary bg-primary/10 border-primary/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}
                                    >
                                      {won ? "WON" : "LOST"}
                                    </span>
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                      {new Date(match.date).toLocaleDateString(
                                        "en-GB"
                                      )}
                                    </span>
                                  </div>
                                  <h3
                                    className="text-sm font-black text-white uppercase tracking-tight mb-1"
                                    style={HEADING_STYLE}
                                  >
                                    {userTeamName} vs {opponentTeamName}
                                  </h3>
                                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin
                                      size={10}
                                      className="text-primary"
                                    />{" "}
                                    {match.turf?.name ||
                                      match.customVenue ||
                                      "Local Ground"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-[8px] text-right">
                                    <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">
                                      Match Performance
                                    </p>
                                    <p className="text-xs font-black text-primary">
                                      {stat.battingRuns > 0
                                        ? `${stat.battingRuns} Runs `
                                        : ""}
                                      {stat.bowlingWickets > 0
                                        ? `& ${stat.bowlingWickets} Wkts`
                                        : ""}
                                      {stat.battingRuns === 0 &&
                                      stat.bowlingWickets === 0
                                        ? "Fielded"
                                        : ""}
                                    </p>
                                  </div>
                                  <Button className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[8px] text-white transition-all group-hover:scale-105" aria-label="Next">
                                    <ArrowRight size={14} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black/40 rounded-[8px] border border-white/10">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          No match history available
                        </p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">
                          Once matches are completed on Kridaz, your detailed
                          resumes will display here!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STATS TAB */}
            {activeProfileTab === "stats" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Sports Filter & Resume Header */}
                <div className="flex w-full items-center justify-between bg-white/[0.02] border border-white/5 px-3 py-2 md:p-3 rounded-[8px] backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Medal className="text-primary" size={16} />
                    <div>
                      <h3
                        className="text-[11px] font-black uppercase tracking-wider text-white"
                        style={HEADING_STYLE}
                      >
                        Sports Stats
                      </h3>
                      <p className="hidden md:block text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                        Filter stats by sport type
                      </p>
                    </div>
                  </div>
                  <Select
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value)}
                    className="bg-black border border-white/10 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[6px] focus:outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="CRICKET">Cricket Stats</option>
                    <option value="FOOTBALL">Football (Coming Soon)</option>
                  </Select>
                </div>

                {(() => {
                  const currentStats = profileUser?.careerStats?.find(
                    (s) => s.sportType === sportFilter
                  ) || {
                    matchesPlayed: 0,
                    matchesWon: 0,
                    matchesLost: 0,
                    winPercentage: 0,
                    totalRuns: 0,
                    fours: 0,
                    sixes: 0,
                    centuries: 0,
                    halfCenturies: 0,
                    highestScore: 0,
                    battingAverage: 0,
                    battingStrikeRate: 0,
                    wickets: 0,
                    economyRate: 0,
                    bowlingAverage: 0,
                    bestBowlingWickets: 0,
                    bestBowlingRuns: 0,
                    ballsBowled: 0,
                    runsConceded: 0,
                    fiveWicketHauls: 0,
                  };

                  const formGuideData = (profileUser?.matchHistory || [])
                    .slice(0, 5)
                    .reverse()
                    .map((match, idx) => {
                      const stat =
                        match.cricketMatch?.playerStats?.find(
                          (s) => s.userId === profileUser.id
                        ) || {};
                      return {
                        matchNum: `Match ${idx + 1}`,
                        runs: stat.battingRuns || 0,
                      };
                    });

                  return (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Career Statistics */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[8px] p-6 border border-white/10 flex flex-col justify-between">
                          <div className="flex justify-between items-center select-none group">
                            <div>
                              <h2
                                className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight"
                                style={HEADING_STYLE}
                              >
                                <BarChart3
                                  className="w-5 h-5"
                                  stroke="url(#cyan-lime-gradient)"
                                />
                                Career Stats Summary
                              </h2>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 animate-in fade-in duration-300">
                            {[
                              {
                                label: "Matches Played",
                                value: currentStats.matchesPlayed,
                                color: "#white",
                              },
                              {
                                label: "Win/Loss Spell",
                                value: `${currentStats.matchesWon}W - ${currentStats.matchesLost}L`,
                                color: "var(--primary)",
                              },
                              {
                                label: "Win Ratio",
                                value: `${currentStats.winPercentage}%`,
                                color: "var(--primary)",
                              },
                              {
                                label: "Runs Scored",
                                value: currentStats.totalRuns,
                                color: "#white",
                              },
                              {
                                label: "Batting Avg",
                                value: currentStats.battingAverage || "0.0",
                                color: "#white",
                              },
                              {
                                label: "Strike Rate",
                                value: currentStats.battingStrikeRate || "0.0",
                                color: "var(--primary)",
                              },
                              {
                                label: "High Score",
                                value: currentStats.highestScore || "0",
                                color: "#white",
                              },
                              {
                                label: "Centuries (100s)",
                                value: currentStats.centuries,
                                color: "#white",
                              },
                              {
                                label: "Wickets Taken",
                                value: currentStats.wickets,
                                color: "var(--primary)",
                              },
                              {
                                label: "Economy",
                                value:
                                  currentStats.bowlingEconomy ||
                                  currentStats.economyRate ||
                                  "0.00",
                                color: "#white",
                              },
                              {
                                label: "Bowling Avg",
                                value: currentStats.bowlingAverage || "0.00",
                                color: "#white",
                              },
                              {
                                label: "Best Bowling",
                                value: currentStats.bestBowlingWickets
                                  ? `${currentStats.bestBowlingWickets}/${currentStats.bestBowlingRuns}`
                                  : "N/A",
                                color: "#white",
                              },
                            ].map((stat, idx) => (
                              <div
                                key={idx}
                                className="bg-black/40 rounded-[8px] p-4 border border-white/5 hover:border-primary/30 transition-all group"
                              >
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                                  {stat.label}
                                </p>
                                <p
                                  className="text-lg font-black tracking-tight"
                                  style={{ color: stat.color }}
                                >
                                  {stat.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form Guide */}
                        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[8px] p-6 border border-white/10 flex flex-col justify-between">
                          <div className="flex justify-between items-center select-none group">
                            <div>
                              <h2
                                className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight"
                                style={HEADING_STYLE}
                              >
                                <TrendingUp
                                  className="w-5 h-5"
                                  stroke="url(#cyan-lime-gradient)"
                                />
                                Form Guide
                              </h2>
                            </div>
                          </div>

                          <div className="mt-6 animate-in fade-in duration-300">
                            {formGuideData.length > 0 ? (
                              <div className="w-full h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={formGuideData}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#222"
                                      vertical={false}
                                    />
                                    <XAxis
                                      dataKey="matchNum"
                                      tick={{
                                        fill: "#666",
                                        fontSize: 9,
                                        fontWeight: "bold",
                                      }}
                                      axisLine={false}
                                    />
                                    <YAxis tick={false} axisLine={false} />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "#000",
                                        border: "1px solid #333",
                                        borderRadius: "8px",
                                        fontSize: "10px",
                                      }}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="runs"
                                      stroke="url(#cyan-lime-gradient)"
                                      strokeWidth={3.5}
                                      dot={{
                                        fill: "var(--primary)",
                                        r: 4,
                                        strokeWidth: 2,
                                        stroke: "#000",
                                      }}
                                      activeDot={{ r: 6 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center bg-black/40 border border-white/5 rounded-[8px] py-12 text-center">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                  No match form data available
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* BADGES TAB */}
            {activeProfileTab === "badges" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[8px] p-6 border border-white/10">
                  <div className="mb-4">
                    <h2
                      className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight"
                      style={HEADING_STYLE}
                    >
                      <Award
                        className="w-5 h-5"
                        stroke="url(#cyan-lime-gradient)"
                      />
                      Earned Badges
                    </h2>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                      Prestigious dynamic sports career badges
                    </p>
                  </div>

                  {profileUser?.badges && profileUser.badges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {profileUser.badges.map((badge, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-[8px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-[var(--primary)]/10 shrink-0"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[8px]" />
                          <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[8px]" />
                          <div className="relative bg-background rounded-[8px] p-4 h-full flex flex-col justify-between text-center min-h-[130px]">
                            <div>
                              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center">
                                <Medal className="w-5 h-5 text-primary" />
                              </div>
                              <h3 className="text-white text-center mb-1 font-black text-[11px] uppercase tracking-tight truncate">
                                {badge.name}
                              </h3>
                              <p className="text-[9px] text-gray-500 leading-normal font-bold line-clamp-2">
                                {badge.description}
                              </p>
                            </div>
                            <p className="text-[8px] text-primary font-black uppercase tracking-widest mt-2">
                              {badge.category || "MILESTONE"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-black/40 rounded-[8px] border border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        No career badges unlocked yet
                      </p>
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">
                        Score centuries, claim five-wicket hauls, or hit
                        boundaries to earn yours!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TEAMS TAB */}
            {activeProfileTab === "teams" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[8px] backdrop-blur-md">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    My Teams
                  </h3>
                  {profileUser?.teams && profileUser.teams.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {profileUser.teams.map((team) => (
                        <Link
                          key={team.id}
                          to={`/team/${team.id}`}
                          className="flex flex-col items-center gap-2 group shrink-0"
                        >
                          <div className="w-20 h-20 rounded-[12px] bg-black border border-white/10 flex items-center justify-center text-primary font-bold overflow-hidden group-hover:border-primary/50 transition-all">
                            {team.logo || team.image ? (
                              <img
                                src={team.logo || team.image}
                                alt={team.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">
                                {team.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider transition-colors max-w-[100px] truncate text-center mt-1">
                            {team.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-black/40 rounded-[8px] border border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        No teams joined yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* POSTS TAB */}
            {activeProfileTab === "posts" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight"
                    style={HEADING_STYLE}
                  >
                    <Plus
                      className="w-5 h-5"
                      stroke="url(#cyan-lime-gradient)"
                    />
                    User Posts
                  </h2>
                  {isOwnProfile && (
                    <Link
                      to="/community?createPost=true"
                      className="px-4 py-2 bg-gradient-to-r from-primary to-primary text-black rounded-[8px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(85,222,232,0.2)] flex items-center justify-center"
                    >
                      Create New Post
                    </Link>
                  )}
                </div>

                {loadingPosts ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : userPosts && userPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {userPosts.map((post) => {
                      const postImage =
                        post.mediaUrls?.[0] ||
                        post.image ||
                        post.imageUrl ||
                        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2070";
                      const postDate = post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Recent";
                      return (
                        <div
                          key={post.id || post._id}
                          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-[8px] border border-white/10 overflow-hidden hover:border-primary/40 transition-all group"
                        >
                          <div className="h-40 relative overflow-hidden bg-zinc-900/50">
                            {post.mediaType === "video" ? (
                              <div className="w-full h-full relative">
                                <video
                                  src={post.videoUrl || post.mediaUrls?.[0]}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Zap className="w-8 h-8 text-primary" />
                                </div>
                              </div>
                            ) : (
                              <img
                                src={postImage}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            )}
                            <div className="absolute top-3 right-3 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-[8px] text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                              {post.mediaType || "Post"}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {profileUser?.profilePicture ? (
                                <img
                                  src={profileUser.profilePicture}
                                  className="w-5 h-5 rounded-full border border-primary/40"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-zinc-850 flex items-center justify-center text-[8px] font-black text-primary">
                                  {profileUser?.name?.[0]}
                                </div>
                              )}
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate flex-1">
                                {profileUser?.name}
                                {profileUser?.username && (
                                  <span className="text-gray-600 ml-1">
                                    @{profileUser.username}
                                  </span>
                                )}
                              </span>
                              <span className="text-[8px] text-gray-600 font-bold">
                                {postDate}
                              </span>
                            </div>
                            <h3
                              className="text-[11px] font-black text-white mb-1 uppercase tracking-tight truncate"
                              style={HEADING_STYLE}
                            >
                              {post.title || "Update"}
                            </h3>
                            <p className="text-[10px] text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                              {post.content}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <div className="flex items-center gap-3">
                                <Button className="flex items-center gap-1 text-gray-500 hover:text-primary transition-colors">
                                  <Heart size={12} />
                                  <span className="text-[9px] font-bold">
                                    {post.likes?.length || 0}
                                  </span>
                                </Button>
                                <Button className="flex items-center gap-1 text-gray-500 hover:text-primary transition-colors">
                                  <MessageSquare size={12} />
                                  <span className="text-[9px] font-bold">
                                    {post.comments?.length || 0}
                                  </span>
                                </Button>
                              </div>
                              <Button className="text-gray-500 hover:text-white transition-colors" aria-label="Next">
                                <ArrowRight size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black/40 rounded-[8px] border border-white/10">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      No posts uploaded yet
                    </p>
                    {isOwnProfile && (
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">
                        Create your first community update to share your sports
                        achievements!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CONNECTIONS TAB */}
            {activeProfileTab === "connections" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex border-b border-white/5 mb-6 overflow-x-auto no-scrollbar gap-2">
                  <Button
                    onClick={() => setConnectionsActiveTab("followers")}
                    className={`py-3 px-4 text-center font-black uppercase tracking-widest text-[10px] sm:text-[11px] border-b-2 transition-all shrink-0 ${connectionsActiveTab === "followers" ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-white/80"}`}
                  >
                    Followers ({profileUser?.followersList?.length || 0})
                  </Button>
                  <Button
                    onClick={() => setConnectionsActiveTab("following")}
                    className={`py-3 px-4 text-center font-black uppercase tracking-widest text-[10px] sm:text-[11px] border-b-2 transition-all shrink-0 ${connectionsActiveTab === "following" ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-white/80"}`}
                  >
                    Following ({profileUser?.followingList?.length || 0})
                  </Button>
                  {!isOwnProfile && (
                    <Button
                      onClick={() => setConnectionsActiveTab("common")}
                      className={`py-3 px-4 text-center font-black uppercase tracking-widest text-[10px] sm:text-[11px] border-b-2 transition-all shrink-0 ${connectionsActiveTab === "common" ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-white/80"}`}
                    >
                      Common ({commonConnections.length})
                    </Button>
                  )}
                </div>

                {connectionsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connectionsList.map((player) => (
                      <div
                        key={player.id || player._id}
                        className="flex items-center justify-between p-4 bg-background border border-white/5 rounded-[8px] hover:border-white/10 transition-all"
                      >
                        <Link
                          to={`/profile/${player.id || player._id}`}
                          className="flex items-center gap-3 min-w-0 hover:opacity-80"
                        >
                          <img
                            src={
                              player.profilePicture ||
                              "https://ui-avatars.com/api/?name=" + player.name
                            }
                            className="w-12 h-12 rounded-full object-cover border border-white/10"
                            alt={player.name}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white tracking-tight truncate">
                              {player.name}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                              @{player.username || "player"}
                            </p>
                          </div>
                        </Link>

                        <div className="flex items-center gap-3 shrink-0">
                          {player.sportTypes &&
                            player.sportTypes.length > 0 && (
                              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-[9px] font-black uppercase">
                                {player.sportTypes[0]}
                              </span>
                            )}
                          {player.id !==
                            (currentUser?.id || currentUser?._id) && (
                            <Button
                              onClick={() => handlePlayerFollowToggle(player)}
                              className={`px-3.5 py-2 rounded-[12px] font-black uppercase tracking-wider text-[10px] transition-all ${followingIds.includes(player.id) ? "bg-white/10 text-white/40 border border-white/5" : "bg-gradient-to-r from-primary to-primary text-black hover:scale-105 active:scale-95"}`}
                            >
                              {followingIds.includes(player.id)
                                ? "Following"
                                : "Follow"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black/40 rounded-[8px] border border-white/5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {connectionsActiveTab === "followers" &&
                        "No followers yet"}
                      {connectionsActiveTab === "following" &&
                        "Not following anyone yet"}
                      {connectionsActiveTab === "common" &&
                        "No common connections"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={currentUser}
      />
      <RequestProModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        pro={profileUser}
        onRequestSuccess={() => setHasRecentInquiry(true)}
      />
      <MatchDetailModal
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
        userId={profileUser?.id || profileUser?._id}
      />
      <ConnectionsModal
        isOpen={isConnectionsModalOpen}
        onClose={() => setIsConnectionsModalOpen(false)}
        followersList={profileUser?.followersList || []}
        followingList={profileUser?.followingList || []}
        commonConnections={commonConnections}
        followingIds={followingIds}
        currentUser={currentUser}
        handlePlayerFollowToggle={handlePlayerFollowToggle}
        activeTab={connectionsActiveTab}
        setActiveTab={setConnectionsActiveTab}
      />
      {viewingStoryGroup && (
        <StoryViewer
          storyGroup={viewingStoryGroup}
          onClose={() => setViewingStoryGroup(null)}
          onDelete={
            isOwnProfile ? (id) => toast.error("Delete logic not mapped") : null
          }
          currentUser={currentUser}
          isAdmin={
            currentUser?.role === "BMSP_SUPER_ADMIN" ||
            currentUser?.role === "BMSP_ADMIN"
          }
          initialIndex={initialStoryIndex}
        />
      )}
    </div>
  );
}
