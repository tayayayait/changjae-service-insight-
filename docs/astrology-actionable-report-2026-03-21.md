# Astrology Report UX Contract (v5)

## Section Order
1. `DiagnosisSection`
2. `CoreInsightsSection`
3. `IdentitySection`
4. `QuestionInterpretationSection`
5. `OperationManualSection`
6. `LongTermGrowthSection`
7. `ActionRoutineSection`
8. `SummaryCardSection`
9. `DetailAccordion` (appendix)

## Section Rules

### 1) DiagnosisSection
- render `hero.headline` only as the core diagnosis line
- show `confidence.score`, `confidence.level`, `confidence.summary`
- show birth-time limitation once when `birthTimeKnown=false`

### 2) CoreInsightsSection
- render exactly 3 items from `hero.topInsights`

### 3) IdentitySection
- summarize "나는 어떤 사람인가" from:
  - Big3 (`deepData.big3`)
  - `lifePatterns.relationship|work|recovery`

### 4) QuestionInterpretationSection
- fixed 5 questions:
  - love
  - work
  - money
  - recovery
  - luck
- only answers vary by user

### 5) OperationManualSection
- fixed 4 cards:
  - `relationship`
  - `work`
  - `money`
  - `recovery`
- each card uses:
  - `problemManifestation`
  - `trigger`
  - `recommendedAction`

### 6) LongTermGrowthSection
- render `currentWindow.quarter.focus|avoid|routine`

### 7) ActionRoutineSection
- render immediate actions from life-pattern recommendations
- render 30-day routine from `currentWindow.month`

### 8) SummaryCardSection
- compress key diagnosis + this-month focus + first action into one summary card

### 9) DetailAccordion
- render detailed astronomy data only at the end:
  - Big 3
  - planets, houses, aspects
  - element and quality distributions

## Quality Gates
- dedupe repeated sentences with `dedupeReportCopy`
- enforce fixed question and pattern shapes
- reject internal tokens and broken mixed strings
- inject birth-time disclaimer once (do not duplicate per card)

## Payment and Reopen Policy
- preview exposes only section 1 (`DiagnosisSection`)
- paid report unlocks section 2~9
- reopen shows the originally generated report without recalculating `currentWindow`
