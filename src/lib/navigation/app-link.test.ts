import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { appLinkTarget } from './app-link';

class FakeElement {
  constructor(private readonly anchor: FakeAnchor | null) {}
  closest() {
    return this.anchor;
  }
}

class FakeAnchor extends FakeElement {
  constructor(
    readonly href: string,
    readonly target = '',
    private readonly attributes: string[] = [],
  ) {
    super(null);
  }
  override closest() {
    return this;
  }
  hasAttribute(name: string) {
    return this.attributes.includes(name);
  }
}

const ORIGIN = 'https://mediprice.test';

beforeAll(() => {
  Object.assign(globalThis, {
    Element: FakeElement,
    HTMLAnchorElement: FakeAnchor,
    window: { location: new URL(`${ORIGIN}/search?q=a`) },
  });
});

afterAll(() => {
  for (const key of ['Element', 'HTMLAnchorElement', 'window']) {
    Reflect.deleteProperty(globalThis, key);
  }
});

function click(target: unknown, init: Partial<MouseEvent> = {}) {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target,
    ...init,
  } as MouseEvent;
}

describe('appLinkTarget', () => {
  it('앱 안 다른 화면으로 가는 링크면 주소를 준다', () => {
    const url = appLinkTarget(
      click(new FakeAnchor(`${ORIGIN}/items/A?x=1#top`)),
    );
    expect(url?.href).toBe(`${ORIGIN}/items/A?x=1#top`);
  });

  it('링크 안쪽 요소를 눌러도 가장 가까운 링크를 본다', () => {
    const inner = new FakeElement(new FakeAnchor(`${ORIGIN}/map`));
    expect(appLinkTarget(click(inner))?.pathname).toBe('/map');
  });

  it('보조키·가운데 버튼·새 탭·다운로드는 브라우저에 맡긴다', () => {
    const anchor = new FakeAnchor(`${ORIGIN}/map`);
    expect(appLinkTarget(click(anchor, { metaKey: true }))).toBeNull();
    expect(appLinkTarget(click(anchor, { button: 1 }))).toBeNull();
    expect(
      appLinkTarget(click(new FakeAnchor(`${ORIGIN}/map`, '_blank'))),
    ).toBeNull();
    expect(
      appLinkTarget(click(new FakeAnchor(`${ORIGIN}/map`, '', ['download']))),
    ).toBeNull();
  });

  it('다른 출처나 같은 화면 안 이동은 앱 이동이 아니다', () => {
    expect(
      appLinkTarget(click(new FakeAnchor('https://other.test/map'))),
    ).toBeNull();
    expect(
      appLinkTarget(click(new FakeAnchor(`${ORIGIN}/search?q=a#reviews`))),
    ).toBeNull();
  });

  it('링크가 아닌 것을 누르면 null이다', () => {
    expect(appLinkTarget(click(new FakeElement(null)))).toBeNull();
    expect(appLinkTarget(click(null))).toBeNull();
  });
});
