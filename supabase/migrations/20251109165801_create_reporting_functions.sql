/*
  # إنشاء دوال التقارير والإحصائيات

  1. الوصف
    - دوال لتوليد التقارير الشاملة
    - دوال للإحصائيات الجغرافية

  2. الدوال الجديدة
    - get_geographic_statistics: إحصائيات حسب المنطقة
    - generate_comprehensive_report: تقرير شامل
    - create_automatic_alerts: إنشاء تنبيهات تلقائية

  3. ملاحظات
    - الدوال محسنة ومصممة للأداء العالي
*/

-- دالة للحصول على الإحصائيات الجغرافية
CREATE OR REPLACE FUNCTION get_geographic_statistics()
RETURNS TABLE (
  area_name text,
  total_beneficiaries bigint,
  delivered_packages bigint,
  pending_packages bigint,
  success_rate numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.location::jsonb->>'area' as area_name,
    COUNT(DISTINCT b.id) as total_beneficiaries,
    COUNT(CASE WHEN p.status = 'delivered' THEN 1 END) as delivered_packages,
    COUNT(CASE WHEN p.status IN ('pending', 'assigned', 'in_delivery') THEN 1 END) as pending_packages,
    CASE 
      WHEN COUNT(p.id) > 0 THEN
        ROUND((COUNT(CASE WHEN p.status = 'delivered' THEN 1 END)::numeric / COUNT(p.id)::numeric) * 100, 2)
      ELSE 0
    END as success_rate
  FROM beneficiaries b
  LEFT JOIN packages p ON b.id = p.beneficiary_id
  WHERE b.location::jsonb->>'area' IS NOT NULL
  GROUP BY b.location::jsonb->>'area'
  ORDER BY total_beneficiaries DESC;
END;
$$;

-- دالة لتوليد تقرير شامل
CREATE OR REPLACE FUNCTION generate_comprehensive_report(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  report jsonb;
  total_beneficiaries integer;
  verified_beneficiaries integer;
  active_beneficiaries integer;
  total_packages integer;
  delivered_packages integer;
  pending_packages integer;
  delivery_rate numeric;
BEGIN
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := CURRENT_TIMESTAMP;
  END IF;

  SELECT COUNT(*) INTO total_beneficiaries FROM beneficiaries;
  SELECT COUNT(*) INTO verified_beneficiaries FROM beneficiaries WHERE identity_status = 'verified';
  SELECT COUNT(*) INTO active_beneficiaries FROM beneficiaries WHERE status = 'active';
  
  SELECT COUNT(*) INTO total_packages FROM packages WHERE created_at BETWEEN start_date AND end_date;
  SELECT COUNT(*) INTO delivered_packages FROM packages WHERE status = 'delivered' AND created_at BETWEEN start_date AND end_date;
  SELECT COUNT(*) INTO pending_packages FROM packages WHERE status IN ('pending', 'assigned', 'in_delivery') AND created_at BETWEEN start_date AND end_date;
  
  IF total_packages > 0 THEN
    delivery_rate := ROUND((delivered_packages::numeric / total_packages::numeric) * 100, 2);
  ELSE
    delivery_rate := 0;
  END IF;

  report := jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', start_date,
      'end_date', end_date
    ),
    'beneficiaries', jsonb_build_object(
      'total', total_beneficiaries,
      'verified', verified_beneficiaries,
      'active', active_beneficiaries
    ),
    'packages', jsonb_build_object(
      'total', total_packages,
      'delivered', delivered_packages,
      'pending', pending_packages
    ),
    'performance', jsonb_build_object(
      'delivery_rate', delivery_rate
    )
  );

  RETURN report;
END;
$$;

-- دالة لإنشاء تنبيهات تلقائية
CREATE OR REPLACE FUNCTION create_automatic_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- تنبيهات للطرود المتأخرة (أكثر من 3 أيام)
  INSERT INTO alerts (type, title, description, related_id, related_type, priority)
  SELECT 
    'delayed',
    'طرد متأخر في التسليم',
    'الطرد لم يتم تسليمه منذ أكثر من 3 أيام',
    p.id,
    'package',
    'high'
  FROM packages p
  WHERE p.status IN ('assigned', 'in_delivery')
    AND p.created_at < CURRENT_TIMESTAMP - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM alerts a 
      WHERE a.related_id = p.id 
        AND a.related_type = 'package' 
        AND a.type = 'delayed'
        AND a.created_at > CURRENT_TIMESTAMP - INTERVAL '1 day'
    );

  -- تنبيهات للطرود القريبة من الانتهاء (أقل من 7 أيام)
  INSERT INTO alerts (type, title, description, related_id, related_type, priority)
  SELECT 
    'expired',
    'طرد قارب على الانتهاء',
    'صلاحية الطرد تنتهي خلال أقل من 7 أيام',
    p.id,
    'package',
    'medium'
  FROM packages p
  WHERE p.status != 'delivered'
    AND p.expiry_date IS NOT NULL
    AND p.expiry_date < CURRENT_DATE + INTERVAL '7 days'
    AND p.expiry_date > CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM alerts a 
      WHERE a.related_id = p.id 
        AND a.related_type = 'package' 
        AND a.type = 'expired'
        AND a.created_at > CURRENT_TIMESTAMP - INTERVAL '1 day'
    );
END;
$$;