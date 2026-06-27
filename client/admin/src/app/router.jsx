import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AdminLayout from "../shared/layouts/AdminLayout";
import ProtectedRoute from "../shared/components/ProtectedRoute/ProtectedRoute";

const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-black text-primary">
    <div className="text-sm font-semibold tracking-widest uppercase animate-pulse">
      Loading Page...
    </div>
  </div>
);

const AdminLogin = lazy(() => import("../features/auth/pages/AdminLogin"));
const AdminDashboard = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AdminDashboard }))
);
const VerificationCenter = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.VerificationCenter }))
);
const UserManagement = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.UserManagement }))
);
const PartnerViewer = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.PartnerViewer }))
);
const TurfList = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.TurfList }))
);
const AllTurf = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AllTurf }))
);
const VenueApprovalDetail = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.VenueApprovalDetail }))
);
const TransactionSection = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.TransactionSection }))
);
const SupportCenter = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.SupportCenter }))
);
const DisputeManager = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.DisputeManager }))
);
const ProfessionalDisputeManager = lazy(() =>
  import("../features/admin").then((m) => ({
    default: m.ProfessionalDisputeManager,
  }))
);
const GameDisputeManager = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.GameDisputeManager }))
);
const AddVenueInvite = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AddVenueInvite }))
);
const InviteDashboard = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.InviteDashboard }))
);
const AuditLogs = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.AuditLogs }))
);
const FinancialMissionControl = lazy(() =>
  import("../features/admin").then((m) => ({
    default: m.FinancialMissionControl,
  }))
);
const FeatureFlags = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.FeatureFlags }))
);
const MarketingManagement = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.MarketingManagement }))
);
const BlogManagement = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.BlogManagement }))
);
const CommunityManagement = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.CommunityManagement }))
);
const CommunityPosts = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.CommunityPosts }))
);
const ProfessionalManagement = lazy(() =>
  import("../features/admin").then((m) => ({
    default: m.ProfessionalManagement,
  }))
);
const ProfessionalDetailsPage = lazy(() =>
  import("../features/admin").then((m) => ({
    default: m.ProfessionalDetailsPage,
  }))
);
const HostedGamesPage = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.HostedGamesPage }))
);
const CouponManagement = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.CouponManagement }))
);
const ReelReports = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.ReelReports }))
);
const ErrorLogs = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.ErrorLogs }))
);
const QRCodeManager = lazy(() =>
  import("../features/admin").then((m) => ({ default: m.QRCodeManager }))
);

const S = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <S>
        <AdminLogin />
      </S>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <S>
            <AdminDashboard />
          </S>
        ),
      },
      {
        path: "verification-center",
        element: (
          <S>
            <VerificationCenter />
          </S>
        ),
      },
      {
        path: "professionals",
        children: [
          {
            path: "coaches",
            element: (
              <S>
                <ProfessionalManagement role="coach" />
              </S>
            ),
          },
          {
            path: "umpires",
            element: (
              <S>
                <ProfessionalManagement role="umpire" />
              </S>
            ),
          },
          {
            path: "scorers",
            element: (
              <S>
                <ProfessionalManagement role="scorer" />
              </S>
            ),
          },
          {
            path: "streamers",
            element: (
              <S>
                <ProfessionalManagement role="streamer" />
              </S>
            ),
          },
          {
            path: ":id",
            element: (
              <S>
                <ProfessionalDetailsPage />
              </S>
            ),
          },
        ],
      },
      {
        path: "users",
        element: (
          <S>
            <UserManagement />
          </S>
        ),
      },
      {
        path: "owners",
        children: [
          {
            path: "",
            element: (
              <S>
                <PartnerViewer />
              </S>
            ),
          },
          {
            path: ":ownerId/turf",
            element: (
              <S>
                <TurfList />
              </S>
            ),
          },
        ],
      },
      {
        path: "turfs",
        element: (
          <S>
            <AllTurf />
          </S>
        ),
      },
      {
        path: "turfs/invites",
        element: (
          <S>
            <InviteDashboard />
          </S>
        ),
      },
      {
        path: "turfs/invite/new",
        element: (
          <S>
            <AddVenueInvite />
          </S>
        ),
      },
      {
        path: "turfs/:id",
        element: (
          <S>
            <VenueApprovalDetail />
          </S>
        ),
      },
      {
        path: "transactions",
        element: (
          <S>
            <TransactionSection />
          </S>
        ),
      },
      {
        path: "support",
        element: (
          <S>
            <SupportCenter />
          </S>
        ),
      },
      {
        path: "disputes",
        element: (
          <S>
            <DisputeManager />
          </S>
        ),
      },
      {
        path: "professional-disputes",
        element: (
          <S>
            <ProfessionalDisputeManager />
          </S>
        ),
      },
      {
        path: "game-disputes",
        element: (
          <S>
            <GameDisputeManager />
          </S>
        ),
      },
      {
        path: "audit",
        element: (
          <S>
            <AuditLogs />
          </S>
        ),
      },
      {
        path: "finance",
        element: (
          <S>
            <FinancialMissionControl />
          </S>
        ),
      },
      {
        path: "features",
        element: (
          <S>
            <FeatureFlags />
          </S>
        ),
      },
      {
        path: "marketing",
        element: (
          <S>
            <MarketingManagement />
          </S>
        ),
      },
      {
        path: "blogs",
        element: (
          <S>
            <BlogManagement />
          </S>
        ),
      },
      {
        path: "community",
        element: (
          <S>
            <CommunityManagement />
          </S>
        ),
      },
      {
        path: "community-posts",
        element: (
          <S>
            <CommunityPosts />
          </S>
        ),
      },
      {
        path: "games",
        element: (
          <S>
            <HostedGamesPage />
          </S>
        ),
      },
      {
        path: "coupons",
        element: (
          <S>
            <CouponManagement />
          </S>
        ),
      },
      {
        path: "reels-reports",
        element: (
          <S>
            <ReelReports />
          </S>
        ),
      },
      {
        path: "error-logs",
        element: (
          <S>
            <ErrorLogs />
          </S>
        ),
      },
      {
        path: "qrcodes",
        element: (
          <S>
            <QRCodeManager />
          </S>
        ),
      },
      { path: "*", element: <Navigate to="/admin" replace /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/admin" replace />,
  },
]);

export default router;
