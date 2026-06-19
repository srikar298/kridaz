import React from "react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans selection:bg-[#BFF367]/30">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-black mb-8 uppercase tracking-tight text-[#BFF367]">
          Terms of Service
        </h1>

        <div className="space-y-8 text-white/70 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Kridaz, you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to
              abide by these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Description of Service
            </h2>
            <p>
              Kridaz provides a platform for sports venue booking, finding
              opponents, and sports networking. We reserve the right to modify
              or discontinue, temporarily or permanently, the service with or
              without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              3. User Conduct
            </h2>
            <p>
              You agree to use our services only for lawful purposes. You are
              solely responsible for the knowledge of and adherence to any and
              all laws, rules, and regulations pertaining to your use of the
              services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Bookings and Payments
            </h2>
            <p>
              All bookings made through the Kridaz platform are subject to the
              availability of venues. Payments must be made in full as per the
              venue's stated policies. Cancellations and refunds are handled
              according to the specific policy of the booked venue.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Intellectual Property
            </h2>
            <p>
              The service and its original content, features, and functionality
              are and will remain the exclusive property of Kridaz and its
              licensors. The service is protected by copyright, trademark, and
              other laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href="mailto:contact@kridaz.com"
                className="text-[#BFF367] hover:underline"
              >
                contact@kridaz.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link
            to="/"
            className="text-[#BFF367] hover:underline font-bold uppercase tracking-wider text-sm"
          >
            ΓåÉ Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
