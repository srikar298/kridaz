import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Save,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Play,
  Layout,
  X,
  ChevronDown,
  Zap,
  ShieldCheck,
  Globe,
  DollarSign,
  Building,
  Search,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

const ALL_SPORTS = [
  "Cricket",
  "Football",
  "Badminton",
  "Tennis",
  "Table Tennis",
  "Basketball",
  "Volleyball",
  "Swimming",
  "Yoga",
  "Gym & Fitness",
  "Kabaddi",
  "Squash",
  "Athletics",
  "Boxing",
  "Chess",
  "Golf",
  "Hockey",
  "Martial Arts",
  "Skating",
  "Billiards",
  "Wrestling",
  "Archery",
  "Cycling",
  "Handball",
  "Rugby",
  "Padel",
  "Pickleball",
  "Karate",
  "Taekwondo",
  "MMA",
  "Crossfit",
  "Pilates",
  "Zumba",
  "Dance",
  "Shooting",
  "Fencing",
  "Baseball",
  "Softball",
  "Lacrosse",
  "Polo",
  "Snooker",
  "Pool",
  "Bowling",
  "E-Sports",
];

const ALL_LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Chinese",
  "Arabic",
  "Portuguese",
  "Russian",
];

const containsPhonePattern = (value) => {
  if (typeof value === "string") {
    if (
      value.startsWith("data:") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.length > 500
    )
      return false;
    if (/^[0-9a-fA-F]{24}$/.test(value)) return false;
    return /\d{9,}/.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsPhonePattern(item));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, val]) => {
      if (
        [
          "profilePicture",
          "bannerUrl",
          "phone",
          "image",
          "mediaUrl",
          "proofImage",
          "logo",
          "pinCode",
          "hourlyPrice",
          "price",
          "experience",
          "name",
          "username",
          "email",
          "dob",
          "id",
          "userId",
        ].includes(key)
      )
        return false;
      return containsPhonePattern(val);
    });
  }
  return false;
};

