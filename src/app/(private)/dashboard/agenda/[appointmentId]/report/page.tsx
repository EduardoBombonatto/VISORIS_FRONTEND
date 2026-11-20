import { redirect } from 'next/navigation';

interface LegacyReportPageProps {
  params: Promise<{
    appointmentId: string;
  }>;
}

export default async function LegacyAppointmentReportPage({ params }: LegacyReportPageProps) {
  const { appointmentId } = await params;
  redirect(`/reports/${appointmentId}`);
}
