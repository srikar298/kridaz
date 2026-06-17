import React from 'react';
import { Megaphone, Image as ImageIcon, Upload, Download, Share2 } from 'lucide-react';

const MarketingTab = ({ tournament }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sponsors Section */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black text-white/90 uppercase tracking-widest">Sponsorships</h3>
            <p className="text-xs text-white/50 mt-1">Logos uploaded here automatically appear on your public page and live scoring overlay.</p>
          </div>
          <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-full text-xs font-bold hover:bg-white/10 transition-colors">
            Manage Layout
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30 hover:border-[#BFF367]/50 hover:text-[#BFF367] transition-colors cursor-pointer group">
            <Upload size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs font-bold">Add Logo</span>
          </div>
          
          {/* Mock Uploaded Sponsor */}
          <div className="aspect-square bg-white rounded-xl flex items-center justify-center p-4 relative group">
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <button className="text-xs font-bold text-red-500 hover:underline">Remove</button>
            </div>
            <span className="text-black font-black text-xl opacity-20">LOGO 1</span>
          </div>
        </div>
      </div>

      {/* Promo Graphics Generator */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black text-white/90 uppercase tracking-widest mb-1">Promo Graphics</h3>
        <p className="text-xs text-white/50 mb-6">Auto-generated graphics ready for Instagram, Facebook, and WhatsApp.</p>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="aspect-[4/5] bg-[#1a1a1a] rounded-xl flex items-center justify-center relative overflow-hidden group">
              <img src={tournament.posterUrl || "https://images.unsplash.com/photo-1522778119026-d647f0596c20"} alt="Promo" className="w-full h-full object-cover opacity-50 grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-[#BFF367] font-black text-xl mb-1 uppercase">Registration Open</p>
                <p className="text-white text-xs font-bold">{tournament.name}</p>
              </div>
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200">
                  <Download size={14} /> Download
                </button>
                <button className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#25D366]/90">
                  <Share2 size={14} /> Share WhatsApp
                </button>
              </div>
            </div>
            <p className="text-center text-xs font-bold text-white/70">"Registration Open"</p>
          </div>

          <div className="space-y-3">
            <div className="aspect-[4/5] bg-[#1a1a1a] border border-white/5 rounded-xl flex items-center justify-center text-white/30 text-xs font-bold text-center p-4">
              "Match Day 1" Graphic<br/>(Available when schedule is generated)
            </div>
            <p className="text-center text-xs font-bold text-white/70">"Match Day"</p>
          </div>

          <div className="space-y-3">
            <div className="aspect-[4/5] bg-[#1a1a1a] border border-white/5 rounded-xl flex items-center justify-center text-white/30 text-xs font-bold text-center p-4">
              "Champions" Graphic<br/>(Available when tournament ends)
            </div>
            <p className="text-center text-xs font-bold text-white/70">"Champions"</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MarketingTab;
