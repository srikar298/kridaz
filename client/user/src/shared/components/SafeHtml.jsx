import React from "react";
import DOMPurify from "dompurify";

/**
 * A secure component to render HTML strings safely, mitigating XSS risks.
 * Replaces direct usage of `dangerouslySetInnerHTML`.
 *
 * @param {Object} props
 * @param {string} props.html - The raw HTML string to sanitize and render
 * @param {string} [props.className] - Optional class name for the wrapper element
 * @param {string} [props.as="div"] - The HTML element to wrap the content in (default: 'div')
 */
const SafeHtml = ({ html, className, as: Component = "div", ...rest }) => {
  if (!html) return null;

  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "span", "div",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "class", "style", "rel"],
  });

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      {...rest}
    />
  );
};

export default SafeHtml;
