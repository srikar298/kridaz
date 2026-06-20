import React from "react";
import { Link } from "react-router-dom";

const DataDeletionInstructions = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans selection:bg-primary/30">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-black mb-8 uppercase tracking-tight text-primary">
          Data Deletion Instructions
        </h1>

        <div className="space-y-8 text-white/70 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Deleting Your Account on Kridaz
            </h2>
            <p>
              At Kridaz, we respect your privacy. If you wish to delete your
              account and remove your personal data from our active databases,
              you can do so by:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>
                Logging in to your account, navigating to the{" "}
                <Link to="/profile" className="text-primary hover:underline">
                  Profile Settings
                </Link>{" "}
                section, and selecting "Delete Account".
              </li>
              <li>
                Or, sending an email to{" "}
                <a
                  href="mailto:privacy@kridaz.com"
                  className="text-primary hover:underline"
                >
                  privacy@kridaz.com
                </a>{" "}
                with the subject line "Data Deletion Request".
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Facebook Login Data Deletion
            </h2>
            <p>
              If you signed in using your Facebook account and want to remove
              Kridaz from your Facebook account, follow these steps:
            </p>
            <ol className="list-decimal pl-6 mt-4 space-y-2">
              <li>
                Go to your Facebook Account's{" "}
                <strong>Settings & Privacy</strong> and click{" "}
                <strong>Settings</strong>.
              </li>
              <li>
                Select <strong>Apps and Websites</strong> from the menu to see
                all the apps linked to your Facebook account.
              </li>
              <li>
                Search for and click on <strong>Kridaz</strong>.
              </li>
              <li>
                Click <strong>Remove</strong> and follow the prompts to confirm.
              </li>
              <li>
                You have successfully removed your app activities and deleted
                the connection.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              3. What Happens Next
            </h2>
            <p>
              Once we receive and verify your request, we will delete (or
              anonymize) your personal information within 30 days. We may retain
              certain information for recordkeeping purposes or to comply with
              legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Contact Us
            </h2>
            <p>
              If you need assistance with the data deletion process, please
              contact us at{" "}
              <a
                href="mailto:privacy@kridaz.com"
                className="text-primary hover:underline"
              >
                privacy@kridaz.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link
            to="/"
            className="text-primary hover:underline font-bold uppercase tracking-wider text-sm"
          >
            ΓåÉ Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionInstructions;
