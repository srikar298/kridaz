import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Clock } from "lucide-react";import { Button } from "@kridaz/ui";


const ClockPicker = ({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("hours");
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState("AM");
  const [isDragging, setIsDragging] = useState(false);

  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const svgRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (value instanceof Date && !isNaN(value)) {
      let h = value.getHours();
      const m = value.getMinutes();
      const p = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setHour(h);
      setMinute(m);
      setPeriod(p);
    }
  }, [value]);

  const open = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 8,
        left: r.left + window.scrollX,
      });
    }
    setMode("hours");
    setIsOpen(true);
  };

  useEffect(() => {
    const handle = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      )
        setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  const confirm = (m = minute) => {
    const d = new Date();
    let h24 = hour % 12;
    if (period === "PM") h24 += 12;
    d.setHours(h24, m, 0, 0);
    onChange(d);
    setIsOpen(false);
  };

  const selectHour = (h) => {
    setHour(h);
    setMode("minutes");
  };
  const selectMinute = (m) => {
    setMinute(m);
    confirm(m);
  };

  // --- Rotation Logic ---
  const handleInteraction = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - centerX;
    const y = clientY - centerY;

    // Calculate angle in degrees (0 is 12 o'clock)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === "hours") {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      if (h > 12) h = 12;
      setHour(h);
    } else {
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      setMinute(m);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        handleInteraction(e);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (mode === "hours") setMode("minutes");
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, mode]);

  const fmt = () => {
    if (!value || !(value instanceof Date) || isNaN(value)) return placeholder;
    const h = value.getHours(),
      m = value.getMinutes();
    const p = h >= 12 ? "PM" : "AM";
    return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${p}`;
  };

  const pos12 = (n, radius = 38) => {
    const a = (n * 30 - 90) * (Math.PI / 180);
    return { x: 50 + radius * Math.cos(a), y: 50 + radius * Math.sin(a) };
  };
  const posMin = (m, radius = 38) => {
    const a = (m * 6 - 90) * (Math.PI / 180);
    return { x: 50 + radius * Math.cos(a), y: 50 + radius * Math.sin(a) };
  };

  const handEnd = mode === "hours" ? pos12(hour) : posMin(minute);
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        onClick={open}
        disabled={disabled}
        className={`w-full bg-card border ${isOpen ? "border-primary/60" : "border-border"} text-white text-sm h-12 rounded-[8px] px-4 transition-all flex items-center justify-between ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:border-primary/40"}`}
      >
        <span
          className={
            value instanceof Date && !isNaN(value)
              ? "text-white font-medium"
              : "text-[#555]"
          }
        >
          {fmt()}
        </span>
        <Clock size={14} className="text-primary opacity-60 shrink-0" />
      </Button>

      {isOpen &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              zIndex: 99999,
            }}
            className="w-[270px] bg-background border border-border rounded-[8px] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-card">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px]">
                {mode === "hours" ? "Select Hour" : "Select Minute"}
              </span>
              <Button
                onClick={() => setIsOpen(false)}
                className="text-[#444] hover:text-white transition-colors"
              >
                <X size={13} />
              </Button>
            </div>

            {/* Time Display */}
            <div className="flex items-center justify-center gap-1 pt-4 pb-1">
              <Button
                onClick={() => setMode("hours")}
                className={`text-[32px] font-black transition-colors ${mode === "hours" ? "text-primary" : "text-white/40 hover:text-white"}`}
              >
                {String(hour).padStart(2, "0")}
              </Button>
              <span className="text-[32px] font-black text-white/20">:</span>
              <Button
                onClick={() => setMode("minutes")}
                className={`text-[32px] font-black transition-colors ${mode === "minutes" ? "text-primary" : "text-white/40 hover:text-white"}`}
              >
                {String(minute).padStart(2, "0")}
              </Button>
              <div className="flex flex-col gap-1 ml-3">
                {["AM", "PM"].map((p) => (
                  <Button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`text-[9px] font-black px-2 py-1 rounded-[4px] uppercase tracking-wider transition-all ${period === p ? "bg-primary text-black" : "text-[#555] hover:text-white"}`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {/* SVG Clock Face */}
            <div className="px-5 pb-2">
              <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                className="w-full cursor-pointer touch-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="#111"
                  stroke="var(--border)"
                  strokeWidth="0.5"
                />

                {/* The Hand */}
                <g>
                  <line
                    x1="50"
                    y1="50"
                    x2={handEnd.x}
                    y2={handEnd.y}
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx={handEnd.x} cy={handEnd.y} r="3" fill="var(--primary)" />
                  <circle cx="50" cy="50" r="2.5" fill="var(--primary)" />
                </g>

                {mode === "hours" &&
                  Array.from({ length: 12 }, (_, i) => {
                    const h = i + 1,
                      p = pos12(h),
                      sel = h === hour;
                    return (
                      <g key={h}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="6.5"
                          fill={sel ? "var(--primary)" : "transparent"}
                        />
                        <text
                          x={p.x}
                          y={p.y + 0.5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="6"
                          fontWeight="900"
                          fill={sel ? "#000" : "#fff"}
                          style={{ userSelect: "none" }}
                        >
                          {h}
                        </text>
                      </g>
                    );
                  })}

                {mode === "minutes" &&
                  MINUTES.map((m) => {
                    const p = posMin(m),
                      sel = m === minute;
                    return (
                      <g key={m}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="6.5"
                          fill={sel ? "var(--primary)" : "transparent"}
                        />
                        <text
                          x={p.x}
                          y={p.y + 0.5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="5"
                          fontWeight="900"
                          fill={sel ? "#000" : "#fff"}
                          style={{ userSelect: "none" }}
                        >
                          {m === 0 ? "00" : m}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            </div>

            {/* Action Buttons */}
            <div className="px-5 pb-4 flex gap-3">
              {mode === "hours" && (
                <Button
                  onClick={() => setMode("minutes")}
                  className="flex-1 py-2.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-[8px] hover:bg-primary/20 transition-all"
                >
                  Next ΓåÆ
                </Button>
              )}
              {mode === "minutes" && (
                <>
                  <Button
                    onClick={() => setMode("hours")}
                    className="flex-1 py-2.5 border border-border text-muted-foreground text-[9px] font-black uppercase tracking-widest rounded-[8px] hover:text-white transition-all"
                  >
                    ΓåÉ Back
                  </Button>
                  <Button
                    onClick={() => confirm(minute)}
                    className="flex-1 py-2.5 bg-primary text-black text-[9px] font-black uppercase tracking-widest rounded-[8px] hover:bg-white transition-all"
                  >
                    Confirm
                  </Button>
                </>
              )}
            </div>
          </div>,
          document.getElementById("root") || document.body
        )}
    </>
  );
};

export default ClockPicker;
