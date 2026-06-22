import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Linkedin, Instagram, Mail, MapPin } from "lucide-react";

const PartnerFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background text-white relative overflow-hidden border-t border-white/5 pt-20 pb-12 font-sans">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Brand Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 mb-16">
          <div className="space-y-6 max-w-xl">
            <Link to="/" className="group flex items-center gap-4">
              <div className="flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Kridaz"
                  className="h-10 lg:h-12 w-auto"
                />
              </div>
              <div className="border-l border-white/20 pl-4 h-10 flex flex-col justify-center">
                <span className="block text-[10px] font-semibold text-primary tracking-wider uppercase leading-none mb-1">
                  Venue Owner Portal
                </span>
                <span className="block text-xl font-bold text-white tracking-tight leading-none uppercase">
                  Business
                </span>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-md">
              Empowering sports venue owners with professional management tools,
              real-time booking systems, and increased visibility for your
              facility.
            </p>
            <div className="flex gap-4">
              {[Facebook, Linkedin, Instagram].map((Icon, i) => (
                <Link
                  key={i}
                  to="#"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary hover:bg-white/10 transition-all"
                >
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-24">
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Management
              </h4>
              <ul className="space-y-3">
                {[
                  "Venue Dashboard",
                  "Booking Manager",
                  "Revenue Reports",
                  "Facility Setup",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      to="#"
                      className="text-white/40 hover:text-primary transition-colors text-sm"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Venue Owners
              </h4>
              <ul className="space-y-3">
                {[
                  { name: "Join Network", path: "/venue-owners" },
                  { name: "Venue Owner Program", path: "#" },
                  { name: "Success Stories", path: "#" },
                  { name: "Guidelines", path: "#" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-white/40 hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Support
              </h4>
              <ul className="space-y-3">
                {[
                  "Help Center",
                  "Documentation",
                  "Contact Support",
                  "Terms of Service",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      to="#"
                      className="text-white/40 hover:text-primary transition-colors text-sm"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact and Legal */}
        <div className="border-t border-white/5 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  Email Us
                </p>
                <p className="text-sm font-medium text-white">
                  partners@kridaz.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  Headquarters
                </p>
                <p className="text-sm font-medium text-white">
                  Hyderabad, TS, India
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
            <p className="text-xs text-white/30">
              &copy; {currentYear} Kridaz. All rights reserved. Professional
              Venue Management Suite.
            </p>
            <div className="flex gap-6">
              <Link
                to="/privacy-policy"
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/data-deletion-instructions"
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                Data Deletion Instructions
              </Link>
              <Link
                to="#"
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PartnerFooter;
