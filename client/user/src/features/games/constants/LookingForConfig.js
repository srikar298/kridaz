import { Users, UserCheck, Briefcase } from "lucide-react";

export const CONTACT_PREFERENCES = [
  { id: "KRIDAZ_DM", label: "Kridaz DM" },
  { id: "WHATSAPP", label: "WhatsApp" },
  { id: "CALL", label: "Call" },
];

export const LOOKING_FOR_CATEGORIES = [
  {
    id: "PLAYERS",
    label: "Players & Opponents",
    description: "Find players to join your team or challenge other teams",
    icon: Users,
    subCategories: [
      { 
        id: "CRICKET", 
        label: "Cricket", 
        roles: ["Batsman (Top-order)", "Batsman (Middle-order)", "Pace Bowler", "Spin Bowler", "Wicket Keeper", "All-Rounder", "Any"] 
      },
      { 
        id: "FOOTBALL", 
        label: "Football", 
        roles: ["Forward", "Midfielder", "Defender", "Goalkeeper", "Any"] 
      },
      { 
        id: "BASKETBALL", 
        label: "Basketball", 
        roles: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center", "Any"] 
      },
      { 
        id: "TENNIS", 
        label: "Tennis", 
        roles: ["Singles Player", "Doubles Partner", "Any"] 
      },
      { 
        id: "BADMINTON", 
        label: "Badminton", 
        roles: ["Singles Player", "Doubles Partner", "Mixed Doubles", "Any"] 
      },
      { 
        id: "VOLLEYBALL", 
        label: "Volleyball", 
        roles: ["Outside Hitter", "Opposite", "Setter", "Middle Blocker", "Libero", "Any"] 
      },
    ],
    fields: [
      { name: "requirementScope", label: "Duration / Scope", type: "radio", options: ["A Match", "Whole Day", "Tournament"] },
      { name: "date", label: "Date", type: "date" },
      { name: "time", label: "Time", type: "time" },
      { name: "location", label: "Location", type: "location" },
      { name: "experienceLevel", label: "Experience Required", type: "select", options: ["Beginner", "Intermediate", "Advanced", "Professional", "Any"] },
      { name: "genderPreference", label: "Gender Preference", type: "select", options: ["Male Only", "Female Only", "Mixed / Any"] },
      { name: "ageGroup", label: "Age Group", type: "select", options: ["Under 18", "18-25", "26-35", "35+", "Any Age"] },
    ]
  },
  {
    id: "PROFESSIONALS",
    label: "Professionals & Officials",
    description: "Hire umpires, scorers, coaches, or commentators",
    icon: UserCheck,
    subCategories: [
      { 
        id: "CRICKET", 
        label: "Cricket", 
        roles: ["Umpire", "Scorer", "Coach", "Commentator", "Net Bowler"] 
      },
      { 
        id: "FOOTBALL", 
        label: "Football", 
        roles: ["Referee", "Linesman", "Coach"] 
      },
      { 
        id: "BASKETBALL", 
        label: "Basketball", 
        roles: ["Referee", "Coach"] 
      },
    ],
    fields: [
      { name: "requirementScope", label: "Duration / Scope", type: "radio", options: ["A Match", "Whole Day", "Tournament"] },
      { name: "budget", label: "Budget (₹) - Optional", type: "number", placeholder: "e.g. 500" },
      { name: "date", label: "Date", type: "date" },
      { name: "time", label: "Time", type: "time" },
      { name: "location", label: "Location", type: "location" },
      { name: "experienceLevel", label: "Experience Required", type: "select", options: ["Beginner", "Intermediate", "Advanced", "Professional", "Any"] },
    ]
  },
  {
    id: "SERVICES",
    label: "Services & Vendors",
    description: "Find photographers, event managers, physios, etc.",
    icon: Briefcase,
    subCategories: [
      { 
        id: "MEDIA", 
        label: "Media & Coverage", 
        roles: ["Photographer", "Videographer", "Drone Operator", "Live Streamer"] 
      },
      { 
        id: "MEDICAL", 
        label: "Medical Support", 
        roles: ["Physiotherapist", "First Aid Provider"] 
      },
      { 
        id: "EVENT", 
        label: "Event Management", 
        roles: ["Event Organizer", "Caterer", "Equipment Rental"] 
      }
    ],
    fields: [
      { name: "requirementScope", label: "Duration / Scope", type: "radio", options: ["Hours", "Whole Day", "Multiple Days"] },
      { name: "budget", label: "Budget (₹) - Optional", type: "number", placeholder: "e.g. 5000" },
      { name: "date", label: "Date", type: "date" },
      { name: "location", label: "Location", type: "location" },
    ]
  }
];
