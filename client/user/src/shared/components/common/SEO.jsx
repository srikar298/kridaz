import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * Reusable SEO component for injecting dynamic meta tags into the document head.
 * @param {Object} props
 * @param {string} props.title - The title of the page.
 * @param {string} props.description - The description of the page.
 * @param {string} props.image - The URL of the Open Graph preview image.
 * @param {string} props.url - The canonical URL of the page.
 * @param {string} [props.type='website'] - The Open Graph type (website, article, profile).
 */
export const SEO = ({
  title = "Kridaz | Sports Networking",
  description = "Kridaz is the ultimate sports community platform for players and venue owners to book turfs, find games, and connect with other players.",
  image = "/favicon.png", // Replace with an absolute URL if possible for production, e.g., https://kridaz.com/default-og-image.jpg
  url = "https://kridaz.com",
  type = "website",
}) => {
  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
