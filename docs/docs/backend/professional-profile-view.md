# Professional Profile View (User-Facing UI)

The user-facing **Professional Profile Page** allows athletes to browse, evaluate, and hire sports professionals (Coaches, Umpires, Scorers, Commentators, and Streamers). Designed with a premium sports-tech dashboard aesthetic, it consolidates credential checks, verified history, portfolios, and interactive calendars to enable direct slot booking and checkout.

![Professional Profile Mockup](/img/platform/prof_profile_view.png)

---

## 1. UI Structure & Elements

The interface is structured in a clear hierarchy, combining glassmorphic sections and high-impact visual grids:

### 1.1 Cover Banner & Identity Header

- **Cover Banner**: A full-width header image (Cloudinary asset) representing the professional's sport or club association.
- **Profile Avatar**: A circular high-resolution profile picture overlaid on the bottom-left of the banner.
- **Verified Name & Badge**: Displays the professional's full name alongside a glowing checkmark badge.
  - _Verification Logic_: The badge is displayed only if `User.isVerified === true` (verified by platform Admins).
- **Role & Title**: Role classifications (e.g. _"Senior Cricket Coach & Official | Level 4 Certified"_).
- **KPI Quick stats**:
  - **Experience**: Years in the industry (e.g. `10 yrs`).
  - **Bookings**: Lifetime completed matches/sessions (e.g. `240+`).
  - **Rating**: Numeric score with 5-star icons (e.g. `4.9 ★★★★★`).

### 1.2 Credentials & Achievements

- Lists verified certifications, awards, and historical roles.
- Key Items:
  - National / Regional awards.
  - Association Level Certifications (e.g., BCCI Level 4, FIFA Coach license).
  - Milestones (e.g., "Coached 50+ State Players").

### 1.3 Media & Portfolio Gallery

- A responsive thumbnail grid of photos and video recordings from training sessions or officiated matches.
- Videos feature a play overlay and duration tag, opening in a media modal on click.

### 1.4 Booking Calendar & Custom Slots

- **Interactive Calendar**: Shows available slot days and selectable time boxes.
  - **Selectable Slots**: Green buttons indicating open slots. Clicking a slot initiates checkout.
- **Request Custom Slot**: A button for matches or tournaments needing custom hours not listed on the calendar. Clicking it opens a form where users specify:
  - Date array and custom time window.
  - Detailed description of requirements.
  - Checkout CTA (redirects to the platform payment flow).

### 1.5 Reviews & Testimonials

- Cards displaying feedback left by match hosts or students.
- Fields: Customer Name, Avatar, Star Rating, Comment, and the Professional's reply.

---

## 2. Technical Definitions & Business Rules

- **Admin Verification**: Professionals submit documents (certifications, ID) during onboarding. Platform Admins review requests in the Admin Dashboard, toggling `User.isVerified` to `true`, which activates the green verification checkmark.
- **Escrow Payments**: When standard slots or accepted custom slots are booked, the fee is paid by the user and held in escrow (`EarningStatus.PENDING`). It is released to the professional's wallet (`EarningStatus.SETTLED`) only after the booking is completed.
- **Privacy Controls**: Contact details (email and phone) are only visible if:
  1. The user has an active booking with this professional.
  2. The professional has opted in to share contact details via their Profile Settings.

---

## 3. Code Architecture & Structures

The implementation uses the following components and database mappings:

### 3.1 React Frontend Components

Create these components in `client/user/src/features/professional/`:

