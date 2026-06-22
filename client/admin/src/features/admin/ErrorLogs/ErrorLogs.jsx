import React from "react";
import useErrorLogs from "@hooks/admin/useErrorLogs";
import { ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";import { Button } from "@kridaz/ui";


const ErrorLogs = () => {
  const { logs, loading, resolveLog } = useErrorLogs();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 lg:p-10 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10">
      <div className="space-y-12 lg:space-y-16 animate-fade-in relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-border pb-10">
            <div className="relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-14 bg-primary rounded-full shadow-[0_0_25px_rgba(204,255,0,0.5)]"></div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                System <span className="text-primary">Errors</span>
              </h1>
              <p className="admin-subheading text-muted-foreground">
                Live Sentry Crash Reports • Telemetry
              </p>
            </div>
            <div className="px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                Total Logs: {logs.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="p-20 rounded-[8px] border border-border bg-background text-center">
                <p className="text-2xl font-black text-primary uppercase tracking-tighter">
                  No Errors Logged
                </p>
                <p className="text-muted-foreground mt-2">
                  Systems operating nominally.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="relative p-6 rounded-[12px] bg-background border border-border hover:border-primary/50 transition-all flex flex-col md:flex-row gap-6 md:items-center justify-between overflow-hidden group"
                >
                  {log.isResolved ? null : (
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-[8px] ${log.isResolved ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                    >
                      {log.isResolved ? (
                        <CheckCircle size={24} />
                      ) : (
                        <AlertTriangle size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {log.errorMessage}
                      </h3>
                      <div className="flex gap-4 text-xs font-black tracking-wider text-muted-foreground uppercase">
                        <span>Level: {log.level}</span>
                        <span>•</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span
                          className={
                            log.isResolved ? "text-green-500" : "text-red-500"
                          }
                        >
                          {log.isResolved ? "Resolved" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    {!log.isResolved && (
                      <Button
                        onClick={() => resolveLog(log.id)}
                        className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-black uppercase text-primary tracking-widest hover:bg-primary/20 transition-all"
                      >
                        Mark Resolved
                      </Button>
                    )}
                    <a
                      href={log.sentryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-card border border-[#333333] rounded-md text-[10px] font-black uppercase text-white tracking-widest hover:border-white transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={14} /> View in Sentry
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogs;
