import React, { useState } from "react";
import {
  Shield,
  Search,
  HardDrive,
  Terminal,
  User,
  Globe,
  Info,
} from "lucide-react";
import useAuditLogs from "@hooks/admin/useAuditLogs";
import { Input } from "@kridaz/ui";


const AuditLogs = () => {
  const { logs, loading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getModuleColor = (module) => {
    switch (module) {
      case "FINANCE":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "RESOLUTION":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "USER_MANAGEMENT":
        return "text-purple-500 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase flex items-center gap-4">
              <Shield className="text-primary" size={40} />
              Audit <span className="text-white/50">Trails</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium tracking-wide">
              Immutable log of all administrative actions
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search logs..."
              className="bg-card border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full md:w-80 focus:outline-none focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Log Terminal */}
        <div className="bg-[#050505] border border-white/10 rounded-[8px] overflow-hidden shadow-2xl">
          <div className="bg-card px-4 py-2 border-b border-white/10 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-2">
              System Auditor v1.0
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-gray-500 font-bold uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-gray-500 font-bold uppercase tracking-wider">
                    Administrator
                  </th>
                  <th className="px-6 py-4 text-gray-500 font-bold uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-4 text-gray-500 font-bold uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-gray-500 font-bold uppercase tracking-wider">
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-20 text-center text-gray-500 animate-pulse"
                    >
                      [ACCESSING SECURE LOG STORAGE...]
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-20 text-center text-gray-500"
                    >
                      [NO RECORDS FOUND IN CURRENT SESSION]
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                            <User size={12} />
                          </div>
                          <span className="text-white font-bold">
                            {log.admin?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-tighter ${getModuleColor(log.module)}`}
                        >
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-primary font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="group/meta relative cursor-help">
                            <Info
                              size={14}
                              className="text-gray-500 hover:text-white transition-colors"
                            />
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/meta:block w-64 bg-card border border-white/10 rounded-[8px] p-3 shadow-2xl z-50">
                              <pre className="text-[10px] text-gray-300 overflow-auto max-h-40 no-scrollbar">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                            <Globe size={10} /> {log.ipAddress}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-white/10 p-6 rounded-[8px] flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-[8px] flex items-center justify-center text-blue-500 border border-blue-500/20">
              <HardDrive size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">
                Log Retention
              </h4>
              <p className="text-xs text-gray-500">
                System logs are retained for 365 days for regulatory compliance
                and security auditing.
              </p>
            </div>
          </div>
          <div className="bg-card border border-white/10 p-6 rounded-[8px] flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-[8px] flex items-center justify-center text-primary border border-primary/20">
              <Terminal size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">
                Action Tracking
              </h4>
              <p className="text-xs text-gray-500">
                Every sensitive action is cryptographically linked to the
                performing administrator.
              </p>
            </div>
          </div>
          <div className="bg-card border border-white/10 p-6 rounded-[8px] flex items-start gap-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-[8px] flex items-center justify-center text-red-500 border border-red-500/20">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">
                Security Access
              </h4>
              <p className="text-xs text-gray-500">
                Audit logs are read-only and cannot be modified or deleted by
                any administrative role.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
