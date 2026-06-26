const fs = require('fs');
const path = require('path');

const filePath = path.resolve('client/user/src/features/networking/components/PostItem.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize newlines to \n to be platform-agnostic
content = content.replace(/\r\n/g, '\n');

// 1. Add imports
const originalImport = `import React, { useState } from "react";`;
const newImport = `import React, { useState, useEffect, useRef } from "react";`;
if (content.includes(originalImport)) {
  content = content.replace(originalImport, newImport);
  console.log("Import replacement success");
} else {
  // Check if we already replaced it
  if (content.includes(newImport)) {
    console.log("Imports already updated");
  } else {
    console.error("Could not find original import line");
  }
}

// 2. Add states & effect hook
const targetStates = `    const [expandedComments, setExpandedComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(false);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);`;

const replacementStates = `    const [expandedComments, setExpandedComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(false);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);

    const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
    const [hasMoreCaption, setHasMoreCaption] = useState(false);
    const captionRef = useRef(null);

    useEffect(() => {
      if (captionRef.current) {
        setHasMoreCaption(
          captionRef.current.scrollHeight > captionRef.current.clientHeight
        );
      }
    }, [post.content, post.title]);`;

// Normalize template newlines to \n too
const normalizedTargetStates = targetStates.replace(/\r\n/g, '\n');
const normalizedReplacementStates = replacementStates.replace(/\r\n/g, '\n');

if (content.includes(normalizedTargetStates)) {
  content = content.replace(normalizedTargetStates, normalizedReplacementStates);
  console.log("States replacement success");
} else {
  if (content.includes(`const [isCaptionExpanded`)) {
    console.log("States already updated");
  } else {
    console.error("Could not find targetStates");
  }
}

// 3. Replace Caption block
const targetCaption = `        {/* Caption */}
        {(post.title || post.content) && (
          <div className="text-[13.5px] font-medium leading-relaxed px-4 pb-3">
            {post.title && <span className="font-bold mr-2">{post.title}</span>}
            <span className="text-white/90 whitespace-pre-wrap">
              {post.content}
            </span>
          </div>
        )}`;

const replacementCaption = `        {/* Caption */}
        {(post.title || post.content) && (
          <div className="text-[13.5px] font-medium leading-relaxed px-4 pb-3">
            <div
              ref={captionRef}
              className={\`text-white/90 whitespace-pre-wrap \${
                !isCaptionExpanded ? "line-clamp-2" : ""
              }\`}
            >
              {post.title && <span className="font-bold mr-2 text-white">{post.title}</span>}
              {post.content}
            </div>
            {hasMoreCaption && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-primary font-bold mt-1 text-[11px] hover:underline block focus:outline-none border-0 bg-transparent p-0"
              >
                {isCaptionExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>
        )}`;

const normalizedTargetCaption = targetCaption.replace(/\r\n/g, '\n');
const normalizedReplacementCaption = replacementCaption.replace(/\r\n/g, '\n');

if (content.includes(normalizedTargetCaption)) {
  content = content.replace(normalizedTargetCaption, normalizedReplacementCaption);
  console.log("Caption replacement success");
} else {
  if (content.includes(`ref={captionRef}`)) {
    console.log("Caption already updated");
  } else {
    console.error("Could not find targetCaption");
  }
}

// Write file back (with \r\n preserved if we want, or just write as \n since Git handles it)
fs.writeFileSync(filePath, content, 'utf8');
console.log("File patched successfully!");
