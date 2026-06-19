import { Trophy, Activity, Target, ShieldCheck, Zap } from "lucide-react";

const testimonials = [
  {
    name: "Alex Mercer",
    profession: "Pro Footballer",
    description:
      "Kridaz completely changed how I find matches. The matchmaking is insane, and the real-time scoring makes every casual game feel like a league final.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    Logo: Trophy,
  },
  {
    name: "Sarah Jenkins",
    profession: "Venue Owner",
    description:
      "Since listing our turf on the ecosystem, our off-peak hours are fully booked. The automated management tools are a lifesaver.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    Logo: Activity,
  },
  {
    name: "Marcus Chen",
    profession: "Tennis Coach",
    description:
      "A fantastic platform to connect with new students. The community features help me organize clinics effortlessly. Highly recommended.",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    Logo: Target,
  },
  {
    name: "Elena Rodriguez",
    profession: "League Organizer",
    description:
      "Managing tournaments used to be a nightmare. With Kridaz, brackets update instantly and players stay informed automatically.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    Logo: ShieldCheck,
  },
  {
    name: "David Kim",
    profession: "Esports Athlete",
    description:
      "The cross-platform integration is flawless. Finding scrims and tracking our team's performance has never been this easy.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    Logo: Zap,
  },
];

const duplicatedTestimonials = [...testimonials, ...testimonials];

const FUITestimonialWithSlide = () => {
  return (
    <section className="relative w-full py-8 md:py-12">
      <div className="w-full">
        <div className="max-w-[800px] mx-auto px-6 mb-8">
          <h2 className="text-[20px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case">
            Voices of the <span className="text-[#BFF367]">Arena</span>
          </h2>
        </div>

        <div
          style={{
            maskImage:
              "linear-gradient(to left, transparent 0%, black 15%, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to left, transparent 0%, black 15%, black 85%, transparent 100%)",
          }}
          className="flex relative overflow-hidden shrink-0 max-w-full"
        >
          <div className="flex animate-x-slider gap-5 w-max">
            {duplicatedTestimonials.map((testimonial, indx) => {
              const Logo = testimonial.Logo;
              return (
                <div
                  key={indx}
                  className="border-[1.2px] flex flex-col bg-[#111] border-white/10 rounded-3xl shrink-0 grow-0 w-[350px] md:w-[450px] h-full group hover:border-[#BFF367]/30 transition-colors"
                >
                  <p className="px-8 py-8 text-pretty text-lg md:text-xl font-medium text-white/80 italic leading-relaxed">
                    &quot;{testimonial.description}&quot;
                  </p>
                  <div className="border-t-[1.2px] w-full flex gap-1 overflow-hidden border-white/5 mt-auto">
                    <div className="w-3/4 flex gap-4 items-center px-6 py-4">
                      <img
                        src={testimonial.avatar}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                      />
                      <div className="flex flex-col flex-1 gap-0 justify-center items-start">
                        <h5 className="text-white font-bold text-base md:text-lg">
                          {testimonial.name}
                        </h5>
                        <p className="text-[#BFF367] mt-[-2px] text-xs font-black uppercase tracking-widest">
                          {testimonial.profession}
                        </p>
                      </div>
                    </div>
                    <div className="w-[1px] bg-white/10" />
                    <div className="max-w-full self-center px-6 flex items-center justify-center flex-1">
                      <Logo
                        size={28}
                        className="text-white/20 group-hover:text-[#BFF367] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FUITestimonialWithSlide;
