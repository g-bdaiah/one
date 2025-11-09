/*
  # إنشاء جدول الصلاحيات

  1. الوصف
    - جدول لتخزين الصلاحيات المختلفة في النظام
    - يستخدم لإدارة الوصول والتحكم

  2. الجداول الجديدة
    - `permissions`
      - `id` (uuid, primary key)
      - `name` (text) - اسم الصلاحية
      - `description` (text) - وصف الصلاحية
      - `category` (text) - فئة الصلاحية
      - `created_at` (timestamptz) - تاريخ الإنشاء

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('read', 'write', 'delete', 'approve', 'manage')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON permissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);