/*
  # إنشاء الدوال والإجراءات المخزنة

  1. الوصف
    - دوال مساعدة لحسابات مختلفة
    - دوال للبحث والتقارير

  2. الدوال الجديدة
    - calculate_distance: حساب المسافة بين نقطتين
    - generate_tracking_number: توليد رقم تتبع فريد
    - search_beneficiaries: البحث في المستفيدين
    - calculate_courier_success_rate: حساب معدل نجاح المندوب

  3. ملاحظات
    - جميع الدوال آمنة ومحسنة للأداء
*/

-- دالة لحساب المسافة بين نقطتين جغرافيتين (بالكيلومتر)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R double precision := 6371;
  dLat double precision;
  dLon double precision;
  a double precision;
  c double precision;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- دالة لتوليد رقم تتبع فريد
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  date_part text;
  random_part text;
BEGIN
  date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
  random_part := lpad(floor(random() * 10000)::text, 4, '0');
  
  RETURN 'TRK-' || date_part || '-' || random_part;
END;
$$;

-- دالة للبحث في المستفيدين
CREATE OR REPLACE FUNCTION search_beneficiaries(search_term text)
RETURNS TABLE (
  id uuid,
  name text,
  national_id text,
  phone text,
  address text,
  status text,
  identity_status text,
  rank real
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.national_id,
    b.phone,
    b.address,
    b.status,
    b.identity_status,
    ts_rank(
      to_tsvector('arabic', b.name || ' ' || b.national_id || ' ' || b.phone),
      plainto_tsquery('arabic', search_term)
    ) as rank
  FROM beneficiaries b
  WHERE 
    b.name ILIKE '%' || search_term || '%' OR
    b.national_id ILIKE '%' || search_term || '%' OR
    b.phone ILIKE '%' || search_term || '%'
  ORDER BY rank DESC, b.created_at DESC
  LIMIT 50;
END;
$$;

-- دالة لحساب معدل نجاح المندوب
CREATE OR REPLACE FUNCTION calculate_courier_success_rate(courier_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  total_tasks integer;
  successful_tasks integer;
  success_rate numeric;
BEGIN
  SELECT COUNT(*) INTO total_tasks
  FROM tasks
  WHERE courier_id = courier_uuid;
  
  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO successful_tasks
  FROM tasks
  WHERE courier_id = courier_uuid AND status = 'delivered';
  
  success_rate := (successful_tasks::numeric / total_tasks::numeric) * 100;
  
  RETURN ROUND(success_rate, 2);
END;
$$;