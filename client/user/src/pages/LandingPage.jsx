import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  MapPin,
  Gamepad2,
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
const StadiumIcon = ({ size = 24, className }) => {
  const adjustedSize = size + 4;
  return (
    <svg width={adjustedSize} height={adjustedSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7V3L7 5L3 7ZM18 7V3L22 5L18 7ZM11 6V2L15 4L11 6ZM11 22C9.73333 21.9667 8.55433 21.8627 7.463 21.688C6.37167 21.5133 5.42167 21.2923 4.613 21.025C3.80433 20.7577 3.16667 20.4493 2.7 20.1C2.23333 19.7507 2 19.384 2 19V10C2 9.58333 2.26267 9.196 2.788 8.838C3.31333 8.48 4.02567 8.16333 4.925 7.888C5.82433 7.61267 6.88267 7.396 8.1 7.238C9.31733 7.08 10.6173 7.00067 12 7C13.3827 6.99933 14.6827 7.07867 15.9 7.238C17.1173 7.39733 18.1757 7.614 19.075 7.888C19.9743 8.162 20.687 8.47867 21.213 8.838C21.739 9.19733 22.0013 9.58467 22 10V19C22 19.3833 21.7667 19.75 21.3 20.1C20.8333 20.45 20.196 20.7583 19.388 21.025C18.58 21.2917 17.63 21.5127 16.538 21.688C15.446 21.8633 14.2667 21.9673 13 22V18H11V22ZM12 11C13.6167 11 15.0127 10.904 16.188 10.712C17.3633 10.52 18.3007 10.2993 19 10.05C19 9.96667 18.3667 9.771 17.1 9.463C15.8333 9.155 14.1333 9.00067 12 9C9.86667 8.99933 8.16667 9.15367 6.9 9.463C5.63333 9.77233 5 9.968 5 10.05C5.7 10.3 6.63733 10.521 7.812 10.713C8.98667 10.905 10.3827 11.0007 12 11ZM9 19.85V16H15V19.85C16.3333 19.7167 17.425 19.521 18.275 19.263C19.125 19.005 19.7 18.7757 20 18.575V11.8C19.0833 12.1667 17.9333 12.4583 16.55 12.675C15.1667 12.8917 13.65 13 12 13C10.35 13 8.83333 12.8917 7.45 12.675C6.06667 12.4583 4.91667 12.1667 4 11.8V18.575C4.3 18.775 4.875 19.0043 5.725 19.263C6.575 19.5217 7.66667 19.7173 9 19.85Z" fill="currentColor"/>
    </svg>
  );
};

import CardNav from "../shared/components/ui/CardNav";
import Dock from "../shared/components/ui/Dock";
import ComparisonTable from "../shared/components/ui/ComparisonTable";
import Masonry from "@components/ui/Masonry";
import MobileMasonrySlider from "@components/ui/MobileMasonrySlider";
import TestimonialMarquee from "./HomeSections/TestimonialMarquee";
import { Button } from "@kridaz/ui";


// Menu items for CardNav
const cardNavItems = [
  {
    label: "Play",
    bgColor: "var(--background)",
    textColor: "#fff",
    links: [
      { label: "Venues", href: "/venues", ariaLabel: "Browse Venues" },
      { label: "Players", href: "/players", ariaLabel: "Find Players" },
      { label: "Leaderboard", href: "/leaderboard", ariaLabel: "Leaderboards" },
      { label: "Login / Register", href: "/login", ariaLabel: "Login" },
    ],
  },
  {
    label: "Manage",
    bgColor: "var(--background)",
    textColor: "#fff",
    links: [
      {
        label: "List your venue",
        href: "/business/venue",
        ariaLabel: "List your venue",
      },
      {
        label: "Score Your Match",
        href: "/scoring",
        ariaLabel: "Score Your Match",
      },
    ],
  },
  {
    label: "Support",
    bgColor: "var(--background)",
    textColor: "#fff",
    links: [
      { label: "Help and FAQs", href: "/faq", ariaLabel: "Help and FAQs" },
      {
        label: "Raise a Request",
        href: "/support",
        ariaLabel: "Raise a Request",
      },
      {
        label: "Terms and Conditions",
        href: "/terms-of-service",
        ariaLabel: "Terms and Conditions",
      },
      {
        label: "Privacy Policy",
        href: "/privacy-policy",
        ariaLabel: "Privacy Policy",
      },
    ],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isBottomNavOpen, setIsBottomNavOpen] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slides = [
    // Slide 1
    <div className="w-full h-full relative" key="slide1">
      <img
        src="/slide1.png?v=6"
        alt="Kridaz Experience"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>,

    // Slide 2
    <div className="w-full h-full relative" key="slide2">
      <img
        src="/slide2.png?v=6"
        alt="Kridaz App Features"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>,

    // Slide 3
    <div className="w-full h-full relative" key="slide3">
      <img
        src="/slide3.png?v=6"
        alt="Discover Community"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>,

    // Slide 4
    <div className="w-full h-full relative" key="slide4">
      <img
        src="/slide4.png?v=6"
        alt="Join the Action"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>,

    // Slide 5
    <div className="w-full h-full relative" key="slide5">
      <img
        src="/slide5.png?v=6"
        alt="Download Kridaz"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>,

    // Slide 6: Comparison Table
    <div
      className="w-full h-full flex flex-col p-8 pt-32 md:p-16 md:pt-40"
      key="table"
    >
      <ComparisonTable />
    </div>,

    // Slide 5: Masonry Gallery
    <div
      className="w-full h-full flex flex-col p-8 pt-32 md:p-16 md:pt-40 overflow-y-auto landing-scrollbar"
      key="gallery"
    >
      <div className="mb-8">
        <h2 className="text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white">
          The <span className="text-primary">Ecosystem</span> in Action
        </h2>
      </div>
      <div className="hidden md:block w-full">
        <Masonry
          items={[
            { id: "1", img: "/host-venue-bg-custom.png", height: 300 },
            {
              id: "2",
              img: "https://picsum.photos/id/1015/600/900",
              height: 200,
            },
            { id: "3", img: "/tournament-bg.png", height: 400 },
            {
              id: "4",
              img: "https://picsum.photos/id/1011/600/750",
              height: 250,
            },
            { id: "5", img: "/scoring_bg.png", height: 350 },
            {
              id: "6",
              img: "https://picsum.photos/id/1020/600/800",
              height: 300,
            },
            { id: "7", img: "/interests_bg.png", height: 250 },
            {
              id: "8",
              img: "https://picsum.photos/id/1021/600/600",
              height: 300,
            },
            { id: "9", img: "/auth-bg.png", height: 400 },
          ]}
          ease="power3.out"
          duration={0.6}
          stagger={0.05}
          animateFrom="bottom"
          scaleOnHover={true}
          hoverScale={0.95}
          blurToFocus={true}
          colorShiftOnHover={false}
        />
      </div>
      <div className="block md:hidden">
        <MobileMasonrySlider
          items={[
            { id: "1", img: "/host-venue-bg-custom.png" },
            { id: "2", img: "https://picsum.photos/id/1015/600/900" },
            { id: "3", img: "/tournament-bg.png" },
          ]}
        />
      </div>
    </div>,

    // Slide 6: All Testimonials combined
    <div
      className="w-full h-full flex flex-col p-8 pt-32 md:p-16 md:pt-40"
      key="testimonials"
    >
      <TestimonialMarquee />
    </div>,
  ];

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return; // Pause slider when hovering over the track
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds to allow reading tables/grids
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white font-sans overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(191,243,103,0.05),rgba(255,255,255,0))] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* MIDDLE SECTION (Single Item Sliding Carousel) - FULL SCREEN */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {slides.map((slide, index) => (
            <div key={index} className="min-w-full w-full h-full shrink-0">
              {slide}
            </div>
          ))}
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 flex flex-col items-center gap-3 z-30">
          <Button
            onClick={prevSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-black hover:bg-primary hover:border-primary transition-all shadow-lg"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </Button>
          <Button
            onClick={nextSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-black hover:bg-primary hover:border-primary transition-all shadow-lg"
            aria-label="Next Slide"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      {/* HEADER (CardNav Expanding Top Strip) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-hidden">
        <CardNav
          logo="/logo.png"
          items={cardNavItems}
          menuColor="#fff"
          baseColor="rgba(10, 10, 10, 0.8)"
          headerExtra={
            <Link
              to="/business/venue"
              className="flex items-center gap-2 text-white/90 hover:text-primary transition-colors text-sm md:text-base font-bold tracking-wide"
            >
              List your sports venue
            </Link>
          }
        />
      </div>

      {/* Side Box Icon Toggle */}
      <Button
        onClick={() => setIsBottomNavOpen(!isBottomNavOpen)}
        className="absolute bottom-6 left-6 md:left-12 z-50 fluid-glass w-12 h-[43px] rounded-[8px] flex items-center justify-center text-white/70 hover:text-white hover:border-primary/50 hover:shadow-[0_0_15px_rgba(191,243,103,0.3)] transition-all cursor-pointer"
        aria-label="Toggle Bottom Navigation"
      >
        {isBottomNavOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* FOOTER (Floating Bottom Strip) */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 fluid-glass px-8 rounded-[8px] flex items-center justify-center w-[90%] max-w-[721px] h-[43px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isBottomNavOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-center gap-6 sm:gap-10 w-full">
          <Link
            to="/venues"
            className="text-white/40 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Venues
          </Link>
          <Link
            to="/players"
            className="text-white/40 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Players
          </Link>
          <Link
            to="/leaderboard"
            className="text-white/40 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Scoring
          </Link>
          <Link
            to="/about"
            className="text-white/40 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors hidden sm:block"
          >
            Company
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Dock */}
      <div className="md:hidden block absolute bottom-0 w-full z-50">
        <Dock
          items={[
            {
              label: "Home",
              icon: <Home size={18} />,
              onClick: () => navigate("/"),
            },
            {
              label: "Venues",
              icon: <StadiumIcon size={18} />,
              onClick: () => navigate("/venues"),
            },
            {
              label: "Scoring",
              icon: <Gamepad2 size={18} />,
              onClick: () => navigate("/leaderboard"),
            },
            {
              label: "Players",
              icon: <Users size={18} />,
              onClick: () => navigate("/players"),
            },
            {
              label: "Register",
              icon: <UserPlus size={18} />,
              onClick: () => navigate("/login"),
            },
          ]}
          panelHeight={64}
          baseItemSize={44}
          magnification={60}
        />
      </div>
    </div>
  );
}
