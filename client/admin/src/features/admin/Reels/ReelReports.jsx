import React from "react";
import {
  useGetReelReportsQuery,
  useDeleteReelMutation,
} from "@redux/api/reelsApi";
import { format } from "date-fns";
import { ShieldAlert, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const ReelReports = () => {
  const { data, isLoading, isError, refetch, isFetching } =
    useGetReelReportsQuery();
  const [deleteReel, { isLoading: isDeleting }] = useDeleteReelMutation();

  const reports = data?.reports || [];

  const handleDeleteReel = async (reelId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this Reel? This action cannot be undone."
      )
    ) {
      try {
        await deleteReel(reelId).unwrap();
        toast.success("Reel deleted successfully");
        refetch();
      } catch (err) {
        toast.error("Failed to delete reel");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#55DEE8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <p>Failed to load reel reports. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-950 min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} />
            Reel Reports
          </h1>
          <p className="text-zinc-400 mt-2">
            Manage and review reported reels from users.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-[8px] transition-colors"
          disabled={isFetching}
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-[12px] overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No reel reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 border-b border-white/10 text-sm text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Reel ID / Creator</th>
                  <th className="px-6 py-4 font-medium">Reported By</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {report.reel ? (
                        <div>
                          <p className="font-medium truncate max-w-[200px] text-[#55DEE8]">
                            {report.reel.id}
                          </p>
                          <p className="text-sm text-zinc-400 truncate max-w-[200px]">
                            {report.reel.caption || "No caption"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            By:{" "}
                            {report.reel.creator?.username ||
                              report.reel.creator?.name}
                          </p>
                        </div>
                      ) : (
                        <p className="text-zinc-500 italic">Reel deleted</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">
                        {report.reportedBy?.username ||
                          report.reportedBy?.name ||
                          "Unknown"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                        {report.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {format(new Date(report.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.reel && (
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/shorts/${report.reel.id}`}
                            target="_blank"
                            className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                            title="View Reel"
                          >
                            <ExternalLink size={18} />
                          </Link>
                          <button
                            onClick={() => handleDeleteReel(report.reel.id)}
                            disabled={isDeleting}
                            className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-colors"
                            title="Delete Reel"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelReports;
