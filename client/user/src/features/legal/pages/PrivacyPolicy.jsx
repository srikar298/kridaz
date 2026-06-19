import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans selection:bg-[#BFF367]/30">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-black mb-8 uppercase tracking-tight text-[#BFF367]">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-white/70 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us, such as
              when you create an account, update your profile, use our
              interactive features, or communicate with us. This may include
              your name, email address, phone number, and location data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              2. How We Use Information
            </h2>
            <p>
              We use the information we collect to provide, maintain, and
              improve our services. This includes processing transactions,
              sending updates and security alerts, responding to comments and
              questions, and personalizing your experience on Kridaz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              3. Sharing of Information
            </h2>
            <p>
              We may share information about you as described in this Privacy
              Policy, such as with vendors, consultants, and other service
              providers who need access to such information to carry out work on
              our behalf.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Data Security
            </h2>
            <p>
              We take reasonable measures to help protect information about you
              from loss, theft, misuse and unauthorized access, disclosure,
              alteration and destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
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

export default PrivacyPolicy;
