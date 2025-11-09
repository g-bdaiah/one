/*
  # إنشاء جدول قوالب الطرود

  1. الوصف
    - جدول لتخزين قوالب الطرود المختلفة
    - يحتوي على معلومات المحتويات والتكلفة

  2. الجداول الجديدة
    - `package_templates`
      - `id` (uuid, primary key)
      - `name` (text) - اسم القالب
      - `type` (text) - نوع الطرد
      - `organization_id` (uuid) - المؤسسة المالكة
      - `description` (text) - الوصف
      - `contents` (jsonb) - محتويات الطرد
      - `status` (text) - حالة القالب
      - `usage_count` (integer) - عدد الاستخدامات
      - `total_weight` (numeric) - الوزن الإجمالي
      - `estimated_cost` (numeric) - التكلفة المقدرة
      - `created_at` (timestamptz) - تاريخ الإنشاء

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS package_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('food', 'medical', 'clothing', 'hygiene', 'emergency')),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description text NOT NULL,
  contents jsonb DEFAULT '[]',
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'inactive')),
  usage_count integer DEFAULT 0,
  total_weight numeric DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_package_templates_organization ON package_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_package_templates_type ON package_templates(type);
CREATE INDEX IF NOT EXISTS idx_package_templates_status ON package_templates(status);

ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON package_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON package_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON package_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);