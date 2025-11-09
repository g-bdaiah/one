/*
  # إنشاء جدول المؤسسات

  1. الوصف
    - جدول لتخزين معلومات المؤسسات الإنسانية والخيرية
    - يحتوي على معلومات الاتصال والإحصائيات

  2. الجداول الجديدة
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text) - اسم المؤسسة
      - `type` (text) - نوع المؤسسة
      - `location` (text) - الموقع
      - `contact_person` (text) - الشخص المسؤول
      - `phone` (text) - رقم الهاتف
      - `email` (text) - البريد الإلكتروني
      - `beneficiaries_count` (integer) - عدد المستفيدين
      - `packages_count` (integer) - عدد الطرود
      - `completion_rate` (numeric) - معدل الإنجاز
      - `status` (text) - حالة المؤسسة
      - `packages_available` (integer) - الطرود المتوفرة
      - `templates_count` (integer) - عدد القوالب
      - `is_popular` (boolean) - مؤسسة مشهورة
      - `created_at` (timestamptz) - تاريخ الإنشاء

  3. الأمان
    - تفعيل Row Level Security
    - سياسة للقراءة للجميع
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  location text NOT NULL,
  contact_person text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  beneficiaries_count integer DEFAULT 0,
  packages_count integer DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  packages_available integer DEFAULT 0,
  templates_count integer DEFAULT 0,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON organizations
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);