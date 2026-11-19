import { parseClaimFilters } from '@/features/admin/claim-filters';

import { ClaimsView } from './_components/claims-view';

/** 상태 필터와 페이지는 URL에 둔다(공유·새로 고침에도 같은 목록). */
export default async function AdminClaimsPage({
  searchParams,
}: PageProps<'/admin/claims'>) {
  const filters = parseClaimFilters(await searchParams);
  return <ClaimsView filters={filters} />;
}
