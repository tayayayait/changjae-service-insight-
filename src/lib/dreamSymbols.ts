export interface DreamSymbol {
  id: string;
  label: string;
  category: "nature" | "animal" | "object" | "emotion";
  hint: string;
}

export const DREAM_SYMBOLS: DreamSymbol[] = [
  { id: "moon", label: "달", category: "nature", hint: "감정, 회복, 직관" },
  { id: "water", label: "물", category: "nature", hint: "흐름, 정화, 관계" },
  { id: "forest", label: "숲", category: "nature", hint: "탐색, 성장, 진로" },
  { id: "bird", label: "새", category: "animal", hint: "소식, 이동, 기회" },
  { id: "snake", label: "뱀", category: "animal", hint: "변화, 경계, 재정비" },
  { id: "door", label: "문", category: "object", hint: "전환점, 선택, 시작" },
  { id: "mirror", label: "거울", category: "object", hint: "자기인식, 점검, 관계" },
  { id: "stairs", label: "계단", category: "object", hint: "단계적 성장, 속도 조절" },
  { id: "fire", label: "불", category: "nature", hint: "의욕, 갈등, 추진력" },
  { id: "wind", label: "바람", category: "nature", hint: "변동, 정보, 커뮤니케이션" },
  { id: "tears", label: "눈물", category: "emotion", hint: "해소, 정리, 관계 회복" },
  { id: "laugh", label: "웃음", category: "emotion", hint: "완화, 유대, 긍정 신호" },
];
