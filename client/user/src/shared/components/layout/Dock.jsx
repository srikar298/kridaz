"use client";

import React, {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import "./Dock.css";

function DockItem({
  children,
  className = "",
  onClick,
  mousePos,
  spring,
  distance,
  magnification,
  baseItemSize,
  direction,
  ariaLabel,
}) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mousePos, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      y: 0,
      width: baseItemSize,
      height: baseItemSize,
    };
    const boundsVal = direction === "vertical" ? rect.y : rect.x;
    return val - boundsVal - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${direction === "vertical" ? "vertical" : ""} ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-label={ariaLabel}
    >
      {Children.map(children, (child) =>
        cloneElement(child, { isHovered, direction })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = "", ...rest }) {
  const { isHovered, direction } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  const isVertical = direction === "vertical";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={isVertical ? { opacity: 0, x: 0 } : { opacity: 0, y: 0 }}
          animate={isVertical ? { opacity: 1, x: 10 } : { opacity: 1, y: -10 }}
          exit={isVertical ? { opacity: 0, x: 0 } : { opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${isVertical ? "vertical" : ""} ${className}`}
          role="tooltip"
          style={isVertical ? { y: "-50%" } : { x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockSubmenu({ subItems, className = "", ...rest }) {
  const { isHovered, direction } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  const isVertical = direction === "vertical";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={isVertical ? { opacity: 0, x: 0 } : { opacity: 0, y: 0 }}
          animate={isVertical ? { opacity: 1, x: 10 } : { opacity: 1, y: -10 }}
          exit={isVertical ? { opacity: 0, x: 0 } : { opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-submenu ${isVertical ? "vertical" : ""} ${className}`}
          role="menu"
          style={isVertical ? { y: "-50%" } : { x: "-50%" }}
        >
          {subItems.map((sub, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                sub.onClick();
              }}
              className="dock-submenu-item"
              role="menuitem"
            >
              {sub.label}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "" }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
  direction = "horizontal",
}) {
  const mousePos = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxDimension = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const dimensionRow = useTransform(
    isHovered,
    [0, 1],
    [panelHeight, maxDimension]
  );
  const dimension = useSpring(dimensionRow, spring);

  const isVertical = direction === "vertical";

  return (
    <motion.div
      style={{
        [isVertical ? "width" : "height"]: dimension,
        scrollbarWidth: "none",
      }}
      className={`dock-outer ${isVertical ? "vertical" : ""}`}
    >
      <motion.div
        onMouseMove={({ pageX, pageY }) => {
          isHovered.set(1);
          mousePos.set(isVertical ? pageY : pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mousePos.set(Infinity);
        }}
        className={`dock-panel ${isVertical ? "vertical" : ""} ${className}`}
        style={{ [isVertical ? "width" : "height"]: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mousePos={mousePos}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            direction={direction}
            ariaLabel={item.label}
          >
            <DockIcon>{item.icon}</DockIcon>
            {item.subItems ? (
              <DockSubmenu subItems={item.subItems} />
            ) : (
              <DockLabel>{item.label}</DockLabel>
            )}
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
