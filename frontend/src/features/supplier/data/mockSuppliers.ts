import { Supplier, SupplierDashboardMetrics, SupplierPerformance } from '../../../types/supplier';

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-HUL',
    legal_name: 'Hindustan Unilever Limited', display_name: 'HUL', supplier_type_id: 'TYP-1', supplier_type_name: 'Manufacturer',
    supplier_category_id: 'CAT-1', supplier_category_name: 'FMCG Consumables', supplier_status_id: 'STAT-1',
    supplier_status_name: 'Active', supplier_status_code: 'ACTIVE', is_active: true, is_preferred: true, is_strategic: true,
    is_approved: true, is_blocked: false, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'orders@hul-dist.com',
    primary_phone: '+91 98110 44210', gst_number: '07AAACH1101A1Z8', pan_number: 'AAACH1101A',
    overall_rating: 4.8, risk_level: 1, created_at_utc: '2025-01-10T10:00:00Z', last_modified_at_utc: '2026-06-10T10:00:00Z', row_version: 1,
    primary_site_name: 'Okhla Delhi', primary_contact_name: 'Rajesh Malhotra'
  },
  {
    id: 'SUP-002', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-ITC',
    legal_name: 'ITC Limited', display_name: 'ITC', supplier_type_id: 'TYP-1', supplier_type_name: 'Manufacturer',
    supplier_category_id: 'CAT-1', supplier_category_name: 'FMCG Consumables', supplier_status_id: 'STAT-1',
    supplier_status_name: 'Active', supplier_status_code: 'ACTIVE', is_active: true, is_preferred: true, is_strategic: true,
    is_approved: true, is_blocked: false, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'sales@itc.in',
    primary_phone: '+91 98220 55330', gst_number: '19AAACI1201B1Z9', pan_number: 'AAACI1201B',
    overall_rating: 4.9, risk_level: 1, created_at_utc: '2025-02-15T10:00:00Z', last_modified_at_utc: '2026-05-20T10:00:00Z', row_version: 1,
    primary_site_name: 'Kolkata Hub', primary_contact_name: 'Sunil Das'
  },
  {
    id: 'SUP-003', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-NST',
    legal_name: 'Nestle India Ltd', display_name: 'Nestle', supplier_type_id: 'TYP-1', supplier_type_name: 'Manufacturer',
    supplier_category_id: 'CAT-2', supplier_category_name: 'Food & Beverage', supplier_status_id: 'STAT-2',
    supplier_status_name: 'Pending Approval', supplier_status_code: 'PENDING', is_active: false, is_preferred: false, is_strategic: false,
    is_approved: false, is_blocked: false, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'vendor@nestle.in',
    primary_phone: '+91 99330 66440', gst_number: '06AAACN1301C1Z0', pan_number: 'AAACN1301C',
    overall_rating: 4.5, risk_level: 2, created_at_utc: '2026-07-01T10:00:00Z', last_modified_at_utc: '2026-07-15T10:00:00Z', row_version: 1,
    primary_site_name: 'Gurugram HQ', primary_contact_name: 'Priya Sharma'
  },
  {
    id: 'SUP-004', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-BRT',
    legal_name: 'Britannia Industries', display_name: 'Britannia', supplier_type_id: 'TYP-1', supplier_type_name: 'Manufacturer',
    supplier_category_id: 'CAT-2', supplier_category_name: 'Food & Beverage', supplier_status_id: 'STAT-1',
    supplier_status_name: 'Active', supplier_status_code: 'ACTIVE', is_active: true, is_preferred: false, is_strategic: false,
    is_approved: true, is_blocked: false, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'sales@britannia.com',
    primary_phone: '+91 98711 22334', gst_number: '07AABCB2202B1Z4', pan_number: 'AABCB2202B',
    overall_rating: 4.6, risk_level: 1, created_at_utc: '2025-03-20T10:00:00Z', last_modified_at_utc: '2026-06-25T10:00:00Z', row_version: 1,
    primary_site_name: 'Noida', primary_contact_name: 'Priya Narang'
  },
  {
    id: 'SUP-005', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-AML',
    legal_name: 'Gujarat Cooperative Milk Marketing Federation', display_name: 'Amul', supplier_type_id: 'TYP-2', supplier_type_name: 'Distributor',
    supplier_category_id: 'CAT-3', supplier_category_name: 'Dairy', supplier_status_id: 'STAT-1',
    supplier_status_name: 'Active', supplier_status_code: 'ACTIVE', is_active: true, is_preferred: true, is_strategic: false,
    is_approved: true, is_blocked: false, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'orders@amul.coop',
    primary_phone: '+91 99887 77665', gst_number: '24AAAAA0000A1Z5', pan_number: 'AAAAA0000A',
    overall_rating: 4.7, risk_level: 1, created_at_utc: '2025-04-10T10:00:00Z', last_modified_at_utc: '2026-05-15T10:00:00Z', row_version: 1,
    primary_site_name: 'Anand', primary_contact_name: 'Ramesh Patel'
  },
  {
    id: 'SUP-006', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-DBR',
    legal_name: 'Dabur India Ltd', display_name: 'Dabur', supplier_type_id: 'TYP-1', supplier_type_name: 'Manufacturer',
    supplier_category_id: 'CAT-1', supplier_category_name: 'FMCG Consumables', supplier_status_id: 'STAT-3',
    supplier_status_name: 'Blocked', supplier_status_code: 'BLOCKED', is_active: false, is_preferred: false, is_strategic: false,
    is_approved: true, is_blocked: true, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'compliance@dabur.com',
    primary_phone: '+91 99112 23344', gst_number: '09AAACD3401D1Z6', pan_number: 'AAACD3401D',
    overall_rating: 3.2, risk_level: 4, created_at_utc: '2025-05-05T10:00:00Z', last_modified_at_utc: '2026-07-20T10:00:00Z', row_version: 1,
    primary_site_name: 'Ghaziabad', primary_contact_name: 'Amit Kumar'
  },
  {
    id: 'SUP-007', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-MRC',
    legal_name: 'Marico Limited', display_name: 'Marico', supplier_type_id: 'TYP-1', supplier_type_name: 'Manufacturer',
    supplier_category_id: 'CAT-1', supplier_category_name: 'FMCG Consumables', supplier_status_id: 'STAT-1',
    supplier_status_name: 'Active', supplier_status_code: 'ACTIVE', is_active: true, is_preferred: false, is_strategic: false,
    is_approved: true, is_blocked: false, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'sales@marico.com',
    primary_phone: '+91 99223 34455', gst_number: '27AAACM4501E1Z7', pan_number: 'AAACM4501E',
    overall_rating: 4.4, risk_level: 2, created_at_utc: '2025-06-12T10:00:00Z', last_modified_at_utc: '2026-04-18T10:00:00Z', row_version: 1,
    primary_site_name: 'Mumbai HQ', primary_contact_name: 'Nitin Desai'
  },
  {
    id: 'SUP-008', company_id: 'COMP-1', company_name: 'INK FMCG', supplier_code: 'SUP-EMM',
    legal_name: 'Emami Limited', display_name: 'Emami', supplier_type_id: 'TYP-1', supplier_type_name: 'Manufacturer',
    supplier_category_id: 'CAT-1', supplier_category_name: 'FMCG Consumables', supplier_status_id: 'STAT-4',
    supplier_status_name: 'Inactive', supplier_status_code: 'INACTIVE', is_active: false, is_preferred: false, is_strategic: false,
    is_approved: true, is_blocked: false, is_blacklisted: false, is_foreign_supplier: false,
    default_currency_code: 'INR', country_id: 'IND', country_name: 'India', primary_email: 'contact@emami.in',
    primary_phone: '+91 99445 56677', gst_number: '19AAACE5601F1Z8', pan_number: 'AAACE5601F',
    overall_rating: 4.0, risk_level: 2, created_at_utc: '2025-07-20T10:00:00Z', last_modified_at_utc: '2026-01-10T10:00:00Z', row_version: 1,
    primary_site_name: 'Kolkata', primary_contact_name: 'Vikash Sen'
  }
];

