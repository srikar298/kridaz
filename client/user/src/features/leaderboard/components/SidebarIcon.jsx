import React from "react";

const SidebarIcon = ({ icon: Icon, active, onClick, label }) => (
  <div
    onClick={onClick}
    className={`p-3 w-20 rounded-[8px] transition-all cursor-pointer flex flex-col items-center gap-1 group ${active ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(85, 222, 232,0.1)]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span
      className={`text-[7px] font-black uppercase tracking-widest text-center truncate w-full ${active ? "text-primary" : "text-gray-600 group-hover:text-gray-400"}`}
    >
      {label}
    </span>
  </div>
);

export default SidebarIcon;
