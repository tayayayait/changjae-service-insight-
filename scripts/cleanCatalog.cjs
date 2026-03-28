const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(process.argv[2] || '');

if (!fs.existsSync(targetPath)) {
    console.error("File not found: " + targetPath);
    process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// Remove eta from ServiceCardDefinition interfaces
content = content.replace(/eta: string;\s*/g, '');

// Remove rating and reviewCount from ServiceLandingData interface
content = content.replace(/rating: number;\s*/g, '');
content = content.replace(/reviewCount: number;\s*/g, '');

// Remove priceText fields entirely if they only say "무료" or similar
// But per requirement, priceText may remain or just remove dummy data. I'll remove it too for clean UI as requested? Actually let's keep priceText if there are premium services, but users asked to remove mock data like "rating, review count, eta".
// The user also mentioned "Premium subscription unlocks all".

// Remove from object literals
// e.g., eta: "인생 지도", 
content = content.replace(/eta:\s*["'].*?["'],\s*/g, '');

// Remove rating: 5.0,
content = content.replace(/rating:\s*\d+(\.\d*)?,\s*/g, '');

// Remove reviewCount: 42100,
content = content.replace(/reviewCount:\s*\d+,\s*/g, '');

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Successfully cleaned " + targetPath);
