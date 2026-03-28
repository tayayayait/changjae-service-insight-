import iconv from 'iconv-lite';
const str = "연결 결과를 불러오는 중입니다.";
const buf = Buffer.from(str, 'utf8');
const cp949Str = iconv.decode(buf, 'cp949');
console.log(cp949Str);
