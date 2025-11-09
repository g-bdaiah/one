/*
  # إنشاء جدول التنبيهات

  1. الوصف
    - جدول لتخزين التنبيهات والإشعارات المهمة
    - يساعد في تتبع المشاكل والقضايا العاجلة

  2. الجداول الجديدة
    - `alerts`
      - `id` (uuid, primary key)
      - `type` (text) - نوع التنبيه
      - `title` (text) - العنوان
      - `description` (text) - الوصف
      - `related_id` (uuid) - معرف الكيان المرتبط
      - `related_type` (text) - نوع الكيان المرتبط
      - `priority` (text) - الأولوية
      - `is_read` (boolean) - مقروء
      - `created_at` (timestamptz) - تاريخ الإنشاء

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('delayed', 'failed', 'expired', 'urgent')),
  title text NOT NULL,
  description text NOT NULL,
  related_id uuid NOT NULL,
  related_type text NOT NULL CHECK (related_type IN ('package', 'beneficiary', 'task')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_related ON alerts(related_id, related_type);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON alerts
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON alerts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);