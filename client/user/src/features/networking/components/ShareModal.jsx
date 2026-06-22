import {
  X,
  Share2,
  MessageCircle,
  Instagram,
  Facebook,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";import { Button } from "@kridaz/ui";


const sharePlatforms = [
  { id: "native", name: "More", icon: Share2 },
  { id: "copy", name: "Copy Link", icon: Copy },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "facebook", name: "Facebook", icon: Facebook },
];

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };

const ShareModal = ({ postId, onClose }) => {
  const copyShareLink = async (url, label = "Link copied!") => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(label);
    } catch (error) {
      toast.error("Unable to copy link");
    }
  };

  const handleShareToPlatform = async (platform) => {
    const { getShareLink } = await import("@utils/shareUtils");
    const url = getShareLink(
      `${window.location.origin}${window.location.pathname}?post=${postId}`
    );
    const text = "Check out this post on Kridaz!";
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const encodedTextWithUrl = encodeURIComponent(`${text} ${url}`);
    const openShare = (shareUrl) =>
      window.open(shareUrl, "_blank", "noopener,noreferrer");

    if (platform === "native") {
      if (navigator.share) {
        try {
          await navigator.share({ title: "Kridaz Community", text, url });
          onClose();
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }
      await copyShareLink(url);
      onClose();
      return;
    }

    if (platform === "copy") {
      await copyShareLink(url);
    } else if (platform === "twitter") {
      openShare(
        `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
      );
    } else if (platform === "facebook") {
      openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
    } else if (platform === "whatsapp") {
      openShare(`https://api.whatsapp.com/send?text=${encodedTextWithUrl}`);
    } else if (platform === "linkedin") {
      openShare(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      );
    } else if (platform === "telegram") {
      openShare(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`);
    } else if (platform === "threads") {
      openShare(
        `https://www.threads.net/intent/post?text=${encodedTextWithUrl}`
      );
    } else if (platform === "reddit") {
      openShare(
        `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`
      );
    } else if (platform === "pinterest") {
      openShare(
        `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`
      );
    } else if (platform === "email") {
      window.location.href = `mailto:?subject=${encodeURIComponent("Kridaz Community Post")}&body=${encodedTextWithUrl}`;
    } else if (platform === "sms") {
      window.location.href = `sms:?&body=${encodedTextWithUrl}`;
    } else if (platform === "messenger") {
      await copyShareLink(url, "Link copied for Messenger");
      openShare("https://www.messenger.com/");
    } else if (platform === "instagram") {
      await copyShareLink(url, "Link copied for Instagram");
      openShare("https://www.instagram.com/");
    } else if (platform === "snapchat") {
      await copyShareLink(url, "Link copied for Snapchat");
      openShare("https://www.snapchat.com/");
    } else if (platform === "tiktok") {
      await copyShareLink(url, "Link copied for TikTok");
      openShare("https://www.tiktok.com/");
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#030303]/75 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 34, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="relative z-20 w-full max-h-[86vh] overflow-hidden rounded-t-[24px] border border-white/10 bg-neutral-950/95 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:max-w-xl sm:rounded-[8px]"
        style={HEADING_STYLE}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-black text-white" style={HEADING_STYLE}>
              Share post
            </h3>
            <p className="mt-1 text-[11px] font-medium text-white/45">
              Choose a platform to send this community post.
            </p>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close share options"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="relative px-5 py-5 sm:px-6">
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 sm:gap-x-4">
            {sharePlatforms.map((app) => {
              const Icon = app.icon;

              return (
                <div
                  key={app.id}
                  className="flex min-w-0 flex-col items-center gap-2"
                >
                  <Button
                    type="button"
                    onClick={() => handleShareToPlatform(app.id)}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-gradient-to-br from-primary/10 to-primary/10 text-white/80 shadow-[0_0_18px_rgba(85,222,232,0.08)] transition-all hover:border-primary/50 hover:from-primary/20 hover:to-primary/20 hover:text-primary active:scale-95"
                    aria-label={`Share to ${app.name}`}
                  >
                    <Icon size={23} strokeWidth={2.2} />
                  </Button>
                  <span className="w-full truncate text-center text-[10px] font-bold text-white/60">
                    {app.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ShareModal;
