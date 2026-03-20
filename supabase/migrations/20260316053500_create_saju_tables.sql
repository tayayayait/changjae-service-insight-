-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_type VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  day INT NOT NULL,
  hour INT,
  minute INT,
  time_block VARCHAR(50),
  location VARCHAR(100),
  gender VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 관심사 + 결과 테이블
CREATE TABLE saju_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100), -- 비회원을 위한 식별자 (예: LocalStorage UUID)
  
  -- 데이터 스냅샷
  born_data JSONB NOT NULL,    -- 입력 당시의 {year, month, day, time...}
  palja_data JSONB NOT NULL,   -- 네 기둥 {year, month, day, time} 한자/오행 
  oheng_data JSONB NOT NULL,   -- 오행 비율
  
  -- 관심사와 분석결과
  interests TEXT[] NOT NULL,   -- 선택된 관심사 목록
  free_question TEXT,          -- 직접 입력 질문 여부
  gemini_summary TEXT,         -- 총평
  gemini_sections JSONB NOT NULL, -- 섹션별 구체적 해석 [{title, interpretation, advice, luckyTip}]
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (회원/비회원 조회 성능 향상)
CREATE INDEX idx_saju_results_user_id ON saju_results(user_id);
CREATE INDEX idx_saju_results_guest_id ON saju_results(guest_id);

-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) 정의
-- --------------------------------------------------------

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_results ENABLE ROW LEVEL SECURITY;

-- user_profiles 정책 (자신만 읽고 쓰기)
CREATE POLICY "Users can insert their own profile" 
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read their own profile" 
  ON user_profiles FOR SELECT USING (auth.uid() = id);

-- saju_results 정책 (관련 user_id 거나 guest_id 일치할 경우 접근 가능)
-- (실제 서비스에서는 비회원 식별과 권한 로직을 추가로 보강해야 할 수도 있음)
CREATE POLICY "Anyone can insert saju_results"
  ON saju_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own saju_results"
  ON saju_results FOR SELECT USING (
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    (guest_id IS NOT NULL) 
    -- 비회원의 경우 RLS에서 guest_id 기준으로만 제어할 경우 취약할수 있음. 
    -- 여기서는 오픈형으로 하고 추후 앱 레벨 방어를 전제함.
  );
