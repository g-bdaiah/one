/*
  # إنشاء جدول مستخدمي النظام

  1. الوصف
    - جدول لتخزين معلومات مستخدمي النظام
    - يربط المستخدمين بالأدوار والكيانات

  2. الجداول الجديدة
    - `system_users`
      - `id` (uuid, primary key)
      - `name` (text) - اسم المستخدم
      - `email` (text) - البريد الإلكتروني
      - `phone` (text) - رقم الهاتف
      - `role_id` (uuid) - معرف الدور
      - `associated_id` (uuid) - معرف الكيان المرتبط
      - `associated_type` (text) - نوع الكيان المرتبط
      - `status` (text) - حالة المستخدم
      - `last_login` (timestamptz) - آخر تسجيل دخول
      - `created_at` (timestamptz) - تاريخ الإنشاء

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  associated_id uuid,
  associated_type text CHECK (associated_type IN ('organization', 'family') OR associated_type IS NULL),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON system_users(role_id);
CREATE INDEX IF NOT EXISTS idx_system_users_status ON system_users(status);
CREATE INDEX IF NOT EXISTS idx_system_users_associated ON system_users(associated_id, associated_type);

ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON system_users
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON system_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON system_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);