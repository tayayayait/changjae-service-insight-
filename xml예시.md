# XML ??

```xml
<?xml version="1.0" encoding="UTF-8"?>
<uiux-spec title="사주·운세 웹 플랫폼 UI/UX 구현 상세서" source="상세서.md" language="ko" format="xml-example">
  <!-- Section: 개요 -->
  <section id="overview" title="개요">
    <table columns="item,value,usage,rule">
      <row index="1" key="overview-munseo-mokjeok">
        <item>문서 목적</item>
        <value>MVP UI/UX 기준서 1종</value>
        <usage>전체 제품</usage>
        <rule>디자인, 프론트엔드, QA가 동일 기준으로 사용한다. 개별 해석으로 수치를 바꾸지 않는다.</rule>
      </row>
      <row index="2" key="overview-dijain-wonchik-01">
        <item>디자인 원칙 01</item>
        <value>모바일 퍼스트</value>
        <usage>전체 화면</usage>
        <rule>설계 시작점은 360px이다. 데스크톱은 같은 정보 구조를 확장한다.</rule>
      </row>
      <row index="3" key="overview-dijain-wonchik-02">
        <item>디자인 원칙 02</item>
        <value>한자 없는 해석</value>
        <usage>결과 카드, 도움말, 입력 가이드</usage>
        <rule>전문 용어는 최초 1회만 쉬운 한국어 설명과 함께 노출한다. 한자 단독 표기는 금지한다.</rule>
      </row>
      <row index="4" key="overview-dijain-wonchik-03">
        <item>디자인 원칙 03</item>
        <value>감성적 카드 중심</value>
        <usage>홈, 리포트, 운세, 궁합</usage>
        <rule>핵심 정보는 카드 단위로 묶는다. 한 화면에 1차 강조 카드 수는 3개를 넘기지 않는다.</rule>
      </row>
      <row index="5" key="overview-dijain-wonchik-04">
        <item>디자인 원칙 04</item>
        <value>정보 우선 시각화</value>
        <usage>오행 차트, 대운 타임라인, 운세 그래프</usage>
        <rule>차트 앞에 요약 수치와 한 줄 해석을 먼저 노출한다. 차트만 단독 배치하지 않는다.</rule>
      </row>
      <row index="6" key="overview-beomwi-poham">
        <item>범위 포함</item>
        <value>홈 / 사주 입력 / 결과 리포트 / 운세 / 궁합 / 마이페이지</value>
        <usage>MVP 화면</usage>
        <rule>빈 상태, 로딩 상태, 오류 상태, 저장·공유 CTA까지 포함한다.</rule>
      </row>
      <row index="7" key="overview-beomwi-jeoe">
        <item>범위 제외</item>
        <value>명리 계산 엔진 / 로그인 API / 결제 SDK</value>
        <usage>백엔드, 외부 연동</usage>
        <rule>UI가 기대하는 입력값, 출력 상태, 실패 메시지 규칙만 정의한다.</rule>
      </row>
    </table>
  </section>
  <!-- Section: 디자인 토큰 -->
  <section id="design-tokens" title="디자인 토큰">
    <subsection id="token-naming-rules" title="토큰 네이밍 규칙">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-token-naming-rules-saeksang-tokeun">
          <item>색상 토큰</item>
          <value>color.*</value>
          <usage>Figma 변수, CSS 변수</usage>
          <rule>의미 기반으로 관리한다. 예: color.bg.base, color.text.primary.</rule>
        </row>
        <row index="2" key="design-tokens-token-naming-rules-taipo-tokeun">
          <item>타이포 토큰</item>
          <value>font.*</value>
          <usage>텍스트 스타일</usage>
          <rule>크기, 줄간격, 굵기를 한 세트로 관리한다. 예: font.body.</rule>
        </row>
        <row index="3" key="design-tokens-token-naming-rules-yeobaek-tokeun">
          <item>여백 토큰</item>
          <value>space.*</value>
          <usage>padding, gap, margin</usage>
          <rule>임의 숫자 사용 금지. 표에 없는 여백은 가장 가까운 토큰으로 반올림한다.</rule>
        </row>
        <row index="4" key="design-tokens-token-naming-rules-raundeu-tokeun">
          <item>라운드 토큰</item>
          <value>radius.*</value>
          <usage>카드, 입력창, 모달</usage>
          <rule>원형 버튼 외에는 12px, 16px, 24px만 사용한다.</rule>
        </row>
        <row index="5" key="design-tokens-token-naming-rules-geurimja-tokeun">
          <item>그림자 토큰</item>
          <value>shadow.*</value>
          <usage>카드, 모달, 드로어, 토스트</usage>
          <rule>한 컴포넌트에 그림자 레이어는 1개만 사용한다.</rule>
        </row>
        <row index="6" key="design-tokens-token-naming-rules-mosyeon-tokeun">
          <item>모션 토큰</item>
          <value>motion.*</value>
          <usage>hover, page transition, modal</usage>
          <rule>transform, opacity, box-shadow만 애니메이션한다. width, height 애니메이션은 금지한다.</rule>
        </row>
        <row index="7" key="design-tokens-token-naming-rules-reieo-tokeun">
          <item>레이어 토큰</item>
          <value>z.*</value>
          <usage>sticky, overlay, toast</usage>
          <rule>표의 값만 사용한다. 임의 z-index 추가 금지.</rule>
        </row>
        <row index="8" key="design-tokens-token-naming-rules-beureikeupointeu-tokeun">
          <item>브레이크포인트 토큰</item>
          <value>breakpoint.*</value>
          <usage>반응형 분기</usage>
          <rule>360, 768, 1024, 1440 기준만 사용한다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="color-system" title="색상 시스템">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-color-system-color-bg-base">
          <item>color.bg.base</item>
          <value>#FFFDF8</value>
          <usage>앱 기본 배경</usage>
          <rule>전체 페이지 기본 배경색이다. 본문 영역에 가장 넓게 사용한다.</rule>
        </row>
        <row index="2" key="design-tokens-color-system-color-bg-surface">
          <item>color.bg.surface</item>
          <value>#FFF8EE</value>
          <usage>보조 섹션 배경, 카드 군집 배경</usage>
          <rule>같은 화면에서 bg.base 다음 단계 배경으로만 사용한다.</rule>
        </row>
        <row index="3" key="design-tokens-color-system-color-bg-subtle">
          <item>color.bg.subtle</item>
          <value>#F6EFE6</value>
          <usage>비활성 영역, 입력 hover, 분리 배경</usage>
          <rule>면적이 큰 블록에 사용 가능하나 텍스트는 text.primary만 허용한다.</rule>
        </row>
        <row index="4" key="design-tokens-color-system-color-bg-elevated">
          <item>color.bg.elevated</item>
          <value>#FFFFFF</value>
          <usage>카드, 모달, 드로어, 토스트</usage>
          <rule>떠 있는 UI의 기본 배경이다.</rule>
        </row>
        <row index="5" key="design-tokens-color-system-color-bg-inverse">
          <item>color.bg.inverse</item>
          <value>#24303F</value>
          <usage>반전 CTA, dark badge</usage>
          <rule>긴 본문 배경으로 쓰지 않는다.</rule>
        </row>
        <row index="6" key="design-tokens-color-system-color-line-default">
          <item>color.line.default</item>
          <value>#E7DDD1</value>
          <usage>기본 테두리, 구분선</usage>
          <rule>기본 1px 보더에 사용한다.</rule>
        </row>
        <row index="7" key="design-tokens-color-system-color-line-strong">
          <item>color.line.strong</item>
          <value>#D6C8B9</value>
          <usage>hover 보더, 카드 강조 경계</usage>
          <rule>기본 보더보다 한 단계 강한 상태에만 사용한다.</rule>
        </row>
        <row index="8" key="design-tokens-color-system-color-focus-ring">
          <item>color.focus.ring</item>
          <value>#7AA9FF</value>
          <usage>focus ring, 키보드 포커스</usage>
          <rule>모든 인터랙티브 요소에 2px 외곽선으로 적용한다.</rule>
        </row>
        <row index="9" key="design-tokens-color-system-color-overlay-scrim">
          <item>color.overlay.scrim</item>
          <value>#24303F85</value>
          <usage>모달, 드로어 배경 딤</usage>
          <rule>오버레이 불투명도는 이 값으로 고정한다.</rule>
        </row>
        <row index="10" key="design-tokens-color-system-color-text-primary">
          <item>color.text.primary</item>
          <value>#24303F</value>
          <usage>본문, 제목, 주요 수치</usage>
          <rule>기본 텍스트 색이다. 본문 대비 4.5:1 이상을 유지한다.</rule>
        </row>
        <row index="11" key="design-tokens-color-system-color-text-secondary">
          <item>color.text.secondary</item>
          <value>#5E6B7A</value>
          <usage>부제, 설명문, 리스트 메타</usage>
          <rule>본문 보조 텍스트에 사용한다.</rule>
        </row>
        <row index="12" key="design-tokens-color-system-color-text-muted">
          <item>color.text.muted</item>
          <value>#8B96A3</value>
          <usage>캡션, 날짜, 비활성 텍스트</usage>
          <rule>본문 핵심 정보에는 사용하지 않는다.</rule>
        </row>
        <row index="13" key="design-tokens-color-system-color-text-inverse">
          <item>color.text.inverse</item>
          <value>#FFFFFF</value>
          <usage>반전 배경 위 텍스트</usage>
          <rule>bg.inverse 또는 진한 포인트 배경에서만 사용한다.</rule>
        </row>
        <row index="14" key="design-tokens-color-system-color-accent-pink">
          <item>color.accent.pink</item>
          <value>#F3B6C7</value>
          <usage>연애운, 감정 카드, 보조 CTA</usage>
          <rule>화면 전체 면적의 15% 이내로 제한한다.</rule>
        </row>
        <row index="15" key="design-tokens-color-system-color-accent-mint">
          <item>color.accent.mint</item>
          <value>#AEE7D8</value>
          <usage>성장, 목 기운, 상태 강조</usage>
          <rule>성공 의미와 혼동되지 않도록 아이콘 또는 라벨과 함께 쓴다.</rule>
        </row>
        <row index="16" key="design-tokens-color-system-color-accent-sky">
          <item>color.accent.sky</item>
          <value>#AFCFFF</value>
          <usage>정보성 배지, 수 기운, 운세 그래프</usage>
          <rule>링크 색으로 직접 사용하지 않는다.</rule>
        </row>
        <row index="17" key="design-tokens-color-system-color-accent-lavender">
          <item>color.accent.lavender</item>
          <value>#CBB7F6</value>
          <usage>주요 CTA, 브랜드 강조, 궁합 포인트</usage>
          <rule>메인 액션 색으로 우선 사용한다.</rule>
        </row>
        <row index="18" key="design-tokens-color-system-color-accent-coral">
          <item>color.accent.coral</item>
          <value>#FFB59E</value>
          <usage>오늘의 운세, 열정 카드, 화 기운</usage>
          <rule>경고 색과 혼동되지 않도록 아이콘 또는 점수와 함께 쓴다.</rule>
        </row>
        <row index="19" key="design-tokens-color-system-color-state-success">
          <item>color.state.success</item>
          <value>#4FA67A</value>
          <usage>성공 아이콘, 상태 라벨</usage>
          <rule>텍스트로 쓸 때는 14px 이상만 허용한다.</rule>
        </row>
        <row index="20" key="design-tokens-color-system-color-state-success-soft">
          <item>color.state.success.soft</item>
          <value>#ECF7F1</value>
          <usage>성공 배지 배경, 성공 카드 배경</usage>
          <rule>면 배경과 라벨 조합으로 사용한다.</rule>
        </row>
        <row index="21" key="design-tokens-color-system-color-state-warning">
          <item>color.state.warning</item>
          <value>#F2A65A</value>
          <usage>주의 알림, 보정 필요 상태</usage>
          <rule>오류와 혼동되지 않도록 문구를 반드시 병행한다.</rule>
        </row>
        <row index="22" key="design-tokens-color-system-color-state-warning-soft">
          <item>color.state.warning.soft</item>
          <value>#FFF4E7</value>
          <usage>경고 배경, 부드러운 안내 배너</usage>
          <rule>하드 경고 대신 소프트 주의 상태에 사용한다.</rule>
        </row>
        <row index="23" key="design-tokens-color-system-color-state-error">
          <item>color.state.error</item>
          <value>#D96B6B</value>
          <usage>필드 오류, 실패 토스트, 오류 배너</usage>
          <rule>색상만으로 오류를 전달하지 않는다. 아이콘과 문구를 함께 쓴다.</rule>
        </row>
        <row index="24" key="design-tokens-color-system-color-state-error-soft">
          <item>color.state.error.soft</item>
          <value>#FDEEEE</value>
          <usage>오류 카드, 오류 인라인 배경</usage>
          <rule>retry CTA와 함께 사용한다.</rule>
        </row>
        <row index="25" key="design-tokens-color-system-color-state-info">
          <item>color.state.info</item>
          <value>#6BA7D9</value>
          <usage>시스템 안내, 정보 배지</usage>
          <rule>중립 정보성 알림에 사용한다.</rule>
        </row>
        <row index="26" key="design-tokens-color-system-color-state-info-soft">
          <item>color.state.info.soft</item>
          <value>#EEF6FC</value>
          <usage>정보 토스트, 정보 배너</usage>
          <rule>안내형 메시지 기본 배경이다.</rule>
        </row>
        <row index="27" key="design-tokens-color-system-color-chart-grid">
          <item>color.chart.grid</item>
          <value>#EDE4D8</value>
          <usage>차트 그리드, 타임라인 가이드</usage>
          <rule>1px 선으로만 사용한다.</rule>
        </row>
        <row index="28" key="design-tokens-color-system-color-chart-axis">
          <item>color.chart.axis</item>
          <value>#8B96A3</value>
          <usage>차트 축 라벨, 범례 메타</usage>
          <rule>font.label 이상 크기에만 사용한다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="element-color-tokens" title="오행 색상 토큰">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-element-color-tokens-color-element-wood">
          <item>color.element.wood</item>
          <value>#AEE7D8</value>
          <usage>목 오행 차트, 성향 카드</usage>
          <rule>자연 메타포 아이콘과 함께 사용한다.</rule>
        </row>
        <row index="2" key="design-tokens-element-color-tokens-color-element-fire">
          <item>color.element.fire</item>
          <value>#FFB59E</value>
          <usage>화 오행 차트, 행동성 강조</usage>
          <rule>경고 의미로 재사용하지 않는다.</rule>
        </row>
        <row index="3" key="design-tokens-element-color-tokens-color-element-earth">
          <item>color.element.earth</item>
          <value>#EBCB9B</value>
          <usage>토 오행 차트, 안정 카드</usage>
          <rule>밝은 배경 위 텍스트는 text.primary만 사용한다.</rule>
        </row>
        <row index="4" key="design-tokens-element-color-tokens-color-element-metal">
          <item>color.element.metal</item>
          <value>#D9D6F5</value>
          <usage>금 오행 차트, 구조성 카드</usage>
          <rule>라벤더 계열과 섞을 때 테두리 또는 라벨로 구분한다.</rule>
        </row>
        <row index="5" key="design-tokens-element-color-tokens-color-element-water">
          <item>color.element.water</item>
          <value>#AFCFFF</value>
          <usage>수 오행 차트, 흐름 카드</usage>
          <rule>목 색상과 혼동되지 않도록 순서 라벨을 병행한다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="typography" title="타이포그래피">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-typography-font-family-base">
          <item>font.family.base</item>
          <value>Pretendard Variable, "Noto Sans KR", sans-serif</value>
          <usage>전체 UI</usage>
          <rule>제목과 본문 모두 같은 패밀리를 사용한다.</rule>
        </row>
        <row index="2" key="design-tokens-typography-font-family-numeric">
          <item>font.family.numeric</item>
          <value>Pretendard Variable</value>
          <usage>점수, 날짜, 차트 수치</usage>
          <rule>tabular-nums를 활성화한다.</rule>
        </row>
        <row index="3" key="design-tokens-typography-font-h1">
          <item>font.h1</item>
          <value>32px / 40px / 800</value>
          <usage>홈 hero, 결과 요약 헤드라인</usage>
          <rule>한 줄 최대 18자를 권장한다.</rule>
        </row>
        <row index="4" key="design-tokens-typography-font-h2">
          <item>font.h2</item>
          <value>24px / 32px / 700</value>
          <usage>섹션 타이틀, 모달 제목</usage>
          <rule>한 화면에 2개 이상 연속 사용하지 않는다.</rule>
        </row>
        <row index="5" key="design-tokens-typography-font-h3">
          <item>font.h3</item>
          <value>20px / 28px / 700</value>
          <usage>카드 제목, 탭 제목</usage>
          <rule>카드 헤더 기본 타이틀로 사용한다.</rule>
        </row>
        <row index="6" key="design-tokens-typography-font-title">
          <item>font.title</item>
          <value>18px / 26px / 700</value>
          <usage>요약 카드, 서브 헤드라인</usage>
          <rule>2줄을 넘기면 body-strong으로 낮춘다.</rule>
        </row>
        <row index="7" key="design-tokens-typography-font-body">
          <item>font.body</item>
          <value>16px / 26px / 400</value>
          <usage>본문, 입력값, 설명문</usage>
          <rule>모바일 본문 최소 크기다. 이보다 작은 본문 텍스트는 금지한다.</rule>
        </row>
        <row index="8" key="design-tokens-typography-font-body-strong">
          <item>font.body.strong</item>
          <value>16px / 26px / 600</value>
          <usage>강조 본문, 필드 값, 주요 메타</usage>
          <rule>본문과 동일 줄간격을 유지한다.</rule>
        </row>
        <row index="9" key="design-tokens-typography-font-caption">
          <item>font.caption</item>
          <value>14px / 22px / 500</value>
          <usage>도움말, 상태 메시지, 토스트 본문</usage>
          <rule>긴 단락에 사용하지 않는다.</rule>
        </row>
        <row index="10" key="design-tokens-typography-font-label">
          <item>font.label</item>
          <value>13px / 18px / 600</value>
          <usage>필드 라벨, 배지, 차트 범례</usage>
          <rule>전부 대문자 사용 금지.</rule>
        </row>
        <row index="11" key="design-tokens-typography-font-button">
          <item>font.button</item>
          <value>15px / 22px / 700</value>
          <usage>버튼 라벨</usage>
          <rule>primary, secondary, ghost 공통으로 사용한다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="spacing" title="Spacing">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-spacing-space-1">
          <item>space.1</item>
          <value>4px</value>
          <usage>아이콘과 텍스트 최소 간격</usage>
          <rule>단독 margin 값으로는 사용하지 않는다.</rule>
        </row>
        <row index="2" key="design-tokens-spacing-space-2">
          <item>space.2</item>
          <value>8px</value>
          <usage>라벨과 필드, 배지 내부 간격</usage>
          <rule>가장 작은 실사용 간격이다.</rule>
        </row>
        <row index="3" key="design-tokens-spacing-space-3">
          <item>space.3</item>
          <value>12px</value>
          <usage>카드 내부 소단위 gap</usage>
          <rule>보조 메타 그룹에 사용한다.</rule>
        </row>
        <row index="4" key="design-tokens-spacing-space-4">
          <item>space.4</item>
          <value>16px</value>
          <usage>입력 필드 간격, 카드 기본 gap</usage>
          <rule>모바일 기본 내부 간격이다.</rule>
        </row>
        <row index="5" key="design-tokens-spacing-space-5">
          <item>space.5</item>
          <value>20px</value>
          <usage>카드 모바일 패딩</usage>
          <rule>결과 카드, 요약 카드 기본 패딩이다.</rule>
        </row>
        <row index="6" key="design-tokens-spacing-space-6">
          <item>space.6</item>
          <value>24px</value>
          <usage>섹션 간격, 모달 패딩, 데스크톱 카드 패딩</usage>
          <rule>페이지 세로 흐름 기본 간격이다.</rule>
        </row>
        <row index="7" key="design-tokens-spacing-space-7">
          <item>space.7</item>
          <value>32px</value>
          <usage>큰 섹션 분리, hero 하단 간격</usage>
          <rule>한 화면에서 두 번 이상 연속 사용하지 않는다.</rule>
        </row>
        <row index="8" key="design-tokens-spacing-space-8">
          <item>space.8</item>
          <value>40px</value>
          <usage>페이지 상단 시작 간격</usage>
          <rule>데스크톱 확장 레이아웃에 우선 적용한다.</rule>
        </row>
        <row index="9" key="design-tokens-spacing-space-9">
          <item>space.9</item>
          <value>48px</value>
          <usage>그룹 전환, 대형 빈 공간</usage>
          <rule>의도된 강조 블록에만 사용한다.</rule>
        </row>
        <row index="10" key="design-tokens-spacing-space-10">
          <item>space.10</item>
          <value>64px</value>
          <usage>데스크톱 섹션 최대 분리</usage>
          <rule>모바일에는 사용하지 않는다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="radius" title="Radius">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-radius-radius-sm">
          <item>radius.sm</item>
          <value>12px</value>
          <usage>배지, 소형 버튼, 입력 보조 UI</usage>
          <rule>가장 작은 라운드 값이다.</rule>
        </row>
        <row index="2" key="design-tokens-radius-radius-md">
          <item>radius.md</item>
          <value>16px</value>
          <usage>버튼, 입력창, 토스트</usage>
          <rule>기본 인터랙션 컴포넌트 라운드다.</rule>
        </row>
        <row index="3" key="design-tokens-radius-radius-lg">
          <item>radius.lg</item>
          <value>24px</value>
          <usage>카드, 모달, 드로어</usage>
          <rule>큰 면적 컴포넌트 기본 라운드다.</rule>
        </row>
        <row index="4" key="design-tokens-radius-radius-full">
          <item>radius.full</item>
          <value>999px</value>
          <usage>segmented 버튼, pill 배지, 원형 액션</usage>
          <rule>CTA를 과도하게 둥글게 쓰지 않는다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="shadow" title="Shadow">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-shadow-shadow-sm">
          <item>shadow.sm</item>
          <value>0 4px 16px #24303F14</value>
          <usage>카드 hover, 입력 focus 보조, 토스트 기본</usage>
          <rule>가장 자주 쓰는 그림자다.</rule>
        </row>
        <row index="2" key="design-tokens-shadow-shadow-md">
          <item>shadow.md</item>
          <value>0 8px 24px #24303F1A</value>
          <usage>모달, 드로어, 강조 카드</usage>
          <rule>hover 또는 부상 레이어에서만 사용한다.</rule>
        </row>
        <row index="3" key="design-tokens-shadow-shadow-lg">
          <item>shadow.lg</item>
          <value>0 16px 40px #24303F1F</value>
          <usage>전체 화면 모달, 핵심 CTA 플로팅 바</usage>
          <rule>화면당 1개 레이어만 허용한다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="motion" title="Motion">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-motion-motion-fast">
          <item>motion.fast</item>
          <value>120ms</value>
          <usage>아이콘, 보더, 색상 변화</usage>
          <rule>hover 피드백 기본값이다.</rule>
        </row>
        <row index="2" key="design-tokens-motion-motion-normal">
          <item>motion.normal</item>
          <value>180ms</value>
          <usage>버튼, 입력창, 카드 상태 전환</usage>
          <rule>대부분의 인터랙션 기본값이다.</rule>
        </row>
        <row index="3" key="design-tokens-motion-motion-slow">
          <item>motion.slow</item>
          <value>240ms</value>
          <usage>모달, 드로어, 탭 전환</usage>
          <rule>opacity + transform 조합만 사용한다.</rule>
        </row>
        <row index="4" key="design-tokens-motion-motion-page">
          <item>motion.page</item>
          <value>320ms</value>
          <usage>페이지 진입, 리포트 카드 순차 등장</usage>
          <rule>리스트 전환 이외 영역에는 과다 사용하지 않는다.</rule>
        </row>
        <row index="5" key="design-tokens-motion-gamsok-gokseon">
          <item>감속 곡선</item>
          <value>cubic-bezier(0.2, 0, 0, 1)</value>
          <usage>공통 인터랙션</usage>
          <rule>모든 전환은 같은 easing을 사용한다.</rule>
        </row>
        <row index="6" key="design-tokens-motion-reduced-motion">
          <item>reduced motion</item>
          <value>0ms ~ 80ms</value>
          <usage>OS 접근성 설정 대응</usage>
          <rule>prefers-reduced-motion 활성 시 모션을 제거하거나 즉시 전환한다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="z-index" title="Z-index">
      <table columns="item,value,usage,rule">
        <row index="1" key="design-tokens-z-index-z-base">
          <item>z.base</item>
          <value>0</value>
          <usage>일반 콘텐츠</usage>
          <rule>기본 문서 흐름 레이어다.</rule>
        </row>
        <row index="2" key="design-tokens-z-index-z-sticky">
          <item>z.sticky</item>
          <value>10</value>
          <usage>sticky 카드, 리포트 보조 패널</usage>
          <rule>fixed보다 낮게 유지한다.</rule>
        </row>
        <row index="3" key="design-tokens-z-index-z-gnb">
          <item>z.gnb</item>
          <value>20</value>
          <usage>상단 GNB</usage>
          <rule>페이지 전체에서 항상 노출된다.</rule>
        </row>
        <row index="4" key="design-tokens-z-index-z-bottom-tab">
          <item>z.bottom-tab</item>
          <value>30</value>
          <usage>모바일 하단 탭</usage>
          <rule>sticky CTA보다 낮게 둔다.</rule>
        </row>
        <row index="5" key="design-tokens-z-index-z-sticky-cta">
          <item>z.sticky-cta</item>
          <value>40</value>
          <usage>하단 주요 CTA 바</usage>
          <rule>모바일 하단 탭 위에 위치한다.</rule>
        </row>
        <row index="6" key="design-tokens-z-index-z-drawer">
          <item>z.drawer</item>
          <value>50</value>
          <usage>드로어, bottom sheet</usage>
          <rule>토스트보다 낮게 둔다.</rule>
        </row>
        <row index="7" key="design-tokens-z-index-z-modal">
          <item>z.modal</item>
          <value>60</value>
          <usage>모달, 차단 오버레이</usage>
          <rule>focus trap을 가진 최상위 레이어다.</rule>
        </row>
        <row index="8" key="design-tokens-z-index-z-toast">
          <item>z.toast</item>
          <value>70</value>
          <usage>토스트, 일시적 피드백</usage>
          <rule>modal 위에는 올리지 않는다. modal 내부 토스트는 모달 내부에 렌더링한다.</rule>
        </row>
      </table>
    </subsection>
  </section>
  <!-- Section: 레이아웃 -->
  <section id="layout" title="레이아웃">
    <subsection id="breakpoints" title="브레이크포인트">
      <table columns="item,value,usage,rule">
        <row index="1" key="layout-breakpoints-breakpoint-mobile">
          <item>breakpoint.mobile</item>
          <value>360px ~ 767px</value>
          <usage>기본 설계 폭</usage>
          <rule>모든 핵심 흐름은 이 구간에서 우선 설계한다.</rule>
        </row>
        <row index="2" key="layout-breakpoints-breakpoint-tablet">
          <item>breakpoint.tablet</item>
          <value>768px ~ 1023px</value>
          <usage>태블릿, 소형 노트북</usage>
          <rule>8컬럼 그리드로 확장한다.</rule>
        </row>
        <row index="3" key="layout-breakpoints-breakpoint-desktop">
          <item>breakpoint.desktop</item>
          <value>1024px ~ 1439px</value>
          <usage>데스크톱 웹</usage>
          <rule>리포트와 마이페이지는 2열 배치를 허용한다.</rule>
        </row>
        <row index="4" key="layout-breakpoints-breakpoint-wide">
          <item>breakpoint.wide</item>
          <value>1440px+</value>
          <usage>대형 모니터</usage>
          <rule>중심 콘텐츠 최대 폭을 유지하고 주변 여백만 늘린다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="containers-and-grid" title="컨테이너 및 그리드">
      <table columns="item,value,usage,rule">
        <row index="1" key="layout-containers-and-grid-mobail-keonteineo">
          <item>모바일 컨테이너</item>
          <value>100% - 32px</value>
          <usage>전 페이지 본문</usage>
          <rule>좌우 패딩은 16px씩 고정한다.</rule>
        </row>
        <row index="2" key="layout-containers-and-grid-taebeulrit-keonteineo">
          <item>태블릿 컨테이너</item>
          <value>720px</value>
          <usage>태블릿 본문</usage>
          <rule>화면 중앙 정렬, 좌우 여백 자동 분배다.</rule>
        </row>
        <row index="3" key="layout-containers-and-grid-deseukeutop-keonteineo">
          <item>데스크톱 컨테이너</item>
          <value>960px</value>
          <usage>일반 데스크톱 본문</usage>
          <rule>리포트 본문 기본 최대 폭이다.</rule>
        </row>
        <row index="4" key="layout-containers-and-grid-waideu-keonteineo">
          <item>와이드 컨테이너</item>
          <value>1280px</value>
          <usage>홈, 대시보드형 화면</usage>
          <rule>12컬럼 사용 시 최대 폭이다.</rule>
        </row>
        <row index="5" key="layout-containers-and-grid-mobail-geurideu">
          <item>모바일 그리드</item>
          <value>4 columns / gutter 16px</value>
          <usage>카드형 레이아웃</usage>
          <rule>카드 너비는 4컬럼 전체를 기본값으로 사용한다.</rule>
        </row>
        <row index="6" key="layout-containers-and-grid-taebeulrit-geurideu">
          <item>태블릿 그리드</item>
          <value>8 columns / gutter 24px</value>
          <usage>입력 화면, 궁합 결과</usage>
          <rule>4:4 또는 5:3 분할을 허용한다.</rule>
        </row>
        <row index="7" key="layout-containers-and-grid-deseukeutop-geurideu">
          <item>데스크톱 그리드</item>
          <value>12 columns / gutter 24px</value>
          <usage>결과 리포트, 마이페이지</usage>
          <rule>메인:사이드 비율은 8:4를 기본값으로 사용한다.</rule>
        </row>
        <row index="8" key="layout-containers-and-grid-waideu-geurideu">
          <item>와이드 그리드</item>
          <value>12 columns / gutter 32px</value>
          <usage>홈, 콘텐츠 허브</usage>
          <rule>메인 카드 폭은 8 columns를 넘기지 않는다.</rule>
        </row>
        <row index="9" key="layout-containers-and-grid-gin-haeseokmun-choedae-pok">
          <item>긴 해석문 최대 폭</item>
          <value>680px</value>
          <usage>리포트 본문, 공지문</usage>
          <rule>한 줄 길이는 34자 전후를 유지한다.</rule>
        </row>
        <row index="10" key="layout-containers-and-grid-kadeu-seutaek-gangyeok">
          <item>카드 스택 간격</item>
          <value>16px</value>
          <usage>같은 섹션 내 카드 묶음</usage>
          <rule>같은 계층 카드 간격은 모두 동일하게 유지한다.</rule>
        </row>
        <row index="11" key="layout-containers-and-grid-seksyeon-gangyeok">
          <item>섹션 간격</item>
          <value>24px</value>
          <usage>섹션과 섹션 사이</usage>
          <rule>기본 페이지 수직 흐름 간격이다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="scroll-and-fixed-rules" title="스크롤 및 고정 규칙">
      <table columns="item,value,usage,rule">
        <row index="1" key="layout-scroll-and-fixed-rules-sangdan-gnb-nopi">
          <item>상단 GNB 높이</item>
          <value>64px</value>
          <usage>전체 페이지</usage>
          <rule>position: sticky를 기본으로 사용한다. 스크롤 시 축소하지 않는다.</rule>
        </row>
        <row index="2" key="layout-scroll-and-fixed-rules-mobail-hadan-taep-nopi">
          <item>모바일 하단 탭 높이</item>
          <value>72px</value>
          <usage>모바일 전용 내비게이션</usage>
          <rule>768px 미만에서만 노출한다. 현재 화면 아이콘+텍스트를 동시에 강조한다.</rule>
        </row>
        <row index="3" key="layout-scroll-and-fixed-rules-juyo-cta-ba-nopi">
          <item>주요 CTA 바 높이</item>
          <value>80px</value>
          <usage>입력 완료, 저장, 공유 액션</usage>
          <rule>모바일에서는 하단 탭 위, 데스크톱에서는 본문 하단 sticky로 배치한다.</rule>
        </row>
        <row index="4" key="layout-scroll-and-fixed-rules-seukeurol-paeding-sangdan">
          <item>스크롤 패딩 상단</item>
          <value>80px</value>
          <usage>앵커 이동, 해시 링크</usage>
          <rule>sticky GNB 아래에 콘텐츠가 가려지지 않게 한다.</rule>
        </row>
        <row index="5" key="layout-scroll-and-fixed-rules-seukeurol-chuk">
          <item>스크롤 축</item>
          <value>세로 1축</value>
          <usage>전체 앱</usage>
          <rule>본문 수평 스크롤은 금지한다. 예외는 테이블 대체 뷰뿐이다.</rule>
        </row>
        <row index="6" key="layout-scroll-and-fixed-rules-jungcheop-seukeurol-heoyong-yeongyeok">
          <item>중첩 스크롤 허용 영역</item>
          <value>modal / drawer / table</value>
          <usage>제한된 영역</usage>
          <rule>중첩 스크롤이 생기면 바깥 body 스크롤은 잠근다.</rule>
        </row>
        <row index="7" key="layout-scroll-and-fixed-rules-anjeon-yeongyeok-sangdan">
          <item>안전 영역 상단</item>
          <value>max(16px, env(safe-area-inset-top))</value>
          <usage>iOS 노치 기기</usage>
          <rule>hero와 고정 헤더 상단 패딩에 반영한다.</rule>
        </row>
        <row index="8" key="layout-scroll-and-fixed-rules-anjeon-yeongyeok-hadan">
          <item>안전 영역 하단</item>
          <value>max(16px, env(safe-area-inset-bottom))</value>
          <usage>iOS 홈 인디케이터 기기</usage>
          <rule>하단 탭, sticky CTA, 토스트 위치 계산에 반영한다.</rule>
        </row>
        <row index="9" key="layout-scroll-and-fixed-rules-roding-gonggan-yeyak">
          <item>로딩 공간 예약</item>
          <value>최소 120px</value>
          <usage>카드, 리스트, 차트</usage>
          <rule>skeleton 높이를 미리 확보해 레이아웃 점프를 막는다.</rule>
        </row>
      </table>
    </subsection>
    <subsection id="visualization-rules" title="시각화 공통 규칙">
      <table columns="item,value,usage,rule">
        <row index="1" key="layout-visualization-rules-ohaeng-bunpo-chateu">
          <item>오행 분포 차트</item>
          <value>220px / stroke 20px</value>
          <usage>결과 리포트 메인 카드</usage>
          <rule>도넛 차트 기본 규격이다. 순서는 목→화→토→금→수로 고정한다.</rule>
        </row>
        <row index="2" key="layout-visualization-rules-daeun-taimrain">
          <item>대운 타임라인</item>
          <value>160px / node 12px</value>
          <usage>결과 리포트, 심화 리포트</usage>
          <rule>현재 시점 노드는 shadow.sm과 2px 외곽선으로 강조한다.</rule>
        </row>
        <row index="3" key="layout-visualization-rules-wolgan-unse-geuraepeu">
          <item>월간 운세 그래프</item>
          <value>180px / stroke 3px</value>
          <usage>오늘·주간·월간 운세</usage>
          <rule>점수 축은 0, 25, 50, 75, 100 고정이다.</rule>
        </row>
        <row index="4" key="layout-visualization-rules-haengun-jeomsu-ring">
          <item>행운 점수 링</item>
          <value>144px / stroke 10px</value>
          <usage>오늘 운세, 궁합 점수</usage>
          <rule>점수 숫자는 중앙 font.h2를 사용한다.</rule>
        </row>
        <row index="5" key="layout-visualization-rules-beomrye-aitem">
          <item>범례 아이템</item>
          <value>label 13px / gap 8px</value>
          <usage>전 차트 공통</usage>
          <rule>색상 점만 쓰지 않는다. 색상+텍스트+수치 3종을 병행한다.</rule>
        </row>
        <row index="6" key="layout-visualization-rules-chateu-yeobaek">
          <item>차트 여백</item>
          <value>상 16px / 하 8px</value>
          <usage>전 차트 공통</usage>
          <rule>카드 안에서 차트와 해석문이 붙지 않게 한다.</rule>
        </row>
        <row index="7" key="layout-visualization-rules-bieo-itneun-chateu-sangtae">
          <item>비어 있는 차트 상태</item>
          <value>아이콘 32px / 메시지 14px</value>
          <usage>데이터 없음 상태</usage>
          <rule>"데이터 없음" 사유와 재시도 또는 입력 유도 CTA를 함께 노출한다.</rule>
        </row>
      </table>
    </subsection>
  </section>
  <!-- Section: 화면 템플릿 -->
  <section id="screen-templates" title="화면 템플릿">
    <table columns="item,value,usage,rule">
      <row index="1" key="screen-templates-hom">
        <item>홈</item>
        <value>hero 280px / quick card 120px / gap 24px</value>
        <usage>첫 방문, 재방문 진입</usage>
        <rule>순서: 브랜드 메시지 → 빠른 시작 CTA 2개 → 오늘 운세 미리보기 → 저장 리포트 → 추천 콘텐츠. 첫 화면 안에 primary CTA 1개를 반드시 노출한다.</rule>
      </row>
      <row index="2" key="screen-templates-saju-ipryeok-step-1">
        <item>사주 입력 Step 1</item>
        <value>progress 8px / field gap 16px / CTA 56px</value>
        <usage>양력·음력, 생년월일, 성별 입력</usage>
        <rule>순서: 진행 헤더 → 양력/음력 segmented → 생년월일 필드 → 성별 선택 → 다음 CTA. 한 화면에 입력군은 4개 이하로 제한한다.</rule>
      </row>
      <row index="3" key="screen-templates-saju-ipryeok-step-2">
        <item>사주 입력 Step 2</item>
        <value>field 52px / helper 14px / CTA 56px</value>
        <usage>출생시간, 출생지, 보정 옵션</usage>
        <rule>읽기 전용 필드를 탭하면 드로어 휠 선택기로 연다. 출생시간 미상 옵션은 체크박스 대신 보조 버튼으로 노출한다.</rule>
      </row>
      <row index="4" key="screen-templates-saju-ipryeok-step-3">
        <item>사주 입력 Step 3</item>
        <value>summary card 180px / notice 14px / CTA 56px</value>
        <usage>입력 확인, 분석 시작</usage>
        <rule>순서: 입력 요약 카드 → 수정 링크 → 개인정보 저장 옵션 → 결과 보기 CTA. 저장 옵션은 기본 off다.</rule>
      </row>
      <row index="5" key="screen-templates-gyeolgwa-ripoteu">
        <item>결과 리포트</item>
        <value>summary hero 220px / desktop 8:4 / sticky action 80px</value>
        <usage>사주 분석 결과</usage>
        <rule>순서: 핵심 기운 카드 → 오행 차트 → 오늘 운세 요약 → 대운 타임라인 → 영역별 해석 → 실용 조언 → 저장·공유 CTA. 데스크톱은 본문 8컬럼, 보조 요약 4컬럼으로 분할한다.</rule>
      </row>
      <row index="6" key="screen-templates-oneul-jugan-wolgan-unse">
        <item>오늘·주간·월간 운세</item>
        <value>tab 48px / score card 160px / calendar cell 44px</value>
        <usage>개인 운세, 간편 운세</usage>
        <rule>상단 segmented 탭으로 범위를 전환한다. 순서: 요약 점수 → 행운 컬러/아이템 → 주의 포인트 → 카드형 캘린더 또는 그래프. 탭 전환은 240ms 안에 끝낸다.</rule>
      </row>
      <row index="7" key="screen-templates-gunghap">
        <item>궁합</item>
        <value>score ring 144px / compare card 2-up / CTA 56px</value>
        <usage>연애, 대인관계, 협업 궁합</usage>
        <rule>순서: 궁합 총점 → 상생·상극 시각화 → 강점 3개 → 주의점 3개 → 관계별 조언 → 저장 CTA. 모바일 비교 카드는 세로 스택, 태블릿 이상은 2열 허용이다.</rule>
      </row>
      <row index="8" key="screen-templates-maipeiji">
        <item>마이페이지</item>
        <value>profile 96px / row 72px / card gap 16px</value>
        <usage>저장 리포트, 알림, 계정 관리</usage>
        <rule>순서: 프로필 요약 → 저장 리포트 목록 → 궁합 상대 목록 → 알림 설정 → 계정 관리. 저장 목록은 최신순 정렬이 기본이다.</rule>
      </row>
    </table>
  </section>
  <!-- Section: 컴포넌트 규격 -->
  <section id="components" title="컴포넌트 규격">
    <common-interaction-rules title="공통 상호작용 규칙">
      <table columns="item,value,usage,rule">
        <row index="1" key="components-common-interaction-rules-choeso-teochi-yeongyeok">
          <item>최소 터치 영역</item>
          <value>44px x 44px</value>
          <usage>버튼, 아이콘 버튼, 탭, 리스트 행</usage>
          <rule>실제 시각 크기가 작아도 hit area는 이 값을 보장한다.</rule>
        </row>
        <row index="2" key="components-common-interaction-rules-gongtong-focus-ring">
          <item>공통 focus ring</item>
          <value>2px / #7AA9FF</value>
          <usage>모든 인터랙션 요소</usage>
          <rule>외곽선은 요소 바깥쪽에 그린다. 그림자와 겹쳐도 사라지지 않아야 한다.</rule>
        </row>
        <row index="3" key="components-common-interaction-rules-sangtae-jeonhwan-sigan">
          <item>상태 전환 시간</item>
          <value>180ms</value>
          <usage>버튼, 입력, 카드</usage>
          <rule>기본 상태 전환 시간이다. 필요한 경우 120ms 또는 240ms만 사용한다.</rule>
        </row>
        <row index="4" key="components-common-interaction-rules-roding-indikeiteo">
          <item>로딩 인디케이터</item>
          <value>16px ~ 20px</value>
          <usage>버튼, 카드, 모달, 토스트</usage>
          <rule>텍스트와 같이 배치할 때 간격은 8px로 고정한다.</rule>
        </row>
        <row index="5" key="components-common-interaction-rules-oryu-mesiji-tekseuteu">
          <item>오류 메시지 텍스트</item>
          <value>14px / 22px / 500</value>
          <usage>입력 오류, 카드 오류, 배너</usage>
          <rule>색상 외에 아이콘과 명확한 문장을 함께 쓴다.</rule>
        </row>
        <row index="6" key="components-common-interaction-rules-aikon-keugi">
          <item>아이콘 크기</item>
          <value>20px</value>
          <usage>일반 버튼, 입력 suffix, 토스트</usage>
          <rule>아이콘 전용 버튼만 24px를 허용한다.</rule>
        </row>
        <row index="7" key="components-common-interaction-rules-keulrik-chadan-jogeon">
          <item>클릭 차단 조건</item>
          <value>disabled / loading</value>
          <usage>모든 인터랙션 요소</usage>
          <rule>포인터 이벤트와 탭 액션을 동시에 차단한다.</rule>
        </row>
        <row index="8" key="components-common-interaction-rules-reiaut-idong-geumji">
          <item>레이아웃 이동 금지</item>
          <value>0px shift</value>
          <usage>hover, active, focus 상태</usage>
          <rule>상태 전환은 색상, 보더, 그림자, opacity만 바꾼다. 위치 이동은 금지한다.</rule>
        </row>
      </table>
    </common-interaction-rules>
    <component id="button" name="Button">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-button-spec-keugi-s">
          <item>크기 S</item>
          <value>40px / px 14</value>
          <usage>보조 액션, 칩형 버튼</usage>
          <rule>텍스트는 font.label을 사용한다.</rule>
        </row>
        <row index="2" key="components-button-spec-keugi-m">
          <item>크기 M</item>
          <value>48px / px 18</value>
          <usage>기본 액션, 필드 보조 버튼</usage>
          <rule>기본 버튼 크기다.</rule>
        </row>
        <row index="3" key="components-button-spec-keugi-l">
          <item>크기 L</item>
          <value>56px / px 20</value>
          <usage>primary CTA, 제출 버튼</usage>
          <rule>입력 완료 화면의 기본 CTA 크기다.</rule>
        </row>
        <row index="4" key="components-button-spec-choeso-neobi">
          <item>최소 너비</item>
          <value>88px</value>
          <usage>텍스트 버튼 전종</usage>
          <rule>짧은 라벨도 균형 있게 보이게 한다.</rule>
        </row>
        <row index="5" key="components-button-spec-gibon-raundeu">
          <item>기본 라운드</item>
          <value>16px</value>
          <usage>primary, secondary, ghost</usage>
          <rule>버튼 기본 radius다.</rule>
        </row>
        <row index="6" key="components-button-spec-segmented-raundeu">
          <item>segmented 라운드</item>
          <value>999px</value>
          <usage>양력/음력 토글, 운세 범위 토글</usage>
          <rule>한 그룹 안에서 2~4개만 허용한다.</rule>
        </row>
        <row index="7" key="components-button-spec-aikon-gangyeok">
          <item>아이콘 간격</item>
          <value>8px</value>
          <usage>아이콘 포함 버튼</usage>
          <rule>아이콘은 왼쪽 또는 오른쪽 1개만 허용한다.</rule>
        </row>
        <row index="8" key="components-button-spec-variant-primary">
          <item>variant.primary</item>
          <value>bg #CBB7F6 / text #24303F</value>
          <usage>제출, 저장, 시작, 결제 전 단계</usage>
          <rule>가장 중요한 액션 1개에만 사용한다.</rule>
        </row>
        <row index="9" key="components-button-spec-variant-secondary">
          <item>variant.secondary</item>
          <value>bg #FFFFFF / border #E7DDD1</value>
          <usage>보조 저장, 나중에 하기</usage>
          <rule>primary 옆에서만 사용한다.</rule>
        </row>
        <row index="10" key="components-button-spec-variant-ghost">
          <item>variant.ghost</item>
          <value>bg transparent / text #24303F</value>
          <usage>텍스트 링크성 액션</usage>
          <rule>카드 내부에서만 사용한다.</rule>
        </row>
        <row index="11" key="components-button-spec-variant-icon">
          <item>variant.icon</item>
          <value>40px ~ 48px / icon 20px</value>
          <usage>닫기, 공유, 더보기</usage>
          <rule>반드시 툴팁 또는 aria-label을 제공한다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-button-state-button-default">
          <item>Button default</item>
          <value>bg #CBB7F6 / border 0 / shadow 0 / 180ms</value>
          <usage>primary 기준</usage>
          <rule>secondary는 bg #FFFFFF, ghost는 bg transparent로 치환한다.</rule>
        </row>
        <row index="2" key="components-button-state-button-hover">
          <item>Button hover</item>
          <value>bg #BFA8F0 / shadow 0 4px 16px #24303F14</value>
          <usage>마우스 환경</usage>
          <rule>hover는 768px 이상에서만 적용한다.</rule>
        </row>
        <row index="3" key="components-button-state-button-active">
          <item>Button active</item>
          <value>bg #B299EB / shadow 0</value>
          <usage>탭, 클릭 누름 상태</usage>
          <rule>크기 축소나 y축 이동은 금지한다.</rule>
        </row>
        <row index="4" key="components-button-state-button-focus">
          <item>Button focus</item>
          <value>ring 2px #7AA9FF / outline-offset 2px</value>
          <usage>키보드 탐색</usage>
          <rule>텍스트와 아이콘 모두 시각적으로 유지된다.</rule>
        </row>
        <row index="5" key="components-button-state-button-disabled">
          <item>Button disabled</item>
          <value>bg #F6EFE6 / text #8B96A3 / opacity 1</value>
          <usage>제출 불가 상태</usage>
          <rule>불투명도만 낮추지 않는다. 대비를 유지한 전용 색을 사용한다.</rule>
        </row>
        <row index="6" key="components-button-state-button-loading">
          <item>Button loading</item>
          <value>spinner 18px / text opacity 0 / click blocked</value>
          <usage>비동기 처리 중</usage>
          <rule>버튼 크기는 유지한다. spinner는 중앙 고정이다.</rule>
        </row>
        <row index="7" key="components-button-state-button-error">
          <item>Button error</item>
          <value>bg #FDEEEE / border 1px #D96B6B / text #B24D4D</value>
          <usage>액션 실패 후 재시도</usage>
          <rule>실패 토스트를 함께 띄우고 라벨은 다시 시도로 바꾼다.</rule>
        </row>
      </state-table>
    </component>
    <component id="input" name="Input">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-input-spec-pildeu-nopi">
          <item>필드 높이</item>
          <value>52px</value>
          <usage>텍스트, 날짜, 시간, 출생지 입력</usage>
          <rule>기본 입력 높이로 고정한다.</rule>
        </row>
        <row index="2" key="components-input-spec-naebu-paeding">
          <item>내부 패딩</item>
          <value>좌우 16px</value>
          <usage>전 input 공통</usage>
          <rule>leading/trailing icon이 있으면 아이콘 영역 40px를 확보한다.</rule>
        </row>
        <row index="3" key="components-input-spec-rabel-gangyeok">
          <item>라벨 간격</item>
          <value>8px</value>
          <usage>라벨과 필드 사이</usage>
          <rule>라벨은 항상 필드 위에 둔다. placeholder를 라벨 대체로 쓰지 않는다.</rule>
        </row>
        <row index="4" key="components-input-spec-doummal-gangyeok">
          <item>도움말 간격</item>
          <value>6px</value>
          <usage>helper, error message</usage>
          <rule>필드 바로 아래에 붙인다.</rule>
        </row>
        <row index="5" key="components-input-spec-gaps-seutail">
          <item>값 스타일</item>
          <value>16px / 26px / 600</value>
          <usage>입력값, 선택값</usage>
          <rule>포맷된 날짜, 시간, 지역명에 사용한다.</rule>
        </row>
        <row index="6" key="components-input-spec-aikon-keugi">
          <item>아이콘 크기</item>
          <value>20px</value>
          <usage>calendar, clock, location</usage>
          <rule>suffix 아이콘은 기능이 있으면 버튼으로 만든다.</rule>
        </row>
        <row index="7" key="components-input-spec-ilkgi-jeonyong-pildeu">
          <item>읽기 전용 필드</item>
          <value>52px / cursor pointer</value>
          <usage>날짜, 시간, 출생지 picker</usage>
          <rule>탭 시 드로어를 연다. 키보드는 직접 띄우지 않는다.</rule>
        </row>
        <row index="8" key="components-input-spec-pildeu-geurup-gangyeok">
          <item>필드 그룹 간격</item>
          <value>16px</value>
          <usage>세로 스택 입력</usage>
          <rule>관련 필드 2개 이상은 하나의 카드 안에 묶는다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-input-state-input-default">
          <item>Input default</item>
          <value>bg #FFFFFF / border 1px #E7DDD1 / text #24303F</value>
          <usage>기본 입력 상태</usage>
          <rule>placeholder는 #8B96A3만 사용한다.</rule>
        </row>
        <row index="2" key="components-input-state-input-hover">
          <item>Input hover</item>
          <value>bg #FFF8EE / border 1px #D6C8B9</value>
          <usage>포인터 입력 환경</usage>
          <rule>모바일 터치 환경에서는 hover를 시뮬레이션하지 않는다.</rule>
        </row>
        <row index="3" key="components-input-state-input-active">
          <item>Input active</item>
          <value>bg #FFF8EE / border 1px #D6C8B9</value>
          <usage>터치 눌림 상태</usage>
          <rule>읽기 전용 필드 탭 직전 피드백으로 사용한다.</rule>
        </row>
        <row index="4" key="components-input-state-input-focus">
          <item>Input focus</item>
          <value>border 1px #7AA9FF / ring 2px #7AA9FF / shadow 0 4px 16px #24303F14</value>
          <usage>텍스트 편집 중</usage>
          <rule>레이블과 도움말 위치는 변하지 않는다.</rule>
        </row>
        <row index="5" key="components-input-state-input-disabled">
          <item>Input disabled</item>
          <value>bg #F6EFE6 / border 1px #E7DDD1 / text #8B96A3</value>
          <usage>입력 불가 상태</usage>
          <rule>placeholder 대신 실제 비활성 값을 보여준다.</rule>
        </row>
        <row index="6" key="components-input-state-input-loading">
          <item>Input loading</item>
          <value>skeleton 100% x 52px / shimmer 1200ms</value>
          <usage>원격 값 조회 중</usage>
          <rule>필드 테두리와 높이는 유지한다.</rule>
        </row>
        <row index="7" key="components-input-state-input-error">
          <item>Input error</item>
          <value>border 1px #D96B6B / ring 2px #D96B6B / helper #D96B6B</value>
          <usage>검증 실패</usage>
          <rule>오류 아이콘 16px와 문구를 같이 노출한다.</rule>
        </row>
      </state-table>
    </component>
    <component id="textarea" name="Textarea">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-textarea-spec-choeso-nopi">
          <item>최소 높이</item>
          <value>120px</value>
          <usage>메모, 추가 요청, 문의</usage>
          <rule>기본 4줄 이상이 보이게 한다.</rule>
        </row>
        <row index="2" key="components-textarea-spec-choedae-nopi">
          <item>최대 높이</item>
          <value>240px</value>
          <usage>긴 입력</usage>
          <rule>최대 높이를 넘기면 내부 스크롤을 허용한다.</rule>
        </row>
        <row index="3" key="components-textarea-spec-naebu-paeding">
          <item>내부 패딩</item>
          <value>16px</value>
          <usage>본문 입력</usage>
          <rule>텍스트는 항상 상단 정렬한다.</rule>
        </row>
        <row index="4" key="components-textarea-spec-risaijeu-gyuchik">
          <item>리사이즈 규칙</item>
          <value>mobile none / desktop vertical</value>
          <usage>반응형 입력</usage>
          <rule>모바일에서는 손잡이 리사이즈를 금지한다.</rule>
        </row>
        <row index="5" key="components-textarea-spec-munja-kaunteo">
          <item>문자 카운터</item>
          <value>14px / 22px</value>
          <usage>선택형 부가 기능</usage>
          <rule>카운터가 있으면 오른쪽 하단에 배치한다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-textarea-state-textarea-default">
          <item>Textarea default</item>
          <value>bg #FFFFFF / border 1px #E7DDD1</value>
          <usage>기본 상태</usage>
          <rule>placeholder는 본문보다 약하게 표시한다.</rule>
        </row>
        <row index="2" key="components-textarea-state-textarea-hover">
          <item>Textarea hover</item>
          <value>bg #FFF8EE / border 1px #D6C8B9</value>
          <usage>포인터 환경</usage>
          <rule>입력 시작 전 시각 피드백만 제공한다.</rule>
        </row>
        <row index="3" key="components-textarea-state-textarea-active">
          <item>Textarea active</item>
          <value>bg #FFF8EE / border 1px #D6C8B9</value>
          <usage>터치 눌림</usage>
          <rule>내부 텍스트 위치는 이동하지 않는다.</rule>
        </row>
        <row index="4" key="components-textarea-state-textarea-focus">
          <item>Textarea focus</item>
          <value>border 1px #7AA9FF / ring 2px #7AA9FF</value>
          <usage>편집 중</usage>
          <rule>스크롤바가 생겨도 높이는 유지한다.</rule>
        </row>
        <row index="5" key="components-textarea-state-textarea-disabled">
          <item>Textarea disabled</item>
          <value>bg #F6EFE6 / text #8B96A3</value>
          <usage>읽기 전용, 작성 불가</usage>
          <rule>내부 텍스트 선택도 막는다.</rule>
        </row>
        <row index="6" key="components-textarea-state-textarea-loading">
          <item>Textarea loading</item>
          <value>skeleton 100% x 120px / shimmer 1200ms</value>
          <usage>초안 불러오는 상태</usage>
          <rule>실제 높이를 예약해 레이아웃 이동을 막는다.</rule>
        </row>
        <row index="7" key="components-textarea-state-textarea-error">
          <item>Textarea error</item>
          <value>border 1px #D96B6B / helper #D96B6B</value>
          <usage>검증 실패</usage>
          <rule>오류 메시지는 2줄 이내로 유지한다.</rule>
        </row>
      </state-table>
    </component>
    <component id="card" name="Card">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-card-spec-kadeu-paeding-mobail">
          <item>카드 패딩 모바일</item>
          <value>20px</value>
          <usage>홈, 운세, 입력 요약</usage>
          <rule>모바일 기본 카드 패딩이다.</rule>
        </row>
        <row index="2" key="components-card-spec-kadeu-paeding-deseukeutop">
          <item>카드 패딩 데스크톱</item>
          <value>24px</value>
          <usage>리포트, 마이페이지, 궁합</usage>
          <rule>데스크톱과 태블릿 확장 패딩이다.</rule>
        </row>
        <row index="3" key="components-card-spec-gibon-raundeu">
          <item>기본 라운드</item>
          <value>24px</value>
          <usage>카드 전종</usage>
          <rule>카드 시스템 공통 라운드다.</rule>
        </row>
        <row index="4" key="components-card-spec-choeso-nopi">
          <item>최소 높이</item>
          <value>120px</value>
          <usage>일반 정보 카드</usage>
          <rule>CTA 카드와 리포트 요약 카드는 더 커도 된다.</rule>
        </row>
        <row index="5" key="components-card-spec-hedeo-bonmun-gangyeok">
          <item>헤더-본문 간격</item>
          <value>12px</value>
          <usage>카드 내부</usage>
          <rule>제목, 메타, 차트, 본문 사이 간격이다.</rule>
        </row>
        <row index="6" key="components-card-spec-bonmun-puteo-gangyeok">
          <item>본문-푸터 간격</item>
          <value>16px</value>
          <usage>CTA 포함 카드</usage>
          <rule>푸터가 없으면 제거한다.</rule>
        </row>
        <row index="7" key="components-card-spec-inteoraektibeu-kadeu">
          <item>인터랙티브 카드</item>
          <value>cursor pointer / shadow.sm</value>
          <usage>저장 리포트 카드, 추천 카드</usage>
          <rule>클릭 가능 카드만 hover를 가진다.</rule>
        </row>
        <row index="8" key="components-card-spec-bin-sangtae-kadeu">
          <item>빈 상태 카드</item>
          <value>icon 32px / text 14px / CTA 40px</value>
          <usage>저장 없음, 결과 없음</usage>
          <rule>메시지와 유도 행동을 같이 제공한다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-card-state-card-default">
          <item>Card default</item>
          <value>bg #FFFFFF / border 1px #E7DDD1 / shadow 0 4px 16px #24303F14</value>
          <usage>기본 카드</usage>
          <rule>정적 카드도 같은 기본 시각을 유지한다.</rule>
        </row>
        <row index="2" key="components-card-state-card-hover">
          <item>Card hover</item>
          <value>border 1px #D6C8B9 / shadow 0 8px 24px #24303F1A</value>
          <usage>인터랙티브 카드</usage>
          <rule>hover로 크기 변경은 금지한다.</rule>
        </row>
        <row index="3" key="components-card-state-card-active">
          <item>Card active</item>
          <value>bg #FFF8EE / border 1px #D6C8B9</value>
          <usage>터치 눌림</usage>
          <rule>눌림 피드백은 120ms 안에 끝낸다.</rule>
        </row>
        <row index="4" key="components-card-state-card-focus">
          <item>Card focus</item>
          <value>ring 2px #7AA9FF / outline-offset 2px</value>
          <usage>키보드 진입 카드</usage>
          <rule>카드 전체가 포커스 가능할 때만 적용한다.</rule>
        </row>
        <row index="5" key="components-card-state-card-disabled">
          <item>Card disabled</item>
          <value>bg #F6EFE6 / text #8B96A3 / shadow 0</value>
          <usage>이용 불가 카드</usage>
          <rule>클릭, hover, focus를 모두 차단한다.</rule>
        </row>
        <row index="6" key="components-card-state-card-loading">
          <item>Card loading</item>
          <value>skeleton block / shimmer 1200ms</value>
          <usage>리포트 로딩, 목록 로딩</usage>
          <rule>제목 1줄, 본문 3줄, 차트 영역 placeholder를 같이 보여준다.</rule>
        </row>
        <row index="7" key="components-card-state-card-error">
          <item>Card error</item>
          <value>bg #FDEEEE / border 1px #D96B6B / text #24303F</value>
          <usage>데이터 불러오기 실패</usage>
          <rule>오류 원인 1줄과 다시 시도 CTA를 카드 안에 둔다.</rule>
        </row>
      </state-table>
    </component>
    <component id="modal" name="Modal">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-modal-spec-choedae-neobi">
          <item>최대 너비</item>
          <value>560px</value>
          <usage>확인 모달, 정책 동의, 공유 모달</usage>
          <rule>데스크톱 기준 최대 폭이다.</rule>
        </row>
        <row index="2" key="components-modal-spec-mobail-neobi">
          <item>모바일 너비</item>
          <value>calc(100% - 32px)</value>
          <usage>모바일 전용 모달</usage>
          <rule>화면 가장자리와 16px 간격을 유지한다.</rule>
        </row>
        <row index="3" key="components-modal-spec-naebu-paeding">
          <item>내부 패딩</item>
          <value>24px</value>
          <usage>헤더, 본문, 푸터</usage>
          <rule>본문이 짧아도 동일 패딩을 유지한다.</rule>
        </row>
        <row index="4" key="components-modal-spec-choedae-nopi">
          <item>최대 높이</item>
          <value>70vh</value>
          <usage>긴 본문 모달</usage>
          <rule>본문만 내부 스크롤한다.</rule>
        </row>
        <row index="5" key="components-modal-spec-hedeo-nopi">
          <item>헤더 높이</item>
          <value>64px</value>
          <usage>제목, 닫기 버튼</usage>
          <rule>닫기 버튼 hit area는 44px를 보장한다.</rule>
        </row>
        <row index="6" key="components-modal-spec-puteo-aeksyeon-nopi">
          <item>푸터 액션 높이</item>
          <value>56px</value>
          <usage>확인, 취소 버튼</usage>
          <rule>CTA 2개 이상이면 세로 스택 대신 가로 2열을 우선한다.</rule>
        </row>
        <row index="7" key="components-modal-spec-baegyeong-dim">
          <item>배경 딤</item>
          <value>#24303F85</value>
          <usage>오버레이 공통</usage>
          <rule>modal open 시 body 스크롤을 잠근다.</rule>
        </row>
        <row index="8" key="components-modal-spec-raundeu">
          <item>라운드</item>
          <value>24px</value>
          <usage>모달 컨테이너</usage>
          <rule>full-screen modal만 예외로 0px을 허용한다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-modal-state-modal-default">
          <item>Modal default</item>
          <value>opacity 1 / scale 1 / shadow 0 16px 40px #24303F1F / 240ms</value>
          <usage>일반 open 상태</usage>
          <rule>진입은 translateY(8px)에서 시작한다.</rule>
        </row>
        <row index="2" key="components-modal-state-modal-hover">
          <item>Modal hover</item>
          <value>close button bg #FFF8EE</value>
          <usage>마우스 환경</usage>
          <rule>모달 본체는 hover 시 변하지 않는다. 닫기 버튼만 반응한다.</rule>
        </row>
        <row index="3" key="components-modal-state-modal-active">
          <item>Modal active</item>
          <value>close button bg #F6EFE6</value>
          <usage>버튼 눌림</usage>
          <rule>backdrop 클릭 닫기가 허용된 경우만 backdrop tap을 활성화한다.</rule>
        </row>
        <row index="4" key="components-modal-state-modal-focus">
          <item>Modal focus</item>
          <value>initial focus 1개 / trap on</value>
          <usage>키보드, 스크린리더</usage>
          <rule>제목 다음 첫 인터랙션 요소로 포커스를 이동한다.</rule>
        </row>
        <row index="5" key="components-modal-state-modal-disabled">
          <item>Modal disabled</item>
          <value>backdrop close off / actions disabled</value>
          <usage>필수 확인 단계</usage>
          <rule>로딩이 아닌 차단 상태에서만 사용한다.</rule>
        </row>
        <row index="6" key="components-modal-state-modal-loading">
          <item>Modal loading</item>
          <value>spinner 20px / body opacity 0.64 / actions blocked</value>
          <usage>제출 중</usage>
          <rule>닫기 버튼도 막아 이탈을 방지한다.</rule>
        </row>
        <row index="7" key="components-modal-state-modal-error">
          <item>Modal error</item>
          <value>banner bg #FDEEEE / border #D96B6B / text 14px</value>
          <usage>제출 실패, 정책 로드 실패</usage>
          <rule>오류 배너는 헤더 아래에 고정한다.</rule>
        </row>
      </state-table>
    </component>
    <component id="drawer" name="Drawer">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-drawer-spec-mobail-neobi">
          <item>모바일 너비</item>
          <value>92vw</value>
          <usage>공유, 필터, 날짜/시간 선택</usage>
          <rule>모바일에서는 bottom sheet로 사용한다.</rule>
        </row>
        <row index="2" key="components-drawer-spec-deseukeutop-neobi">
          <item>데스크톱 너비</item>
          <value>480px</value>
          <usage>설정, 상세 필터, 보조 리포트</usage>
          <rule>데스크톱에서는 우측 side sheet로 사용한다.</rule>
        </row>
        <row index="3" key="components-drawer-spec-mobail-choedae-nopi">
          <item>모바일 최대 높이</item>
          <value>85vh</value>
          <usage>바텀 시트</usage>
          <rule>상단에 drag handle 32px x 4px를 둔다.</rule>
        </row>
        <row index="4" key="components-drawer-spec-deseukeutop-nopi">
          <item>데스크톱 높이</item>
          <value>100vh</value>
          <usage>사이드 시트</usage>
          <rule>body 스크롤과 분리된 내부 스크롤을 사용한다.</rule>
        </row>
        <row index="5" key="components-drawer-spec-naebu-paeding">
          <item>내부 패딩</item>
          <value>24px</value>
          <usage>헤더, 본문, 푸터</usage>
          <rule>모달과 동일 패딩 체계를 사용한다.</rule>
        </row>
        <row index="6" key="components-drawer-spec-raundeu">
          <item>라운드</item>
          <value>24px 24px 0 0</value>
          <usage>모바일 bottom sheet</usage>
          <rule>데스크톱 side sheet는 왼쪽 모서리만 24px을 적용한다.</rule>
        </row>
        <row index="7" key="components-drawer-spec-baegyeong-dim">
          <item>배경 딤</item>
          <value>#24303F85</value>
          <usage>오버레이 공통</usage>
          <rule>drawer open 시 focus trap을 적용한다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-drawer-state-drawer-default">
          <item>Drawer default</item>
          <value>translateY(0) mobile / translateX(0) desktop / 240ms</value>
          <usage>open 상태</usage>
          <rule>진입은 모바일 아래, 데스크톱 오른쪽에서 시작한다.</rule>
        </row>
        <row index="2" key="components-drawer-state-drawer-hover">
          <item>Drawer hover</item>
          <value>close button bg #FFF8EE</value>
          <usage>마우스 환경</usage>
          <rule>sheet 본체 hover 효과는 없다.</rule>
        </row>
        <row index="3" key="components-drawer-state-drawer-active">
          <item>Drawer active</item>
          <value>handle opacity 1 / close button bg #F6EFE6</value>
          <usage>바텀시트 조작</usage>
          <rule>drag handle은 시각 힌트만 제공하고 실제 드래그 닫기는 선택 구현이다.</rule>
        </row>
        <row index="4" key="components-drawer-state-drawer-focus">
          <item>Drawer focus</item>
          <value>initial focus 1개 / trap on</value>
          <usage>키보드, 스크린리더</usage>
          <rule>시트 내부 마지막 요소 뒤에서 탭하면 처음으로 순환한다.</rule>
        </row>
        <row index="5" key="components-drawer-state-drawer-disabled">
          <item>Drawer disabled</item>
          <value>dismiss off / actions disabled</value>
          <usage>필수 선택 단계</usage>
          <rule>시간 선택 등 완료 전 닫힘을 막을 때만 사용한다.</rule>
        </row>
        <row index="6" key="components-drawer-state-drawer-loading">
          <item>Drawer loading</item>
          <value>spinner 20px / content opacity 0.64</value>
          <usage>옵션 로드 중</usage>
          <rule>시트 높이는 유지한다.</rule>
        </row>
        <row index="7" key="components-drawer-state-drawer-error">
          <item>Drawer error</item>
          <value>inline error bg #FDEEEE / retry CTA 40px</value>
          <usage>옵션 조회 실패</usage>
          <rule>오류 문구를 시트 상단 본문에 노출한다.</rule>
        </row>
      </state-table>
    </component>
    <component id="toast" name="Toast">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-toast-spec-neobi">
          <item>너비</item>
          <value>344px</value>
          <usage>데스크톱 토스트</usage>
          <rule>모바일에서는 calc(100% - 32px)를 사용한다.</rule>
        </row>
        <row index="2" key="components-toast-spec-choeso-nopi">
          <item>최소 높이</item>
          <value>56px</value>
          <usage>정보, 성공, 오류 피드백</usage>
          <rule>한 줄 메시지도 같은 높이를 유지한다.</rule>
        </row>
        <row index="3" key="components-toast-spec-naebu-paeding">
          <item>내부 패딩</item>
          <value>16px</value>
          <usage>본문, 액션</usage>
          <rule>아이콘-텍스트-액션 순서로 배치한다.</rule>
        </row>
        <row index="4" key="components-toast-spec-raundeu">
          <item>라운드</item>
          <value>16px</value>
          <usage>토스트 전종</usage>
          <rule>shadow.sm과 함께 사용한다.</rule>
        </row>
        <row index="5" key="components-toast-spec-jadong-dathim">
          <item>자동 닫힘</item>
          <value>4000ms</value>
          <usage>정보, 성공 토스트</usage>
          <rule>오류 토스트는 자동 닫힘을 기본으로 사용하지 않는다.</rule>
        </row>
        <row index="6" key="components-toast-spec-aeksyeon-beoteun-nopi">
          <item>액션 버튼 높이</item>
          <value>40px</value>
          <usage>다시 시도, 보기</usage>
          <rule>액션이 없으면 공간을 남기지 않는다.</rule>
        </row>
        <row index="7" key="components-toast-spec-wichi-mobail">
          <item>위치 모바일</item>
          <value>bottom 96px</value>
          <usage>모바일 앱 shell</usage>
          <rule>하단 탭 및 sticky CTA와 겹치지 않게 띄운다.</rule>
        </row>
        <row index="8" key="components-toast-spec-wichi-deseukeutop">
          <item>위치 데스크톱</item>
          <value>top 24px / right 24px</value>
          <usage>데스크톱</usage>
          <rule>최대 3개까지만 스택한다.</rule>
        </row>
        <row index="9" key="components-toast-spec-seutaek-gangyeok">
          <item>스택 간격</item>
          <value>12px</value>
          <usage>다중 토스트</usage>
          <rule>새 토스트는 최신순으로 위에 쌓는다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-toast-state-toast-default">
          <item>Toast default</item>
          <value>bg #FFFFFF / border 1px #E7DDD1 / shadow 0 4px 16px #24303F14</value>
          <usage>일반 안내</usage>
          <rule>정보 토스트 기본값이다.</rule>
        </row>
        <row index="2" key="components-toast-state-toast-hover">
          <item>Toast hover</item>
          <value>timer pause / shadow 0 8px 24px #24303F1A</value>
          <usage>마우스 환경</usage>
          <rule>hover 시 자동 닫힘 타이머를 멈춘다.</rule>
        </row>
        <row index="3" key="components-toast-state-toast-active">
          <item>Toast active</item>
          <value>action bg #F6EFE6</value>
          <usage>액션 버튼 누름</usage>
          <rule>토스트 본체는 active 시 색을 바꾸지 않는다.</rule>
        </row>
        <row index="4" key="components-toast-state-toast-focus">
          <item>Toast focus</item>
          <value>action ring 2px #7AA9FF</value>
          <usage>키보드 탐색</usage>
          <rule>토스트 액션 버튼에만 focus를 준다.</rule>
        </row>
        <row index="5" key="components-toast-state-toast-disabled">
          <item>Toast disabled</item>
          <value>action disabled / dismiss off</value>
          <usage>처리 중 피드백</usage>
          <rule>진행형 토스트에서만 사용한다.</rule>
        </row>
        <row index="6" key="components-toast-state-toast-loading">
          <item>Toast loading</item>
          <value>spinner 16px / text #24303F</value>
          <usage>업로드, 저장 진행 상태</usage>
          <rule>자동 닫힘을 사용하지 않는다.</rule>
        </row>
        <row index="7" key="components-toast-state-toast-error">
          <item>Toast error</item>
          <value>bg #FDEEEE / border 1px #D96B6B / icon #D96B6B</value>
          <usage>실패 피드백</usage>
          <rule>닫기 또는 다시 시도 중 하나를 반드시 제공한다.</rule>
        </row>
      </state-table>
    </component>
    <component id="table" name="Table">
      <spec-table columns="item,value,usage,rule">
        <row index="1" key="components-table-spec-hedeo-nopi">
          <item>헤더 높이</item>
          <value>48px</value>
          <usage>데스크톱 데이터 표</usage>
          <rule>헤더 텍스트는 font.label을 사용한다.</rule>
        </row>
        <row index="2" key="components-table-spec-haeng-nopi">
          <item>행 높이</item>
          <value>56px</value>
          <usage>저장 목록, 알림 로그, 비교표</usage>
          <rule>기본 행 높이로 고정한다.</rule>
        </row>
        <row index="3" key="components-table-spec-sel-paeding">
          <item>셀 패딩</item>
          <value>16px</value>
          <usage>헤더, 바디 셀 공통</usage>
          <rule>수치 열은 우측 정렬한다.</rule>
        </row>
        <row index="4" key="components-table-spec-choeso-keolreom-pok">
          <item>최소 컬럼 폭</item>
          <value>120px</value>
          <usage>일반 텍스트 열</usage>
          <rule>날짜·상태 열은 96px까지 축소 가능하다.</rule>
        </row>
        <row index="5" key="components-table-spec-hedeo-baegyeong">
          <item>헤더 배경</item>
          <value>#FFF8EE</value>
          <usage>표 상단</usage>
          <rule>sticky header가 필요하면 같은 색을 유지한다.</rule>
        </row>
        <row index="6" key="components-table-spec-bodeo">
          <item>보더</item>
          <value>1px #E7DDD1</value>
          <usage>행 구분선</usage>
          <rule>zebra 배경은 사용하지 않는다.</rule>
        </row>
        <row index="7" key="components-table-spec-mobail-daeche-gyuchik">
          <item>모바일 대체 규칙</item>
          <value>card list</value>
          <usage>768px 미만</usage>
          <rule>모바일은 기본적으로 카드 리스트로 변환한다. 가로 스크롤 표는 예외 상황에만 허용한다.</rule>
        </row>
        <row index="8" key="components-table-spec-bin-sangtae">
          <item>빈 상태</item>
          <value>row 120px / icon 32px / text 14px</value>
          <usage>데이터 없음</usage>
          <rule>표 안에 빈 상태를 직접 렌더링한다.</rule>
        </row>
      </spec-table>
      <state-table columns="item,value,usage,rule">
        <row index="1" key="components-table-state-table-default">
          <item>Table default</item>
          <value>row bg #FFFFFF / border 1px #E7DDD1</value>
          <usage>일반 표 상태</usage>
          <rule>헤더와 바디는 같은 그리드 폭을 유지한다.</rule>
        </row>
        <row index="2" key="components-table-state-table-hover">
          <item>Table hover</item>
          <value>row bg #FFF8EE</value>
          <usage>데스크톱 행 hover</usage>
          <rule>hover는 현재 행 전체에만 적용한다.</rule>
        </row>
        <row index="3" key="components-table-state-table-active">
          <item>Table active</item>
          <value>row bg #F6EFE6 / border-left 3px #CBB7F6</value>
          <usage>선택된 행</usage>
          <rule>선택 상태는 체크 아이콘 또는 라벨을 함께 표시한다.</rule>
        </row>
        <row index="4" key="components-table-state-table-focus">
          <item>Table focus</item>
          <value>cell ring 2px #7AA9FF</value>
          <usage>키보드 탐색</usage>
          <rule>셀 또는 행 단위 focus 정책을 문서화해 일관되게 적용한다.</rule>
        </row>
        <row index="5" key="components-table-state-table-disabled">
          <item>Table disabled</item>
          <value>row bg #F6EFE6 / text #8B96A3</value>
          <usage>사용 불가 항목</usage>
          <rule>행 액션 버튼은 모두 비활성화한다.</rule>
        </row>
        <row index="6" key="components-table-state-table-loading">
          <item>Table loading</item>
          <value>5 skeleton rows / shimmer 1200ms</value>
          <usage>조회 중</usage>
          <rule>컬럼 폭을 유지한 placeholder를 사용한다.</rule>
        </row>
        <row index="7" key="components-table-state-table-error">
          <item>Table error</item>
          <value>full row bg #FDEEEE / border 1px #D96B6B / retry CTA 40px</value>
          <usage>조회 실패</usage>
          <rule>표 내부 첫 행 위치에 오류 상태를 렌더링한다.</rule>
        </row>
      </state-table>
    </component>
  </section>
  <!-- Section: 접근성(A11y) 체크리스트 -->
  <section id="accessibility-checklist" title="접근성(A11y) 체크리스트">
    <table columns="item,value,usage,rule">
      <row index="1" key="accessibility-checklist-tekseuteu-daebi">
        <item>텍스트 대비</item>
        <value>4.5:1 이상</value>
        <usage>본문, 버튼, 입력, 표</usage>
        <rule>작은 텍스트와 핵심 액션은 WCAG AA를 만족해야 한다.</rule>
      </row>
      <row index="2" key="accessibility-checklist-keun-tekseuteu-daebi">
        <item>큰 텍스트 대비</item>
        <value>3:1 이상</value>
        <usage>24px+ 제목, 대형 수치</usage>
        <rule>예외 적용 시에도 본문색과 배경색 명암 차를 확인한다.</rule>
      </row>
      <row index="3" key="accessibility-checklist-choeso-teochi-yeongyeok">
        <item>최소 터치 영역</item>
        <value>44px x 44px</value>
        <usage>버튼, 아이콘, 탭</usage>
        <rule>시각적 크기와 무관하게 hit area를 보장한다.</rule>
      </row>
      <row index="4" key="accessibility-checklist-kibodeu-tamsaek">
        <item>키보드 탐색</item>
        <value>Tab / Shift+Tab / Enter / Space / Esc</value>
        <usage>웹 전체</usage>
        <rule>시각적 순서와 포커스 순서가 일치해야 한다.</rule>
      </row>
      <row index="5" key="accessibility-checklist-pokeoseu-gasiseong">
        <item>포커스 가시성</item>
        <value>2px / #7AA9FF</value>
        <usage>모든 인터랙션</usage>
        <rule>hover만 있고 focus가 없는 상태는 금지한다.</rule>
      </row>
      <row index="6" key="accessibility-checklist-seukeurinrideo-rabel">
        <item>스크린리더 라벨</item>
        <value>aria-label / aria-labelledby</value>
        <usage>아이콘 버튼, 차트, 입력</usage>
        <rule>의미 있는 SVG와 아이콘 버튼은 접근성 이름을 반드시 가진다.</rule>
      </row>
      <row index="7" key="accessibility-checklist-ipryeok-rabelring">
        <item>입력 라벨링</item>
        <value>label + helper + error</value>
        <usage>form 전종</usage>
        <rule>placeholder만으로 의미를 전달하지 않는다.</rule>
      </row>
      <row index="8" key="accessibility-checklist-oryu-annae-bangsik">
        <item>오류 안내 방식</item>
        <value>색상 + 아이콘 + 문구</value>
        <usage>입력, 카드, 토스트</usage>
        <rule>오류 발생 위치 바로 옆에 원인과 해결 방법을 함께 둔다.</rule>
      </row>
      <row index="9" key="accessibility-checklist-saeksang-dandok-jeondal-geumji">
        <item>색상 단독 전달 금지</item>
        <value>텍스트 병행</value>
        <usage>오행 차트, 상태 배지, 점수</usage>
        <rule>색상만 보고 의미를 판단하게 만들지 않는다.</rule>
      </row>
      <row index="10" key="accessibility-checklist-reduced-motion-daeeung">
        <item>reduced motion 대응</item>
        <value>0ms ~ 80ms</value>
        <usage>modal, drawer, page transition</usage>
        <rule>OS 설정이 켜져 있으면 움직임을 최소화한다.</rule>
      </row>
      <row index="11" key="accessibility-checklist-pyo-daeche-pyohyeon">
        <item>표 대체 표현</item>
        <value>card list or summary text</value>
        <usage>테이블, 차트</usage>
        <rule>모바일 또는 보조 기술 사용 시 같은 정보를 텍스트로도 제공한다.</rule>
      </row>
      <row index="12" key="accessibility-checklist-raibeu-yeongyeok">
        <item>라이브 영역</item>
        <value>aria-live="polite"</value>
        <usage>토스트, 비동기 완료 메시지</usage>
        <rule>오류는 assertive를 선택할 수 있으나 남용하지 않는다.</rule>
      </row>
      <row index="13" key="accessibility-checklist-eoneo-seoljeong">
        <item>언어 설정</item>
        <value>lang="ko"</value>
        <usage>문서 루트</usage>
        <rule>한국어 문장을 올바르게 읽게 한다.</rule>
      </row>
    </table>
  </section>
  <!-- Section: UI QA 체크리스트 -->
  <section id="ui-qa-checklist" title="UI QA 체크리스트">
    <table columns="item,value,usage,rule">
      <row index="1" key="ui-qa-checklist-baneunghyeong-geomsu-pok">
        <item>반응형 검수 폭</item>
        <value>375px / 768px / 1024px / 1440px</value>
        <usage>전체 페이지</usage>
        <rule>네 폭에서 레이아웃 깨짐, 겹침, 잘림을 모두 확인한다.</rule>
      </row>
      <row index="2" key="ui-qa-checklist-garo-seukeurol">
        <item>가로 스크롤</item>
        <value>0px</value>
        <usage>전체 페이지</usage>
        <rule>표 예외 화면 외에는 수평 스크롤이 없어야 한다.</rule>
      </row>
      <row index="3" key="ui-qa-checklist-gojeong-yoso-gyeopchim">
        <item>고정 요소 겹침</item>
        <value>GNB 64px / 탭 72px / CTA 80px</value>
        <usage>sticky, fixed 영역</usage>
        <rule>본문, 토스트, 모달이 고정 요소에 가려지지 않아야 한다.</rule>
      </row>
      <row index="4" key="ui-qa-checklist-sangtaebyeol-sigak-ilgwanseong">
        <item>상태별 시각 일관성</item>
        <value>default / hover / active / focus / disabled / loading / error</value>
        <usage>8개 컴포넌트 전종</usage>
        <rule>모든 상태가 누락 없이 구현되고 동일 토큰 체계를 따라야 한다.</rule>
      </row>
      <row index="5" key="ui-qa-checklist-gin-tekseuteu-julbakkum">
        <item>긴 텍스트 줄바꿈</item>
        <value>2줄 clamp 또는 자동 줄바꿈</value>
        <usage>카드 제목, 도움말, 토스트</usage>
        <rule>영문, 숫자, 긴 한국어 문장에서 overflow가 없어야 한다.</rule>
      </row>
      <row index="6" key="ui-qa-checklist-bin-sangtae-geomsu">
        <item>빈 상태 검수</item>
        <value>icon 32px / body 14px / CTA 40px</value>
        <usage>카드, 표, 목록</usage>
        <rule>데이터가 없을 때 빈 화면이 아니라 안내형 empty state를 노출한다.</rule>
      </row>
      <row index="7" key="ui-qa-checklist-oryu-sangtae-geomsu">
        <item>오류 상태 검수</item>
        <value>error soft + retry</value>
        <usage>카드, 필드, 모달, 토스트</usage>
        <rule>오류 사유와 재시도 액션이 동시에 보여야 한다.</rule>
      </row>
      <row index="8" key="ui-qa-checklist-roding-sangtae-geomsu">
        <item>로딩 상태 검수</item>
        <value>skeleton / spinner</value>
        <usage>목록, 차트, 버튼</usage>
        <rule>로딩 중 레이아웃 점프가 없어야 한다.</rule>
      </row>
      <row index="9" key="ui-qa-checklist-chateu-beomrye-geomsu">
        <item>차트 범례 검수</item>
        <value>label 13px / gap 8px</value>
        <usage>오행, 대운, 운세 그래프</usage>
        <rule>범례가 색상+텍스트+수치를 함께 표시하는지 확인한다.</rule>
      </row>
      <row index="10" key="ui-qa-checklist-jeojang-gongyu-cta-nochul">
        <item>저장·공유 CTA 노출</item>
        <value>56px ~ 80px</value>
        <usage>결과 리포트, 궁합</usage>
        <rule>결과 하단까지 스크롤하지 않아도 저장 또는 공유 CTA에 접근 가능해야 한다.</rule>
      </row>
      <row index="11" key="ui-qa-checklist-modal-deuroeo-datgi-dongjak">
        <item>모달/드로어 닫기 동작</item>
        <value>Esc / 닫기 버튼 / 바깥 탭</value>
        <usage>오버레이 전종</usage>
        <rule>허용된 닫기 수단이 일관돼야 한다. 차단 상태에서는 예외를 명시한다.</rule>
      </row>
      <row index="12" key="ui-qa-checklist-ipryeok-yuhyoseong-geomsu">
        <item>입력 유효성 검수</item>
        <value>error 14px / ring 2px</value>
        <usage>사주 입력, 궁합 입력</usage>
        <rule>빈 값, 잘못된 시간, 미지원 날짜 등 경계값을 모두 확인한다.</rule>
      </row>
      <row index="13" key="ui-qa-checklist-safe-area-geomsu">
        <item>safe-area 검수</item>
        <value>env(safe-area-inset-*)</value>
        <usage>iOS 모바일</usage>
        <rule>하단 탭, sticky CTA, 토스트가 홈 인디케이터와 겹치지 않아야 한다.</rule>
      </row>
      <row index="14" key="ui-qa-checklist-jeopgeunseong-geomsu">
        <item>접근성 검수</item>
        <value>Tab / SR / Contrast</value>
        <usage>전체 UI</usage>
        <rule>키보드 탐색, 스크린리더 읽기, 명암 대비를 릴리즈 전 점검한다.</rule>
      </row>
    </table>
  </section>
  <!-- Section: 가정(Assumptions) -->
  <section id="assumptions" title="가정(Assumptions)">
    <table columns="item,value,usage,rule">
      <row index="1" key="assumptions-beomwi-gijun">
        <item>범위 기준</item>
        <value>MVP</value>
        <usage>전체 문서</usage>
        <rule>프리미엄 심층 리포트, AI 상담, 알림, 게이미피케이션은 확장 여지로만 본다.</rule>
      </row>
      <row index="2" key="assumptions-peulraetpom">
        <item>플랫폼</item>
        <value>모바일 웹 우선 반응형 웹</value>
        <usage>전체 제품</usage>
        <rule>네이티브 앱 전용 제스처와 OS 전용 UI 패턴은 본 문서 범위에서 제외한다.</rule>
      </row>
      <row index="3" key="assumptions-aikon-siseutem">
        <item>아이콘 시스템</item>
        <value>선형 SVG / 20px / 24px</value>
        <usage>전체 UI</usage>
        <rule>이모지 아이콘은 사용하지 않는다.</rule>
      </row>
      <row index="4" key="assumptions-tokeun-sayong-bangsik">
        <item>토큰 사용 방식</item>
        <value>Figma Variables + CSS Custom Properties</value>
        <usage>디자인, 프론트엔드</usage>
        <rule>토큰 이름은 문서 표기를 그대로 사용한다.</rule>
      </row>
      <row index="5" key="assumptions-chateu-guhyeon-bangsik">
        <item>차트 구현 방식</item>
        <value>라이브러리 무관</value>
        <usage>결과 리포트, 운세</usage>
        <rule>색상, 여백, 범례, 접근성 기준만 고정하고 라이브러리 선택은 구현 단계에서 결정한다.</rule>
      </row>
      <row index="6" key="assumptions-naljja-sigan-seontaekgi">
        <item>날짜·시간 선택기</item>
        <value>Input + Drawer 조합</value>
        <usage>사주 입력, 궁합 입력</usage>
        <rule>모바일 휠 선택 경험을 우선한다. 브라우저 기본 picker는 보조 옵션으로만 본다.</rule>
      </row>
      <row index="7" key="assumptions-gibon-jeongryeol-gyuchik">
        <item>기본 정렬 규칙</item>
        <value>최신순 / 중요도 우선</value>
        <usage>저장 목록, 알림 목록</usage>
        <rule>사용자가 별도 정렬을 바꾸지 않으면 최신 결과를 먼저 보여준다.</rule>
      </row>
    </table>
  </section>
</uiux-spec>
```
