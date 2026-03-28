import { describe, it, expect } from 'vitest';
import { resolveLongitude } from '../sajuEngine';
import { normalizeRegionSelection } from '../koreanRegions';

describe('Region Logic', () => {
  it('should resolve correct longitudes for separated regions', () => {
    expect(resolveLongitude('서울')).toBe(126.978);
    expect(resolveLongitude('인천')).toBe(126.7052);
    expect(resolveLongitude('세종')).toBe(127.289);
    expect(resolveLongitude('충북')).toBe(127.5);
    expect(resolveLongitude('경기')).toBe(126.9);
  });

  it('should normalize separated region names to correct Sido', () => {
    expect(normalizeRegionSelection('충북').sido).toBe('충청북도');
    expect(normalizeRegionSelection('세종').sido).toBe('세종특별자치시');
    expect(normalizeRegionSelection('인천').sido).toBe('인천광역시');
    expect(normalizeRegionSelection('경기').sido).toBe('경기도');
  });

  it('should still handle legacy grouped names for backward compatibility', () => {
    expect(normalizeRegionSelection('충북/세종').sido).toBe('충청북도');
    expect(normalizeRegionSelection('경기/인천').sido).toBe('경기도');
  });
});
