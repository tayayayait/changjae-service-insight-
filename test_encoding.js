const crypto = require('crypto');

function decodeUTF8AsCP949(text) {
  const buf = Buffer.from(text, 'utf8');
  let decoder = new TextDecoder('euc-kr');
  return decoder.decode(buf);
}

const stringsToTest = [
  "결과를",     // EA B2 B0 EA B3 BC EB A5 BC
  "경계를",
  "경력을",
  "경험을",
  "관계를",
  "결제를",
  "견해를"
];

for (const s of stringsToTest) {
  console.log(`${s} -> ${decodeUTF8AsCP949(s)}`);
}
