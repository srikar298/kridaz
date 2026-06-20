import * as Sentry from "@sentry/react";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Video,
  Key,
  Globe,
  Shield,
  RefreshCw,
  AlertCircle,
  MonitorPlay,
  Youtube,
  Facebook,
  Copy,
  CheckCircle2,
  Layers,
  Search,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Layout,
  Palette,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import GlobalBackButton from "@/shared/components/GlobalBackButton";import { Button, Input, Select, Textarea } from "@kridaz/ui";


export default function StreamSetup() {
  const { id: paramId, matchId } = useParams();
  const id = paramId || matchId;
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // YouTube specific states
  const [channel, setChannel] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [channelLoading, setChannelLoading] = useState(true);

  // Facebook specific states
  const [fbAccount, setFbAccount] = useState(null);
  const [fbLoading, setFbLoading] = useState(true);

  // Platform selection
  const [youtubeAccounts, setYoutubeAccounts] = useState([]);
  const [facebookAccounts, setFacebookAccounts] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState({}); // { 'youtube_account_id': true, 'facebook_page_id': true }

  // Ticker Theme
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const themes = [
    { id: "classic", name: "Classic Pro", color: "bg-blue-600" },
    { id: "modern", name: "Modern Dark", color: "bg-gray-800" },
    { id: "neon", name: "Neon Pulse", color: "bg-fuchsia-600" },
    {
      id: "premium",
      name: "Gold Premium",
      color: "bg-gradient-to-r from-primary to-primary",
    },
  ];

  // Form states
  const [generating, setGenerating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [officialSearch, setOfficialSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "Live cricket match broadcasted via Kridaz.",
    privacyStatus: "unlisted",
    resolution: "1080p",
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Official/Ground Management
  const [activeOfficialType, setActiveOfficialType] = useState(null); // 'SCORER', 'UMPIRE', 'STREAMER'
  const [groundSearch, setGroundSearch] = useState("");
  const [groundResults, setGroundResults] = useState([]);
  const [searchingGround, setSearchingGround] = useState(false);

  // Key masking
  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch match details
        const matchRes = await axiosInstance.get(
          `/api/hosted-game/find-by-id?id=${id}`
        );
        const matchData = matchRes.data.game;
        setMatch(matchData);
        setSelectedTheme(matchData.tickerTheme || "classic");

        setFormData((prev) => ({
          ...prev,
          title: `${matchData.teams?.teamA?.name || "TBD"} vs ${matchData.teams?.teamB?.name || "TBD"} - Kridaz Live`,
        }));

        // Fetch YouTube accounts
        await fetchYouTubeAccounts(true);

        // Fetch Facebook accounts
        await fetchFacebookAccounts(true);
      } catch (err) {
        toast.error("Failed to load configuration");
      } finally {
        setLoading(false);
        setChannelLoading(false);
        setFbLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleConnectYouTube = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:6001";
    const apiBase = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
    const authUrl = `${apiBase}/youtube/oauth/start?token=${token}`;
    const width = 600,
      height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      authUrl,
      "YouTube Auth",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  const handleConnectFacebook = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:6001";
    const apiBase = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
    const authUrl = `${apiBase}/facebook/oauth/start?token=${token}`;
    const width = 600,
      height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      authUrl,
      "Facebook Auth",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== window.location.origin) return;

      if (e.data?.type === "YOUTUBE_OAUTH_SUCCESS") {
        toast.success("YouTube account connected!");
        fetchYouTubeAccounts();
      }
      if (e.data?.type === "FACEBOOK_OAUTH_SUCCESS") {
        toast.success("Facebook page connected!");
        fetchFacebookAccounts();
      }
    };
    window.addEventListener("message", handleMessage);

    const handleStorage = (e) => {
      if (
        e.key === "youtube_oauth_status" &&
        e.newValue?.startsWith("success_")
      ) {
        toast.success("YouTube account connected!");
        fetchYouTubeAccounts();
        localStorage.removeItem("youtube_oauth_status");
      }
      if (
        e.key === "facebook_oauth_status" &&
        e.newValue?.startsWith("success_")
      ) {
        toast.success("Facebook page connected!");
        fetchFacebookAccounts();
        localStorage.removeItem("facebook_oauth_status");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const fetchFacebookAccounts = async (silent = false) => {
    if (!silent) setFbLoading(true);
    try {
      const fbRes = await axiosInstance.get("/api/facebook/accounts");
      setFacebookAccounts(fbRes.data || []);
      // Auto-select if it's the only one
      if (fbRes.data.length === 1) {
        setSelectedPlatforms((prev) => ({
          ...prev,
          [fbRes.data[0].accountId]: true,
        }));
      }
    } catch (err) {
      Sentry.addBreadcrumb({
        message: JSON.stringify(["Facebook account fetch error", err]),
      });
    } finally {
      if (!silent) setFbLoading(false);
    }
  };

  const fetchYouTubeAccounts = async (silent = false) => {
    if (!silent) setChannelLoading(true);
    try {
      const res = await axiosInstance.get("/api/youtube/accounts");
      setYoutubeAccounts(res.data || []);
      // Auto-select if it's the only one
      if (
        res.data.length === 1 &&
        Object.keys(selectedPlatforms).length === 0
      ) {
        setSelectedPlatforms((prev) => ({
          ...prev,
          [res.data[0].accountId]: true,
        }));
      }
    } catch (err) {
      Sentry.addBreadcrumb({
        message: JSON.stringify(["YouTube account fetch error", err]),
      });
    } finally {
      if (!silent) setChannelLoading(false);
    }
  };

  const handleRemoveAccount = async (platform, accountId) => {
    if (
      !confirm(`Are you sure you want to disconnect this ${platform} account?`)
    )
      return;
    try {
      await axiosInstance.delete(`/api/${platform}/account/${accountId}`);
      toast.success("Account disconnected");
      if (platform === "youtube") fetchYouTubeAccounts();
      if (platform === "facebook") fetchFacebookAccounts();
      setSelectedPlatforms((prev) => {
        const next = { ...prev };
        delete next[accountId];
        return next;
      });
    } catch (err) {
      toast.error("Failed to remove account");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleThemeChange = async (themeId) => {
    setSelectedTheme(themeId);
    try {
      await axiosInstance.post(`/api/hosted-game/update-ticker-theme/${id}`, {
        tickerTheme: themeId,
      });
      toast.success(`Theme updated to ${themeId}`);
    } catch (err) {
      toast.error("Failed to update theme");
    }
  };

  const handleSearchOfficials = async (val) => {
    setOfficialSearch(val);
    if (val.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axiosInstance.get(
        `/api/hosted-game/search-officials?query=${val}`
      );
      setSearchResults(res.data.officials || []);
    } catch (err) {
      Sentry.captureException(err);
    } finally {
      setSearching(false);
    }
  };

  const handleInviteOfficial = async (officialId, type) => {
    setInviting(true);
    try {
      await axiosInstance.post("/api/hosted-game/invite-official", {
        gameId: match._id,
        officialId,
        type,
      });
      toast.success(`${type} invitation sent!`);
      // Refresh match data
      const matchRes = await axiosInstance.get(
        `/api/hosted-game/find-by-id?id=${id}`
      );
      setMatch(matchRes.data.game);
      setOfficialSearch("");
      setSearchResults([]);
      setActiveOfficialType(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleSearchGrounds = async (val) => {
    setGroundSearch(val);
    if (val.length < 3) {
      setGroundResults([]);
      return;
    }
    setSearchingGround(true);
    try {
      const res = await axiosInstance.get(
        `/api/hosted-game/grounds?query=${val}`
      );
      setGroundResults(res.data.grounds || []);
    } catch (err) {
      Sentry.captureException(err);
    } finally {
      setSearchingGround(false);
    }
  };

  const handleUpdateVenue = async (groundId) => {
    try {
      await axiosInstance.post("/api/hosted-game/update-venue", {
        gameId: id,
        groundId,
      });
      toast.success("Match venue updated!");
      const matchRes = await axiosInstance.get(
        `/api/hosted-game/find-by-id?id=${id}`
      );
      setMatch(matchRes.data.game);
      setGroundSearch("");
      setGroundResults([]);
    } catch (err) {
      toast.error("Failed to update venue");
    }
  };

  const handleGenerateStream = async (e) => {
    e.preventDefault();
    const selectedAccountIds = Object.keys(selectedPlatforms).filter(
      (id) => selectedPlatforms[id]
    );

    if (selectedAccountIds.length === 0) {
      toast.error("Please select at least one account to stream.");
      return;
    }

    setGenerating(true);
    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("privacyStatus", formData.privacyStatus);
      submitData.append("resolution", formData.resolution);
      submitData.append("selectedAccounts", JSON.stringify(selectedAccountIds));
      if (thumbnailFile) {
        submitData.append("thumbnail", thumbnailFile);
      }

      const res = await axiosInstance.post(
        `/api/youtube/stream/create?matchId=${id}`,
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        toast.success("Stream(s) generated successfully!");
        setMatch((prev) => ({
          ...prev,
          ...res.data.streamConfig,
          isLive: true,
        }));

        if (window.opener) {
          window.opener.postMessage(
            {
              type: "STREAM_KEYS_READY",
              matchId: id,
            },
            window.location.origin
          );
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate stream");
    } finally {
      setGenerating(false);
    }
  };

  const handleEndStream = async () => {
    if (!confirm("Are you sure you want to end this broadcast?")) return;

    setEnding(true);
    try {
      const res = await axiosInstance.post(`/api/youtube/stream/end/${id}`);
      if (res.data.success) {
        toast.success("Broadcast ended successfully!");
        setMatch((prev) => ({
          ...prev,
          isLive: false,
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to end broadcast");
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <RefreshCw className="animate-spin text-violet-500 mb-4" size={32} />
        <p className="text-white font-bold uppercase tracking-widest text-xs">
          Loading Settings...
        </p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
          Match Not Found
        </h2>
        <GlobalBackButton />
      </div>
    );
  }

  const isStreamActive =
    match.isLive && (match.youtubeStreamKey || match.facebookStreamKey);
  const overlayUrl = `${window.location.origin}/live-overlay/${id}?token=${match.overlayToken || ""}`;
  const scoreboardUrl = `${window.location.origin}/analytics/${id}`;

  const isOfficialsApproved =
    (match.umpireRequest?.status === "APPROVED" || match.umpire) &&
    (match.scorerRequest?.status === "APPROVED" || match.scorer) &&
    match.ground;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-fade-in custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <GlobalBackButton />
              <span className="px-3 py-1 bg-violet-500/10 text-violet-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                Match ID: {match.shortId}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none flex items-center gap-4">
              <Globe className="text-blue-500" size={48} />
              Multi-Platform <span className="text-violet-500">Live</span>
            </h1>
          </div>

          {!isOfficialsApproved && (
            <div className="px-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-[8px] flex items-center gap-4 animate-pulse">
              <AlertCircle className="text-amber-500" size={24} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
                  Requirements Missing
                </p>
                <p className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-primary/70 to-primary/70 font-bold uppercase tracking-tight">
                  Venue, Umpire & Scorer are required to stream.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Connection Status Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* YouTube Accounts */}
          <div className="bg-background border border-white/10 rounded-[8px] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Youtube className="text-red-500" size={24} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  YouTube Channels
                </h3>
              </div>
              <Button
                onClick={handleConnectYouTube}
                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:bg-red-500/20 transition-all"
              >
                Connect New
              </Button>
            </div>

            <div className="space-y-3">
              {youtubeAccounts.length === 0 ? (
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center py-4">
                  No channels connected
                </p>
              ) : (
                youtubeAccounts.map((acc) => (
                  <div
                    key={acc.accountId}
                    className={`flex items-center justify-between p-3 rounded-[8px] border transition-all ${selectedPlatforms[acc.accountId] ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        type="checkbox"
                        checked={!!selectedPlatforms[acc.accountId]}
                        onChange={(e) =>
                          setSelectedPlatforms({
                            ...selectedPlatforms,
                            [acc.accountId]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-white/10 bg-white/5 accent-red-500"
                      />
                      <img
                        src={
                          acc.thumbnail ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${acc.accountId}`
                        }
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                      <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">
                        {acc.accountName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2 hidden sm:block">
                        <p className="text-[9px] font-black text-gray-500 uppercase">
                          {acc.metadata?.statistics?.subscriberCount || 0} Subs
                        </p>
                        <p className="text-[8px] font-bold text-green-500 uppercase">
                          Active
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          handleRemoveAccount("youtube", acc.accountId)
                        }
                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <RefreshCw size={12} className="rotate-45" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Facebook Accounts */}
          <div className="bg-background border border-white/10 rounded-[8px] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Facebook className="text-blue-500" size={24} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  Facebook Pages
                </h3>
              </div>
              <Button
                onClick={handleConnectFacebook}
                className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:bg-blue-500/20 transition-all"
              >
                Connect New
              </Button>
            </div>

            <div className="space-y-3">
              {facebookAccounts.length === 0 ? (
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center py-4">
                  No pages connected
                </p>
              ) : (
                facebookAccounts.map((acc) => (
                  <div
                    key={acc.accountId}
                    className={`flex items-center justify-between p-3 rounded-[8px] border transition-all ${selectedPlatforms[acc.accountId] ? "bg-blue-500/10 border-blue-500/20" : "bg-white/5 border-white/10"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        type="checkbox"
                        checked={!!selectedPlatforms[acc.accountId]}
                        onChange={(e) =>
                          setSelectedPlatforms({
                            ...selectedPlatforms,
                            [acc.accountId]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-white/10 bg-white/5 accent-blue-500"
                      />
                      <img
                        src={
                          acc.thumbnail ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${acc.accountId}`
                        }
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                      <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">
                        {acc.accountName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2 hidden sm:block">
                        <p className="text-[9px] font-black text-gray-500 uppercase">
                          {acc.metadata?.fan_count ||
                            acc.metadata?.follower_count ||
                            0}{" "}
                          Followers
                        </p>
                        <p className="text-[8px] font-bold text-blue-500 uppercase">
                          Linked
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          handleRemoveAccount("facebook", acc.accountId)
                        }
                        className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <RefreshCw size={12} className="rotate-45" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Create Stream Form */}
          <div className="space-y-8">
            <div className="bg-background border border-white/5 rounded-[8px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                <Video className="text-violet-500" size={24} /> 1. Configure
                Broadcast
              </h2>

              <form onSubmit={handleGenerateStream} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">
                    Stream Title
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    disabled={isStreamActive}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-[8px] px-6 text-xs font-bold tracking-widest text-white focus:border-violet-500/50 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">
                    Description
                  </label>
                  <Textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={isStreamActive}
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] p-6 text-xs font-bold tracking-widest text-white focus:border-violet-500/50 outline-none transition-all resize-none disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">
                      Privacy
                    </label>
                    <Select
                      value={formData.privacyStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          privacyStatus: e.target.value,
                        })
                      }
                      disabled={isStreamActive}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-[8px] px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-violet-500/50 outline-none transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">
                      Quality
                    </label>
                    <Select
                      value={formData.resolution}
                      onChange={(e) =>
                        setFormData({ ...formData, resolution: e.target.value })
                      }
                      disabled={isStreamActive}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-[8px] px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-violet-500/50 outline-none transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">
                    Thumbnail (1280x720)
                  </label>
                  <div
                    onClick={() =>
                      !isStreamActive && fileInputRef.current?.click()
                    }
                    className={`w-full h-32 bg-white/5 border border-dashed border-white/20 rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden ${isStreamActive ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <ImageIcon className="text-gray-500 mb-2" size={24} />
                        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                          Click to upload image
                        </span>
                      </>
                    )}
                  </div>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="pt-4">
                  {!isStreamActive ? (
                    <Button
                      type="submit"
                      disabled={generating || !isOfficialsApproved}
                      className="w-full h-14 bg-violet-500 text-white font-black uppercase text-xs tracking-widest rounded-[8px] shadow-[0_10px_30px_rgba(139,92,246,0.2)] hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generating ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <MonitorPlay size={16} />
                      )}
                      {generating ? "Generating..." : "Generate Multi-Stream"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleEndStream}
                      disabled={ending}
                      className="w-full h-14 bg-red-500/20 text-red-500 border border-red-500/30 font-black uppercase text-xs tracking-widest rounded-[8px] hover:bg-red-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {ending ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <MonitorPlay size={16} />
                      )}
                      {ending ? "Ending..." : "End Broadcast"}
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Ticker Theme Selection */}
            <div className="bg-background border border-white/5 rounded-[8px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Layout className="text-violet-500" size={24} /> 2. Ticker
                  Theme
                </div>
                <Button
                  type="button"
                  onClick={() => navigate(`/streamer/ticker-gallery/${id}`)}
                  className="px-4 py-2 bg-violet-500/10 text-violet-500 border border-violet-500/20 text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:bg-violet-500/20 transition-all flex items-center gap-2"
                >
                  <Palette size={14} /> Browse Gallery
                </Button>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {themes.map((theme) => (
                  <Button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`relative p-4 rounded-[8px] border-2 transition-all flex flex-col items-center justify-center gap-2 ${selectedTheme === theme.id ? "border-violet-500 bg-violet-500/10" : "border-white/5 bg-white/5 hover:border-white/20"}`}
                  >
                    <div
                      className={`w-12 h-2 rounded-full ${theme.color} shadow-lg`}
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">
                      {theme.name}
                    </p>
                    {selectedTheme === theme.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Keys and URLs */}
          <div className="space-y-6">
            <div className="bg-background border border-white/5 rounded-[8px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                <Key className="text-violet-500" size={24} /> 3. Encoder Setup
              </h2>

              {!isStreamActive ? (
                <div className="h-48 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-[8px] bg-white/5">
                  <AlertCircle className="text-gray-500 mb-3" size={32} />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest px-8">
                    Create a stream first to generate your RTMP URL and Stream
                    Key.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* YouTube Keys */}
                  {match.broadcasts?.some((b) => b.platform === "youtube") &&
                    match.broadcasts
                      .filter((b) => b.platform === "youtube")
                      .map((b, idx) => (
                        <div key={idx} className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-4 flex items-center gap-2">
                            <Youtube size={12} /> YouTube Broadcast {idx + 1}
                          </p>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                              RTMP Server URL
                              <Button
                                onClick={() =>
                                  copyToClipboard(b.rtmpUrl, "YouTube RTMP URL")
                                }
                                className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                              >
                                <Copy size={12} /> Copy
                              </Button>
                            </label>
                            <div className="w-full bg-black border border-white/10 rounded-[8px] p-4 text-xs font-mono text-gray-300 break-all">
                              {b.rtmpUrl}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                              Stream Key
                              <div className="flex gap-4">
                                <Button
                                  onClick={() => setShowKey(!showKey)}
                                  className="text-gray-400 hover:text-white flex items-center gap-1"
                                >
                                  {showKey ? (
                                    <>
                                      <EyeOff size={12} /> Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye size={12} /> Reveal
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    copyToClipboard(
                                      b.streamKey,
                                      "YouTube Stream Key"
                                    )
                                  }
                                  className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                                >
                                  <Copy size={12} /> Copy
                                </Button>
                              </div>
                            </label>
                            <div className="w-full bg-black border border-white/10 rounded-[8px] p-4 text-xs font-mono text-gray-300 tracking-widest">
                              {showKey
                                ? b.streamKey
                                : "••••••••••••••••••••••••••••"}
                            </div>
                          </div>
                        </div>
                      ))}

                  {/* Facebook Keys */}
                  {match.broadcasts?.some((b) => b.platform === "facebook") &&
                    match.broadcasts
                      .filter((b) => b.platform === "facebook")
                      .map((b, idx) => (
                        <div
                          key={idx}
                          className="space-y-4 pt-6 border-t border-white/5"
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-4 flex items-center gap-2">
                            <Facebook size={12} /> Facebook Broadcast {idx + 1}
                          </p>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                              RTMP Server URL
                              <Button
                                onClick={() =>
                                  copyToClipboard(
                                    b.rtmpUrl,
                                    "Facebook RTMP URL"
                                  )
                                }
                                className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                              >
                                <Copy size={12} /> Copy
                              </Button>
                            </label>
                            <div className="w-full bg-black border border-white/10 rounded-[8px] p-4 text-xs font-mono text-gray-300 break-all">
                              {b.rtmpUrl}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                              Stream Key
                              <div className="flex gap-4">
                                <Button
                                  onClick={() => setShowKey(!showKey)}
                                  className="text-gray-400 hover:text-white flex items-center gap-1"
                                >
                                  {showKey ? (
                                    <>
                                      <EyeOff size={12} /> Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye size={12} /> Reveal
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    copyToClipboard(
                                      b.streamKey,
                                      "Facebook Stream Key"
                                    )
                                  }
                                  className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                                >
                                  <Copy size={12} /> Copy
                                </Button>
                              </div>
                            </label>
                            <div className="w-full bg-black border border-white/10 rounded-[8px] p-4 text-xs font-mono text-gray-300 tracking-widest">
                              {showKey
                                ? b.streamKey
                                : "••••••••••••••••••••••••••••"}
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              )}
            </div>

            {/* Manage Officials & Venue */}
            <div className="bg-background border border-white/5 rounded-[8px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                <Shield className="text-violet-500" size={24} /> 4. Match
                Personnel & Venue
              </h2>

              <div className="space-y-6">
                {/* Venue Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">
                    MATCH VENUE (GROUND)
                  </p>
                  {match.ground ? (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-[8px] border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                          <Globe size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">
                            {match.ground.name}
                          </p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase">
                            {match.ground.city}, {match.ground.state}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setGroundSearch(" ")}
                        className="text-violet-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search
                        className="absolute left-4 top-4 text-gray-500"
                        size={16}
                      />
                      <Input
                        type="text"
                        placeholder="SEARCH & ASSIGN GROUND..."
                        value={groundSearch}
                        onChange={(e) => handleSearchGrounds(e.target.value)}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-[8px] pl-12 pr-4 text-xs font-bold tracking-widest text-white focus:border-violet-500/50 outline-none uppercase"
                      />
                      {searchingGround && (
                        <RefreshCw
                          className="absolute right-4 top-4 animate-spin text-violet-500"
                          size={14}
                        />
                      )}
                    </div>
                  )}
                  {groundResults.length > 0 && (
                    <div className="bg-card border border-white/10 rounded-[8px] overflow-hidden divide-y divide-white/5 mt-2">
                      {groundResults.map((ground) => (
                        <div
                          key={ground._id}
                          onClick={() => handleUpdateVenue(ground._id)}
                          className="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-all"
                        >
                          <div>
                            <p className="text-xs font-bold text-white uppercase">
                              {ground.name}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase">
                              {ground.city}, {ground.state}
                            </p>
                          </div>
                          <CheckCircle2 size={14} className="text-gray-700" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Role Icons Map */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  {/* Scorer */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center">
                      Scorer
                    </p>
                    <div className="relative group">
                      <div
                        className={`w-full aspect-square rounded-[8px] border-2 flex flex-col items-center justify-center gap-2 transition-all ${match.scorer || match.scorerRequest?.status === "APPROVED" ? "border-green-500/50 bg-green-500/5" : "border-white/5 bg-white/5"}`}
                      >
                        {match.scorer?.profilePicture ||
                        match.scorerRequest?.user?.profilePicture ? (
                          <img
                            src={
                              match.scorer?.profilePicture ||
                              match.scorerRequest?.user?.profilePicture
                            }
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <MonitorPlay size={24} className="text-gray-600" />
                        )}
                        <p className="text-[10px] font-black uppercase text-center px-2 truncate w-full">
                          {match.scorer?.name ||
                            match.scorerRequest?.user?.name ||
                            "Vacant"}
                        </p>
                        {!match.scorer &&
                          match.scorerRequest?.status !== "APPROVED" && (
                            <Button
                              onClick={() => setActiveOfficialType("SCORER")}
                              className="absolute inset-0 bg-violet-500/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-opacity rounded-[8px]"
                            >
                              Assign
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Umpire */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center">
                      Umpire
                    </p>
                    <div className="relative group">
                      <div
                        className={`w-full aspect-square rounded-[8px] border-2 flex flex-col items-center justify-center gap-2 transition-all ${match.umpire || match.umpireRequest?.status === "APPROVED" ? "border-green-500/50 bg-green-500/5" : "border-white/5 bg-white/5"}`}
                      >
                        {match.umpire?.profilePicture ||
                        match.umpireRequest?.user?.profilePicture ? (
                          <img
                            src={
                              match.umpire?.profilePicture ||
                              match.umpireRequest?.user?.profilePicture
                            }
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <Shield size={24} className="text-gray-600" />
                        )}
                        <p className="text-[10px] font-black uppercase text-center px-2 truncate w-full">
                          {match.umpire?.name ||
                            match.umpireRequest?.user?.name ||
                            "Vacant"}
                        </p>
                        {!match.umpire &&
                          match.umpireRequest?.status !== "APPROVED" && (
                            <Button
                              onClick={() => setActiveOfficialType("UMPIRE")}
                              className="absolute inset-0 bg-violet-500/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-opacity rounded-[8px]"
                            >
                              Assign
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Streamer */}
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center">
                      Streamer
                    </p>
                    <div className="relative group">
                      <div
                        className={`w-full aspect-square rounded-[8px] border-2 flex flex-col items-center justify-center gap-2 transition-all ${match.streamer || match.streamerRequest?.status === "APPROVED" ? "border-blue-500/50 bg-blue-500/5" : "border-white/5 bg-white/5"}`}
                      >
                        {match.streamer?.profilePicture ||
                        match.streamerRequest?.user?.profilePicture ? (
                          <img
                            src={
                              match.streamer?.profilePicture ||
                              match.streamerRequest?.user?.profilePicture
                            }
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <Video size={24} className="text-gray-600" />
                        )}
                        <p className="text-[10px] font-black uppercase text-center px-2 truncate w-full">
                          {match.streamer?.name ||
                            match.streamerRequest?.user?.name ||
                            "Host"}
                        </p>
                        {!match.streamer &&
                          match.streamerRequest?.status !== "APPROVED" && (
                            <Button
                              onClick={() => setActiveOfficialType("STREAMER")}
                              className="absolute inset-0 bg-blue-500/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-opacity rounded-[8px]"
                            >
                              Invite
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Search Overlay */}
                {activeOfficialType && (
                  <div className="pt-4 border-t border-white/5 animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">
                        Hire {activeOfficialType}
                      </p>
                      <Button
                        onClick={() => {
                          setActiveOfficialType(null);
                          setOfficialSearch("");
                          setSearchResults([]);
                        }}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="relative">
                      <Search
                        className="absolute left-4 top-4 text-gray-500"
                        size={16}
                      />
                      <Input
                        type="text"
                        autoFocus
                        placeholder={`SEARCH FOR ${activeOfficialType} BY NAME...`}
                        value={officialSearch}
                        onChange={(e) => handleSearchOfficials(e.target.value)}
                        className="w-full h-14 bg-white/5 border border-violet-500/30 rounded-[8px] pl-12 pr-4 text-xs font-bold tracking-widest text-white focus:border-violet-500 outline-none uppercase"
                      />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="bg-card border border-white/10 rounded-[8px] overflow-hidden divide-y divide-white/5 mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            onClick={() =>
                              handleInviteOfficial(user._id, activeOfficialType)
                            }
                            className="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  user.profilePicture ||
                                  `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                                }
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="text-[10px] font-bold text-white uppercase">
                                  {user.name}
                                </p>
                                <p className="text-[8px] text-gray-500 uppercase">
                                  @{user.username || user.email?.split("@")[0]}
                                </p>
                              </div>
                            </div>
                            <Button className="px-3 py-1 bg-violet-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              Invite
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Overlays */}
            <div className="bg-background border border-white/5 rounded-[8px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                <Layers className="text-violet-500" size={24} /> 5. Overlays
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                    OBS Browser Source (Score Overlay)
                    <Button
                      onClick={() => copyToClipboard(overlayUrl, "Overlay URL")}
                      className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <Copy size={12} /> Copy
                    </Button>
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-[8px] p-4 text-xs font-mono text-gray-400 truncate">
                    {overlayUrl}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                    Viewer Match Analytics URL
                    <Button
                      onClick={() =>
                        copyToClipboard(scoreboardUrl, "Match Analytics URL")
                      }
                      className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <Copy size={12} /> Copy
                    </Button>
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-[8px] p-4 text-xs font-mono text-gray-400 truncate">
                    {scoreboardUrl}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
