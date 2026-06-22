import React, { useState } from "react";
import { useCreateGroupChatMutation } from "@redux/api/chatApi";
import { Globe, X, ChevronRight, Camera } from "lucide-react";import { Button, Input, Textarea } from "@kridaz/ui";


const CreateCommunityModal = ({ isOpen, onClose, onSuccess }) => {
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");

  const [createGroupChat, { isLoading: isCreating }] =
    useCreateGroupChatMutation();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!communityName) return;

    try {
      // Create the Community Root
      const communityRoot = await createGroupChat({
        name: communityName,
        isCommunity: true,
        description: communityDescription,
        users: JSON.stringify([]),
      }).unwrap();

      onSuccess(communityRoot);
      onClose();
    } catch (err) {
      console.error("Failed to create community:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-card border border-white/10 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl relative animate-scale-up p-5 sm:p-6">
        <Button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white z-10"
        >
          <X size={18} />
        </Button>

        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="w-16 h-16 rounded-[8px] bg-primary/10 flex items-center justify-center relative overflow-hidden group">
            <Globe size={24} className="text-primary" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={16} className="text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Create a New Community
            </h2>
            <p className="text-white/40 text-xs font-medium leading-relaxed mt-1 max-w-xs mx-auto">
              Bring your related groups like neighborhoods, schools, or work
              teams together under one umbrella.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            autoFocus
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] px-4 py-3 text-white focus:border-primary outline-none transition-all font-bold text-sm placeholder:text-white/20"
            placeholder="Community Name"
          />
          <Textarea
            value={communityDescription}
            onChange={(e) => setCommunityDescription(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] px-4 py-3 text-white focus:border-primary outline-none transition-all font-medium placeholder:text-white/20 resize-none text-sm"
            placeholder="Community Description"
          />

          <div className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-[8px]">
            <div className="w-8 h-8 rounded-[6px] bg-primary/10 flex items-center justify-center shrink-0">
              <Globe size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">Organize groups</p>
              <p className="text-white/30 text-[10px] mt-0.5 leading-snug">
                Once created, you can add and manage groups under this
                community.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isCreating || !communityName.trim()}
            className="w-full mt-2 py-3 bg-primary text-black font-bold uppercase text-sm tracking-wider rounded-[8px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isCreating ? "Creating..." : "Create Community"}{" "}
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCommunityModal;
