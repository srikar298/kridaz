import React, { useState } from "react";
import { Button, Input, Textarea } from "@kridaz/ui";

import {
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
} from "lucide-react";

const GRAD = "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)";
const BDR = "rgba(255,255,255,0.08)";

const ContactUs = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactCards = [
    {
      icon: <Mail size={22} style={{ color: "#000" }} />,
      title: "Email Us",
      value: "contact@kridaz.com",
      sub: "We reply within 24 hours",
    },
    {
      icon: <MapPin size={22} style={{ color: "#000" }} />,
      title: "Visit Us",
      value: "Hyderabad, Telangana",
      sub: "India – 500001",
    },
    {
      icon: <Clock size={22} style={{ color: "#000" }} />,
      title: "Support Hours",
      value: "Mon – Sat",
      sub: "9:00 AM – 6:00 PM IST",
    },
  ];

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(85,222,232,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(191,243,103,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] mb-6 border text-xs font-black uppercase tracking-widest"
            style={{
              borderColor: BDR,
              background: "rgba(85,222,232,0.07)",
              color: "var(--primary)",
            }}
          >
            <MessageCircle size={12} /> Get In Touch
          </div>
          <h1
            className="text-5xl md:text-7xl font-black uppercase leading-[0.9] mb-6"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Contact{" "}
            <span className="bg-gradient-to-br from-primary to-primary bg-clip-text text-transparent">
              Us
            </span>
          </h1>
          <p
            className="text-gray-400 max-w-xl mx-auto"
            style={{ fontSize: "20px" }}
          >
            Have a question, a partnership idea, or just want to say hello? We'd
            love to hear from you.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {contactCards.map((card, i) => (
            <div
              key={i}
              className="rounded-[8px] p-6 border flex flex-col items-center text-center gap-4 group hover:border-primary/40 transition-all duration-300"
              style={{ borderColor: BDR, backgroundColor: "var(--background)" }}
            >
              <div
                className="w-12 h-12 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: GRAD }}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">
                  {card.title}
                </p>
                <p
                  className="text-white font-black text-lg"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  {card.value}
                </p>
                <p className="text-gray-500 text-sm mt-1">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div
          className="rounded-[8px] border p-8 md:p-12"
          style={{ borderColor: BDR, backgroundColor: "var(--background)" }}
        >
          {submitted ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: GRAD }}
              >
                <CheckCircle size={36} style={{ color: "#000" }} />
              </div>
              <h2
                className="text-3xl font-black mb-3"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Message Sent!
              </h2>
              <p className="text-gray-400" style={{ fontSize: "20px" }}>
                Thanks for reaching out. Our team will get back to you within 24
                hours.
              </p>
            </div>
          ) : (
            <>
              <h2
                className="text-3xl font-black mb-2 uppercase"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Send Us a Message
              </h2>
              <p className="text-gray-500 mb-8" style={{ fontSize: "20px" }}>
                Fill in the form below and we'll respond as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Full Name
                    </label>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      className="w-full bg-card border rounded-[8px] px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary transition-colors"
                      style={{ borderColor: BDR }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full bg-card border rounded-[8px] px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary transition-colors"
                      style={{ borderColor: BDR }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Subject
                  </label>
                  <Input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="What's this about?"
                    className="w-full bg-card border rounded-[8px] px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary transition-colors"
                    style={{ borderColor: BDR }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Message
                  </label>
                  <Textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us more..."
                    className="w-full bg-card border rounded-[8px] px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-primary transition-colors resize-none"
                    style={{ borderColor: BDR }}
                  />
                </div>

                <Button
                  type="submit"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-[8px] font-black text-black uppercase tracking-wider text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(85,222,232,0.2)]"
                  style={{ background: GRAD }}
                >
                  <Send size={16} /> Send Message
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
