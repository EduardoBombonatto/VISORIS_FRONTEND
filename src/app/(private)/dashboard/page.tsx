import { AgendaDashboard } from '@/features/agenda/components/AgendaDashboard';

export const metadata = {
  title: 'Agenda Diária - Visoris',
  description: 'Acompanhamento e gestão da agenda diária e comandas de exames.',
};

export default function DashboardPage() {
  return <AgendaDashboard />;
}
