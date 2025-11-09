/*
  # إنشاء جدول الطرود

  1. الوصف
    - جدول لتخزين معلومات الطرود المساعدة
    - يحتوي على معلومات التوزيع والحالة

  2. الجداول الجديدة
    - `packages`
      - `id` (uuid, primary key)
      - `name` (text) - اسم الطرد
      - `type` (text) - نوع الطرد
      - `description` (text) - الوصف
      - `value` (numeric) - القيمة
      - `funder` (text) - الممول
      - `organization_id` (uuid) - المؤسسة
      - `family_id` (uuid) - العائلة
      - `beneficiary_id` (uuid) - المستفيد
      - `status` (text) - الحالة
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `delivered_at` (timestamptz) - تاريخ التسليم
      - `expiry_date` (date) - تاريخ الانتهاء

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  value numeric DEFAULT 0,
  funder text NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_delivery', 'delivered', 'failed')),
  created_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  expiry_date date
);

CREATE INDEX IF NOT EXISTS idx_packages_organization ON packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_packages_family ON packages(family_id);
CREATE INDEX IF NOT EXISTS idx_packages_beneficiary ON packages(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON packages
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON packages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON packages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);