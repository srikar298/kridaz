import React from "react";
import { Settings, Save, Trash2, AlertTriangle } from "lucide-react";import { Button, Input, Textarea } from "@kridaz/ui";


const SettingsTab = ({ tournament }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="text-yellow-500 flex-shrink-0" size={20} />
        <div>
          <p className="text-sm font-bold text-yellow-500 mb-1">
            Editing Published Tournaments
          </p>
          <p className="text-xs text-yellow-500/70">
            Changing entry fees or rules while registration is open may confuse
            teams. Proceed with caution.
          </p>
        </div>
      </div>

      {/* Edit Form Mockup */}
      <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
            <Settings size={16} className="text-secondary" />
            Tournament Settings
          </h3>
          <Button className="flex items-center gap-2 bg-primary text-black px-6 py-2 rounded-full text-xs font-bold hover:bg-white transition-colors">
            <Save size={14} /> Save Changes
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-2">
              Tournament Name
            </label>
            <Input
              type="text"
              defaultValue={tournament.name}
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-2">
              About Tournament
            </label>
            <Textarea
              defaultValue={tournament.details?.about || ""}
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary transition-colors min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 block mb-2">
                Entry Fee (â‚¹)
              </label>
              <Input
                type="number"
                defaultValue={tournament.entryFee}
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">
                Prize Pool (â‚¹)
              </label>
              <Input
                type="number"
                defaultValue={tournament.prizePool}
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/30 rounded-2xl p-6">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4">
          Danger Zone
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Cancel Tournament</p>
            <p className="text-xs text-white/50 mt-1 max-w-md">
              Canceling a published tournament will refund all collected entry
              fees to the teams' wallets and notify all captains. This action
              cannot be undone.
            </p>
          </div>
          <Button className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
            <Trash2 size={16} /> Cancel Tournament
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
