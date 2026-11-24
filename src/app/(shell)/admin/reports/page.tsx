import { parseReportFilters } from '@/features/admin/report-filters';

import { ReportsView } from './_components/reports-view';

/** 상태 필터와 페이지는 URL에 둔다(공유·새로 고침에도 같은 목록). */
export default async function AdminReportsPage({
  searchParams,
}: PageProps<'/admin/reports'>) {
  const filters = parseReportFilters(await searchParams);
  return <ReportsView filters={filters} />;
}
