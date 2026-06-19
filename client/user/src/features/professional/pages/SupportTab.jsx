import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import axiosInstance from "../../../infrastructure/axios";

const SupportTab = ({ role }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New ticket state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("MATCHMAKING");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("success");

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/api/owner/support/tickets");
      if (res.data && res.data.tickets) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error("Failed to load support tickets", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setFeedback("");
    try {
      const res = await axiosInstance.post("/api/owner/support/create", {
        subject,
        category,
        priority,
        description,
      });

      if (res.data) {
        setFeedbackType("success");
        setFeedbackMsg(
          "Support ticket created successfully! Our ops team will get in touch shortly."
        );
        setSubject("");
        setDescription("");
        fetchTickets();
      }
    } catch (err) {
      setFeedbackType("error");
      setFeedbackMsg(
        err.response?.data?.message || "Failed to create support ticket."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const [feedbackMsg, setFeedbackMsg] = useState("");

  return (
    <div className="space-y-6 text-white font-inter">
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${feedbackType === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
        >
          {feedbackType === "success" ? (
            <CheckCircle2 size={20} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{feedbackMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Submission Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-6">
          <div className="flex items-center gap-2.5 border-b border-[#2D2D2D] pb-4">
            <HelpCircle size={20} className="text-[#BFF367]" />
            <h3 className="text-lg font-bold tracking-tight">Raise a Ticket</h3>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Booking Match check-in error"
                className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BFF367] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-[#2D2D2D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#BFF367]"
                >
                  <option value="MATCHMAKING">Matchmaking</option>
                  <option value="PAYMENT">Payment/Wallet</option>
                  <option value="TECHNICAL">App Glitch</option>
                  <option value="OTHER">Other Issues</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black border border-[#2D2D2D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#BFF367]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#878C9F] uppercase tracking-wider">
                Problem details
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#BFF367] min-h-[120px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#BFF367] hover:bg-[#44cdd7] disabled:bg-gray-600 text-black font-semibold rounded-xl py-3.5 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>{isSubmitting ? "Submitting..." : "Submit Ticket"}</span>
            </button>
          </form>
        </div>

        {/* Existing Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#878C9F] border-b border-[#2D2D2D] pb-3">
            Active Requests & Support History
          </h3>

          {isLoading ? (
            <div className="py-12 text-center text-[#878C9F]">
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center bg-[#141414] border border-[#2D2D2D] rounded-2xl space-y-4">
              <div className="mx-auto w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="font-bold">No active tickets</h4>
                <p className="text-sm text-[#878C9F] mt-1">
                  Your created tickets will appear here with dynamic status
                  indicators.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl bg-[#141414] border border-[#2D2D2D] flex items-center justify-between hover:border-[#BFF367]/30 transition-colors"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      {ticket.subject}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[10px] text-[#878C9F]">
                      <span className="font-medium px-2 py-0.5 bg-black rounded border border-[#2D2D2D]">
                        {ticket.category}
                      </span>
                      <span
                        className={`font-semibold ${ticket.priority === "HIGH" ? "text-red-400" : ticket.priority === "MEDIUM" ? "text-yellow-400" : "text-green-400"}`}
                      >
                        {ticket.priority} Priority
                      </span>
                      <span>
                        • Created{" "}
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${ticket.status === "OPEN" ? "bg-[#BFF367]/10 text-[#BFF367] border-[#BFF367]/20" : ticket.status === "IN_PROGRESS" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}
                  >
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTab;
