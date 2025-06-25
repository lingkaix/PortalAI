import React, { useEffect } from 'react'; // Import useEffect
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Context Provider
import { RightSidebarProvider } from './contexts/RightSidebarContext';
import { useSettingsStore } from './data/settingsStore'; // Import settings store
import { useAgentStore } from './data/agentStore'; // Import agent store
import { useAppStateStore } from './data/appStateStore'; // Import app state store
import { useChatStore } from './data/chatStore'; // Import chat store

// Layout Components
import { LeftSidebarContainer } from './layouts/LeftSidebarContainer';
import { RightSidebar } from './layouts/RightSidebar';
import { PageContent } from './layouts/PageContent'; // For fallback/not found

// Page Components
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { GroupChatAdminPage } from './pages/GroupChatAdminPage';
import { AgentsPage } from './pages/AgentsPage'; // Import new page
import { ToolsPage } from './pages/ToolsPage'; // Import new page
import { KnowledgePage } from './pages/KnowledgePage'; // Import new page
import { DashboardPage } from './pages/DashboardPage';

// UI Components
import { Card } from './components/Card';
import { TitleBar } from './components/TitleBar';

// Main Application Component
const App: React.FC = () => {
  // Load settings and agents when the app mounts
  useEffect(() => {
    useSettingsStore.getState().loadSettings();
    useAgentStore.getState().loadAgent();
    useAppStateStore.getState().init();
    useChatStore.getState().init(useAppStateStore);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <Router>
      <RightSidebarProvider>
        <TitleBar />
        <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-900 font-sans text-sm min-w-200 min-h-150">
          {/* Layer 1 Sidebar */}
          <LeftSidebarContainer />
          {/* Main Content Area */}
          <main className="flex-grow flex flex-col relative overflow-hidden">
            <Routes>
              {/* Chat Routes (Root and specific chat) */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/chat/:chatType/:chatId" element={<ChatPage />} />

              {/* Page Routes */}
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />

              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/group/:groupId/admin" element={<GroupChatAdminPage />} />

              {/* Fallback Route */}
              <Route
                path="*"
                element={
                  <PageContent title="Not Found">
                    <Card className="p-6">
                      <p className="text-neutral-600 dark:text-neutral-400">The page you requested could not be found.</p>
                    </Card>
                  </PageContent>
                }
              />
            </Routes>
          </main>
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </RightSidebarProvider>
    </Router>
  );
};

export default App;
