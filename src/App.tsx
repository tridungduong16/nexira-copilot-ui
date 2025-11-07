import { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import AuthCallback from './components/AuthCallback';
// removed unused AIAgents import
import AgentsPage from './components/AgentsPage';
import FinanceAnalystPage from './components/FinanceAnalystPage';
import PromptOptimizerPage from './components/PromptOptimizerPage';
import MarketingAgentPage from './components/MarketingAgentPage';
import GameDevAgentPage from './components/GameDevAgentPage';
import SalesAgentPage from './components/SalesAgentPage';
import QAAgentPage from './components/QAAgentPage';
import UIUXAgentPage from './components/UIUXAgentPage';
import DataAgentPage from './components/DataAgentPage';
import TelesalesAgentPage from './components/TelesalesAgentPage';
import HRAgentPage from './components/HRAgentPage';
import DesignAgentPage from './components/DesignAgentPage';
import TrainingAgentPage from './components/TrainingAgentPage';
import KnowledgeBasePage from './components/KnowledgeBasePage';
import HelpPage from './components/HelpPage';
import SettingsPage from './components/SettingsPage';
import ChatPage from './components/ChatPage';
import SupportTicketsPage from './components/SupportTicketsPage';
import AllSupportTicketPage from './components/AllSupportTicketPage';
import TicketDetailPage from './components/TicketDetailPage';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = useMemo(() => {
    const path = location.pathname.replace(/^\/+/, '');
    if (path === '' || path === 'home') return 'home';
    if (path === 'marketplace' || path.endsWith('-analyst')) return path === 'marketplace' ? 'agents' : path;
    if (path === 'knowledge') return 'knowledge';
    if (path === 'settings') return 'settings';
    if (path === 'help' || path === 'support-tickets' || path === 'all-support-tickets') return 'help';
    if (path.startsWith('tickets/')) return 'tickets';  
    if (path === 'chat') return 'chat';
    return 'home';
  }, [location.pathname]);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const { resolvedTheme } = useTheme();
  const isAgentDetailPage = currentPage.endsWith('-analyst');

  const renderRoutes = () => (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/home" element={<Hero onSubmitPrompt={(p: string) => { setInitialPrompt(p); navigate('/chat'); }} />} />
      <Route path="/marketplace" element={<AgentsPage onAgentSelect={(agentId) => navigate(`/${agentId}-analyst`)} />} />
      <Route path="/finance-analyst" element={<FinanceAnalystPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/prompt-optimizer-analyst" element={<PromptOptimizerPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/marketing-analyst" element={<MarketingAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/gamedev-analyst" element={<GameDevAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/sales-analyst" element={<SalesAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/qa-analyst" element={<QAAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/uiux-analyst" element={<UIUXAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/data-analyst" element={<DataAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/telesales-analyst" element={<TelesalesAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/hr-analyst" element={<HRAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/design-analyst" element={<DesignAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/training-analyst" element={<TrainingAgentPage onBack={() => navigate('/marketplace')} />} />
      <Route path="/knowledge" element={<KnowledgeBasePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/support-tickets" element={<HelpPage />} />
      <Route path="/tickets/:ticketId" element={<TicketDetailPage onBack={() => navigate('/help')} />} />
      <Route path="/chat" element={<ChatPage initialPrompt={initialPrompt} />} />
      <Route path="/help" element={<SupportTicketsPage onBack={() => navigate('/home')} />} />
      <Route path="/all-support-tickets" element={<AllSupportTicketPage onBack={() => navigate('/help')} />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );

  return (
    <div
      className={
        `min-h-screen ` +
        (currentPage === 'home'
          ? (resolvedTheme === 'dark' ? 'bg-[#001F3F] overflow-hidden' : 'bg-[#E6F0FF] overflow-hidden')
          : (currentPage === 'agents')
            ? (resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]')
            : (currentPage.endsWith('-analyst'))
              ? 'bg-[#E6F0FF]'
              : currentPage === 'settings'
                ? (resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]')
                : (currentPage === 'knowledge' || currentPage === 'help' || currentPage === 'tickets')
                  ? (resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]')
                  : currentPage === 'chat'
                    ? 'bg-[#001F3F] overflow-hidden'
                    : 'bg-[#E6F0FF]')
      }
    >
      {!isAgentDetailPage && currentPage !== 'chat' && (
        <Header 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          currentPage={currentPage}
        />
      )}
      {renderRoutes()}
      {/* Footer hidden on Home to keep a full-bleed hero without scroll */}
    </div>
  );
}

export default App;
