import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

export type FavoriteHospital =
  components['schemas']['FavoriteHospitalResponse'];

/** 낙관적으로 목록에 넣을 때 쓰는 병원 정보. 응답이 오면 서버 값으로 바뀐다. */
export type FavoriteSeed = Pick<
  FavoriteHospital,
  'name' | 'className' | 'address' | 'phone'
>;

export type FavoriteToggle = {
  ykiho: string;
  /** 바꾼 뒤의 상태. true면 찜하고 false면 해제한다. */
  isFavorite: boolean;
  hospital?: FavoriteSeed;
};

const PAGE_SIZE = 100;
/** 찜은 손으로 하나씩 누르는 것이라 많지 않다. 끝없이 부르지 않도록 상한을 둔다. */
const MAX_PAGES = 10;

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: () => [...favoriteKeys.all, 'list'] as const,
  toggle: () => [...favoriteKeys.all, 'toggle'] as const,
};

/** 하트 상태(병원 상세·카드)와 관심 화면이 같은 목록 하나를 쓰도록 모든 페이지를 모아 한 번에 캐시한다. */
async function fetchAllFavorites(): Promise<FavoriteHospital[]> {
  const favorites: FavoriteHospital[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await unwrap(
      apiClient.GET('/api/users/me/favorites', {
        params: { query: { pageQuery: { page, size: PAGE_SIZE } } },
      }),
    );
    favorites.push(...response.content);
    if (page + 1 >= response.totalPages) break;
  }
  return favorites;
}

export const favoriteQueries = {
  list: () =>
    queryOptions({
      queryKey: favoriteKeys.list(),
      queryFn: fetchAllFavorites,
    }),
};

export function isFavoriteIn(
  favorites: readonly FavoriteHospital[] | undefined,
  ykiho: string,
) {
  return favorites?.some((favorite) => favorite.ykiho === ykiho) ?? false;
}

export function applyFavoriteToggle(
  favorites: readonly FavoriteHospital[],
  { ykiho, isFavorite, hospital }: FavoriteToggle,
  now: Date = new Date(),
): FavoriteHospital[] {
  const rest = favorites.filter((favorite) => favorite.ykiho !== ykiho);
  if (!isFavorite) return rest;
  const existing = favorites.find((favorite) => favorite.ykiho === ykiho);
  if (existing) return [...favorites];
  return [
    {
      ykiho,
      available: true,
      name: hospital?.name ?? null,
      className: hospital?.className ?? null,
      address: hospital?.address ?? null,
      phone: hospital?.phone ?? null,
      favoritedAt: now.toISOString(),
    },
    ...rest,
  ];
}

export const favoriteMutations = {
  /** 목록 캐시를 먼저 바꾸고, 실패하면 되돌린 뒤 서버 목록으로 다시 맞춘다. */
  toggle: () =>
    mutationOptions({
      mutationKey: favoriteKeys.toggle(),
      mutationFn: ({ ykiho, isFavorite }: FavoriteToggle) =>
        unwrap(
          isFavorite
            ? apiClient.POST('/api/users/me/favorites/{ykiho}', {
                params: { path: { ykiho } },
              })
            : apiClient.DELETE('/api/users/me/favorites/{ykiho}', {
                params: { path: { ykiho } },
              }),
        ),
      onMutate: async (toggle, { client }) => {
        await client.cancelQueries({ queryKey: favoriteKeys.list() });
        const previous = client.getQueryData<FavoriteHospital[]>(
          favoriteKeys.list(),
        );
        if (previous) {
          client.setQueryData(
            favoriteKeys.list(),
            applyFavoriteToggle(previous, toggle),
          );
        }
        return { previous };
      },
      onError: (_error, _toggle, result, { client }) => {
        if (result?.previous) {
          client.setQueryData(favoriteKeys.list(), result.previous);
        }
      },
      /** 연달아 누른 다른 변경이 남아 있으면 그 변경의 낙관적 상태를 덮지 않도록 마지막 변경 뒤에만 다시 불러온다. */
      onSettled: async (_data, _error, _toggle, _result, { client }) => {
        if (client.isMutating({ mutationKey: favoriteKeys.toggle() }) > 1) {
          return;
        }
        await client.invalidateQueries({ queryKey: favoriteKeys.list() });
      },
    }),
};
