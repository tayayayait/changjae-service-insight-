const iconv = require('iconv-lite');
const str = "연애 궁합 결과를 불러오는 중입니다.";
const buf = Buffer.from(str, 'utf8');
const cp949Str = iconv.decode(buf, 'cp949');
console.log(cp949Str);
