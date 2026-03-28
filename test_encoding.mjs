function decodeUTF8AsCP949(text) {
  const buf = Buffer.from(text, 'utf8');
  let decoder = new TextDecoder('euc-kr');
  return decoder.decode(buf);
}

const errorStrings = [
  "결과를 불러오지 못했습니다.",
  "점성학 분석 결과를 불러오지 못했습니다.",
  "사주 결과를 불러오지 못했습니다.",
  "결과를 불러오는 중 문제가 발생했습니다.",
  "결과를 불러오는 중 오류가 발생했습니다.",
  "결과를 불러올 수 없습니다."
];

for (const s of errorStrings) {
  console.log(`${s} -> ${decodeUTF8AsCP949(s)}`);
}
