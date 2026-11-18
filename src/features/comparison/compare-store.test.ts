import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => {
  const values = new Map<string, string>();
  const fake = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: fake,
    configurable: true,
  });
  return fake;
});

const {
  buildBasketHref,
  COMPARE_STORAGE_KEY,
  sharedItemCode,
  useCompareStore,
} = await import('./compare-store');

const hospital = (id: string, itemCode: string | null = 'MX1220000') => ({
  ykiho: `YKIHO${id}`,
  name: `병원${id}`,
  itemCode,
});

function stored() {
  const raw = storage.getItem(COMPARE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

beforeEach(() => {
  storage.clear();
  useCompareStore.setState({ hospitals: [], notice: null });
});

describe('useCompareStore', () => {
  it('3곳까지 담고 4번째는 막는다', () => {
    const { add } = useCompareStore.getState();
    expect(add(hospital('1'))).toBe('added');
    expect(add(hospital('2'))).toBe('added');
    expect(add(hospital('3'))).toBe('added');
    expect(add(hospital('4'))).toBe('full');

    const state = useCompareStore.getState();
    expect(state.hospitals.map((h) => h.ykiho)).toEqual([
      'YKIHO1',
      'YKIHO2',
      'YKIHO3',
    ]);
    expect(state.notice).toMatchObject({ kind: 'full', name: '병원4' });
  });

  it('이미 담은 병원은 다시 담지 않는다', () => {
    const { add } = useCompareStore.getState();
    add(hospital('1'));
    expect(add(hospital('1'))).toBe('exists');
    expect(useCompareStore.getState().hospitals).toHaveLength(1);
  });

  it('빼고 비우면 알림이 바뀌고 알림 id는 계속 늘어난다', () => {
    const { add, remove, clear } = useCompareStore.getState();
    add(hospital('1'));
    add(hospital('2'));
    remove('YKIHO1');
    const removed = useCompareStore.getState().notice;
    expect(removed).toMatchObject({ kind: 'removed', name: '병원1', count: 1 });
    clear();
    const cleared = useCompareStore.getState().notice;
    expect(cleared).toMatchObject({ kind: 'cleared', count: 0 });
    expect(cleared!.id).toBeGreaterThan(removed!.id);
    expect(useCompareStore.getState().hospitals).toEqual([]);
  });

  it('담은 병원만 sessionStorage에 저장한다', () => {
    useCompareStore.getState().add(hospital('1'));
    expect(stored()).toEqual({
      state: { hospitals: [hospital('1')] },
      version: 1,
    });
  });

  it('저장된 비교함을 다시 불러온다', async () => {
    storage.setItem(
      COMPARE_STORAGE_KEY,
      JSON.stringify({
        state: { hospitals: [hospital('1'), hospital('2', null)] },
        version: 1,
      }),
    );
    await useCompareStore.persist.rehydrate();
    expect(useCompareStore.getState().hospitals).toEqual([
      hospital('1'),
      hospital('2', null),
    ]);
  });

  it('형식이 틀리거나 3곳을 넘는 저장 값은 버린다', async () => {
    storage.setItem(
      COMPARE_STORAGE_KEY,
      JSON.stringify({
        state: {
          hospitals: ['1', '2', '3', '4'].map((id) => hospital(id)),
        },
        version: 1,
      }),
    );
    await useCompareStore.persist.rehydrate();
    expect(useCompareStore.getState().hospitals).toEqual([]);

    storage.setItem(
      COMPARE_STORAGE_KEY,
      JSON.stringify({
        state: { hospitals: [{ ykiho: '<bad>', name: 'x', itemCode: null }] },
        version: 1,
      }),
    );
    await useCompareStore.persist.rehydrate();
    expect(useCompareStore.getState().hospitals).toEqual([]);
  });

  it('adopt는 비교함이 비어 있을 때만 채운다', () => {
    const { adopt, add } = useCompareStore.getState();
    adopt([hospital('1'), hospital('2')]);
    expect(useCompareStore.getState().hospitals).toHaveLength(2);
    adopt([hospital('3')]);
    expect(useCompareStore.getState().hospitals).toHaveLength(2);
    expect(add(hospital('3'))).toBe('added');
  });
});

describe('sharedItemCode / buildBasketHref', () => {
  it('모두 같은 항목이면 그 항목을 붙인다', () => {
    const hospitals = [hospital('1'), hospital('2')];
    expect(sharedItemCode(hospitals)).toBe('MX1220000');
    expect(buildBasketHref(hospitals)).toBe(
      '/compare?h=YKIHO1&h=YKIHO2&item=MX1220000',
    );
  });

  it('항목이 다르거나 없으면 항목 없이 비교한다', () => {
    expect(sharedItemCode([hospital('1'), hospital('2', 'AB1')])).toBeNull();
    expect(
      sharedItemCode([hospital('1', null), hospital('2', null)]),
    ).toBeNull();
    expect(sharedItemCode([])).toBeNull();
  });
});
