import React, { useEffect, useRef } from "react";

export const BentoItem = ({ className, children }) => {
  const itemRef = useRef(null);
  const MAX_ROTATION = 10;

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    // Use default Tailwind transitions for other properties (colors, borders),
    // but we need to strictly manage `transform` transitions.
    item.style.transitionProperty =
      "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, filter, backdrop-filter";
    item.style.transitionDuration = "300ms";
    item.style.transitionTimingFunction = "cubic-bezier(0.4, 0, 0.2, 1)";

    const handleMouseMove = (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Calculate rotation
      const rotateY = ((x - centerX) / centerX) * MAX_ROTATION;
      const rotateX = (-(y - centerY) / centerY) * MAX_ROTATION;

      item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      // Allow transform to transition smoothly back to 0
      item.style.transitionProperty = "all";
      item.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";

      // Reset transition back to non-transform properties after it finishes
      setTimeout(() => {
        if (itemRef.current) {
          itemRef.current.style.transitionProperty =
            "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, filter, backdrop-filter";
        }
      }, 500);
    };

    item.addEventListener("mousemove", handleMouseMove);
    item.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      item.removeEventListener("mousemove", handleMouseMove);
      item.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={itemRef}
      className={`bento-item cursor-pointer ${className || ""}`}
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </div>
  );
};
