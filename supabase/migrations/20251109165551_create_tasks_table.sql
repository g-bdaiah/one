/*
  # إنشاء جدول المهام

  1. الوصف
    - جدول لتخزين مهام التوصيل
    - يربط بين الطرود والمستفيدين والمندوبين

  2. الجداول الجديدة
    - `tasks`
      - `id` (uuid, primary key)
      - `package_id` (uuid) - معرف الطرد
      - `beneficiary_id` (uuid) - معرف المستفيد
      - `courier_id` (uuid) - معرف المندوب
      - `status` (text) - حالة المهمة
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `scheduled_at` (timestamptz) - موعد التسليم
      - `delivered_at` (timestamptz) - تاريخ التسليم
      - `delivery_location` (jsonb) - موقع التسليم
      - `notes` (text) - ملاحظات
      - `courier_notes` (text) - ملاحظات المندوب
      - `delivery_proof_image_url` (text) - صورة إثبات التسليم
      - `digital_signature_image_url` (text) - التوقيع الرقمي
      - `estimated_arrival_time` (timestamptz) - وقت الوصول المقدر
      - `remaining_distance` (numeric) - المسافة المتبقية
      - `photo_url` (text) - صورة
      - `failure_reason` (text) - سبب الفشل

  3. الأمان
    - تفعيل Row Level Security
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  beneficiary_id uuid NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  courier_id uuid REFERENCES couriers(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'delivered', 'failed', 'rescheduled')),
  created_at timestamptz DEFAULT now(),
  scheduled_at timestamptz,
  delivered_at timestamptz,
  delivery_location jsonb,
  notes text,
  courier_notes text,
  delivery_proof_image_url text,
  digital_signature_image_url text,
  estimated_arrival_time timestamptz,
  remaining_distance numeric,
  photo_url text,
  failure_reason text
);

CREATE INDEX IF NOT EXISTS idx_tasks_package ON tasks(package_id);
CREATE INDEX IF NOT EXISTS idx_tasks_beneficiary ON tasks(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_tasks_courier ON tasks(courier_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);