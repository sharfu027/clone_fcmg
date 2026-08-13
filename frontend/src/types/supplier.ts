// Lookup types
export interface SupplierType { id: string; code: string; name: string; }
export interface SupplierCategory { id: string; code: string; name: string; }
export interface SupplierGroup { id: string; code: string; name: string; }
export interface SupplierStatus { id: string; code: string; name: string; blocks_procurement: boolean; is_terminal: boolean; }
export interface PaymentTerms { id: string; code: string; name: string; net_days: number; }
export interface RiskRating { id: string; code: string; name: string; risk_level: number; }
export interface ComplianceStatus { id: string; code: string; name: string; }
export interface KYCStatus { id: string; code: string; name: string; is_verified: boolean; }
export interface ApprovalStatus { id: string; code: string; name: string; is_approved: boolean; }
export interface ContactRole { id: string; code: string; name: string; }
export interface SiteType { id: string; code: string; name: string; }
export interface IncotermsCode { id: string; code: string; name: string; }

// Core entities
export interface Supplier {
  id: string;
  company_id: string;
  company_name: string;
  supplier_code: string;
  legal_name: string;
  display_name: string;
  short_name?: string;
  trade_name?: string;
  supplier_type_id: string;
  supplier_type_name: string;
  supplier_category_id: string;
  supplier_category_name: string;
  supplier_group_id?: string;
  supplier_group_name?: string;
  supplier_status_id: string;
  supplier_status_name: string;
  supplier_status_code: string;
  is_active: boolean;
  is_preferred: boolean;
  is_strategic: boolean;
  is_approved: boolean;
  is_blocked: boolean;
  is_blacklisted: boolean;
  is_foreign_supplier: boolean;
  payment_terms_id?: string;
  payment_terms_name?: string;
  default_currency_code: string;
  preferred_settlement_currency?: string;
  credit_limit?: number;
  country_id: string;
  country_name: string;
  state_id?: string;
  state_name?: string;
  primary_email?: string;
  primary_phone?: string;
  website?: string;
  gst_number?: string;
  pan_number?: string;
  business_registration_number?: string;
  parent_supplier_id?: string;
  parent_supplier_name?: string;
  overall_rating?: number;
  on_time_delivery_pct?: number;
  defect_rate_pct?: number;
  compliance_status_name?: string;
  risk_rating_name?: string;
  risk_level?: number;
  kyc_status_name?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  registration_date?: string;
  approved_date?: string;
  remarks?: string;
  primary_site_name?: string;
  primary_contact_name?: string;
  primary_contact_mobile?: string;
  created_at_utc: string;
  last_modified_at_utc: string;
  row_version: number;
}

export interface SupplierSite {
  id: string;
  supplier_id: string;
  site_code: string;
  site_name: string;
  site_type_id: string;
  site_type_name: string;
  is_active: boolean;
  is_primary_site: boolean;
  is_default_procurement_site: boolean;
  is_default_billing_site: boolean;
  is_default_shipping_site: boolean;
  payment_terms_id?: string;
  payment_terms_name?: string;
  currency_code?: string;
  country_name?: string;
  state_name?: string;
  storage_capacity_sqm?: number;
  remarks?: string;
  created_at_utc: string;
}

export interface SupplierContact {
  id: string;
  supplier_id: string;
  supplier_site_id?: string;
  supplier_site_name?: string;
  contact_type_id: string;
  contact_type_name: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  designation?: string;
  department?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  is_primary: boolean;
  is_emergency: boolean;
  is_active: boolean;
  roles: ContactRole[];
}

export interface SupplierAddress {
  id: string;
  supplier_id: string;
  supplier_site_id?: string;
  address_type_id: string;
  address_type_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  district?: string;
  state_name?: string;
  country_name: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  is_primary: boolean;
  is_active: boolean;
  contact_person_name?: string;
  contact_phone?: string;
}

export interface SupplierBankAccount {
  id: string;
  supplier_id: string;
  supplier_site_id?: string;
  bank_name: string;
  bank_branch?: string;
  account_holder_name: string;
  account_number: string;
  account_type?: string;
  ifsc_code?: string;
  swift_code?: string;
  iban?: string;
  currency_code: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at_utc?: string;
  is_primary: boolean;
  is_active: boolean;
  approval_status_name?: string;
  allows_payment: boolean;
}

export interface SupplierTaxProfile {
  id: string;
  supplier_id: string;
  supplier_site_id?: string;
  gst_registration_type?: string;
  gst_registration_date?: string;
  gst_expiry_date?: string;
  is_gst_registered: boolean;
  is_gst_composition: boolean;
  is_gst_exempt: boolean;
  gst_exemption_reason?: string;
  pan_registration_date?: string;
  is_tax_exempt: boolean;
  tax_exemption_certificate?: string;
  tax_exemption_valid_from?: string;
  tax_exemption_valid_to?: string;
  tds_applicable: boolean;
  tds_section?: string;
  tds_rate_pct?: number;
  rcm_applicable: boolean;
  gst_return_frequency?: string;
}

