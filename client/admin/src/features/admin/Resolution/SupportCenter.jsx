import React, { useState, useEffect } from "react";
import { MessageSquare, Search, Send, User, ChevronRight } from "lucide-react";
import useSupport from "@hooks/admin/useSupport";import { Button, Input } from "@kridaz/ui";


const SupportCenter = () => {
  const {
    tickets,
    loading,
    processingId,
    handleUpdateStatus,
    handleReply,
    handleToggleAgentStatus,
  } = useSupport();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Sync selected ticket with tickets list
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find((t) => t._id === selectedTicket._id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets]);

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "URGENT":
        return "text-red-500 bg-red-500/10";
      case "HIGH":
        return "text-orange-500 bg-orange-500/10";
      case "MEDIUM":
        return "text-yellow-500 bg-yellow-500/10";
      default:
        return "text-blue-500 bg-blue-500/10";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED":
        return "text-green-500 bg-green-500/10";
      case "IN_PROGRESS":
        return "text-blue-500 bg-blue-500/10";
      case "CLOSED":
        return "text-gray-500 bg-gray-500/10";
      default:
        return "text-yellow-500 bg-yellow-500/10";
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
              Support <span className="text-secondary">Center</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium tracking-wide">
              Manage customer inquiries and partner issues
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tickets..."
              className="bg-card border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full md:w-80 focus:outline-none focus:border-secondary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Ticket List */}
          <div
            className={`lg:col-span-4 space-y-4 ${selectedTicket ? "hidden lg:block" : "block"}`}
          >
            <div className="bg-card border border-white/10 rounded-[8px] overflow-hidden">
              <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  All Tickets
                </p>
                <span className="text-[10px] bg-secondary text-black px-1.5 py-0.5 rounded font-black">
                  {filteredTickets.length}
                </span>
              </div>
              <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="p-8 text-center animate-pulse text-gray-500">
                    Loading tickets...
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No tickets found
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <Button
                      key={ticket._id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-4 border-b border-white/5 transition-all hover:bg-white/[0.03] ${selectedTicket?._id === ticket._id ? "bg-secondary/5 border-l-4 border-l-[var(--secondary)]" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-tighter uppercase ${getPriorityColor(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-white truncate mb-1">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User size={10} />{" "}
                        {ticket.user?.name || ticket.owner?.name}
                      </p>
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Ticket Detail & Chat */}
          <div className="lg:col-span-8">
            {selectedTicket ? (
              <div className="bg-card border border-white/10 rounded-[8px] overflow-hidden flex flex-col h-[700px]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Button
                        onClick={() => setSelectedTicket(null)}
                        className="lg:hidden text-gray-500 hover:text-white mr-2"
                      >
                        <ChevronRight className="rotate-180" size={20} />
                      </Button>
                      <h2 className="text-xl font-bold">
                        {selectedTicket.subject}
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${getStatusColor(selectedTicket.status)}`}
                      >
                        {selectedTicket.status}
                      </span>
                      <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                        ID: {selectedTicket?._id?.slice(-6) || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedTicket.status !== "RESOLVED" && (
                      <Button
                        onClick={() =>
                          handleUpdateStatus(selectedTicket._id, "RESOLVED")
                        }
                        className="bg-secondary/10 text-secondary hover:bg-secondary hover:text-black px-4 py-2 rounded-[6px] text-xs font-bold transition-all"
                      >
                        Resolve
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedTicket._id, "CLOSED")
                      }
                      className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-[6px] text-xs font-bold transition-all"
                    >
                      Close
                    </Button>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-[8px] border border-white/10 ml-2">
                      <Button
                        onClick={() =>
                          handleToggleAgentStatus(selectedTicket._id, true)
                        }
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selectedTicket.isAgentOnline ? "bg-secondary text-black shadow-[0_0_10px_rgba(85, 222, 232,0.4)]" : "text-gray-500 hover:text-white"}`}
                      >
                        Online
                      </Button>
                      <Button
                        onClick={() =>
                          handleToggleAgentStatus(selectedTicket._id, false)
                        }
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${!selectedTicket.isAgentOnline ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "text-gray-500 hover:text-white"}`}
                      >
                        Offline
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-background">
                  {/* Initial Message */}
                  <div className="flex flex-col items-start max-w-[80%]">
                    <div className="bg-card p-4 rounded-[8px] rounded-tl-none border border-white/5 shadow-xl">
                      <p className="text-sm leading-relaxed mb-4">
                        {selectedTicket.message}
                      </p>

                      {/* Attachments */}
                      {selectedTicket.images &&
                        selectedTicket.images.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {selectedTicket.images.map((img, i) => (
                              <a
                                key={i}
                                href={img}
                                target="_blank"
                                rel="noreferrer"
                                className="block relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-secondary/50 transition-colors"
                              >
                                <img
                                  src={img}
                                  alt={`attachment-${i}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-[8px] font-black uppercase text-white bg-black/60 px-2 py-1 rounded">
                                    View Full
                                  </span>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">
                      {selectedTicket.user?.name || selectedTicket.owner?.name}{" "}
                      • {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Replies */}
                  {(selectedTicket.replies || []).map((reply, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${reply.sender === "ADMIN" ? "items-end" : "items-start"} max-w-[80%] ${reply.sender === "ADMIN" ? "ml-auto" : ""}`}
                    >
                      <div
                        className={`p-4 rounded-[8px] border shadow-xl ${reply.sender === "ADMIN" ? "bg-secondary/10 border-secondary/20 rounded-tr-none" : "bg-card border-white/5 rounded-tl-none"}`}
                      >
                        <p className="text-sm leading-relaxed">
                          {reply.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">
                        {reply.sender} •{" "}
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="p-4 bg-white/[0.02] border-t border-white/10">
                  <div className="relative flex items-center gap-3">
                    <Input
                      type="text"
                      placeholder="Type your response..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-all"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        handleReply(selectedTicket._id, replyText).then(() =>
                          setReplyText("")
                        )
                      }
                    />
                    <Button
                      onClick={() =>
                        handleReply(selectedTicket._id, replyText).then(() =>
                          setReplyText("")
                        )
                      }
                      disabled={
                        processingId === selectedTicket._id || !replyText.trim()
                      }
                      className="bg-secondary text-black p-3 rounded-[8px] hover:bg-[#b3ff00] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(85, 222, 232,0.3)]"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[700px] bg-card border border-white/10 rounded-[8px] flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <MessageSquare className="text-gray-500" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Ticket Console</h3>
                <p className="text-gray-500 max-w-sm">
                  Select a ticket from the list to view conversation history and
                  provide assistance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;
