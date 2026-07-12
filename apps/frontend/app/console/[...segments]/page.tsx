import { notFound } from 'next/navigation';
import { EnterpriseAdminApp } from '@/components/admin/EnterpriseAdminApp';
import { getConsoleRouteFromSegments } from '@/lib/console-routes';

export default async function ConsoleSegmentsPage({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  const route = getConsoleRouteFromSegments(segments);

  if (!route) {
    notFound();
  }

  return <EnterpriseAdminApp routeKey={route.key} />;
}