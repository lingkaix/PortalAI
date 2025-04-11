import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Context Provider
import { RightSidebarProvider } from './contexts/RightSidebarContext';

// Layout Components
import { LeftSidebarContainer } from './layouts/LeftSidebarContainer';
import { RightSidebar } from './layouts/RightSidebar';
import { PageContent } from './layouts/PageContent'; // For fallback/not found

// Page Components
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { GroupChatAdminPage } from './pages/GroupChatAdminPage';

// UI Components (only Card needed for fallback route here)
import { Card } from './components/Card';
import { TitleBar } from './components/TitleBar';

// Main Application Component
const App: React.FC = () => {
  return (
    <Router>
      <RightSidebarProvider>
        <TitleBar />
        <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-900 font-sans text-sm">
          <LeftSidebarContainer />
          <main className="flex-grow flex flex-col relative overflow-hidden">
            <Routes>
              <Route path="/" element={<ChatPage />} />
              <Route path="/chat/:chatType/:chatId" element={<ChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/group/:groupId/admin" element={<GroupChatAdminPage />} />
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
          <RightSidebar />
        </div>
      </RightSidebarProvider>
    </Router>
  );
};

export default App;
