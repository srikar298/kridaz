import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary")}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className="buttons">
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Explore Docs - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Kridaz Platform Documentation"
    >
      <HomepageHeader />
      <main>
        <div
          className="container"
          style={{ padding: "2rem 0", textAlign: "center" }}
        >
          <h2>API Reference & Development Guides</h2>
          <p>Unified documentation for Kridaz developers.</p>
        </div>
      </main>
    </Layout>
  );
}
