import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    text: "We never needed to do much marketing as we started getting bookings from Day 1, thanks to the visibility and convenience of Kridaz. Their platform simplifies booking management, staff management, and payment collection.",
    initials: "IP",
    name: "Imran Patel",
    title: "The Willingdon Sports Club",
  },
  {
    text: "Managing 18 facilities across with sports like Football, Box Cricket & Pickleball would have been overwhelming if we weren't using Kridaz. Its seamless automation for bookings, lead generation, and payment collection has really helped to streamline our operations.",
    initials: "SS",
    name: "Samir Sahni",
    title: "CEO | Claygrounds",
  },
  {
    text: "The live cross-platform syncing is flawless. We used to struggle with double bookings all the time, but now it's completely automated. Staff roles also make it super easy to let my team handle operations.",
    initials: "PS",
    name: "Priya Sharma",
    title: "Director | Elite Sports",
  },
  {
    text: "Kridaz has been a game-changer for managing our five venues with multiple courts. From automating bookings to streamlining invoicing, accounting, and payment collection, it has simplified operations that would've required a large team otherwise.",
    initials: "RS",
    name: "Rehan Sumar",
    title: "Founder | VPadel",
  },
  {
    text: "Our revenue literally doubled after we switched to Kridaz. The dynamic pricing alone helps us maximize court utilization on weekends. I can't imagine running my venue without this platform now.",
    initials: "AR",
    name: "Arjun Reddy",
    title: "Manager | Smash Arena",
  },
  {
    text: "Instant payouts mean we never have cash flow issues. The platform is robust, the analytics dashboard gives us exactly the data we need, and the support team is incredible.",
    initials: "KM",
    name: "Karan Mehta",
    title: "Owner | Turf City",
  },
];

// Duplicate each column 4 times for infinite smooth scrolling
const col1Base = [testimonials[0], testimonials[3]];
const col2Base = [testimonials[1], testimonials[4]];
const col3Base = [testimonials[2], testimonials[5]];

const col1 = [...col1Base, ...col1Base, ...col1Base, ...col1Base];
const col2 = [...col2Base, ...col2Base, ...col2Base, ...col2Base];
const col3 = [...col3Base, ...col3Base, ...col3Base, ...col3Base];

const TestimonialCard = ({ item }) => (
  <div className="bg-card border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full cursor-default hover:bg-card hover:border-white/10 transition-colors duration-300">
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="w-[14px] h-[14px] fill-[#F5C518] text-[#F5C518]"
        />
      ))}
    </div>
    <p className="text-white/80 text-[13px] md:text-[14px] leading-relaxed font-inter font-medium">
      "{item.text}"
    </p>
    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-white/5">
      <div className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center text-white/90 text-sm font-bold font-inter">
        {item.initials}
      </div>
      <div className="flex flex-col">
        <h4 className="text-white font-bold text-[13px] font-inter leading-tight">
          {item.name}
        </h4>
        <p className="text-white/40 text-[11px] font-inter mt-1 leading-none">
          {item.title}
        </p>
      </div>
    </div>
  </div>
);

export default function TestimonialMarquee() {
  return (
    <div className="w-full flex flex-col items-center justify-center h-full max-w-[1200px] mx-auto px-4 md:px-8">
      {/* Title */}
      <div className="w-full mb-8 z-10 relative text-left">
        <h2 className="text-[36px] font-medium tracking-tight font-poppins normal-case text-white">
          Voices of the <span className="text-primary">Arena</span>
        </h2>
      </div>

      {/* Marquee Wrapper */}
      <div className="relative w-full h-[600px] overflow-hidden mask-vertical-faded">
        {/* We use pointer-events-auto inside a relative container to allow hovering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 absolute inset-x-0 top-0">
          {/* Column 1 */}
          <div 
            className="!flex flex-col gap-6 animate-marquee-vertical hover:[animation-play-state:paused]"
            style={{ animationDuration: "90s" }}
          >
            {col1.map((item, i) => (
              <TestimonialCard key={`c1-${i}`} item={item} />
            ))}
          </div>

          {/* Column 2 */}
          <div
            className="hidden md:flex flex-col gap-6 animate-marquee-vertical hover:[animation-play-state:paused]"
            style={{ animationDuration: "90s" }}
          >
            {col2.map((item, i) => (
              <TestimonialCard key={`c2-${i}`} item={item} />
            ))}
          </div>

          {/* Column 3 */}
          <div
            className="hidden md:flex flex-col gap-6 animate-marquee-vertical hover:[animation-play-state:paused]"
            style={{ animationDuration: "90s" }}
          >
            {col3.map((item, i) => (
              <TestimonialCard key={`c3-${i}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
