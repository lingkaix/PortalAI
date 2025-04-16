import React from 'react';
import { PageContent } from '../layouts/PageContent';
import { Card } from '../components/Card';
import { Wrench } from 'lucide-react'; // Icon for title if needed later, not for PageContent prop

export const ToolsPage: React.FC = () => {
  return (
    <PageContent title="Tools" data-component-id="ToolsPage">
      <Card className="p-6">
        <p className="text-[var(--text-secondary)]">Tools management interface will be here.</p>
        {/* Placeholder content */}
      </Card>
    </PageContent>
  );
};