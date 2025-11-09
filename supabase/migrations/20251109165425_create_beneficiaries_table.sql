/*
  # إنشاء جدول المستفيدين

  1. الوصف
    - جدول لتخزين معلومات المستفيدين من المساعدات الإنسانية
    - يحتوي على معلومات شخصية، طبية، اقتصادية وجغرافية

  2. الجداول الجديدة
    - `beneficiaries`
      - معلومات شخصية أساسية
      - معلومات الهوية والتحقق
      - المعلومات الاقتصادية والطبية
      - العلاقات الأسرية والتنظيمية
      - معلومات الموقع الجغرافي

  3. الأمان
    - تفعيل Row Level Security
    - سياسات للوصول حسب الدور
*/

CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  full_name text NOT NULL,
  national_id text UNIQUE NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  phone text NOT NULL,
  address text NOT NULL,
  detailed_address jsonb DEFAULT '{}',
  location jsonb DEFAULT '{"lat": 0, "lng": 0}',
  
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  relation_to_family text,
  
  is_head_of_family boolean DEFAULT false,
  spouse_id uuid,
  children_ids uuid[] DEFAULT '{}',
  parent_id uuid,
  
  medical_conditions text[] DEFAULT '{}',
  profession text NOT NULL,
  marital_status text NOT NULL CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  economic_level text NOT NULL CHECK (economic_level IN ('very_poor', 'poor', 'moderate', 'good')),
  members_count integer DEFAULT 0,
  
  additional_documents jsonb DEFAULT '[]',
  identity_status text DEFAULT 'pending' CHECK (identity_status IN ('verified', 'pending', 'rejected')),
  identity_image_url text,
  
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  eligibility_status text DEFAULT 'under_review' CHECK (eligibility_status IN ('eligible', 'under_review', 'rejected')),
  
  last_received date DEFAULT CURRENT_DATE,
  total_packages integer DEFAULT 0,
  notes text DEFAULT '',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system',
  updated_by text DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_organization ON beneficiaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_family ON beneficiaries(family_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_national_id ON beneficiaries(national_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(status);

ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON beneficiaries
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON beneficiaries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON beneficiaries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);