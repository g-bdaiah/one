/*
  # إنشاء جدول العائلات

  1. الوصف
    - جدول لتخزين معلومات العائلات المستفيدة
    - يحتوي على معلومات رب الأسرة والإحصائيات

  2. الجداول الجديدة
    - `families`
      - `id` (uuid, primary key)
      - `name` (text) - اسم العائلة
      - `head_of_family` (text) - رب الأسرة
      - `head_of_family_id` (uuid) - معرف رب الأسرة من جدول المستفيدين
      - `phone` (text) - رقم الهاتف
      - `members_count` (integer) - عدد الأفراد
      - `total_children` (integer) - عدد الأطفال
      - `total_medical_cases` (integer) - عدد الحالات الطبية
      - `average_age` (numeric) - متوسط العمر
      - `packages_distributed` (integer) - عدد الطرود الموزعة
      - `completion_rate` (numeric) - معدل الإنجاز
      - `location` (text) - الموقع
      - `created_at` (timestamptz) - تاريخ الإنشاء

  3. الأمان
    - تفعيل Row Level Security
    - سياسات للقراءة والكتابة
*/

CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  head_of_family text NOT NULL,
  head_of_family_id uuid,
  phone text NOT NULL,
  members_count integer DEFAULT 0,
  total_children integer DEFAULT 0,
  total_medical_cases integer DEFAULT 0,
  average_age numeric DEFAULT 0,
  packages_distributed integer DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON families
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON families
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON families
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);