import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  buildCompareHref,
  isNpayCode,
  isYkiho,
  MAX_COMPARE,
} from './compare-params';

export type CompareHospital = {
  ykiho: string;
  name: string;
  /** 담은 화면의 항목. 모두 같은 항목에서 담았을 때만 비교 화면이 그 항목 가격을 보여 준다. */
  itemCode: string | null;
};

export type CompareNotice = {
  kind: 'added' | 'removed' | 'full' | 'cleared';
  name: string | null;
  count: number;
  /** 같은 알림이 이어져도 스크린 리더가 다시 읽도록 매번 바뀐다. */
  id: number;
};

type AddResult = 'added' | 'exists' | 'full';

type CompareState = {
  hospitals: CompareHospital[];
  notice: CompareNotice | null;
  add: (hospital: CompareHospital) => AddResult;
  remove: (ykiho: string) => void;
  clear: () => void;
  /** 공유받은 비교 주소로 들어왔을 때, 비교함이 비어 있으면 그 병원들로 채운다. */
  adopt: (hospitals: readonly CompareHospital[]) => void;
};

export const COMPARE_STORAGE_KEY = 'mediprice:compare';

const storedSchema = z.object({
  hospitals: z
    .array(
      z.object({
        ykiho: z.string().refine(isYkiho),
        name: z.string().trim().min(1).max(200),
        itemCode: z.string().refine(isNpayCode).nullable(),
      }),
    )
    .max(MAX_COMPARE),
});

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => {
      const notify = (
        kind: CompareNotice['kind'],
        name: string | null,
        count: number,
      ) => ({ kind, name, count, id: (get().notice?.id ?? 0) + 1 });

      return {
        hospitals: [],
        notice: null,
        add: (hospital) => {
          const { hospitals } = get();
          if (hospitals.some((h) => h.ykiho === hospital.ykiho))
            return 'exists';
          if (hospitals.length >= MAX_COMPARE) {
            set({ notice: notify('full', hospital.name, hospitals.length) });
            return 'full';
          }
          const next = [...hospitals, hospital];
          set({
            hospitals: next,
            notice: notify('added', hospital.name, next.length),
          });
          return 'added';
        },
        remove: (ykiho) => {
          const { hospitals } = get();
          const target = hospitals.find((h) => h.ykiho === ykiho);
          if (!target) return;
          const next = hospitals.filter((h) => h.ykiho !== ykiho);
          set({
            hospitals: next,
            notice: notify('removed', target.name, next.length),
          });
        },
        clear: () => set({ hospitals: [], notice: notify('cleared', null, 0) }),
        adopt: (hospitals) => {
          if (get().hospitals.length > 0) return;
          set({ hospitals: hospitals.slice(0, MAX_COMPARE) });
        },
      };
    },
    {
      name: COMPARE_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ hospitals: state.hospitals }),
      /** 저장소 값은 다른 버전이나 사용자가 고친 값일 수 있어 검증하고, 틀리면 빈 비교함으로 시작한다. */
      merge: (persisted, current) => {
        const parsed = storedSchema.safeParse(persisted);
        if (!parsed.success) return current;
        const seen = new Set<string>();
        const hospitals = parsed.data.hospitals.filter((h) => {
          if (seen.has(h.ykiho)) return false;
          seen.add(h.ykiho);
          return true;
        });
        return { ...current, hospitals };
      },
      /** 서버 렌더링 결과(빈 비교함)와 맞추려고 하이드레이션 뒤에 CompareTray가 불러온다. */
      skipHydration: true,
    },
  ),
);

/** 모두 같은 항목에서 담았으면 그 항목 코드, 아니면 null. */
export function sharedItemCode(hospitals: readonly CompareHospital[]) {
  const [first, ...rest] = hospitals;
  const code = first?.itemCode ?? null;
  return code && rest.every((h) => h.itemCode === code) ? code : null;
}

export function buildBasketHref(hospitals: readonly CompareHospital[]) {
  return buildCompareHref(
    hospitals.map((h) => h.ykiho),
    sharedItemCode(hospitals),
  );
}
