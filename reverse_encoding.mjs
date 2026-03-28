import iconv from 'iconv-lite';

// The text is probably:
const corruptedText = "浚곗 〈遺葎꽦 寃곌낵瑜";
const buf = iconv.encode(corruptedText, 'cp949');
console.log(buf.toString('utf8'));

// What if we try to find UTF-8 strings that result in those CP949 chars?
const tests = [
  "연애 궁합 결과를",
  "분석 결과를 불러오는",
  "상담 결과를 불러오는",
  "운세 결과를 불러오는",
  "보고서 결과를 불러오는",
  "사주 결과를 불러오는"
];

tests.forEach(t => {
  const enc = iconv.decode(Buffer.from(t, 'utf8'), 'euc-kr');
  console.log(`${t} -> ${enc}`);
});
