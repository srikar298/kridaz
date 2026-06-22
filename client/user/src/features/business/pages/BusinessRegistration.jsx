// Business Registration Page for Professional Upgrades
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance.js";
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Briefcase,
  ShieldAlert,
  Loader2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { searchLocations } from "@user/utils/locationService";import { Button, Input } from "@kridaz/ui";


const PRI = "var(--primary)";

export default function BusinessRegistration({ defaultRole }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") || defaultRole || "venu_owners";

  const { user, isLoggedIn } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const [formData, setFormData] = useState({
    role: roleFromUrl,
    businessDetails: {
      businessName: "",
    },
  });

  const [files, setFiles] = useState({
    PAN: null,
    AADHAR: null,
  });

  const isOwner =
    formData.role === "venu_owners" ||
    formData.role === "venue_owners" ||
    formData.role === "venue";

  const handleFileChange = (type, file) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
  };

  const [hasRoleConflict, setHasRoleConflict] = useState(false);
  const [existingRole, setExistingRole] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      // Allow unauthenticated users to view the form, but they will be intercepted on interaction
      return;
    }

    // Sync user data to formData when it becomes available
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }

    // Check for pending application status from Redux state
    if (user?.applicationStatus === "pending") {
      setIsPending(true);
      setPendingRole(user.applicationRole || roleFromUrl);
    }

    // Check if user already has a professional role
    const professionalRoles = [
      "venu_owners",
      "venue_owners",
      "venue",
      "coach",
      "umpire",
      "streamer",
      "admin",
      "bmsp_admin",
      "scorer",
    ];
    const isLimitedUmpire = user?.role?.toLowerCase() === "limited_umpire";
    const isLimitedScorer = user?.role?.toLowerCase() === "limited_scorer";

    // limited_umpire is only a conflict if they aren't applying for umpire upgrade
    if (
      user?.role &&
      (professionalRoles.includes(user.role.toLowerCase()) ||
        (isLimitedUmpire && roleFromUrl !== "umpire") ||
        (isLimitedScorer && roleFromUrl !== "scorer"))
    ) {
      setHasRoleConflict(true);
      setExistingRole(user.role);
    }
  }, [isLoggedIn, navigate, roleFromUrl, user]);

  // Debounced search for location suggestions
  useEffect(() => {
    const address = formData.businessDetails.address;
    const timer = setTimeout(async () => {
      if (address && address.length >= 3) {
        setIsSearching(true);
        const results = await searchLocations(address);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.businessDetails.address]);

  const handleSuggestionSelect = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        address: suggestion.display_name,
        city: suggestion.city || prev.businessDetails.city,
        state: suggestion.state || prev.businessDetails.state,
        zipCode: suggestion.postcode || prev.businessDetails.zipCode,
      },
    }));
    setShowSuggestions(false);
  };

  const requiredDocs = [
    { key: "PAN", label: "PAN Card" },
    { key: "AADHAR", label: "Aadhaar Card" },
  ];

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please login first to register your business");
      navigate(
        "/login?redirect=" +
          encodeURIComponent("/business/register?role=" + roleFromUrl)
      );
      return;
    }

    if (hasRoleConflict) {
      toast.error("Role conflict detected. Please contact support.");
      return;
    }
    if (isPending) {
      toast.error("You already have a pending application.");
      return;
    }
    if (!formData.businessDetails.businessName) {
      toast.error("Please fill in Business Name");
      return;
    }

    // Check all required documents are uploaded
    for (const doc of requiredDocs) {
      const file = files[doc.key];
      const isEmpty = !file || (Array.isArray(file) && file.length === 0);
      if (isEmpty) {
        toast.error(`Please upload: ${doc.label}`);
        return;
      }
    }

    setShowAgreementModal(true);
    setIsAgreed(false);
  };

  const processSubmission = async () => {
    setShowAgreementModal(false);
    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", user?.name || "");
      data.append("email", user?.email || "");
      data.append("phone", user?.phone || "");
      data.append("role", formData.role);
      data.append("businessDetails", JSON.stringify(formData.businessDetails));

      // Append all selected documents
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          if (Array.isArray(files[key])) {
            files[key].forEach((file, index) => {
              data.append("documents", file, `${key}_${index}_${file.name}`);
            });
          } else {
            data.append("documents", files[key], `${key}_${files[key].name}`);
          }
        }
      });

      const response = await axiosInstance.post(
        "/api/user/auth/upgrade-request",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast.success("Application submitted successfully!");
        setSubmitted(true);
      } else {
        toast.error(
          response.data.message || "Submission failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Submission Error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to submit application. Check your connection.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Role Conflict ───
  if (hasRoleConflict && existingRole) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 p-12 rounded-[8px] border border-border bg-background relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary" />
          <div className="w-16 h-16 bg-gradient-to-r from-primary/10 to-primary/10 rounded-[8px] flex items-center justify-center mx-auto mb-6">
            <ShieldAlert
              size={40}
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary"
            />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Role{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
              Conflict
            </span>
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Your account already holds the{" "}
            <span className="text-white capitalize font-semibold">
              {existingRole}
            </span>{" "}
            role. Kridaz supports only one professional role per account.
          </p>
          <Button
            onClick={() => {
              if (existingRole?.toLowerCase() === "coach")
                navigate("/professional/coach");
              else if (existingRole?.toLowerCase() === "umpire")
                navigate("/umpire");
              else if (existingRole?.toLowerCase() === "scorer")
                navigate("/scorer");
              else if (existingRole?.toLowerCase() === "streamer")
                navigate("/streamer");
              else if (
                ["venu_owners", "venue_owners", "venue"].includes(
                  existingRole?.toLowerCase()
                )
              )
                navigate("/venue-owner");
              else if (
                ["admin", "bmsp_admin"].includes(existingRole?.toLowerCase())
              )
                navigate("/admin");
              else navigate("/");
            }}
            className="w-full py-4 rounded-[8px] border border-border hover:border-primary/30 hover:text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary transition-all font-normal uppercase tracking-widest text-[12px]"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ─── Application pending review ───
  if (isPending || submitted) {
    const displayRole = submitted ? formData.role : pendingRole;

    // Format the role for display
    let formattedRole = displayRole;
    if (
      displayRole === "venu_owners" ||
      displayRole === "venue_owners" ||
      displayRole === "venue"
    ) {
      formattedRole = "Venue Partner";
    } else {
      // Capitalize first letter if it's something else
      formattedRole = displayRole
        ? displayRole.charAt(0).toUpperCase() + displayRole.slice(1)
        : "";
    }

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 pt-20">
        <div className="max-w-md w-full text-center space-y-6 p-8 md:p-10 rounded-[8px] border border-border bg-background relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary" />
          <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/15 rounded-[12px] flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Clock size={32} className="text-primary animate-pulse" />
          </div>
          <h2
            className="text-3xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Application{" "}
            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              Pending
            </span>
          </h2>
          <p
            className="text-gray-400 leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px" }}
          >
            Thank you for applying to be a{" "}
            <span className="text-white font-semibold">{formattedRole}</span>.
            Our admin team is reviewing your registration details and documents.
          </p>
          <div className="bg-background rounded-[8px] p-4 text-[12px] text-left space-y-4 border border-border">
            <div className="flex items-center gap-3 text-gray-300">
              <CheckCircle2 size={18} className="text-primary" />
              <span>Application Received</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-[18px] h-[18px] border-2 border-primary/30 border-t-[var(--primary)] rounded-full animate-spin" />
              <span>Document Verification In-Progress</span>
            </div>
            <div className="flex items-center gap-3 text-white/20">
              <div className="w-[18px] h-[18px] border-2 border-border rounded-full" />
              <span>Final Approval &amp; Access</span>
            </div>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="w-full py-4 mt-2 rounded-[8px] border border-border hover:border-primary/30 hover:text-primary transition-all font-normal uppercase tracking-widest text-[12px]"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-10 pb-20 font-sans selection:bg-primary selection:text-black">
      <div className="w-full px-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 relative">
          <div className="space-y-10">
            <div>
              <h1
                className="text-4xl md:text-5xl font-black uppercase leading-none mb-4 tracking-tight"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Professional{" "}
                <span className="bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text">
                  Registration.
                </span>
              </h1>
              <p
                className="text-gray-400 text-[20px]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Submit your business documents for verification and access the
                Kridaz dashboard.
              </p>
            </div>

            {/* Role conflict banner removed as it's now handled by the early return view */}

            <div className="relative">
              {!isLoggedIn && (
                <div
                  className="absolute inset-0 z-50 cursor-pointer"
                  onClick={() => {
                    toast.error("Please login first to register your business");
                    navigate(
                      "/login?redirect=" +
                        encodeURIComponent(
                          "/business/register?role=" + roleFromUrl
                        )
                    );
                  }}
                  title="Click to login and continue"
                />
              )}
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="p-6 rounded-[8px] border border-border bg-background space-y-6 relative overflow-hidden">
                  <h3
                    className="text-lg font-black uppercase tracking-widest flex items-center gap-3"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    <Building2 className="text-primary w-5 h-5" />{" "}
                    <span className="bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text">
                      Business Details
                    </span>
                  </h3>

                  <div className="space-y-2 group">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="businessDetails.businessName"
                      value={formData.businessDetails.businessName}
                      onChange={handleChange}
                      placeholder="e.g. Dream Sports Arena"
                      className="w-full bg-[#0a0a0c] border border-border focus:border-primary/50 rounded-[6px] h-12 px-4 text-white text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-[8px] border border-border bg-background space-y-6 relative overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <h3
                      className="text-lg font-black uppercase tracking-widest flex items-center gap-3"
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      <FileText className="text-primary w-5 h-5" />{" "}
                      <span className="bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text">
                        Document Uploads
                      </span>
                    </h3>
                    <p
                      className="text-[12px] text-gray-500 tracking-wide mt-1"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Accepted formats: JPG, PNG, PDF &nbsp;&bull;&nbsp;{" "}
                      <span className="text-primary">
                        Max file size: 10MB
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <DocumentSection
                      title="PAN Card"
                      subtitle="Upload 2 photos front and back"
                    >
                      <DocumentUploadBox
                        id="PAN"
                        onFileSelect={(f) => handleFileChange("PAN", f)}
                        selectedFile={files.PAN}
                        multiple
                      />
                    </DocumentSection>

                    <DocumentSection
                      title="Aadhaar Card"
                      subtitle="Upload 2 photos front and back"
                    >
                      <DocumentUploadBox
                        id="AADHAR"
                        onFileSelect={(f) => handleFileChange("AADHAR", f)}
                        selectedFile={files.AADHAR}
                        multiple
                      />
                    </DocumentSection>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || hasRoleConflict}
                  className={`w-full py-4 rounded-[6px] font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 ${hasRoleConflict ? "bg-border text-muted-foreground cursor-not-allowed" : "bg-gradient-to-r from-primary to-primary hover:opacity-90 text-black "}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span>Processing Application...</span>
                    </>
                  ) : hasRoleConflict ? (
                    <>
                      <ShieldAlert size={18} />
                      <span>Cannot Apply Again</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Verification Bundle</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          <aside className="space-y-6 sticky top-24 self-start">
            <div className="p-8 rounded-[8px] border border-border bg-background relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheckIcon size={80} className="text-primary" />
              </div>
              <h4
                className="text-[16px] font-black uppercase tracking-[0.2em] mb-4 bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Verification Policy
              </h4>
              <ul
                className="space-y-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {[
                  "Reviews take 24-48 hours",
                  "Valid registration required",
                  "Secure document handling",
                  "Email notification on status",
                  "Dedicated support access",
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-muted-foreground">
                    <CheckCircle2
                      size={16}
                      className="text-primary shrink-0"
                    />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-[8px] border border-border bg-background">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-[6px] bg-primary/10">
                  <Briefcase size={20} className="text-primary" />
                </div>
                <h4
                  className="text-[16px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  Partner Perks
                </h4>
              </div>
              <div
                className="space-y-4 text-gray-400 text-[13px] leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <p>
                  Join India's fastest growing sports ecosystem. Get access to:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#0a0a0c] rounded-[8px] border border-border">
                    <span className="bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text block font-black text-2xl mb-1">
                      0%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Initial Fee
                    </span>
                  </div>
                  <div className="p-4 bg-[#0a0a0c] rounded-[8px] border border-border">
                    <span className="bg-gradient-to-r from-primary to-primary text-transparent bg-clip-text block font-black text-2xl mb-1">
                      24/7
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Support
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Agreement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0c] border border-border rounded-[8px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary" />
            <h3
              className="text-xl font-black text-white uppercase tracking-wider mb-4"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Agreement & Confirmation
            </h3>
            <p
              className="text-gray-400 text-sm leading-relaxed mb-6"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              By proceeding, you confirm that all documents uploaded are
              authentic and accurate. You take full responsibility for the
              provided information.
            </p>

            <label className="flex items-start gap-3 cursor-pointer mb-8 group">
              <div className="relative flex items-center justify-center mt-0.5">
                <Input
                  type="checkbox"
                  className="peer appearance-none w-5 h-5 border border-border bg-[#0a0a0c] rounded-[4px] flex-shrink-0 checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                />
                <CheckCircle2
                  size={14}
                  className="absolute text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                />
              </div>
              <span
                className="text-sm text-gray-300 group-hover:text-white transition-colors select-none"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                I agree and take full responsibility for the uploaded documents.
              </span>
            </label>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="flex-1 py-3 rounded-[8px] font-bold text-xs uppercase tracking-widest border border-border hover:bg-border/50 transition-colors text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={processSubmission}
                disabled={!isAgreed}
                className="flex-1 py-3 rounded-[8px] font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-primary to-primary text-black disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Proceed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentSection({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-white tracking-wide">
          {title}
        </span>
        {subtitle && (
          <span className="text-[9px] text-gray-500">{subtitle}</span>
        )}
      </div>
      <div className="flex gap-2 w-full h-full items-start">{children}</div>
    </div>
  );
}

function DocumentUploadBox({
  id,
  onFileSelect,
  selectedFile,
  label,
  multiple,
}) {
  return (
    <div className="flex flex-col relative w-full h-full">
      {label && (
        <span className="text-[10px] font-medium text-gray-300 mb-2">
          {label}
        </span>
      )}
      <Input
        type="file"
        id={id}
        className="hidden"
        onChange={(e) => {
          if (multiple) {
            onFileSelect(Array.from(e.target.files));
          } else {
            onFileSelect(e.target.files[0]);
          }
        }}
        accept="image/*,.pdf"
        multiple={multiple}
      />
      <label
        htmlFor={id}
        className={`flex flex-row items-center justify-center gap-2 py-3 px-2 border border-dashed transition-all cursor-pointer rounded-[6px] flex-1 ${selectedFile ? "border-primary bg-primary/10 text-primary" : "border-border bg-[#0a0a0c] hover:border-primary/50 hover:bg-primary/5 text-primary"}`}
      >
        <Upload size={14} />
        <span className="text-[10px] font-bold truncate max-w-[80px]">
          {selectedFile
            ? Array.isArray(selectedFile)
              ? `${selectedFile.length} file(s)`
              : selectedFile.name
            : "Browse File"}
        </span>
      </label>
    </div>
  );
}

function ShieldCheckIcon({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
