/*
  # إنشاء العروض (Views)

  1. الوصف
    - عروض لتسهيل الاستعلامات المعقدة
    - تجميع البيانات من عدة جداول

  2. العروض الجديدة
    - beneficiaries_detailed: عرض تفصيلي للمستفيدين
    - system_statistics: إحصائيات النظام العامة
    - courier_performance: أداء المندوبين

  3. ملاحظات
    - العروض محسنة للأداء
*/

-- عرض تفصيلي للمستفيدين مع معلومات المؤسسات والعائلات
CREATE OR REPLACE VIEW beneficiaries_detailed AS
SELECT 
  b.id,
  b.name,
  b.full_name,
  b.national_id,
  b.phone,
  b.status,
  b.identity_status,
  b.eligibility_status,
  b.total_packages,
  b.last_received,
  o.name as organization_name,
  f.name as family_name,
  (SELECT COUNT(*) FROM packages WHERE beneficiary_id = b.id AND status = 'delivered') as packages_delivered,
  (SELECT MAX(delivered_at) FROM packages WHERE beneficiary_id = b.id) as last_package_date,
  b.created_at
FROM beneficiaries b
LEFT JOIN organizations o ON b.organization_id = o.id
LEFT JOIN families f ON b.family_id = f.id;

-- عرض إحصائيات النظام العامة
CREATE OR REPLACE VIEW system_statistics AS
SELECT 
  (SELECT COUNT(*) FROM beneficiaries) as total_beneficiaries,
  (SELECT COUNT(*) FROM beneficiaries WHERE identity_status = 'verified') as verified_beneficiaries,
  (SELECT COUNT(*) FROM beneficiaries WHERE status = 'active') as active_beneficiaries,
  (SELECT COUNT(*) FROM packages) as total_packages,
  (SELECT COUNT(*) FROM packages WHERE status = 'delivered') as delivered_packages,
  (SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'assigned', 'in_progress')) as active_tasks,
  (SELECT COUNT(*) FROM alerts WHERE priority = 'critical' AND is_read = false) as critical_alerts,
  (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
  (SELECT COUNT(*) FROM couriers WHERE status IN ('active', 'busy')) as active_couriers;

-- عرض أداء المندوبين
CREATE OR REPLACE VIEW courier_performance AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.status,
  c.rating,
  c.completed_tasks as total_tasks,
  (SELECT COUNT(*) FROM tasks WHERE courier_id = c.id AND status = 'delivered') as successful_deliveries,
  (SELECT COUNT(*) FROM tasks WHERE courier_id = c.id AND status = 'failed') as failed_deliveries,
  CASE 
    WHEN c.completed_tasks > 0 THEN
      ROUND((SELECT COUNT(*)::numeric FROM tasks WHERE courier_id = c.id AND status = 'delivered') / c.completed_tasks::numeric * 100, 2)
    ELSE 0
  END as success_rate_calculated
FROM couriers c;