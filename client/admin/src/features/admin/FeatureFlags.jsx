import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import { Activity, Server } from "lucide-react";

export const FeatureFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/features`);
      if (res.data.success) {
        setFlags(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      toast.error("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key, currentStatus) => {
    try {
      const res = await axiosInstance.put(`/api/admin/features/${key}`, {
        enabled: !currentStatus,
      });

      if (res.data.success) {
        toast.success(
          `Feature ${!currentStatus ? "enabled" : "disabled"} successfully`
        );
        setFlags((prevFlags) =>
          prevFlags.map((flag) =>
            flag.key === key ? { ...flag, enabled: !currentStatus } : flag
          )
        );
      }
    } catch (error) {
      console.error("Error toggling feature flag:", error);
      toast.error("Failed to update feature flag");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-bebas">
            PLATFORM FEATURES
          </h1>
          <p className="text-sm text-gray-400">
            Control dynamic features and sections across the Kridaz platform.
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await axiosInstance.post("/api/admin/features/seed");
              if (res.data.success) {
                toast.success("Feature flags synced successfully");
                setFlags(res.data.data);
              }
            } catch (error) {
              console.error("Error seeding flags:", error);
              toast.error("Failed to sync feature flags");
            }
          }}
          className="flex items-center gap-2 rounded-[8px] bg-lime-500 px-4 py-2 text-xs font-bold uppercase text-black transition-all hover:bg-lime-400 active:scale-95"
        >
          <Server className="h-4 w-4" />
          Sync Default Features
        </button>
      </div>

      {/* Flags List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flags.length > 0 ? (
          flags.map((flag) => (
            <div
              key={flag._id}
              className="flex flex-col justify-between rounded-[8px] border border-white/10 bg-[#1A1A1A] p-6 transition-all hover:border-lime-500/50"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-5 w-5 text-lime-500" />
                  <h3 className="text-lg font-bold text-white">{flag.name}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">{flag.description}</p>
                <div className="inline-flex items-center gap-1.5 rounded-[6px] bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300">
                  <code className="text-lime-400">{flag.key}</code>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <span
                  className={`text-sm font-medium ${flag.enabled ? "text-lime-500" : "text-gray-500"}`}
                >
                  {flag.enabled ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => handleToggle(flag.key, flag.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flag.enabled ? "bg-lime-500" : "bg-gray-600"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-[8px] border border-white/10 bg-[#1A1A1A] p-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-4 text-lg font-bold text-white">
              No Feature Flags Found
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Feature flags will appear here once they are seeded in the
              database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
