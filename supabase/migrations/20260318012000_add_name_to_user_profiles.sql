-- user_profiles 테이블에 name 필드 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name TEXT;
