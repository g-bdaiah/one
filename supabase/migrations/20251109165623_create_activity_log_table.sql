/*
  # إنشاء جدول سجل الأنشطة

  1. الوصف
    - جدول لتتبع جميع الأنشطة والعمليات في النظام
    - يساعد في المراجعة والتدقيق

  2. الجداول الجديدة
    - `activity_log`
      - `id` (uuid, primary key)
      - `action` (text) - الإجراء المنفذ
      - `user_name` (text) - اسم المستخدم
      - `role` (text) - دور المستخدم
      - `timestamp` (timestamptz) - وقت التنفيذ
      - `type` (text) - نوع الإجراء
      - `beneficiary_id` (uuid) - معرف المستفيد المرتبط
      - `details` (text) - تفاصيل إضافية

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_name text NOT NULL,
  role text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  type text NOT NULL CHECK (type IN ('create', 'verify', 'approve', 'update', 'deliver', 'review')),
  beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE SET NULL,
  details text
);

CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_beneficiary ON activity_log(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_name);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON activity_log
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);