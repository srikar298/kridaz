import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Input, Select } from "@kridaz/ui";


const FadeInUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingHeroTemplate() {
  return (
    <section className="relative w-full min-h-[100vh] flex flex-col justify-center pt-12 pb-16 md:pt-24 md:pb-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-desktop-new.webp"
          alt="Hero Background Desktop"
          className="hidden md:block w-full h-full object-cover object-center opacity-100"
        />
        <img
          src="/hero-mobile-new.webp"
          alt="Hero Background Mobile"
          className="block md:hidden w-full h-full object-cover object-center opacity-100"
        />
      </div>

      <div className="relative z-10 w-full mx-auto px-6 flex flex-col items-center text-center">
        <FadeInUp
          delay={0.2}
          className="w-full mt-[100px] md:mt-6 px-2 md:px-0"
        >
          <div className="flex flex-row items-center w-full bg-[#050505] rounded-xl border border-white/5 shadow-2xl max-w-[700px] mx-auto p-2 md:p-0 h-14 md:h-16 md:pl-6 md:pr-2 gap-2 md:gap-0">
            {/* Search Venue Name (Desktop Only) */}
            <div className="hidden md:flex md:flex-1 relative h-full items-center bg-transparent px-0">
              <Input
                type="text"
                placeholder="Search Venue Name"
                className="w-full bg-transparent border-none text-white/70 placeholder-white/40 focus:outline-none focus:ring-0 transition-all text-base font-medium"
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block w-[1px] h-6 bg-white/10 mx-3"></div>

            {/* Select Sport */}
            <div className="flex-1 md:w-36 relative group h-10 md:h-full flex items-center bg-background md:bg-transparent rounded-lg md:rounded-none px-2 md:px-0">
              <Select className="w-full bg-transparent border-none text-white/90 focus:outline-none focus:ring-0 transition-all appearance-none cursor-pointer text-[11px] sm:text-xs md:text-base font-medium">
                <option value="" className="bg-background">
                  Select Sport
                </option>
                <option value="cricket" className="bg-background">
                  Cricket
                </option>
                <option value="football" className="bg-background">
                  Football
                </option>
                <option value="tennis" className="bg-background">
                  Tennis
                </option>
              </Select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-[1px] h-6 bg-white/10 mx-3"></div>

            {/* Select City */}
            <div className="flex-1 md:w-36 relative h-10 md:h-full flex items-center bg-background md:bg-transparent rounded-lg md:rounded-none px-2 md:px-0">
              <Select className="w-full bg-transparent border-none text-white/90 focus:outline-none focus:ring-0 transition-all appearance-none cursor-pointer text-[11px] sm:text-xs md:text-base font-medium">
                <option value="" className="bg-background">
                  Select City
                </option>
                <option value="mumbai" className="bg-background">
                  Mumbai
                </option>
                <option value="delhi" className="bg-background">
                  Delhi
                </option>
                <option value="bangalore" className="bg-background">
                  Bangalore
                </option>
              </Select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* Submit Button (Unified for Desktop/Mobile) */}
            <div className="flex items-center shrink-0 ml-1 md:ml-2">
              <Link
                to="/venues"
                className="w-10 h-10 md:w-12 md:h-12 bg-primary hover:bg-primary rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 text-black shadow-[0_0_20px_rgba(191,243,103,0.15)]"
              >
                <ArrowRight size={20} className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
