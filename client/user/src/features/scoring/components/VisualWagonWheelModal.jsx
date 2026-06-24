import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@kridaz/ui";


const POSITIONS = [
  "LONG_OFF", // Top-left sector
  "LONG_ON", // Top-right sector
  "DEEP_MID_WICKET", // Right-top
  "DEEP_SQUARE_LEG", // Right-bottom
  "DEEP_FINE_LEG", // Bottom-right
  "THIRD_MAN", // Bottom-left
  "DEEP_POINT", // Left-bottom
  "DEEP_COVER", // Left-top
];

// Determine position based on angle
// Angle 0 is straight UP (Long Off / Long On boundary)
// Assuming clock-wise angle from top
const getPositionKey = (angle) => {
  // Normalize angle to 0 - 360
  let a = (angle + 360) % 360;

  if (a >= 0 && a < 45) return "LONG_ON";
  if (a >= 45 && a < 90) return "DEEP_MID_WICKET";
  if (a >= 90 && a < 135) return "DEEP_SQUARE_LEG";
  if (a >= 135 && a < 180) return "DEEP_FINE_LEG";
  if (a >= 180 && a < 225) return "THIRD_MAN";
  if (a >= 225 && a < 270) return "DEEP_POINT";
  if (a >= 270 && a < 315) return "DEEP_COVER";
  if (a >= 315 && a < 360) return "LONG_OFF";

  return "LONG_ON";
};

const getDistanceKey = (radiusPercent) => {
  if (radiusPercent <= 0.33) return "SHORT";
  if (radiusPercent <= 0.66) return "MID";
  return "BOUNDARY";
};

const VisualWagonWheelModal = ({ runs, isBoundary, onConfirm, onClose }) => {
  const svgRef = useRef(null);

  const handleClick = (e) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = rect.width / 2; // Assuming a square aspect ratio

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dx = clickX - centerX;
    const dy = clickY - centerY;

    // Distance from center
    const distanceToClick = Math.sqrt(dx * dx + dy * dy);

    // Ignore clicks completely outside the outer circle
    if (distanceToClick > radius) return;

    // Angle in degrees (0 is up, clockwise)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // atan2 is 0 at Right (3 o'clock). We want 0 at Top (12 o'clock).
    // So shift by +90 degrees.
    angle = angle + 90;
    if (angle < 0) angle += 360;

    const radiusPercent = distanceToClick / radius;

    const positionKey = getPositionKey(angle);
    // If it's a boundary, force it to boundary distance, otherwise calculate.
    const distanceKey = isBoundary ? "BOUNDARY" : getDistanceKey(radiusPercent);

    onConfirm({ position: positionKey, distance: distanceKey });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-sm bg-card rounded-[8px] border border-white/5 overflow-hidden z-10 p-6 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">
              Select Shot Direction
            </h2>
            <Button
              onClick={onClose}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Close
            </Button>
          </div>

          {/* SVG Wheel Area */}
          <div className="relative w-full aspect-square flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox="0 0 200 200"
              className="w-full h-full cursor-crosshair overflow-visible"
              onClick={handleClick}
            >
              <defs>
                <clipPath id="circleClip">
                  <circle cx="100" cy="100" r="100" />
                </clipPath>
              </defs>

              {/* Rings */}
              {/* Outer */}
              <circle
                cx="100"
                cy="100"
                r="98"
                fill="#141E18"
                stroke="#165133"
                strokeWidth="4"
              />
              {/* Mid */}
              <circle
                cx="100"
                cy="100"
                r="66"
                fill="transparent"
                stroke="#1F3325"
                strokeWidth="1"
              />
              {/* Inner */}
              <circle
                cx="100"
                cy="100"
                r="33"
                fill="transparent"
                stroke="#1F3325"
                strokeWidth="1"
              />

              {/* 8 Sector Lines */}
              <g stroke="#1F3325" strokeWidth="1" clipPath="url(#circleClip)">
                <line x1="100" y1="100" x2="100" y2="0" />
                <line x1="100" y1="100" x2="170.7" y2="29.3" />
                <line x1="100" y1="100" x2="200" y2="100" />
                <line x1="100" y1="100" x2="170.7" y2="170.7" />
                <line x1="100" y1="100" x2="100" y2="200" />
                <line x1="100" y1="100" x2="29.3" y2="170.7" />
                <line x1="100" y1="100" x2="0" y2="100" />
                <line x1="100" y1="100" x2="29.3" y2="29.3" />
              </g>

              {/* Pitch */}
              <rect
                x="92"
                y="80"
                width="16"
                height="40"
                rx="3"
                fill="#2E4A35"
                stroke="#417351"
                strokeWidth="1.5"
              />
              <line
                x1="92"
                y1="90"
                x2="108"
                y2="90"
                stroke="#417351"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1="92"
                y1="110"
                x2="108"
                y2="110"
                stroke="#417351"
                strokeWidth="1"
                opacity="0.5"
              />

              {/* Text Labels Overlay */}
              <text
                x="100"
                y="25"
                fill="#5F7666"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="1"
              >
                STRAIGHT
              </text>
              <text
                x="100"
                y="180"
                fill="#5F7666"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="1"
              >
                BEHIND
              </text>

              <text
                x="175"
                y="100"
                fill="#5F7666"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="1"
                transform="rotate(90 175,100)"
              >
                LEG SIDE
              </text>
              <text
                x="25"
                y="100"
                fill="#5F7666"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="1"
                transform="rotate(-90 25,100)"
              >
                OFF SIDE
              </text>
            </svg>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-neutral-500 italic">
              Tap on the field where the ball was hit
            </p>
            {runs !== undefined && (
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                Scoring {runs} Run{runs !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <Button
            onClick={() => onConfirm({ position: null, distance: null })}
            className="mt-6 w-full py-3 rounded-[8px] border border-white/10 text-neutral-400 text-sm font-bold hover:bg-white/5 transition-colors"
          >
            Skip Wagon Wheel
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VisualWagonWheelModal;
