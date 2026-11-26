import React, { useEffect, useState } from 'react';
import { useStoryStore } from './store/useStoryStore.ts';
import { TopNavBar } from './components/header/TopNavBar.tsx';
import { StoryCanvas } from './components/canvas/StoryCanvas.tsx';
import { AuditModal } from './components/modals/AuditModal.tsx';
import { McpModal } from './components/modals/McpModal.tsx';
import { VariablesModal } from './components/modals/VariablesModal.tsx';
import { CharactersModal } from './components/modals/CharactersModal.tsx';

export const App: React.FC = () => {
  const initWebSocket = useStoryStore((s) => s.initWebSocket);
  const fetchProject = useStoryStore((s) => s.fetchProject);
  const theme = useStoryStore((s) => s.theme);

  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);

  useEffect(() => {
    initWebSocket();
    fetchProject();
  }, [initWebSocket, fetchProject]);

  // Sync theme class to document body, root and favicon
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);

    const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = theme === 'dark' ? '/logo-dark.jpg' : '/logo-light.jpg';
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#0f0f12] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <TopNavBar
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenMcp={() => setIsMcpOpen(true)}
        onOpenVariables={() => setIsVariablesOpen(true)}
        onOpenCharacters={() => setIsCharactersOpen(true)}
      />

      {/* Main Fullscreen Canvas (Inline Node Studio) */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 h-full relative">
          <StoryCanvas />
        </main>
      </div>

      {/* Modals */}
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <McpModal isOpen={isMcpOpen} onClose={() => setIsMcpOpen(false)} />
      <VariablesModal isOpen={isVariablesOpen} onClose={() => setIsVariablesOpen(false)} />
      <CharactersModal isOpen={isCharactersOpen} onClose={() => setIsCharactersOpen(false)} />
    </div>
  );
};

