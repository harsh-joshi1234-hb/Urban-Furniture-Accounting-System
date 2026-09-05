import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

/**
 * Placeholder for the accounting-core and reporting screens, which belong to
 * the second half of the frontend build. The navigation entries exist now so
 * the menu matches the wireframe.
 */
export default function ComingSoon({ title, subtitle, description }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <EmptyState
          icon="🚧"
          title="Screen not built yet"
          description={
            description ||
            'This module is part of the next frontend phase. The backend API for it is already available.'
          }
        />
      </Card>
    </div>
  );
}
