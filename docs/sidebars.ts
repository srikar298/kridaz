import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";
// @ts-ignore
import apiSidebar from "./docs/api/sidebar.ts";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "intro",
    {
      type: "category",
      label: "Platform Guide (Web Portal)",
      items: [
        "platform-guide/overview",
        "platform-guide/auth",
        "platform-guide/homepage",
        "platform-guide/venues",
        "platform-guide/ground",
        "platform-guide/checkout",
        "platform-guide/wallet",
        "platform-guide/messaging-community",
        "platform-guide/nearby-players",
        "platform-guide/professionals",
      ],
    },
    {
      type: "category",
      label: "Platform Guide (Application Portals)",
      items: [
        "platform-guide/user-profile",
        "platform-guide/bookings",
        "platform-guide/hosted-games",
        "platform-guide/my-teams",
        "platform-guide/leaderboard",
        "platform-guide/scoring",
        "platform-guide/owner-dashboard",
        "platform-guide/umpire-analytics",
        "platform-guide/universal-dashboard",
      ],
    },
    {
      type: "category",
      label: "Backend (Project Bible)",
      items: [
        "backend/onboarding",
        "backend/architecture",
        "backend/module-guide",
        "backend/security",
        {
          type: "category",
          label: "Recommendation Engines",
          items: [
            "backend/recommendation-engines/overview",
            "backend/recommendation-engines/ground-engine",
            "backend/recommendation-engines/user-engine",
          ],
        },
        "backend/professional-profiles-spec",
        "backend/umpire-dispatch-engine",
      ],
    },
    {
      type: "category",
      label: "Upcoming Features",
      items: [
        "backend/ads-platform",
        "backend/tournament-stage-builder",
        {
          type: "category",
          label: "Tournament Stage Builder (Postgres)",
          items: [
            "backend/tournament/architecture",
            "backend/tournament/prompts",
          ],
        },
        "backend/voice-rooms",
        "backend/professional-profile-view",
      ],
    },
    {
      type: "category",
      label: "Frontend",
      items: [
        "frontend/ARCHITECTURE",
        "frontend/STATE_MANAGEMENT",
        "frontend/COMPONENT_DESIGN",
        "frontend/API_INTEGRATION",
      ],
    },
  ],
  apiSidebar: [
    {
      type: "category",
      label: "Kridaz API",
      link: {
        type: "generated-index",
        title: "Kridaz API Reference",
        description: "Complete API documentation for the Kridaz platform.",
        slug: "/api",
      },
      items: apiSidebar,
    },
  ],
};

export default sidebars;
