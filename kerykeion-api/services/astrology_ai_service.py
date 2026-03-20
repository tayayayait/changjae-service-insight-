import os
import google.generativeai as genai

class AstrologyAIService:
    def __init__(self, api_key=None):
        if not api_key:
            api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-pro')
        else:
            self.model = None

    def generate_natal_reading(self, name, big3):
        """네이탈 차트(출생 천궁도) 심층 AI 해석"""
        if not self.model:
            return "Gemini API 키가 설정되지 않아 AI 심층 해석을 제공할 수 없습니다."
        
        prompt = f"""
        당신은 20년 경력의 따뜻하고 통찰력 있는 서양 점성가입니다.
        다음은 내담자 '{name}'님의 출생 천궁도(Natal Chart) 핵심 데이터(Big 3)입니다.
        
        [Big 3 데이터]
        - 태양(Sun, 자아/정체성): {big3.get('sun', {}).get('signKo', '알 수 없음')}
        - 달(Moon, 내면/감정): {big3.get('moon', {}).get('signKo', '알 수 없음')}
        - 상승점(Ascendant, 페르소나/첫인상): {big3.get('rising', {}).get('signKo', '알 수 없음')}
        
        이 데이터를 바탕으로 {name}님을 위한 심도 깊고 감동적인 점성학 리포트를 작성해주세요.
        
        [작성 가이드]
        1. 우주가 부여한 고유한 빛 (총평): 이 사람의 전반적인 에너지와 핵심 기질을 매력적으로 묘사해주세요.
        2. 내면과 외면의 춤 (태양과 달의 조화): 삶의 목적성(태양)과 내면의 안식처(달)가 어떻게 상호작용하는지 분석해주세요.
        3. 세상을 향한 첫걸음 (상승점): 사회에서 어떤 첫인상을 주며, 어떤 방식의 삶을 개척해 나가는지 설명해주세요.
        4. 별의 조언: 이 별자리 조합을 가진 사람이 더 행복하게 살기 위한 따뜻한 통찰을 제공해주세요.
        
        [작성 스타일]
        - 친절하고 다정하며 전문가다운 어조(~입니다, ~해요)를 사용하세요.
        - 마크다운 문법을 사용하여 가독성 있게 작성해주세요. (제목은 `###` 등 활용)
        - 약 500자 ~ 700자 분량으로 작성하세요.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"AI 해석 생성 중 오류가 발생했습니다: {str(e)}"

    def generate_synastry_reading(self, p1_name, p2_name, score, positive_count, negative_count, aspects):
        """시나스트리(궁합) 심층 AI 해석"""
        if not self.model:
            return "Gemini API 키가 설정되지 않아 AI 심층 해석을 제공할 수 없습니다."
        
        major_aspects = ", ".join([f"{a['planet1Ko']}와 {a['planet2Ko']}의 {a['aspectTypeKo']}({a['influence']})" for a in aspects[:5]])
        
        prompt = f"""
        당신은 관계 점성학(Synastry) 전문 상담가입니다.
        다음은 '{p1_name}'님과 '{p2_name}'님의 별자리 궁합 데이터입니다.
        
        [궁합 데이터]
        - 전체 궁합 점수: {score}점 / 100점
        - 조화로운 각도(긍정): {positive_count}개
        - 긴장/갈등 각도(부정): {negative_count}개
        - 주요 상호작용: {major_aspects}
        
        이 데이터를 바탕으로 두 사람의 관계에 대한 심도 깊은 리포트를 작성해주세요.
        
        [작성 가이드]
        1. 우주적 인연의 색깔 (총평): 이 관계의 전반적인 분위기와 끌림의 강도를 묘사해주세요.
        2. 두 사람의 찰떡 포인트 (조화): 서로에게 어떤 긍정적인 에너지를 주는지 설명해주세요.
        3. 극복해야 할 우주적 과제 (갈등 요소): 관계에서 부딪힐 수 있는 부분과 그 해결책을 부드럽게 조언해주세요.
        4. 관계를 위한 처방전: 두 사람이 오래도록 건강한 관계를 유지하기 위한 현실적이고 따옴표 위주의 조언 한 마디.
        
        [작성 스타일]
        - 친절하고 로맨틱하면서도 현실적인 어조를 유지하세요.
        - 마크다운 문법을 활용하여 가독성을 높여주세요.
        - 약 500자 ~ 700자 분량으로 작성하세요.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"AI 해석 생성 중 오류가 발생했습니다: {str(e)}"

    def generate_transit_reading(self, name, transits):
        """트랜짓(오늘의 운세) 심층 AI 해석"""
        if not self.model:
            return "Gemini API 키가 설정되지 않아 AI 심층 해석을 제공할 수 없습니다."
            
        transit_desc = "\n".join([f"- 현재 {t['transitKo']}가 나의 {t['natalKo']}에 {t['influence']} 영향을 줌 ({t['aspectTypeKo']})" for t in transits[:3]])
        
        prompt = f"""
        당신은 일일 운세의 흐름(Transit)을 읽어주는 점성학 멘토입니다.
        '{name}'님의 출생 차트를 기준으로, 오늘 하늘의 행성들이 미치는 주요 영향력을 분석한 데이터입니다.
        
        [오늘의 주요 트랜짓 영향력]
        {transit_desc if transits else "- 오늘은 우주 파동이 잔잔하여 평온한 기운이 지배적입니다."}
        
        이 데이터를 바탕으로 {name}님을 위한 오늘의 특별한 조언을 작성해주세요.
        
        [작성 가이드]
        1. 오늘의 우주 날씨 (총평): 오늘 하루의 전반적인 분위기.
        2. 하이라이트 에너지: 일/사랑/대인관계 등에서 특별히 신경 써야 하거나 유리한 부분.
        3. 행동 지침: 오늘 하루를 가장 지혜롭게 보내기 위한 멘토의 조언.
        
        [작성 스타일]
        - 마음을 편안하게 해주는 힐링 어조를 사용하세요.
        - 마크다운 문법을 활용해주세요.
        - 약 400자 분량으로 핵심만 간결하고 따뜻하게 작성하세요.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"AI 해석 생성 중 오류가 발생했습니다: {str(e)}"

    def generate_cosmic_calendar(self, year, month):
        """코스믹 캘린더 월간 이벤트 AI 생성"""
        if not self.model:
            return "Gemini API 키가 설정되지 않아 AI 심층 해석을 제공할 수 없습니다."
            
        prompt = f"""
        당신은 천문학과 점성학을 통합하여 매월 우주의 주요 이벤트를 안내하는 코스믹 캘린더 전문가입니다.
        이번 달 데이터: {year}년 {month}월
        
        해당 년/월에 발생하는 점성학적으로 중요한 주요 하늘의 이벤트를 나열하고 그 의미를 해석해주세요.
        정확한 천문학적 트랜짓 데이터를 기반으로 가상의 이벤트를 만들지 말고, 일반적으로 중요하게 다뤄지는 이벤트들(예: 뉴문, 풀문, 주요 행성의 별자리 이동, 눈에 띄는 주요 각도, 수성/금성 역행 등)을 4~5개 정도 시간순으로 정리해주세요. (실제 데이터와 다소 오차가 있어도 무방하니, 긍정적인 메시지 위주로 작성)
        
        [작성 가이드]
        1. 이달의 우주 테마 (총평): 전체적인 월간 에너지 흐름
        2. 날짜별 주요 이벤트: (예: 5일 - 사수자리의 보름달: 결실과 완성) 
        3. 활용 팁: 이달의 에너지를 직장/연애/내면 성장에 어떻게 활용하면 좋을지
        
        [작성 스타일]
        - 신비롭고 영감을 주는 부드러운 어조를 사용하세요.
        - 마크다운을 적극 활용하여 정보(날짜, 테마)가 돋보이게 해주세요.
        - 약 800자 이내로 풍성하게 작성하세요.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"AI 생성 중 오류가 발생했습니다: {str(e)}"

    def generate_daily_horoscope(self, sign):
        """태양 별자리(Sun Sign) 기반 오늘의 운세 AI 생성"""
        if not self.model:
            return "Gemini API 키가 설정되지 않아 AI 운세를 제공할 수 없습니다."
            
        prompt = f"""
        당신은 상냥하고 통찰력 있는 서양 점성가입니다.
        오늘 하늘의 행성 배치를 고려하여, 태양 별자리가 '{sign}'인 분들을 위한 오늘의 운세를 작성해주세요.
        정확한 현재 날짜의 우주 날씨를 반영해주시면 가장 좋습니다.
        
        [작성 가이드]
        1. 우주가 보내는 메시지 (오늘의 테마): 오늘의 전반적인 분위기와 운의 흐름.
        2. 하이라이트 에너지: 직업, 연애, 금전 등 특별히 눈에 띄게 좋은 부분.
        3. 럭키 포인트: 오늘의 행운의 색상, 행운의 아이템, 또는 행운의 시간대.
        
        [작성 스타일]
        - 마음을 편안하게 해주는 가볍고 따뜻한 어조(~해요, ~입니다)를 사용하세요.
        - 마크다운 문법을 사용하여 섹션 구분을 깔끔하게 해주세요.
        - 약 400~500자 이내로 긍정적인 희망을 담아 작성하세요.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"운세 생성 중 오류가 발생했습니다: {str(e)}"

astrology_ai_service = AstrologyAIService()
