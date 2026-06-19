import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Smartphone, Globe } from "lucide-react";

function TypeTester() {
  return (
    <div className="flex items-center justify-center h-full">
      <span className="font-poppins text-6xl md:text-8xl text-white font-medium">
        Aa
      </span>
    </div>
  );
}

function LayoutAnimation() {
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLayout((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const layouts = ["grid-cols-2", "grid-cols-3", "grid-cols-1"];

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        className={`grid ${layouts[layout]} gap-1.5 w-full max-w-[140px] h-full`}
        layout
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-white/20 rounded-md h-5 w-full"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function SpeedIndicator() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="h-10 flex items-center justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              className="h-8 w-24 bg-white/10 rounded"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              exit={{ opacity: 0, y: -20, position: "absolute" }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : (
            <motion.span
              key="text"
              initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              className="text-3xl md:text-4xl font-sans font-medium text-white"
            >
              100ms
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm text-gray-400">Load Time</span>
      <div className="w-full max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: loading ? 0 : "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 15, mass: 1 }}
        />
      </div>
    </div>
  );
}

function SecurityBadge() {
  const [shields, setShields] = useState([
    { id: 1, active: false },
    { id: 2, active: false },
    { id: 3, active: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShields((prev) => {
        const nextIndex = prev.findIndex((s) => !s.active);
        if (nextIndex === -1) {
          return prev.map(() => ({ id: Math.random(), active: false }));
        }
        return prev.map((s, i) =>
          i === nextIndex ? { ...s, active: true } : s
        );
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full gap-2">
      {shields.map((shield) => (
        <motion.div
          key={shield.id}
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            shield.active ? "bg-white/20" : "bg-white/5"
          }`}
          animate={{ scale: shield.active ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock
            className={`w-5 h-5 ${shield.active ? "text-white" : "text-gray-600"}`}
          />
        </motion.div>
      ))}
    </div>
  );
}

function GlobalNetwork() {
  const [pulses] = useState([0, 1, 2, 3, 4]);

  return (
    <div className="flex items-center justify-center h-full relative">
      <Globe className="w-16 h-16 text-white/80 z-10" />
      {pulses.map((pulse) => (
        <motion.div
          key={pulse}
          className="absolute w-16 h-16 border-2 border-white/30 rounded-full"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: pulse * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function BentoGrid01() {
  return (
    <div className="w-full">
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
        {/* 1. Typography - Tall (2x2) */}
        <motion.div
          className="md:col-span-2 md:row-span-2 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 flex flex-col hover:border-white/20 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex-1">
            <TypeTester />
          </div>
          <div className="mt-4">
            <h3 className="font-poppins font-semibold tracking-tight leading-[1.05] text-xl text-white normal-case">
              Community Posts
            </h3>
            <p className="text-white/50 text-sm mt-1">
              Share match highlights and training routines.
            </p>
          </div>
        </motion.div>

        {/* 2. Layouts - Standard (2x2) */}
        <motion.div
          className="md:col-span-2 md:row-span-2 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 flex flex-col hover:border-white/20 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1">
            <LayoutAnimation />
          </div>
          <div className="mt-4">
            <h3 className="font-poppins font-semibold tracking-tight leading-[1.05] text-xl text-white normal-case">
              Profiles
            </h3>
            <p className="text-white/50 text-sm mt-1">
              Build your sports resume.
            </p>
          </div>
        </motion.div>

        {/* 3. Global Network - Tall (2x2) */}
        <motion.div
          className="md:col-span-2 md:row-span-2 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 flex flex-col hover:border-white/20 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <GlobalNetwork />
            </div>
          </div>
          <div className="mt-auto relative z-20 bg-[#0A0A0A]/50 backdrop-blur-sm rounded-lg p-2">
            <h3 className="font-poppins font-semibold tracking-tight leading-[1.05] text-xl text-white normal-case">
              Networking
            </h3>
            <p className="text-white/50 text-sm mt-1">
              Follow friends and rivals worldwide.
            </p>
          </div>
        </motion.div>

        {/* 5. Security - Wide (3x1) */}
        <motion.div
          className="md:col-span-3 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 flex flex-col hover:border-white/20 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1">
            <SecurityBadge />
          </div>
          <div className="mt-4">
            <h3 className="font-poppins font-semibold tracking-tight leading-[1.05] text-xl text-white normal-case">
              Secure Matchmaking
            </h3>
            <p className="text-white/50 text-sm mt-1">
              Verified profiles and enterprise-grade data protection.
            </p>
          </div>
        </motion.div>

        {/* 6. Mobile Responsive - Wide (3x1) */}
        <motion.div
          className="md:col-span-3 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 flex flex-col hover:border-white/20 transition-colors cursor-pointer overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 0.98 }}
        >
          <div className="flex-1 flex items-center justify-center">
            {/* Icon removed as requested, flex-1 maintains card size */}
          </div>
          <div className="mt-4">
            <h3 className="font-poppins font-semibold tracking-tight leading-[1.05] text-xl text-white normal-case">
              Play Anywhere
            </h3>
            <p className="text-white/50 text-sm mt-1">
              Optimized for all devices so you can book games on the go.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