export default function ProfessionalProfile() {
  const { user, role } = useSelector((state) => state.auth);

  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = "#BFF367";
  const portalName = role?.toUpperCase() || "PROFESSIONAL";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
    hourlyPrice: 0,
    gameTypes: [],
    city: "",
    state: "",
    specialization: "",
    experience: "",
    certifications: [],
    gender: "",
    dob: "",
    address: "",
    pinCode: "",
    coachingLevel: "Beginner",
    availabilityTimings: "",
    availabilityMode: "Both",
    preferredLocations: { grounds: [], customLocations: [] },
    trainingTypes: [],
    ageGroups: [],
    languages: [],
    achievements: [],
    portfolio: [],
    // New fields
    profilePicture: "",
    bannerUrl: "",
    isOnline: false,
    instagram: "",
    linkedin: "",
    youtube: "",
    streamPlatforms: [],
    matchesCovered: "",
    camerasSupported: "",
    streamQuality: "1080p",
    liveScoringSupport: false,
    matchFormats: [],
    liveCommentarySupported: false,
    panelDiscussionEnabled: false,
    structuredAchievements: [],
  });

  // Supporting state for dynamic selectors
  const [grounds, setGrounds] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [locationTab, setLocationTab] = useState("grounds"); // 'grounds' or 'custom'
  const [groundSearch, setGroundSearch] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleTimeChange = (start, end) => {
    setStartTime(start);
    setEndTime(end);
    setFormData((prev) => ({
      ...prev,
      availabilityTimings: start && end ? `${start} - ${end}` : "",
    }));
  };

  const [newGameType, setNewGameType] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newAchievement, setNewAchievement] = useState("");
  const [newAchievementDesc, setNewAchievementDesc] = useState("");
  const [newAchievementTags, setNewAchievementTags] = useState("");
  const [newMatchFormat, setNewMatchFormat] = useState("");
  const [newCert, setNewCert] = useState({
    title: "",
    description: "",
    image: "",
  });
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: "",
    description: "",
    mediaType: "image",
    mediaUrl: "",
  });
  const [newStructuredAchievement, setNewStructuredAchievement] = useState({
    title: "",
    description: "",
  });

  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const [showLanguagesDropdown, setShowLanguagesDropdown] = useState(false);
  const [showEngagementDropdown, setShowEngagementDropdown] = useState(false);
  const [showProficiencyDropdown, setShowProficiencyDropdown] = useState(false);
  const [showPreferredDropdown, setShowPreferredDropdown] = useState(false);
  const [preferredMode, setPreferredMode] = useState("list"); // 'list' or 'search'
  const preferredDropdownRef = useRef(null);

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  // Custom location search inside preferred dropdown
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [customSearchResults, setCustomSearchResults] = useState([]);
  const [customSearching, setCustomSearching] = useState(false);
  const [customSearchTimer, setCustomSearchTimer] = useState(null);
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationSearchTimer, setLocationSearchTimer] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchGrounds();
    fetchStates();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        preferredDropdownRef.current &&
        !preferredDropdownRef.current.contains(event.target)
      ) {
        setShowPreferredDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const res = await axiosInstance.get("/api/professional/profile");
      const prof = res.data.professional;

      const preferred = prof.businessDetails?.preferredLocations || {
        grounds: [],
        customLocations: [],
      };

      setFormData({
        name: prof.user?.name || prof.name || "",
        username: prof.user?.username || "",
        email: prof.user?.email || "",
        phone: prof.user?.phone || "",
        bio: prof.bio || "",
        hourlyPrice: prof.price || 0,
        gameTypes: prof.user?.sportTypes || prof.gameTypes || [],
        city: prof.user?.city || prof.city || "",
        state: prof.user?.state || prof.state || "",
        specialization:
          prof.specialization || prof.businessDetails?.specialization || "",
        experience: prof.experience || prof.businessDetails?.experience || "",
        certifications: (prof.certifications || []).map((cert) => {
          if (typeof cert === "string") {
            try {
              return JSON.parse(cert);
            } catch {
              return { title: cert, description: "", image: null };
            }
          }
          return cert;
        }),
        gender: prof.gender || "",
        dob: prof.dob ? new Date(prof.dob).toISOString().split("T")[0] : "",
        address: prof.businessDetails?.address || "",
        pinCode: prof.businessDetails?.pinCode || "",
        coachingLevel: prof.coachingLevel || "Beginner",
        availabilityTimings:
          prof.businessDetails?.availabilityTimings ||
          prof.availabilityTimings ||
          "",
        availabilityMode:
          prof.businessDetails?.availabilityMode ||
          prof.availabilityMode ||
          "Both",
        preferredLocations: preferred,
        trainingTypes: prof.trainingTypes || [],
        ageGroups: prof.ageGroups || [],
        languages: prof.languages
          ? prof.languages.split(", ").filter((l) => l)
          : [],
        achievements: prof.achievements
          ? prof.achievements.split("\n").filter((a) => a)
          : [],
        portfolio: prof.portfolio || [],
        // New columns
        profilePicture: prof.user?.profilePicture || "",
        bannerUrl: prof.bannerUrl || "",
        isOnline: prof.isOnline || false,
        instagram: prof.instagram || "",
        linkedin: prof.linkedin || "",
        youtube: prof.youtube || "",
        streamPlatforms: prof.streamPlatforms || [],
        matchesCovered: prof.matchesCovered || "",
        camerasSupported:
          prof.camerasSupported !== null && prof.camerasSupported !== undefined
            ? String(prof.camerasSupported)
            : "",
        streamQuality: prof.streamQuality || "1080p",
        liveScoringSupport: prof.liveScoringSupport || false,
        matchFormats: prof.matchFormats || [],
        liveCommentarySupported: prof.liveCommentarySupported || false,
        panelDiscussionEnabled: prof.panelDiscussionEnabled || false,
        structuredAchievements: prof.structuredAchievements || [],
      });

      const timings =
        prof.businessDetails?.availabilityTimings ||
        prof.availabilityTimings ||
        "";
      if (timings && timings.includes(" - ")) {
        const [start, end] = timings.split(" - ");
        setStartTime(start || "");
        setEndTime(end || "");
      } else {
        setStartTime("");
        setEndTime("");
      }
    } catch (error) {
      console.error("Error fetching professional profile:", error);
      toast.error("Failed to load profile data.");
    } finally {
      setFetching(false);
    }
  };

  const fetchGrounds = async () => {
    try {
      const res = await axiosInstance.get("/api/user/turf/all");
      setGrounds(res.data.turfs || res.data || []);
    } catch (err) {
      console.error("Error fetching grounds:", err);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await axiosInstance.get("/api/location/states");
      setStates(res.data.states || res.data || []);
    } catch (err) {
      console.error("Error fetching states:", err);
    }
  };

  const handleStateChange = async (stateName) => {
    setSelectedState(stateName);
    setSelectedCity("");
    if (!stateName) {
      setCities([]);
      return;
    }
    try {
      const res = await axiosInstance.get(
        `/api/location/cities?state=${stateName}`
      );
      setCities(res.data.cities || res.data || []);
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  // Nominatim location search with debounce
  const handleLocationSearch = (query) => {
    if (locationSearchTimer) clearTimeout(locationSearchTimer);
    if (!query || query.length < 3) {
      setLocationResults([]);
      setShowLocationResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLocationSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setLocationResults(data);
        setShowLocationResults(true);
      } catch (err) {
        console.error("Location search error:", err);
      } finally {
        setLocationSearching(false);
      }
    }, 400);
    setLocationSearchTimer(timer);
  };

  const handleCustomLocationSearch = (query) => {
    if (customSearchTimer) clearTimeout(customSearchTimer);
    if (!query || query.length < 3) {
      setCustomSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setCustomSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&featuretype=settlement&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setCustomSearchResults(data);
      } catch (err) {
        console.error("Custom location search error:", err);
      } finally {
        setCustomSearching(false);
      }
    }, 400);
    setCustomSearchTimer(timer);
  };

  const addSearchedCustomLocation = (result) => {
    const addr = result.address || {};
    const stateName = addr.state || "";
    const cityName =
      addr.city || addr.town || addr.village || addr.county || "";

    if (!stateName || !cityName) {
      toast.error(
        "Could not resolve State and City. Try a more specific city search."
      );
      return;
    }

    const currentLocs = formData.preferredLocations?.customLocations || [];
    const stateObj = currentLocs.find((item) => item.state === stateName);
    let updated;

    if (stateObj) {
      if (stateObj.cities.includes(cityName)) {
        toast.error("City already added");
        return;
      }
      updated = currentLocs.map((item) => {
        if (item.state === stateName) {
          return { ...item, cities: [...item.cities, cityName] };
        }
        return item;
      });
    } else {
      updated = [...currentLocs, { state: stateName, cities: [cityName] }];
    }

    setFormData({
      ...formData,
      preferredLocations: {
        ...formData.preferredLocations,
        customLocations: updated,
      },
    });
    setCustomSearchQuery("");
    setCustomSearchResults([]);
    toast.success(`Linked ${cityName}, ${stateName}`);
  };

  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Detecting location...", { id: "gps" });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          if (data && data.address) {
            addSearchedCustomLocation(data);
            toast.success("Location detected & linked!", { id: "gps" });
          } else {
            toast.error("Could not resolve location address.", { id: "gps" });
          }
        } catch (err) {
          console.error("GPS resolution error:", err);
          toast.error("Failed to resolve GPS coordinates.", { id: "gps" });
        }
      },
      (error) => {
        console.error("GPS error:", error);
        toast.error("Permission denied or GPS error.", { id: "gps" });
      }
    );
  };

  const selectLocation = (result) => {
    const addr = result.address || {};
    setFormData({
      ...formData,
      city: addr.city || addr.town || addr.village || addr.county || "",
      state: addr.state || "",
      address: result.display_name || "",
      pinCode: addr.postcode || "",
    });
    setLocationSearchQuery(result.display_name || "");
    setShowLocationResults(false);
    setLocationResults([]);
  };

  // Toggle selection of platform listed grounds
  const toggleGroundSelection = (groundId) => {
    const currentGrounds = formData.preferredLocations?.grounds || [];
    let updated;
    if (currentGrounds.includes(groundId)) {
      updated = currentGrounds.filter((id) => id !== groundId);
    } else {
      updated = [...currentGrounds, groundId];
    }

    setFormData({
      ...formData,
      preferredLocations: {
        ...formData.preferredLocations,
        grounds: updated,
      },
    });
  };

  // Add custom locations state-city combos
  const addCustomLocation = () => {
    if (!selectedState || !selectedCity) {
      toast.error("Please select both State and City");
      return;
    }

    const currentLocs = formData.preferredLocations?.customLocations || [];
    const stateObj = currentLocs.find((item) => item.state === selectedState);
    let updated;

    if (stateObj) {
      if (stateObj.cities.includes(selectedCity)) {
        toast.error("City already added under this State");
        return;
      }
      updated = currentLocs.map((item) => {
        if (item.state === selectedState) {
          return { ...item, cities: [...item.cities, selectedCity] };
        }
        return item;
      });
    } else {
      updated = [
        ...currentLocs,
        { state: selectedState, cities: [selectedCity] },
      ];
    }

    setFormData({
      ...formData,
      preferredLocations: {
        ...formData.preferredLocations,
        customLocations: updated,
      },
    });
    setSelectedCity("");
    toast.success("Service location registered");
  };

  // Remove specific city from custom locations map
  const removeCustomCity = (stateName, cityName) => {
    const currentLocs = formData.preferredLocations?.customLocations || [];
    const updated = currentLocs
      .map((item) => {
        if (item.state === stateName) {
          return { ...item, cities: item.cities.filter((c) => c !== cityName) };
        }
        return item;
      })
      .filter((item) => item.cities.length > 0);

    setFormData({
      ...formData,
      preferredLocations: {
        ...formData.preferredLocations,
        customLocations: updated,
      },
    });
  };

  const handleUpdate = async () => {
    if (containsPhonePattern(formData)) {
      toast.error(
        "Sharing phone numbers or sequences of 9+ digits is prohibited."
      );
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...formData,
        languages: formData.languages.join(", "),
        achievements: formData.achievements.join("\n"),
      };
      await axiosInstance.put("/api/professional/update-profile", payload);
      toast.success("Professional Profile Updated Successfully!", {
        style: {
          background: "#000",
          color: "#fff",
          border: `1px solid ${themeColor}`,
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (containsPhonePattern(formData)) {
      toast.error(
        "Sharing phone numbers or sequences of 9+ digits is prohibited."
      );
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handleUpdate();
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const jumpToStep = (step) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  const addGameType = (sport = newGameType) => {
    if (containsPhonePattern(sport)) {
      toast.error("Sequences of 9+ digits are not allowed.");
      return;
    }
    if (sport && !formData.gameTypes.includes(sport)) {
      setFormData({ ...formData, gameTypes: [...formData.gameTypes, sport] });
      setNewGameType("");
      setShowSportsDropdown(false);
    }
  };

  const removeGameType = (type) => {
    setFormData({
      ...formData,
      gameTypes: formData.gameTypes.filter((t) => t !== type),
    });
  };

  const addLanguage = (lang = newLanguage) => {
    if (containsPhonePattern(lang)) {
      toast.error("Sequences of 5+ digits are not allowed.");
      return;
    }
    if (lang && !formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
      setNewLanguage("");
      setShowLanguagesDropdown(false);
    }
  };

  const removeLanguage = (lang) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l) => l !== lang),
    });
  };

  const addMatchFormat = (formatVal = newMatchFormat) => {
    const trimmed = formatVal.trim();
    if (containsPhonePattern(trimmed)) {
      toast.error("Sequences of 9+ digits are not allowed.");
      return;
    }
    if (trimmed && !formData.matchFormats?.includes(trimmed)) {
      setFormData({
        ...formData,
        matchFormats: [...(formData.matchFormats || []), trimmed],
      });
      setNewMatchFormat("");
    }
  };

  const removeMatchFormat = (formatVal) => {
    setFormData({
      ...formData,
      matchFormats: (formData.matchFormats || []).filter(
        (f) => f !== formatVal
      ),
    });
  };

  const addCertification = () => {
    if (containsPhonePattern(newCert)) {
      toast.error("Sequences of 9+ digits are not allowed.");
      return;
    }
    if (newCert.title) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...newCert }],
      });
      setNewCert({ title: "", description: "", image: "" });
      toast.success("Credential added");
    } else {
      toast.error("Title is mandatory");
    }
  };

  const removeCertification = (index) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    });
  };

  const handleCertImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be below 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCert({ ...newCert, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Avatar size must be below 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Banner size must be below 4MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, bannerUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addStructuredAchievement = () => {
    if (containsPhonePattern(newStructuredAchievement)) {
      toast.error("Sequences of 9+ digits are not allowed.");
      return;
    }
    if (newStructuredAchievement.title) {
      setFormData({
        ...formData,
        structuredAchievements: [
          ...(formData.structuredAchievements || []),
          { ...newStructuredAchievement },
        ],
      });
      setNewStructuredAchievement({ title: "", description: "" });
      toast.success("Achievement logged successfully");
    } else {
      toast.error("Achievement title is mandatory");
    }
  };

  const removeStructuredAchievement = (index) => {
    setFormData({
      ...formData,
      structuredAchievements: (formData.structuredAchievements || []).filter(
        (_, i) => i !== index
      ),
    });
  };

  const addAchievement = () => {
    const title = newAchievement.trim();
    const desc = newAchievementDesc.trim();
    const tags = newAchievementTags.trim();
    if (
      containsPhonePattern(title) ||
      containsPhonePattern(desc) ||
      containsPhonePattern(tags)
    ) {
      toast.error("Sequences of 9+ digits are not allowed.");
      return;
    }
    if (title) {
      const formatted = `${title}|${desc}|${tags}`;
      if (!formData.achievements.includes(formatted)) {
        setFormData({
          ...formData,
          achievements: [...formData.achievements, formatted],
        });
      }
      setNewAchievement("");
      setNewAchievementDesc("");
      setNewAchievementTags("");
    } else {
      toast.error("Service Title is mandatory");
    }
  };

  const removeAchievement = (ach) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter((a) => a !== ach),
    });
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title && newPortfolioItem.mediaUrl) {
      setFormData({
        ...formData,
        portfolio: [...formData.portfolio, { ...newPortfolioItem }],
      });
      setNewPortfolioItem({
        title: "",
        description: "",
        mediaType: "image",
        mediaUrl: "",
      });
      toast.success("Work showcased");
    } else {
      toast.error("Title and media are mandatory");
    }
  };

  const removePortfolioItem = (index) => {
    setFormData({
      ...formData,
      portfolio: formData.portfolio.filter((_, i) => i !== index),
    });
  };

  const handlePortfolioMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Media size must be below 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPortfolioItem({ ...newPortfolioItem, mediaUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleArrayItem = (field, item) => {
    const current = [...formData[field]];
    if (current.includes(item)) {
      setFormData({ ...formData, [field]: current.filter((i) => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...current, item] });
    }
  };

  const filteredSports = ALL_SPORTS.filter(
    (s) =>
      (!newGameType || s.toLowerCase().includes(newGameType.toLowerCase())) &&
      !formData.gameTypes.includes(s)
  );

  const filteredLanguages = ALL_LANGUAGES.filter(
    (l) =>
      (!newLanguage || l.toLowerCase().includes(newLanguage.toLowerCase())) &&
      !formData.languages.includes(l)
  );

  const filteredGrounds = grounds.filter(
    (g) =>
      !groundSearch ||
      g.name.toLowerCase().includes(groundSearch.toLowerCase()) ||
      g.city.toLowerCase().includes(groundSearch.toLowerCase())
  );

  if (fetching)
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-[#BFF367]" size={48} />
      </div>
    );

  const StepIndicator = () => (
    <div className="flex items-center gap-4 mb-6 overflow-x-auto no-scrollbar pb-1">
      {[1, 2, 3].map((step) => (
        <button
          key={step}
          onClick={() => jumpToStep(step)}
          className="flex items-center gap-3 group text-left outline-none shrink-0"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black transition-all duration-300 ${
              currentStep === step
                ? `text-black`
                : currentStep > step
                  ? "bg-white/5 border border-white/5"
                  : "bg-black border border-white/5 text-neutral-600 group-hover:border-white/10"
            }`}
            style={{
              backgroundColor:
                currentStep === step
                  ? themeColor
                  : currentStep > step
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
              color:
                currentStep === step
                  ? "#000"
                  : currentStep > step
                    ? themeColor
                    : "#444",
              boxShadow:
                currentStep === step ? `0 0 15px ${themeColor}33` : "none",
            }}
          >
            {currentStep > step ? <CheckCircle2 size={16} /> : `0${step}`}
          </div>
          <div className="hidden sm:block">
            <p
              className={`text-[7px] font-black uppercase tracking-[0.2em] transition-colors font-inter leading-none`}
              style={{ color: currentStep === step ? themeColor : "#444" }}
            >
              PHASE {step}
            </p>
            <p
              className={`text-[10px] font-black uppercase tracking-widest transition-colors font-inter mt-0.5 ${currentStep === step ? "text-white" : "text-neutral-700 group-hover:text-white/60"}`}
            >
              {step === 1
                ? "Profile Details"
                : step === 2
                  ? "Credentials"
                  : "Work Portfolio"}
            </p>
          </div>
          {step < 3 && <div className="w-6 h-[1px] bg-white/5" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in font-inter pb-20 h-full custom-scrollbar text-white px-0 md:px-4 py-6">
      {/* Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative z-10 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight font-['Open_Sans'] capitalize leading-none text-white">
              {portalName?.toLowerCase()} <span style={{ color: themeColor }}>Profile</span>
            </h1>
            <p className="text-[#878C9F] text-[9px] font-black tracking-[0.28em] font-inter mt-1 ml-0.5 opacity-60">
              Manage your professional presence and preferences
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-6 py-2.5 rounded-[6px] backdrop-blur-xl">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black"
              style={{ backgroundColor: themeColor }}
            >
              <Zap size={16} />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest leading-none">
                Completion
              </p>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${(currentStep / 3) * 100}%`,
                      backgroundColor: themeColor,
                    }}
                  />
                </div>
                <span className="text-[11px] font-black text-white">
                  {Math.round((currentStep / 3) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-6 py-3 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl font-bold"
            style={{
              backgroundColor: themeColor,
              boxShadow: `0 5px 15px ${themeColor}22`,
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      </header>

      <StepIndicator />

      <div className="w-full">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Core Identity */}
              <div className="lg:col-span-5 space-y-6">
                {/* Identity & Presence Card */}
                <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-4">
                  <h3 
                    className="text-[10px] font-black tracking-[0.3em] text-[#878C9F] flex items-center gap-2"
                    style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                  >
                    <User size={14} style={{ color: themeColor }} /> Identity &
                    presence
                  </h3>

                  <div className="space-y-4">
                    {/* Widescreen Banner / Cover Image */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Cover Banner Image
                      </label>
                      <div className="relative group/banner overflow-hidden rounded-lg border border-dashed border-white/10 bg-white/[0.02] h-28 flex items-center justify-center transition-colors hover:border-white/20">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {formData.bannerUrl ? (
                          <>
                            <img
                              src={formData.bannerUrl}
                              className="w-full h-full object-cover"
                              alt="Banner Preview"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white">
                              Change Cover Banner
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-neutral-600">
                            <ImageIcon size={20} />
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              Upload Cover Banner
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile Picture Avatar Selector & Online Toggle Row */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 pb-4 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="relative group/avatar w-14 h-14 rounded-full overflow-hidden border border-white/10 bg-white/[0.02] flex items-center justify-center shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePicUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          {formData.profilePicture ? (
                            <img
                              src={formData.profilePicture}
                              className="w-full h-full object-cover"
                              alt="Avatar"
                            />
                          ) : (
                            <User className="text-neutral-600" size={20} />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-[7px] font-bold uppercase tracking-wider text-white text-center leading-tight">
                            Change Avatar
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-wider leading-none">
                            Profile Picture
                          </p>
                          <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                            Upload Base64 Avatar File
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Full Name & Username */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Full Name
                        </label>
                        <div className="relative flex items-center">
                          <User
                            size={14}
                            className="absolute left-2.5 text-neutral-500"
                          />
                          <input
                            type="text"
                            placeholder="Your full name"
                            className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg pl-7 pr-2 py-2.5 text-[11px] sm:text-xs text-white outline-none focus:border-white/10 transition-colors font-medium"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] sm:text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Username
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-neutral-500 text-xs font-bold">
                            @
                          </span>
                          <input
                            type="text"
                            placeholder="username"
                            className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg pl-7 pr-2 py-2.5 text-[11px] sm:text-xs text-white outline-none focus:border-white/10 transition-colors font-medium"
                            value={formData.username}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                username: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9_]/g, ""),
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Email Address
                        </label>
                        <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-2.5 text-[10px] sm:text-xs text-neutral-400 font-medium overflow-hidden truncate">
                          <Mail
                            size={12}
                            className="text-neutral-600 shrink-0 sm:w-3.5 sm:h-3.5"
                          />
                          <span className="truncate">
                            {formData.email || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] sm:text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Phone
                        </label>
                        <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-lg px-2.5 py-2.5 text-[10px] sm:text-xs text-neutral-400 font-medium overflow-hidden truncate">
                          <Phone size={12} className="text-neutral-600 shrink-0 sm:w-3.5 sm:h-3.5" />
                          <span className="truncate">{formData.phone || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Editable Identity Sub-matrix */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div>
                        <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Gender
                        </label>
                        <select
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white/10 transition-colors font-medium"
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white/10 transition-colors font-medium uppercase font-mono"
                            value={formData.dob}
                            onChange={(e) =>
                              setFormData({ ...formData, dob: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Operational Headline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Scorer / Certified Coach"
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-white/10 transition-colors font-bold"
                        value={formData.specialization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specialization: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="pt-4">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Professional Bio Description
                      </label>
                      <textarea
                        rows="4"
                        placeholder="Describe your qualifications, history, and achievements..."
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-white/10 transition-colors font-medium resize-y break-words overflow-hidden"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                      />
                    </div>

                    {/* Personal Location (Single Search & Preview) */}
                    <div className="pt-4">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Personal Location
                      </label>
                      <div className="relative flex items-center">
                        <Search
                          size={14}
                          className="absolute left-3 text-neutral-500"
                        />
                        <input
                          type="text"
                          placeholder="Search city, area, or address..."
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg pl-8 pr-3 py-2.5 text-xs text-white outline-none focus:border-white/10 transition-colors font-medium"
                          value={locationSearchQuery}
                          onChange={(e) => {
                            setLocationSearchQuery(e.target.value);
                            handleLocationSearch(e.target.value);
                          }}
                          onFocus={() =>
                            locationResults.length > 0 &&
                            setShowLocationResults(true)
                          }
                        />
                        {locationSearching && (
                          <Loader2
                            size={14}
                            className="absolute right-3 text-neutral-500 animate-spin"
                          />
                        )}
                      </div>

                      {/* Search Results Dropdown */}
                      {showLocationResults && locationResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl max-h-52 overflow-y-auto z-[150] custom-scrollbar">
                          {locationResults.map((result, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => selectLocation(result)}
                              className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2"
                            >
                              <MapPin
                                size={12}
                                className="text-neutral-500 mt-0.5 shrink-0"
                              />
                              <span className="text-[11px] text-white/80 font-medium leading-snug">
                                {result.display_name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Location Preview */}
                    {(formData.city || formData.state) && (
                      <div className="flex flex-wrap items-center gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-lg mt-2">
                        <MapPin size={12} style={{ color: themeColor }} />
                        <span className="text-[11px] text-white font-bold">
                          {[
                            formData.address,
                            formData.city,
                            formData.state,
                            formData.pinCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              city: "",
                              state: "",
                              address: "",
                              pinCode: "",
                            });
                            setLocationSearchQuery("");
                          }}
                          className="ml-auto text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Social Media Links */}
                    <div className="pt-2 border-t border-white/5 space-y-2.5">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">
                        Social Media Connections
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="flex items-center bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white">
                          <span className="w-20 text-[8px] font-black text-neutral-500 uppercase tracking-wider">
                            Instagram
                          </span>
                          <input
                            type="text"
                            placeholder="https://instagram.com/yourprofile"
                            className="flex-1 bg-transparent border-0 outline-none text-xs text-white font-medium pl-2"
                            value={formData.instagram}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                instagram: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white">
                          <span className="w-20 text-[8px] font-black text-neutral-500 uppercase tracking-wider">
                            LinkedIn
                          </span>
                          <input
                            type="text"
                            placeholder="https://linkedin.com/in/yourprofile"
                            className="flex-1 bg-transparent border-0 outline-none text-xs text-white font-medium pl-2"
                            value={formData.linkedin}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                linkedin: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white">
                          <span className="w-20 text-[8px] font-black text-neutral-500 uppercase tracking-wider">
                            YouTube
                          </span>
                          <input
                            type="text"
                            placeholder="https://youtube.com/@yourchannel"
                            className="flex-1 bg-transparent border-0 outline-none text-xs text-white font-medium pl-2"
                            value={formData.youtube}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                youtube: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Matrix & Locations */}
              <div className="lg:col-span-7 space-y-6">
                {/* Professional Matrix & Engagement */}
                <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-6 shadow-2xl relative overflow-hidden">
                  <h3 
                    className="text-[10px] font-black tracking-[0.3em] text-[#878C9F] flex items-center gap-2"
                    style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                  >
                    <FileText size={14} style={{ color: themeColor }} />{" "}
                    Professional matrix
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Proficiency Level Dropdown */}
                    <div
                      className={`space-y-1.5 relative ${showProficiencyDropdown ? "z-[110]" : "z-auto"}`}
                    >
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Proficiency Level
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowProficiencyDropdown(!showProficiencyDropdown)
                          }
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-[8px] p-3 text-xs text-white focus:border-white/10 outline-none font-bold uppercase tracking-widest flex items-center justify-between"
                        >
                          <span>
                            {formData.coachingLevel === "Beginner"
                              ? "Junior Associate"
                              : formData.coachingLevel === "Intermediate"
                                ? "Mid-Tier Professional"
                                : formData.coachingLevel === "Elite"
                                  ? "Elite / Senior"
                                  : "Governing Body Certified"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${showProficiencyDropdown ? "rotate-180" : ""}`}
                          />
                        </button>

                        {showProficiencyDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-[8px] shadow-2xl z-[100] overflow-hidden">
                            {[
                              { label: "Junior Associate", value: "Beginner" },
                              {
                                label: "Mid-Tier Professional",
                                value: "Intermediate",
                              },
                              { label: "Elite / Senior", value: "Elite" },
                              {
                                label: "Governing Body Certified",
                                value: "National",
                              },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    coachingLevel: opt.value,
                                  });
                                  setShowProficiencyDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-[10px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-bold uppercase tracking-wider"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Engagement Mode Selector */}
                    <div
                      className={`space-y-1.5 relative ${showEngagementDropdown ? "z-[110]" : "z-auto"}`}
                    >
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Availability / Engagement Mode
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowEngagementDropdown(!showEngagementDropdown)
                          }
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-[8px] p-3 text-xs text-white outline-none font-bold uppercase tracking-widest transition-all flex items-center justify-between"
                        >
                          <span>
                            {formData.availabilityMode === "Both"
                              ? "Hybrid Mode (Online & Physical)"
                              : formData.availabilityMode === "Offline"
                                ? "Physical Presence Only"
                                : "Remote Services Only"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${showEngagementDropdown ? "rotate-180" : ""}`}
                          />
                        </button>

                        {showEngagementDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-[8px] shadow-2xl z-[100] overflow-hidden">
                            {[
                              {
                                label: "Physical Presence Only",
                                value: "Offline",
                              },
                              {
                                label: "Remote Services Only",
                                value: "Online",
                              },
                              { label: "Hybrid Mode (Both)", value: "Both" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    availabilityMode: opt.value,
                                  });
                                  setShowEngagementDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-[10px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-bold uppercase tracking-wider"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>{" "}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Tenure & Core Experience
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5+ Years officiating regional league tournaments"
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-[8px] p-3 text-xs text-white focus:border-white/10 outline-none font-bold transition-all"
                        value={formData.experience}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            experience: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* Per Hour Rate */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Per Hour Rate (₹)
                      </label>
                      <div className="relative">
                        <DollarSign
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                        />
                        <input
                          type="number"
                          min={300}
                          max={10000}
                          step={50}
                          placeholder="e.g. 800"
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-[8px] p-3 pl-9 text-xs text-white focus:border-white/10 outline-none font-bold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={formData.hourlyPrice || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (
                              e.target.value === "" ||
                              (val >= 0 && val <= 10000)
                            ) {
                              setFormData({
                                ...formData,
                                hourlyPrice: e.target.value === "" ? "" : val,
                              });
                            }
                          }}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val && val < 300)
                              setFormData({ ...formData, hourlyPrice: 300 });
                            if (val > 10000)
                              setFormData({ ...formData, hourlyPrice: 10000 });
                          }}
                        />
                      </div>
                      <p className="text-[8px] text-neutral-600 ml-0.5 tracking-wide">
                        Min ₹300 — Max ₹10,000
                      </p>
                    </div>
                    {/* Matches & Tournaments Covered */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Matches & Tournaments Covered
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 150+ Matches, 12 Leagues"
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-[8px] p-3 text-xs text-white focus:border-white/10 outline-none font-bold transition-all"
                        value={formData.matchesCovered}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            matchesCovered: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* Linguistics / Languages Dropdown with Multi-Selection */}
                    <div
                      className={`space-y-1.5 relative ${showLanguagesDropdown ? "z-[105]" : "z-auto"}`}
                    >
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Linguistics / Languages
                      </label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Search & Add Languages..."
                            className="flex-1 bg-[#1A1A1A] border border-[#222] rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:border-white/10 transition-all font-medium"
                            value={newLanguage}
                            onChange={(e) => {
                              setNewLanguage(e.target.value);
                              setShowLanguagesDropdown(true);
                            }}
                            onFocus={() => setShowLanguagesDropdown(true)}
                          />
                          <button
                            type="button"
                            onClick={() => addLanguage()}
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95"
                            style={{ backgroundColor: themeColor }}
                          >
                            <Plus size={18} color="#000" />
                          </button>
                        </div>

                        {showLanguagesDropdown &&
                          filteredLanguages.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-[8px] shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar">
                              {filteredLanguages.map((lang) => (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => addLanguage(lang)}
                                  className="w-full px-4 py-2.5 text-left text-[10px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-bold uppercase tracking-wider"
                                >
                                  {lang}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {formData.languages.map((lang) => (
                          <span
                            key={lang}
                            className="px-3 py-1.5 bg-white/[0.04] border border-white/5 rounded-[6px] text-[8px] font-black text-white flex items-center gap-2 uppercase tracking-widest"
                          >
                            {lang}
                            <button
                              type="button"
                              onClick={() => removeLanguage(lang)}
                              className="text-neutral-600 hover:text-red-500 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Domain Expertise */}
                    <div
                      className={`space-y-1.5 relative ${showSportsDropdown ? "z-[100]" : "z-auto"}`}
                    >
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Domain Expertise (Sports)
                      </label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Search & Add Sports..."
                            className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-white/10 transition-all font-medium"
                            value={newGameType}
                            onChange={(e) => {
                              setNewGameType(e.target.value);
                              setShowSportsDropdown(true);
                            }}
                            onFocus={() => setShowSportsDropdown(true)}
                          />
                          <button
                            type="button"
                            onClick={() => addGameType()}
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95"
                            style={{ backgroundColor: themeColor }}
                          >
                            <Plus size={18} color="#000" />
                          </button>
                        </div>

                        {showSportsDropdown && filteredSports.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-[8px] shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar">
                            {filteredSports.map((sport) => (
                              <button
                                key={sport}
                                type="button"
                                onClick={() => addGameType(sport)}
                                className="w-full px-4 py-2.5 text-left text-[10px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-black uppercase tracking-wider"
                              >
                                {sport}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {formData.gameTypes.map((type) => (
                          <span
                            key={type}
                            className="px-3 py-1.5 bg-white/[0.04] border border-white/5 rounded-[6px] text-[8px] font-black text-white flex items-center gap-2 uppercase tracking-widest"
                          >
                            {type}
                            <button
                              type="button"
                              onClick={() => removeGameType(type)}
                              className="text-neutral-600 hover:text-red-500 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Supported Match Formats */}
                    <div className="space-y-1.5 relative z-10">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider ml-0.5">
                        Supported Match Formats
                      </label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add Match Formats (e.g. T20, Box Cricket)..."
                            className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-white/10 transition-all font-medium"
                            value={newMatchFormat}
                            onChange={(e) => setNewMatchFormat(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addMatchFormat())
                            }
                          />
                          <button
                            type="button"
                            onClick={() => addMatchFormat()}
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95"
                            style={{ backgroundColor: themeColor }}
                          >
                            <Plus size={18} color="#000" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {(formData.matchFormats || []).map((fmt) => (
                          <span
                            key={fmt}
                            className="px-3 py-1.5 bg-white/[0.04] border border-white/5 rounded-[6px] text-[8px] font-black text-white flex items-center gap-2 uppercase tracking-widest"
                          >
                            {fmt}
                            <button
                              type="button"
                              onClick={() => removeMatchFormat(fmt)}
                              className="text-neutral-600 hover:text-red-500 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Role-conditioned streaming specs */}
                    {role?.toLowerCase().includes("streamer") && (
                      <div className="md:col-span-2 border-t border-white/5 pt-4 space-y-4">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[#BFF367]">
                          Streamer Specifications
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                              Max Stream Quality
                            </label>
                            <select
                              className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none"
                              value={formData.streamQuality}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  streamQuality: e.target.value,
                                })
                              }
                            >
                              <option value="720p">720p HD</option>
                              <option value="1080p">1080p Full HD</option>
                              <option value="4K">4K Ultra HD</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-[#878C9F] uppercase tracking-wider block mb-1">
                              Cameras Supported
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 3"
                              className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none"
                              value={formData.camerasSupported}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  camerasSupported: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#878C9F] uppercase tracking-wider block mb-1">
                            Stream Support Platforms
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "YouTube",
                              "Facebook Live",
                              "Twitch",
                              "Kick",
                              "Custom RTMP",
                            ].map((platform) => {
                              const isSelected =
                                formData.streamPlatforms?.includes(platform);
                              return (
                                <button
                                  key={platform}
                                  type="button"
                                  onClick={() => {
                                    const current =
                                      formData.streamPlatforms || [];
                                    const updated = current.includes(platform)
                                      ? current.filter((p) => p !== platform)
                                      : [...current, platform];
                                    setFormData({
                                      ...formData,
                                      streamPlatforms: updated,
                                    });
                                  }}
                                  className={`px-2.5 py-1.5 rounded border text-[9px] font-bold uppercase tracking-wider transition-colors ${isSelected ? "border-[#BFF367] bg-[#BFF367]/10 text-white font-black" : "border-white/5 bg-black/20 text-neutral-500 hover:text-white"}`}
                                >
                                  {platform}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Role-conditioned scoring specs */}
                    {(role?.toLowerCase().includes("scorer") ||
                      role?.toLowerCase().includes("umpire")) && (
                      <div className="md:col-span-2 border-t border-white/5 pt-4 space-y-3">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[#BFF367]">
                          Scoring Integration
                        </h4>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="peer appearance-none w-4 h-4 border border-white/10 rounded checked:bg-[#BFF367] checked:border-[#BFF367] cursor-pointer"
                            checked={formData.liveScoringSupport}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                liveScoringSupport: e.target.checked,
                              })
                            }
                          />
                          <span className="text-xs text-neutral-400 group-hover:text-white transition-colors uppercase tracking-wide font-bold">
                            Supports Live Scoring via Kridaz Scorer App
                          </span>
                        </label>
                      </div>
                    )}
                    {/* Role-conditioned commentator specs */}
                    {role?.toLowerCase().includes("commentator") && (
                      <div className="md:col-span-2 border-t border-white/5 pt-4 space-y-3">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-[#BFF367]">
                          Commentary Features
                        </h4>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="peer appearance-none w-4 h-4 border border-white/10 rounded checked:bg-[#BFF367] checked:border-[#BFF367] cursor-pointer"
                              checked={formData.liveCommentarySupported}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  liveCommentarySupported: e.target.checked,
                                })
                              }
                            />
                            <span className="text-xs text-neutral-400 group-hover:text-white transition-colors uppercase tracking-wide font-bold">
                              Live commentary supported
                            </span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="peer appearance-none w-4 h-4 border border-white/10 rounded checked:bg-[#BFF367] checked:border-[#BFF367] cursor-pointer"
                              checked={formData.panelDiscussionEnabled}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  panelDiscussionEnabled: e.target.checked,
                                })
                              }
                            />
                            <span className="text-xs text-neutral-400 group-hover:text-white transition-colors uppercase tracking-wide font-bold">
                              Panel discussion engagement enabled
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferred Locations & Timings Card */}
                <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-4 relative z-20">
                  <h3 
                    className="text-[10px] font-black tracking-[0.3em] text-[#878C9F] flex items-center gap-2"
                    style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                  >
                    <MapPin size={14} style={{ color: themeColor }} /> Preferred
                    locations & timings
                  </h3>

                  <div className="space-y-4">
                    {/* Preferred Locations (Multiple Selector) */}
                    <div className="relative" ref={preferredDropdownRef}>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Preferred Service Locations (Multiple)
                      </label>
                      <div
                        onClick={() =>
                          setShowPreferredDropdown(!showPreferredDropdown)
                        }
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg pl-3 pr-8 py-2.5 text-xs text-neutral-400 outline-none focus:border-white/10 transition-colors font-medium flex items-center justify-between cursor-pointer"
                      >
                        <span className="text-white font-semibold">
                          {(formData.preferredLocations?.grounds?.length || 0) +
                            (formData.preferredLocations?.customLocations?.reduce(
                              (acc, curr) => acc + curr.cities.length,
                              0
                            ) || 0) || 0}{" "}
                          Locations Selected
                        </span>
                        <ChevronDown size={14} className="text-neutral-500" />
                      </div>

                      {showPreferredDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl p-4 z-50 custom-scrollbar max-h-96 overflow-y-auto">
                          {preferredMode === "list" ? (
                            <div className="space-y-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#878C9F] flex items-center gap-1.5 leading-none">
                                <Building
                                  size={12}
                                  style={{ color: themeColor }}
                                />{" "}
                                Choose Venue/Ground
                              </p>

                              {/* Mini search inside dropdown for venues */}
                              <div
                                className="relative flex items-center mb-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Search
                                  size={12}
                                  className="absolute left-2.5 text-neutral-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Filter venues/grounds..."
                                  className="w-full bg-[#222] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-white/10 font-medium"
                                  value={groundSearch}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setGroundSearch(e.target.value);
                                  }}
                                />
                              </div>

                              <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                                {filteredGrounds.map((ground) => {
                                  const isSelected =
                                    formData.preferredLocations?.grounds?.includes(
                                      ground.id
                                    );
                                  return (
                                    <button
                                      key={ground.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroundSelection(ground.id);
                                      }}
                                      className={`w-full flex justify-between items-center px-3 py-2.5 text-left text-xs rounded hover:bg-white/[0.04] transition-colors ${isSelected ? "bg-white/[0.02]" : ""}`}
                                    >
                                      <div>
                                        <p className="font-bold text-white uppercase tracking-wide">
                                          {ground.name}
                                        </p>
                                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5">
                                          {ground.city}, {ground.state}
                                        </p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="peer appearance-none w-3.5 h-3.5 border border-white/20 rounded checked:bg-[#BFF367] checked:border-[#BFF367]"
                                        style={{
                                          backgroundColor: isSelected
                                            ? themeColor
                                            : "transparent",
                                          borderColor: isSelected
                                            ? themeColor
                                            : "rgba(255,255,255,0.2)",
                                        }}
                                      />
                                    </button>
                                  );
                                })}
                                {filteredGrounds.length === 0 && (
                                  <p className="text-[9px] font-medium text-neutral-600 italic px-3 py-1">
                                    No matching venues found.
                                  </p>
                                )}
                              </div>

                              {/* Special Search by Location Option */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreferredMode("search");
                                }}
                                className="w-full text-left px-3 py-3 text-[11px] font-black uppercase tracking-wider flex items-center gap-2 border-t border-white/5 mt-2 transition-colors hover:bg-white/[0.02]"
                                style={{ color: themeColor }}
                              >
                                <MapPin
                                  size={14}
                                  className="shrink-0"
                                  style={{ color: themeColor }}
                                />
                                Search by Location
                              </button>
                            </div>
                          ) : (
                            // Search Location mode
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#BFF367] flex items-center gap-1.5 leading-none">
                                  <MapPin size={12} /> Search Location
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreferredMode("list");
                                    setCustomSearchQuery("");
                                    setCustomSearchResults([]);
                                  }}
                                  className="text-neutral-500 hover:text-white transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  detectGPSLocation();
                                }}
                                className="w-full py-2 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 text-[#BFF367] transition-all"
                                style={{
                                  color: themeColor,
                                  borderColor: `${themeColor}22`,
                                }}
                              >
                                <MapPin size={12} /> Detect My GPS Location
                              </button>

                              <div
                                className="relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="relative flex items-center">
                                  <Search
                                    size={12}
                                    className="absolute left-2.5 text-neutral-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Search for a place, city, or area..."
                                    className="w-full bg-[#222] border border-[#333] rounded-lg pl-8 pr-8 py-2 text-xs text-white outline-none focus:border-white/10 font-medium"
                                    value={customSearchQuery}
                                    onChange={(e) => {
                                      setCustomSearchQuery(e.target.value);
                                      handleCustomLocationSearch(
                                        e.target.value
                                      );
                                    }}
                                  />
                                  {customSearching && (
                                    <Loader2
                                      size={12}
                                      className="absolute right-2.5 text-neutral-500 animate-spin"
                                    />
                                  )}
                                </div>

                                {/* Search Results for Custom Location */}
                                {customSearchResults.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-[60] custom-scrollbar">
                                    {customSearchResults.map((result, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                          addSearchedCustomLocation(result)
                                        }
                                        className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2"
                                      >
                                        <MapPin
                                          size={10}
                                          className="text-neutral-500 mt-0.5 shrink-0"
                                        />
                                        <span className="text-[10px] text-white/80 font-medium leading-snug">
                                          {result.display_name}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Preferred Locations List Chips */}
                    <div className="space-y-2 pt-1">
                      {/* Selected Grounds Chips */}
                      {formData.preferredLocations?.grounds?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">
                            Covered Platform Grounds
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {formData.preferredLocations.grounds.map(
                              (groundId) => {
                                const gObj = grounds.find(
                                  (g) => g.id === groundId
                                );
                                if (!gObj) return null;
                                return (
                                  <span
                                    key={groundId}
                                    className="px-2 py-1 bg-white/[0.03] border border-white/5 rounded text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5"
                                  >
                                    <Building
                                      size={10}
                                      className="text-neutral-500"
                                    />
                                    <span>{gObj.name}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleGroundSelection(groundId)
                                      }
                                      className="text-neutral-600 hover:text-red-400"
                                    >
                                      <X size={10} />
                                    </button>
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* Selected Custom Locations Chips */}
                      {formData.preferredLocations?.customLocations?.length >
                        0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">
                            Covered Custom Cities
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {formData.preferredLocations.customLocations.map(
                              (item, idx) =>
                                item.cities.map((cityName) => (
                                  <span
                                    key={`${item.state}-${cityName}`}
                                    className="px-2 py-1 bg-white/[0.03] border border-white/5 rounded text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5"
                                  >
                                    <Globe
                                      size={10}
                                      className="text-neutral-500"
                                    />
                                    <span>
                                      {cityName}, {item.state}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeCustomCity(item.state, cityName)
                                      }
                                      className="text-neutral-600 hover:text-red-400"
                                    >
                                      <X size={10} />
                                    </button>
                                  </span>
                                ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Twin Time Selectors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-white/10 transition-colors font-medium"
                          value={startTime}
                          onChange={(e) =>
                            handleTimeChange(e.target.value, endTime)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-white/10 transition-colors font-medium"
                          value={endTime}
                          onChange={(e) =>
                            handleTimeChange(startTime, e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services Provided */}
                <div className="bg-[#111111] border border-white/5 rounded-xl p-6 space-y-6 relative overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-black"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 
                        className="text-[10px] font-black tracking-[0.3em] text-neutral-500"
                        style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                      >
                        Professional services
                      </h3>
                      <p className="text-white text-[14px] font-black uppercase tracking-tight font-['Open_Sans']">
                        Services Offered / Provided
                      </p>
                    </div>
                  </div>

                  {/* Service Creator Form */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-5 space-y-4">
                    <h4
                      className="text-[9px] font-black uppercase tracking-[0.2em] mb-1"
                      style={{ color: themeColor }}
                    >
                      Configure New Service
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                          Service Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Live Scoring, Coach, Commentator"
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-[11px] text-white focus:border-white/10 outline-none font-bold transition-all"
                          value={newAchievement}
                          onChange={(e) => setNewAchievement(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                          Tags / Specialties (Comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. T20, Box Cricket, Junior Training"
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-[11px] text-white focus:border-white/10 outline-none font-bold transition-all"
                          value={newAchievementTags}
                          onChange={(e) =>
                            setNewAchievementTags(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                          Service Description / Scope
                        </label>
                        <textarea
                          rows="2"
                          placeholder="Detail the deliverables, match coverage scope, or specific details of this service..."
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-[11px] text-white focus:border-white/10 outline-none font-medium transition-all resize-none"
                          value={newAchievementDesc}
                          onChange={(e) =>
                            setNewAchievementDesc(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={addAchievement}
                        className="px-6 h-10 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 hover:brightness-110 font-bold"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Plus size={16} /> Add Service Offered
                      </button>
                    </div>
                  </div>

                  {/* Display Grid */}
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600 border-b border-white/5 pb-2">
                      Active Services Directory
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.achievements.map((ach, idx) => {
                        const parts = ach.split("|");
                        const hasPipe = parts.length > 1;
                        const title = hasPipe ? parts[0] : ach;
                        const description = hasPipe ? parts[1] : "";
                        const tagsStr = hasPipe ? parts[2] : "";
                        const tags = tagsStr
                          ? tagsStr
                              .split(",")
                              .filter(Boolean)
                              .map((t) => t.trim())
                          : [];

                        return (
                          <div
                            key={idx}
                            className="flex flex-col justify-between p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl group/item transition-all duration-300 relative overflow-hidden hover:translate-y-[-2px] shadow-lg"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: themeColor }}
                                  />
                                  <h4 className="text-[11px] font-black text-white uppercase tracking-wider line-clamp-1">
                                    {title}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAchievement(ach)}
                                  className="text-neutral-600 hover:text-red-500 transition-colors shrink-0 p-1 rounded-md hover:bg-white/5"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              {description && (
                                <p className="text-[10px] text-neutral-400 font-medium leading-relaxed line-clamp-3">
                                  {description}
                                </p>
                              )}
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {tags.map((tag, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="px-2 py-0.5 rounded-md text-[7px] font-bold text-white uppercase tracking-wider transition-transform hover:scale-105"
                                      style={{
                                        color: themeColor,
                                        borderColor: `${themeColor}22`,
                                        backgroundColor: `${themeColor}08`,
                                        border: "1px solid",
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {formData.achievements.length === 0 && (
                        <div className="col-span-full py-16 bg-white/[0.01] rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center space-y-3">
                          <Award size={36} className="text-neutral-800" />
                          <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.5em] text-center">
                            No services currently published
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-5 h-10 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-neutral-400 active:scale-95"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-8 h-10 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:brightness-110"
                style={{ backgroundColor: themeColor, color: "#000" }}
              >
                {currentStep === 3 ? (
                  <>
                    <CheckCircle2 size={14} /> Finalize Profile
                  </>
                ) : (
                  <>
                    <Zap size={14} /> Next Phase (PHASE {currentStep + 1}){" "}
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Add Certification */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-black"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 
                        className="text-[9px] font-black tracking-[0.3em] text-neutral-500"
                        style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                      >
                        Verification
                      </h3>
                      <p className="text-white text-[12px] font-black uppercase tracking-tight">
                        Add Credential
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                        Credential Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ICC Certified Umpire"
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3.5 text-[11px] text-white focus:border-white/10 outline-none font-bold transition-all"
                        value={newCert.title}
                        onChange={(e) =>
                          setNewCert({ ...newCert, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                        Description / Scope
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Add validating description..."
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3.5 text-[11px] text-white focus:border-white/10 outline-none font-bold transition-all resize-none"
                        value={newCert.description}
                        onChange={(e) =>
                          setNewCert({
                            ...newCert,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                        Digital Proof Image
                      </label>
                      <div className="relative group/upload">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCertImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div
                          className={`w-full h-36 border border-dashed rounded-[8px] flex flex-col items-center justify-center gap-3 transition-all ${newCert.image ? "border-white/20 bg-white/5" : "border-white/5 bg-white/[0.02] group-hover/upload:border-white/10"}`}
                        >
                          {newCert.image ? (
                            <img
                              src={newCert.image}
                              className="w-full h-full object-contain p-2"
                              alt="Preview"
                            />
                          ) : (
                            <>
                              <ImageIcon
                                size={24}
                                className="text-neutral-900"
                              />
                              <span className="text-[8px] font-black text-neutral-800 uppercase tracking-widest">
                                Link Identity Proof
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={addCertification}
                      className="w-full h-12 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Plus size={16} /> Integrate credential
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Credentials List */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-6 min-h-[500px] relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                    <h3 
                      className="text-[10px] font-black tracking-[0.3em] text-white flex items-center gap-3"
                      style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                    >
                      <ShieldCheck size={16} style={{ color: themeColor }} />{" "}
                      Verified stack
                    </h3>
                    <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
                      {formData.certifications.length} Credentials
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10">
                    {formData.certifications.map((cert, idx) => (
                      <div
                        key={idx}
                        className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden group/item transition-all hover:border-white/10"
                      >
                        <div className="h-24 bg-white/[0.02] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                          {cert.image ? (
                            <img
                              src={cert.image}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                              alt={cert.title}
                            />
                          ) : (
                            <Award size={24} className="text-neutral-900" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button
                              onClick={() => removeCertification(idx)}
                              className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">
                            {cert.title}
                          </h4>
                          <p className="text-[9px] text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                            {cert.description || "Pending validation."}
                          </p>
                        </div>
                      </div>
                    ))}

                    {formData.certifications.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center space-y-4 bg-white/[0.01] rounded-lg border border-dashed border-white/5">
                        <ShieldCheck size={32} className="text-neutral-900" />
                        <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.5em]">
                          No credentials verified yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Achievements Section */}
            <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-6 relative overflow-hidden mt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-4">
                <div>
                  <h3 
                    className="text-lg font-black text-white tracking-widest flex items-center gap-3"
                    style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                  >
                    <Trophy size={20} style={{ color: themeColor }} /> Career
                    achievements
                  </h3>
                  <p className="text-[8px] text-neutral-500 font-bold tracking-[0.28em] font-inter mt-1">
                    Log your verified career awards, titles, and milestones with
                    rich details
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[450px]">
                  <input
                    type="text"
                    placeholder="Achievement Title (e.g. Best Scorer 2025)"
                    className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-lg px-4 py-2.5 text-xs text-white outline-none font-bold"
                    value={newStructuredAchievement.title}
                    onChange={(e) =>
                      setNewStructuredAchievement({
                        ...newStructuredAchievement,
                        title: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Brief description / scope"
                    className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-lg px-4 py-2.5 text-xs text-white outline-none"
                    value={newStructuredAchievement.description}
                    onChange={(e) =>
                      setNewStructuredAchievement({
                        ...newStructuredAchievement,
                        description: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={addStructuredAchievement}
                    className="w-10 h-10 rounded-lg shadow-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 mx-auto sm:mx-0"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Plus size={20} color="#000" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(formData.structuredAchievements || []).map((ach, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white/[0.02] border border-white/5 rounded-lg flex items-start justify-between hover:border-white/10 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Trophy
                          size={14}
                          style={{ color: themeColor }}
                          className="shrink-0"
                        />
                        <h4 className="text-[11px] font-black text-white uppercase tracking-tight">
                          {ach.title}
                        </h4>
                      </div>
                      <p className="text-[9px] text-neutral-500 font-medium leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeStructuredAchievement(idx)}
                      className="text-neutral-700 hover:text-red-500 transition-colors shrink-0 ml-2"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {(!formData.structuredAchievements ||
                  formData.structuredAchievements.length === 0) && (
                  <div className="col-span-full py-10 bg-white/[0.01] rounded-lg border border-dashed border-white/5 flex flex-col items-center justify-center space-y-2">
                    <Trophy size={24} className="text-neutral-800" />
                    <p className="text-[8px] text-neutral-500 font-black tracking-[0.5em]">
                      No career achievements logged yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Adjusted Navigation */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
              <button
                onClick={prevStep}
                className="px-5 h-10 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-neutral-400 active:scale-95"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={nextStep}
                className="px-8 h-10 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:brightness-110"
                style={{ backgroundColor: themeColor, color: "#000" }}
              >
                <Zap size={14} /> Next Phase (PHASE 3){" "}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gallery Form */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-black"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Layout size={20} />
                    </div>
                    <div>
                      <h3 
                        className="text-[9px] font-black tracking-[0.3em] text-neutral-500"
                        style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                      >
                        Portfolio
                      </h3>
                      <p className="text-white text-[12px] font-black uppercase tracking-tight">
                        Live Gallery
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex bg-black p-1 rounded-lg border border-white/5">
                      <button
                        onClick={() =>
                          setNewPortfolioItem({
                            ...newPortfolioItem,
                            mediaType: "image",
                            mediaUrl: "",
                          })
                        }
                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${newPortfolioItem.mediaType === "image" ? "text-black" : "text-neutral-500"}`}
                        style={{
                          backgroundColor:
                            newPortfolioItem.mediaType === "image"
                              ? themeColor
                              : "transparent",
                        }}
                      >
                        Photos
                      </button>
                      <button
                        onClick={() =>
                          setNewPortfolioItem({
                            ...newPortfolioItem,
                            mediaType: "video",
                            mediaUrl: "",
                          })
                        }
                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${newPortfolioItem.mediaType === "video" ? "text-black" : "text-neutral-500"}`}
                        style={{
                          backgroundColor:
                            newPortfolioItem.mediaType === "video"
                              ? themeColor
                              : "transparent",
                        }}
                      >
                        Videos
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                        Project Title Scope
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Local Premier League"
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3.5 text-[11px] text-white outline-none font-bold transition-all"
                        value={newPortfolioItem.title}
                        onChange={(e) =>
                          setNewPortfolioItem({
                            ...newPortfolioItem,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                        Brief details
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Add brief role info..."
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3.5 text-[11px] text-white outline-none font-bold transition-all resize-none"
                        value={newPortfolioItem.description}
                        onChange={(e) =>
                          setNewPortfolioItem({
                            ...newPortfolioItem,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    {newPortfolioItem.mediaType === "video" && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                          YouTube Video URL
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. https://www.youtube.com/watch?v=..."
                          className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-[11px] text-white outline-none font-bold transition-all focus:border-white/10"
                          value={
                            newPortfolioItem.mediaUrl &&
                            (newPortfolioItem.mediaUrl.includes(
                              "youtube.com"
                            ) ||
                              newPortfolioItem.mediaUrl.includes("youtu.be"))
                              ? newPortfolioItem.mediaUrl
                              : ""
                          }
                          onChange={(e) =>
                            setNewPortfolioItem({
                              ...newPortfolioItem,
                              mediaUrl: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    {newPortfolioItem.mediaType === "image" && (
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">
                          Upload Asset
                        </label>
                        <div className="relative group/upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePortfolioMediaUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div
                            className={`w-full h-36 border border-dashed rounded-[8px] flex flex-col items-center justify-center gap-3 transition-all ${newPortfolioItem.mediaUrl ? "border-white/20 bg-white/5" : "border-white/5 bg-white/[0.02] group-hover/upload:border-white/10"}`}
                          >
                            {newPortfolioItem.mediaUrl ? (
                              <img
                                src={newPortfolioItem.mediaUrl}
                                className="w-full h-full object-contain p-2"
                                alt="Preview"
                              />
                            ) : (
                              <>
                                <ImageIcon
                                  size={24}
                                  className="text-neutral-900"
                                />
                                <span className="text-[8px] font-black text-neutral-800 uppercase tracking-widest">
                                  Select Visual Asset
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={addPortfolioItem}
                      className="w-full h-12 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Plus size={16} /> Integrate portfolio
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Exhibition Gallery */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-[#111111] border border-white/5 rounded-xl p-5 space-y-6 min-h-[500px] relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                    <h3 
                      className="text-[10px] font-black tracking-[0.3em] text-white flex items-center gap-3"
                      style={{ fontFamily: "'Open Sans', sans-serif", textTransform: 'none' }}
                    >
                      <Layout size={16} style={{ color: themeColor }} />{" "}
                      Exhibition showcase
                    </h3>
                    <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
                      {formData.portfolio?.length || 0} Assets Linked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10">
                    {formData.portfolio?.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden group/item transition-all hover:border-white/10"
                      >
                        <div className="h-28 bg-[#111] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                          {item.mediaType === "image" ? (
                            <img
                              src={item.mediaUrl}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                              alt={item.title}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center gap-2">
                              <Play size={20} style={{ color: themeColor }} />
                              <span className="text-[7px] font-black text-neutral-700 uppercase tracking-[0.3em]">
                                Motion Media
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button
                              onClick={() => removePortfolioItem(idx)}
                              className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-[9px] text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                            {item.description || "No description."}
                          </p>
                        </div>
                      </div>
                    ))}

                    {(!formData.portfolio ||
                      formData.portfolio.length === 0) && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center space-y-4 bg-white/[0.01] rounded-lg border border-dashed border-white/5">
                        <Layout size={32} className="text-neutral-900" />
                        <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.5em]">
                          No showcase items loaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Adjusted Navigation */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
              <button
                onClick={prevStep}
                className="px-5 h-10 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-neutral-400 active:scale-95"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-8 h-10 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:brightness-110 font-bold"
                style={{ backgroundColor: themeColor, color: "#000" }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}{" "}
                Finalize Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