export const MOCK_METRICS: SupplierDashboardMetrics = {
  total_suppliers: 8, active_suppliers: 5, preferred_suppliers: 3, strategic_suppliers: 2,
  pending_approval: 1, blocked_suppliers: 1, blacklisted_suppliers: 0, compliance_alerts: 2,
  expiring_documents: 4, avg_overall_rating: 4.3, new_this_month: 1,
  top_suppliers: [
    { id: 'SUP-002', name: 'ITC Limited', rating: 4.9, orders: 154 },
    { id: 'SUP-001', name: 'Hindustan Unilever', rating: 4.8, orders: 231 },
    { id: 'SUP-005', name: 'Amul', rating: 4.7, orders: 89 },
    { id: 'SUP-004', name: 'Britannia', rating: 4.6, orders: 112 }
  ]
};

export const MOCK_PERFORMANCE: SupplierPerformance = {
  id: 'PERF-1', supplier_id: 'SUP-001', quality_rating: 4.9, delivery_rating: 4.8, service_rating: 4.7, price_rating: 4.6, overall_rating: 4.8,
  on_time_delivery_pct: 98, defect_rate_pct: 0.5, fill_rate_pct: 99, return_rate_pct: 1.2, lead_time_days_avg: 4,
  preferred_supplier_score: 95, last_evaluation_date: '2026-06-30', next_evaluation_date: '2026-12-31',
  total_orders: 231, total_order_value: 45000000, total_returns: 4
};
