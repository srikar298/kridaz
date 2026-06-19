import CountUp from "react-countup";
import { TrendingUp } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  className,
  prefix = "",
  trend,
  trendValue,
}) => (
  <div
    className={`relative overflow-hidden group p-3 md:p-6 rounded-[8px] md:rounded-[8px] transition-all duration-500 hover:scale-[1.02] border border-white/5 bg-[#0A0A0A] ${className}`}
  >
    {/* Subtle Background Glow */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-all duration-700" />

    <div className="relative z-10 flex justify-between items-start mb-4">
      <div className="space-y-1">
        <p className="text-[8px] md:text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-[#55DEE8] transition-colors">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          {prefix && (
            <span className="text-xl font-bold text-[#55DEE8]">{prefix}</span>
          )}
          <div className="text-lg md:text-4xl font-bold tracking-tight text-white leading-none">
            <CountUp end={value || 0} duration={2.5} separator="," />
          </div>
        </div>
      </div>

      {Icon && (
        <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-white/5 rounded-lg md:rounded-[8px] border border-white/5 group-hover:border-[#55DEE8]/30 transition-all">
          <Icon
            className="text-[#55DEE8] group-hover:scale-110 transition-transform"
            size={16}
            md:size={20}
          />
        </div>
      )}
    </div>

    {trend && (
      <div
        className={`flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] ${trend === "up" ? "text-[#55DEE8]" : "text-red-500"}`}
      >
        <div
          className={`flex items-center ${trend === "up" ? "rotate-0" : "rotate-180"}`}
        >
          <TrendingUp size={12} />
        </div>
        <span>
          {trend === "up" ? "+" : "-"}
          {trendValue}%
        </span>
        <span className="text-white/20">this month</span>
      </div>
    )}

    {/* Progress Indicator Accent */}
    <div className="relative h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
      <div className="absolute top-0 left-0 h-full bg-primary w-1/3 group-hover:w-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(85, 222, 232,0.6)]" />
    </div>
  </div>
);

export default StatCard;
