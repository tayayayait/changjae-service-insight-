-- saju_results 테이블에 서비스 유형 컬럼 추가
ALTER TABLE saju_results ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'traditional-saju';
-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_saju_results_service_type ON saju_results(service_type);
