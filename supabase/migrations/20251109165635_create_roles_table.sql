/*
  # إنشاء جدول الأدوار

  1. الوصف
    - جدول لتخزين أدوار المستخدمين
    - يربط الأدوار بالصلاحيات

  2. الجداول الجديدة
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text) - اسم الدور
      - `description` (text) - وصف الدور
      - `permissions` (uuid[]) - قائمة معرفات الصلاحيات
      - `user_count` (integer) - عدد المستخدمين
      - `is_active` (boolean) - نشط
      - `created_at` (timestamptz) - تاريخ الإنشاء

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  permissions uuid[] DEFAULT '{}',
  user_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON roles
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);