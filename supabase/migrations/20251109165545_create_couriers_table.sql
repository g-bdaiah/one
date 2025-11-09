/*
  # إنشاء جدول المندوبين

  1. الوصف
    - جدول لتخزين معلومات مندوبي التوصيل
    - يحتوي على معلومات الأداء والموقع

  2. الجداول الجديدة
    - `couriers`
      - `id` (uuid, primary key)
      - `name` (text) - اسم المندوب
      - `phone` (text) - رقم الهاتف
      - `email` (text) - البريد الإلكتروني
      - `status` (text) - الحالة
      - `rating` (numeric) - التقييم
      - `completed_tasks` (integer) - المهام المكتملة
      - `current_location` (jsonb) - الموقع الحالي
      - `is_humanitarian_approved` (boolean) - موافقة إنسانية

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'offline' CHECK (status IN ('active', 'busy', 'offline')),
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  completed_tasks integer DEFAULT 0,
  current_location jsonb DEFAULT '{"lat": 0, "lng": 0}',
  is_humanitarian_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_couriers_status ON couriers(status);
CREATE INDEX IF NOT EXISTS idx_couriers_rating ON couriers(rating);

ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON couriers
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON couriers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON couriers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);