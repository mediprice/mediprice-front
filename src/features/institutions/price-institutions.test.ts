import { describe, expect, it } from 'vitest';

import { isPricedInstitution } from './price-institutions';

describe('isPricedInstitution', () => {
  it('병원·의원·치과·한방은 남긴다', () => {
    for (const code of [
      '01',
      '05',
      '11',
      '21',
      '28',
      '29',
      '31',
      '41',
      '51',
      '91',
      '92',
      '93',
    ])
      expect(isPricedInstitution(code)).toBe(true);
  });

  it('약국·조산원·보건기관·비요양기관·묶음 코드는 뺀다', () => {
    for (const code of ['61', '71', '72', '73', '75', '81', '99', 'AA'])
      expect(isPricedInstitution(code)).toBe(false);
  });
});
