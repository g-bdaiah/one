/*
  # إضافة العلاقة بين العائلات والمستفيدين

  1. الوصف
    - إضافة المفتاح الأجنبي لربط رب الأسرة بجدول المستفيدين

  2. التعديلات
    - إضافة foreign key constraint على head_of_family_id في جدول families
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'families_head_of_family_id_fkey'
  ) THEN
    ALTER TABLE families
    ADD CONSTRAINT families_head_of_family_id_fkey
    FOREIGN KEY (head_of_family_id)
    REFERENCES beneficiaries(id)
    ON DELETE SET NULL;
  END IF;
END $$;