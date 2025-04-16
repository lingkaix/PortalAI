import React from 'react';
import { PageContent } from '../layouts/PageContent';
import { Card } from '../components/Card';
import { Users } from 'lucide-react';

export const AgentsPage: React.FC = () => {
  return (
    <PageContent title="Agents" data-component-id="AgentsPage">
      <Card className="p-6">
        <p className="text-[var(--text-secondary)]">Agents management interface will be here.</p>
        {/* Placeholder content */}
      </Card>
    </PageContent>
  );
};