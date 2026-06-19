import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Activity,
  IndianRupee,
  Star,
} from "lucide-react";

const ProfessionalBottomNav = () => {
  const location = useLocation();
  const { role } = useParams();

  const navItems = [
    { name: "Overview", path: `/professional/${role}`, icon: LayoutDashboard },
    { name: "Profile", path: `/professional/${role}/profile`, icon: User },
    {
      name: "Bookings",
      path: `/professional/${role}/bookings`,
      icon: Activity,
    },
    {
      name: "Payouts",
      path: `/professional/${role}/payouts`,
      icon: IndianRupee,
    },
    { name: "Reviews", path: `/professional/${role}/reviews`, icon: Star },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-3xl border-t border-white/10 rounded-t-[24px] px-4 pb-safe-area-inset-bottom transition-transform duration-500 translate-y-0 shadow-2xl">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          // Exact match for Overview to prevent it from highlighting on all sub-routes
          const isActive =
            location.pathname === item.path ||
            location.pathname === item.path + "/";
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-300 ${isActive ? "text-[#BFF367]" : "text-white/40 hover:text-white/60"}`}
            >
              <div
                className={`relative p-1.5 rounded-[8px] transition-all duration-300 ${isActive ? "bg-[#BFF367]/10 scale-110" : ""}`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#BFF367] rounded-full shadow-[0_0_8px_#BFF367]" />
                )}
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-60"}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ProfessionalBottomNav;