export interface SupplierDocument {
  id: string;
  supplier_id: string;
  document_type_id: string;
  document_type_name: string;
  document_number?: string;
  document_name: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  is_expired: boolean;
  renewal_reminder_days: number;
  file_reference?: string;
  file_mime_type?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at_utc?: string;
  is_active: boolean;
}

export interface SupplierCompliance {
  id: string;
  supplier_id: string;
  approval_status_name: string;
  is_approved: boolean;
  compliance_status_name: string;
  kyc_status_name: string;
  risk_rating_name?: string;
  risk_level?: number;
  approved_by?: string;
  approved_at_utc?: string;
  approval_expiry_date?: string;
  kyc_completed_date?: string;
  kyc_expiry_date?: string;
  last_review_date?: string;
  next_review_date?: string;
  is_verified: boolean;
  esg_rating?: string;
  esg_assessment_date?: string;
  is_sanction_screened: boolean;
  sanction_screening_date?: string;
  sanction_watch_list_match: boolean;
  is_conflict_minerals_assessed: boolean;
  conflict_minerals_compliant?: boolean;
  is_rohs_compliant?: boolean;
  is_reach_compliant?: boolean;
  is_import_export_compliant: boolean;
  import_export_license_number?: string;
  import_export_license_expiry?: string;
  anti_bribery_policy_confirmed: boolean;
  gdpr_compliant?: boolean;
}

export interface SupplierPerformance {
  id: string;
  supplier_id: string;
  quality_rating?: number;
  delivery_rating?: number;
  service_rating?: number;
  price_rating?: number;
  overall_rating?: number;
  on_time_delivery_pct?: number;
  defect_rate_pct?: number;
  fill_rate_pct?: number;
  return_rate_pct?: number;
  lead_time_days_avg?: number;
  preferred_supplier_score?: number;
  last_evaluation_date?: string;
  next_evaluation_date?: string;
  total_orders: number;
  total_order_value: number;
  total_returns: number;
}

export interface SupplierCertification {
  id: string;
  supplier_id: string;
  certification_name: string;
  certification_code?: string;
  certifying_body?: string;
  certificate_number?: string;
  scope?: string;
  issue_date?: string;
  expiry_date?: string;
  is_expired: boolean;
  renewal_reminder_days: number;
  file_reference?: string;
  is_active: boolean;
}

export interface SupplierRelationship {
  id: string;
  supplier_id: string;
  related_supplier_id: string;
  related_supplier_name: string;
  relationship_type: string;
  effective_from: string;
  effective_to?: string;
  equity_stake_pct?: number;
}

export interface SupplierStatusHistoryEntry {
  id: string;
  supplier_id: string;
  supplier_status_name: string;
  effective_from: string;
  effective_to?: string;
  is_current: boolean;
  changed_by?: string;
  reason?: string;
  created_at_utc: string;
}

export interface SupplierProductCategoryApproval {
  id: string;
  supplier_id: string;
  product_category_id: string;
  product_category_name: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at_utc?: string;
  approval_expiry_date?: string;
  lead_time_days?: number;
  lead_time_min_days?: number;
  lead_time_max_days?: number;
  minimum_order_qty?: number;
  minimum_order_value?: number;
  incoterms_code?: string;
  preferred_brand?: string;
  packaging_standard?: string;
  default_delivery_site_id?: string;
  default_delivery_site_name?: string;
  quality_certification_required: boolean;
  inspection_required: boolean;
}

export interface SupplierDashboardMetrics {
  total_suppliers: number;
  active_suppliers: number;
  preferred_suppliers: number;
  strategic_suppliers: number;
  pending_approval: number;
  blocked_suppliers: number;
  blacklisted_suppliers: number;
  compliance_alerts: number;
  expiring_documents: number;
  avg_overall_rating: number;
  new_this_month: number;
  top_suppliers: Array<{ id: string; name: string; rating: number; orders: number; }>;
}

// Form types for wizard
export interface SupplierFormData {
  // Step 1: General
  company_id: string;
  supplier_code: string;
  legal_name: string;
  display_name: string;
  short_name: string;
  supplier_type_id: string;
  supplier_category_id: string;
  supplier_group_id: string;
  supplier_status_id: string;
  payment_terms_id: string;
  default_currency_code: string;
  preferred_settlement_currency: string;
  is_preferred: boolean;
  is_strategic: boolean;
  gst_number: string;
  pan_number: string;
  business_registration_number: string;
  country_id: string;
  state_id: string;
  primary_email: string;
  primary_phone: string;
  website: string;
  credit_limit: string;
  contract_start_date: string;
  contract_end_date: string;
  remarks: string;
}

export type SupplierWizardStep =
  | 'general'
  | 'sites'
  | 'contacts'
  | 'addresses'
  | 'bank-accounts'
  | 'tax-profiles'
  | 'compliance'
  | 'documents'
  | 'product-categories'
  | 'review';

export type SupplierDetailTab =
  | 'overview'
  | 'sites'
  | 'contacts'
  | 'addresses'
  | 'bank-accounts'
  | 'tax-profiles'
  | 'documents'
  | 'certifications'
  | 'compliance'
  | 'performance'
  | 'product-categories'
  | 'relationships'
  | 'status-history'
  | 'audit';

export type SupplierListView = 'list' | 'create' | 'detail' | 'edit' | 'dashboard';
