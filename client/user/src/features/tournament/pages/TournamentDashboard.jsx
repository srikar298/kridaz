import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Share2, Users, Calendar, Megaphone, 
  ShieldCheck, Wallet, Settings, ArrowLeft, QrCode
} from 'lucide-react';
import { useGetTournamentByIdQuery } from '../../../redux/api/tournamentApi';

// Import Tabs
import OverviewTab from '../components/dashboard/OverviewTab';
import TeamsTab from '../components/dashboard/TeamsTab';
import ScheduleTab from '../components/dashboard/ScheduleTab';
import MarketingTab from '../components/dashboard/MarketingTab';
import OfficialsTab from '../components/dashboard/OfficialsTab';
import FinancesTab from '../components/dashboard/FinancesTab';
import SettingsTab from '../components/dashboard/SettingsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <Trophy size={16} /> },
  { id: 'teams', label: 'Teams', icon: <Users size={16} /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar size={16} /> },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone size={16} /> },
  { id: 'officials', label: 'Officials', icon: <ShieldCheck size={16} /> },
  { id: 'finances', label: 'Finances', icon: <Wallet size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
];

const TournamentDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch Tournament Details
  const { data: res, isLoading } = useGetTournamentByIdQuery(id);
  const tournament = res?.data;

  // Render the correct tab content
  const renderTabContent = () => {
    if (!tournament) return null;
    
    const props = { tournament };
    
    switch (currentTab) {
      case 'overview': return <OverviewTab {...props} />;
      case 'teams': return <TeamsTab {...props} />;
      case 'schedule': return <ScheduleTab {...props} />;
      case 'marketing': return <MarketingTab {...props} />;
      case 'officials': return <OfficialsTab {...props} />;
      case 'finances': return <FinancesTab {...props} />;
      case 'settings': return <SettingsTab {...props} />;
      default: return <OverviewTab {...props} />;
    }
  };

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#BFF367] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-bold mb-4">Tournament Not Found</h2>
        <button onClick={() => navigate(-1)} className="text-[#BFF367] underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Dynamic Header */}
      <div className="relative pt-6 pb-20">
        {/* Blurred Poster Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110"
            style={{ backgroundImage: \`url(\${tournament.posterUrl || 'https://images.unsplash.com/photo-1522778119026-d647f0596c20'}) saturate(200%)\` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-4">
          <button 
            onClick={() => navigate('/my-hosted-games')}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-black border border-white/10 overflow-hidden flex-shrink-0 shadow-2xl">
                {tournament.posterUrl ? (
                  <img src={tournament.posterUrl} alt="Poster" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                    <Trophy size={32} className="text-[#BFF367]" />
                  </div>
                )}
              </div>
              
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFF367]/10 border border-[#BFF367]/20 text-[#BFF367] text-[10px] font-black uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFF367] animate-pulse" />
                  {tournament.status || 'PUBLISHED'}
                </div>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide leading-tight mb-2">
                  {tournament.name}
                </h1>
                <p className="text-sm text-white/60 font-bold tracking-widest uppercase">
                  {tournament.sport} • {tournament.type} • {tournament.format}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowShareModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#BFF367] text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                <Share2 size={16} /> Share Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={\`flex items-center gap-2 py-4 px-4 whitespace-nowrap transition-colors relative \${
                  currentTab === tab.id ? 'text-[#BFF367]' : 'text-white/50 hover:text-white'
                }\`}
              >
                {tab.icon}
                <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                {currentTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BFF367]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative text-center">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              x
            </button>
            <div className="w-16 h-16 bg-[#BFF367]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-[#BFF367]" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest mb-2">Share Registration Link</h3>
            <p className="text-xs text-white/50 mb-6">Teams can scan this QR or use the link to register for {tournament.name}.</p>
            
            <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-6 p-2 flex items-center justify-center">
              {/* Mock QR Code */}
              <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center text-black/20 font-bold text-xs">QR CODE</div>
            </div>

            <button className="w-full bg-[#25D366] text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 mb-3">
              Share on WhatsApp
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(\`https://kridaz.com/t/\${tournament.id}\`);
                setShowShareModal(false);
              }}
              className="w-full bg-[#1a1a1a] text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-white/10"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for hiding scrollbar in tabs */}
      <style dangerouslySetInnerHTML={{__html: \`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      \`}} />
    </div>
  );
};

export default TournamentDashboard;
