import { resolveLongitude } from './src/lib/sajuEngine';
import { normalizeRegionSelection } from './src/lib/koreanRegions';

const testRegions = ["충북", "세종", "인천", "대전", "대구", "부산", "울산", "광주", "경기"];

console.log("--- Longitude Resolution Test ---");
testRegions.forEach(region => {
    const lon = resolveLongitude(region);
    console.log(`${region}: ${lon}`);
});

console.log("\n--- Region Normalization Test ---");
testRegions.forEach(region => {
    const norm = normalizeRegionSelection(region);
    console.log(`${region} -> Sido: ${norm.sido}, Sigungu: ${norm.sigungu}`);
});
