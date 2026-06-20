import React, { useState } from "react";
import { ChevronDown, HelpCircle, Search } from "lucide-react";import { Input } from "@kridaz/ui";


const GRAD = "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)";
const BDR = "rgba(255,255,255,0.08)";

const faqs = [
  {
    category: "Booking & Venues",
    items: [
      {
        q: "How do I book a venue on Kridaz?",
        a: "Simply browse venues on the Turfs page, select your preferred slot, choose a date and time, and complete the payment. You'll receive a booking confirmation instantly.",
      },
      {
        q: "Can I cancel or reschedule my booking?",
        a: "Yes. Navigate to your Booking History, select the booking, and use the Cancel or Reschedule option. Cancellations are subject to the venue's policy, which is displayed before you confirm.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept UPI, credit/debit cards, net banking, and Kridaz Wallet credits. All transactions are secured and encrypted.",
      },
      {
        q: "Will I receive a receipt after booking?",
        a: "Yes. A digital invoice and booking pass are sent to your registered email and are also accessible under Booking History in your profile.",
      },
    ],
  },
  {
    category: "Players & Games",
    items: [
      {
        q: "How do I join an open game?",
        a: "Go to the Join Games section, filter by your sport and location, and click 'Join' on any available match. You'll get a confirmation once the host accepts your request.",
      },
      {
        q: "Can I host my own game?",
        a: "Absolutely! Head to Host Game, fill in your sport, venue, time, and number of players needed. Other players nearby can discover and join your game.",
      },
      {
        q: "How are teams formed on Kridaz?",
        a: "You can create a team under My Teams, invite other players, and compete together. Team profiles are visible publicly so others can challenge you.",
      },
    ],
  },
  {
    category: "Professionals",
    items: [
      {
        q: "How do I book a coach?",
        a: "Visit the Professionals section, filter by sport and coach type, view their profile and availability, and book a session directly through the platform.",
      },
      {
        q: "Who can register as a professional on Kridaz?",
        a: "Coaches, umpires, scorers, and streamers can register. Visit the Business section and complete the verification process to get listed.",
      },
    ],
  },
  {
    category: "Account & Profile",
    items: [
      {
        q: "How do I update my profile information?",
        a: "Go to your Profile page and click the Edit button. You can update your name, location, sport preferences, profile picture, and banner image.",
      },
      {
        q: "Is my personal data secure?",
        a: "Yes. Kridaz uses industry-standard encryption for all personal data. We never share or sell your information to third parties. Read our Privacy Policy for full details.",
      },
      {
        q: "How do I delete my account?",
        a: "You can request account deletion by visiting the Data Deletion Instructions page or contacting our support team at contact@kridaz.com.",
      },
    ],
  },
  {
    category: "Wallet & Payments",
    items: [
      {
        q: "What is the Kridaz Wallet?",
        a: "The Kridaz Wallet is a digital balance you can top up and use for instant bookings, game entries, and professional sessions without re-entering payment details.",
      },
      {
        q: "How do I add money to my Wallet?",
        a: "Go to the Wallet section, click Add Money, enter the amount, and complete the payment via UPI or card. Funds are credited instantly.",
      },
    ],
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border rounded-[8px] overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        borderColor: open ? "rgba(85,222,232,0.3)" : BDR,
        backgroundColor: open ? "rgba(85,222,232,0.04)" : "var(--background)",
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5 gap-4">
        <p
          className="font-bold text-white text-[15px] leading-snug flex-1"
          style={{ fontFamily: "'Open Sans', sans-serif" }}
        >
          {q}
        </p>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: open ? GRAD : "rgba(255,255,255,0.07)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDown size={14} style={{ color: open ? "#000" : "#fff" }} />
        </div>
      </div>
      {open && (
        <div className="px-5 pb-5">
          <div
            className="w-full h-px mb-4"
            style={{ background: "rgba(85,222,232,0.15)" }}
          />
          <p
            className="text-gray-400 leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "20px" }}
          >
            {a}
          </p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-0 right-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(85,222,232,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="fixed bottom-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(191,243,103,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] mb-6 border text-xs font-black uppercase tracking-widest"
            style={{
              borderColor: BDR,
              background: "rgba(85,222,232,0.07)",
              color: "var(--primary)",
            }}
          >
            <HelpCircle size={12} /> Help Center
          </div>
          <h1
            className="text-5xl md:text-7xl font-black uppercase leading-[0.9] mb-6"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Frequently{" "}
            <span className="bg-gradient-to-br from-primary to-primary bg-clip-text text-transparent">
              Asked
            </span>
            <br />
            Questions
          </h1>
          <p
            className="text-gray-400 max-w-xl mx-auto"
            style={{ fontSize: "20px" }}
          >
            Find quick answers to the most common questions about Kridaz.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-12">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full bg-background border rounded-[8px] pl-12 pr-5 py-4 text-white placeholder-gray-600 outline-none transition-all"
            style={{ borderColor: BDR, fontSize: "16px" }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(85,222,232,0.5)")
            }
            onBlur={(e) => (e.target.style.borderColor = BDR)}
          />
        </div>

        {/* FAQ Sections */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-20">
            <HelpCircle size={48} className="mx-auto mb-4 text-gray-700" />
            <p
              className="text-xl font-black"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              No results found
            </p>
            <p className="text-gray-500 mt-2" style={{ fontSize: "20px" }}>
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredFaqs.map((cat, i) => (
              <div key={i}>
                {/* Category Label */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-1 h-6 rounded-full"
                    style={{ background: GRAD }}
                  />
                  <h2
                    className="text-sm font-black uppercase tracking-widest"
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      background: GRAD,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {cat.category}
                  </h2>
                </div>

                <div className="space-y-3">
                  {cat.items.map((item, j) => (
                    <FAQItem key={j} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div
          className="mt-16 rounded-[8px] p-8 md:p-12 text-center border"
          style={{
            borderColor: BDR,
            background:
              "linear-gradient(135deg, rgba(85,222,232,0.06) 0%, rgba(191,243,103,0.04) 100%)",
          }}
        >
          <h3
            className="text-2xl font-black mb-3 uppercase"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Still have questions?
          </h3>
          <p className="text-gray-400 mb-6" style={{ fontSize: "20px" }}>
            Our support team is ready to help you out.
          </p>
          <a
            href="/contact-us"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[8px] font-black text-black uppercase tracking-wider text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(85,222,232,0.2)]"
            style={{ background: GRAD }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
