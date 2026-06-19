import React, { lazy, Suspense } from "react";

const UserHome = lazy(() => import("@user/pages/Home"));

const RootRedirect = () => {
  // Users always land on the home page.
  // They can navigate to their dashboard via the profile dropdown.
  return (
    <Suspense fallback={null}>
      <UserHome />
    </Suspense>
  );
};

export default RootRedirect;