```javascript
// ProfessionalProfileView.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortfolioGallery from "./components/PortfolioGallery";
import BookingCalendar from "./components/BookingCalendar";
import ReviewList from "./components/ReviewList";
import { axiosInstance } from "../../shared/utils/axios";

const ProfessionalProfileView = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/professionals/${id}/public-profile`
        );
        setProfile(response.data.profile);
      } catch (err) {
        console.error("Failed to load professional profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading)
    return (
      <div className="text-white text-center py-20">Loading profile...</div>
    );

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Cover Banner */}
      <div
        className="h-64 bg-cover bg-center relative border-b border-gray-800"
        style={{
          backgroundImage: `url(${profile.coverBanner || "/img/default-banner.png"})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Identity Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
          <img
            className="w-32 h-32 rounded-full border-4 border-cyan-400 bg-gray-900 object-cover shadow-lg"
            src={profile.user.profilePicture || "/img/default-avatar.png"}
            alt={profile.user.name}
          />
          <div className="mt-4 md:mt-0 flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-extrabold">{profile.user.name}</h1>
              {profile.user.isVerified && (
                <span className="bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border border-cyan-400/30">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-gray-400 mt-1">{profile.bio}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          {/* Column 1: Portfolio & Achievements */}
          <div className="space-y-8 lg:col-span-2">
            <div>
              <h2 className="text-xl font-bold border-b border-gray-800 pb-2 mb-4">
                Achievements
              </h2>
              <ul className="space-y-2 text-gray-300">
                {profile.achievements?.map((ach, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <span>🏆</span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
            <PortfolioGallery items={profile.portfolio} />
            <ReviewList reviews={profile.reviews} />
          </div>

          {/* Column 2: Booking Calendar */}
          <div className="bg-[#121212] p-6 rounded-2xl border border-gray-850 shadow-2xl h-fit">
            <h2 className="text-xl font-bold mb-4">Booking Calendar</h2>
            <BookingCalendar
              professionalId={profile.id}
              onSelectSlot={(slot) =>
                navigate("/checkout", { state: { slot, type: "professional" } })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProfileView;
```

### 3.2 Backend API & Controllers

Add this logic to the backend to support public profile requests:

```javascript
// server/modules/professional/professional.controller.js
export const getPublicProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await prisma.ownerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profilePicture: true,
            isVerified: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: { name: true, profilePicture: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Mask contact details if privacy controls prevent sharing
    const hasBookingHistory = await checkActiveBookingBetween(
      req.user?.id,
      profile.userId
    );
    if (!hasBookingHistory) {
      profile.user.email = undefined;
      profile.user.phone = undefined;
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Failed to load public profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
```

---

## 4. Role-Specific Profile Metadata

To support the diverse professional roles available on Kridaz, the user-facing profile renders specialized metadata cards. This data is stored dynamically in a JSONB column (`roleMetadata`) on the `OwnerProfile` database model and parsed by the frontend according to the professional's active role.

### 4.1 Umpire Profiles

Umpires require fields that highlight officiating authority, rules mastery, and match style.

- **Match Formats Handled**: Arrays of supported match formats (e.g., T20, One Day, Multi-Day, Indoor).
- **Sports Expertise**: Primary and secondary sports they are qualified to officiate (e.g., Cricket, Football).
- **Tournament Level Covered**: Highest level of competition officiated (e.g., Club, State, National, International League).
- **Officiating Style**: A brief description of their stance on field discipline and rules interpretation (e.g., "Proactive Communication", "Strict Rule Adherence").

### 4.2 Coach Profiles

Coaches focus on athletic growth, pedagogy, and tracking record of student success.

- **Performance Improvement Metrics**: Specific skills they specialize in improving (e.g., Bowling Speed, Batting Stance, Agility, Tactics).
- **Athlete Improvement Percentage**: Average statistical performance gain tracked across past students (e.g., "Average 15% increase in batting strike rate").
- **Coaching Style**: The pedagogical methodology used (e.g., "Video Analysis Feedback", "Technical Drills", "Holistic Player Development").
- **Sports Category**: Age and skill brackets they train (e.g., "Under-15", "Adult Beginners", "Elite Academy").

### 4.3 Streamer Profiles

Streamers need to present technological capabilities and video quality details to tournament organizers.

- **Platforms Supported**: Direct list of destinations they can broadcast to (e.g., YouTube, Facebook Live, Twitch, Custom RTMP).
- **Match or Event Types Covered**: Formats of sports production they handle (e.g., Local League Finals, Multi-Court Tournaments, Individual matches).
- **Multi-Camera Support**: Maximum simultaneous camera feeds managed (e.g., Single Cam, 3-Camera Setup with switcher).
- **Stream Quality**: Maximum transmission specifications (e.g., 1080p 60fps, 4K UHD).
- **Live Graphics Support**: Capabilities for overlaying tickers, lower thirds, animations, and ads (e.g., "Full score overlays, animated wickets, custom sponsors").
- **Production Type Supported**: Hardware vs Software encoding configurations (e.g., OBS Software, Blackmagic ATEM Hardware setup).

### 4.4 Commentator Profiles

Commentators showcase host presence, media delivery, and auditory samples.

- **Match Type Covered**: Formats they commentate on (e.g., T20 Cricket, Football Derbies, League Tournaments).
- **Hosting Experience**: Master of ceremonies (MC) and presentation roles (e.g., "Pre-match panel host", "Post-match award presenter").
- **Live Commentary Support**: Experience doing real-time, fast-paced play-by-play commentary.
- **Co-Commentary Experience**: Ability to work in pairs (e.g., "Analytical Color Commentator", "Main Play-by-Play").
- **Panel Discussion Experience**: Experience leading or participating in post-match review tables.
- **Commentary Audio Portfolio**: Audio attachments or cloud links (e.g. Soundcloud, Cloudinary MP3 links) rendering inline audio players so users can hear their voice before booking.

### 4.5 Scorer Profiles

Scorers demonstrate precision, software literacy, and calculations accuracy.

- **Live Scoring Experience**: Years or counts of matches scored live on digital interfaces (e.g., "120+ matches using Kridaz Scorers app").
- **Score Updating Experience**: Special rules expertise (e.g., DLS - Duckworth-Lewis-Stern method, VJD method calculations, offline sync recovery in low-network regions).
