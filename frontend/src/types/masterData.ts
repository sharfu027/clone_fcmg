export interface Company {
  id: string;
  code: string;
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  status: 'Active' | 'Inactive';
}

export interface CompanyDto {
  id: string;
  code: string;
  legalName: string;
  tradeName?: string;
  taxRegistrationNumber: string;
  panNumber: string;
  cinNumber?: string;
  logoUrl?: string;
  email: string;
  phone: string;
  website?: string;
  currencyCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status?: string | number;
  isActive: boolean;
  timeZoneId?: string;
  financialYearStartMonth?: number;
  createdAtUtc: string;
  createdBy?: string;
  lastModifiedAtUtc?: string;
  lastModifiedBy?: string;
  rowVersion?: number;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  companyId: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: 'Active' | 'Inactive';
}

export interface BranchDto {
  id: string;
  companyId: string;
  companyName?: string;
  code: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isHeadquarters: boolean;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  branchId: string;
  manager: string;
  employeeCount: number;
  status: 'Active' | 'Inactive';
}

export interface DepartmentDto {
  id: string;
  branchId: string;
  branchName?: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Designation {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  level: string;
  status: 'Active' | 'Inactive';
}

export interface DesignationDto {
  id: string;
  companyId: string;
  companyName?: string;
  code: string;
  title: string;
  level: number;
  approvalLimit?: number;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  branch: string;
  status: 'Active' | 'Inactive';
}

export interface EmployeeDto {
  id: string;
  companyId: string;
  companyName?: string;
  branchId: string;
  branchName?: string;
  departmentId: string;
  departmentName?: string;
  designationId: string;
  designationTitle?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  joiningDate: string;
  salary?: number;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone?: string;
  email: string;
  balance?: number;
  creditLimit?: number;
  region?: string;
  status: 'Active' | 'Inactive';
}

export interface CustomerDto {
  id: string;
  companyId: string;
  companyName?: string;
  code: string;
  legalName: string;
  tradeName?: string;
  customerType: string;
  gstin?: string;
  pan?: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  creditLimit: number;
  creditDays: number;
  routeId?: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone?: string;
  email: string;
  balance?: number;
  paymentTerms?: string;
  category?: string;
  status: 'Active' | 'Inactive';
}

export interface SupplierDto {
  id: string;
  companyId: string;
  companyName?: string;
  code: string;
  legalName: string;
  tradeName?: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentTermsDays: number;
  creditLimit?: number;
  isActive: boolean;
  createdAtUtc: string;
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  productCount?: number;
  status: 'Active' | 'Inactive' | string;
  companyId?: string;
  companyName?: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  gstTaxRatePercent?: number;
  hsnCodeDefault?: string;
  isActive?: boolean;
  createdAtUtc?: string;
}

export type Category = ProductCategory;

export interface CategoryDto {
  id: string;
  companyId: string;
  companyName?: string;
  code: string;
  name: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  gstTaxRatePercent: number;
  hsnCodeDefault: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Brand {
  id: string;
  code: string;
  name: string;
  origin: string;
  productCount: number;
  status: 'Active' | 'Inactive';
}

export interface BrandDto {
  id: string;
  companyId: string;
  companyName?: string;
  code: string;
  name: string;
  manufacturerName?: string;
  originCountry?: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  taxRate: number;
  stockLevel: number;
  status: 'Active' | 'Inactive';
  companyId?: string;
  companyName?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  baseUomId?: string;
  baseUomCode?: string;
  sku?: string;
  barcode?: string;
  hsnCode?: string;
  gstRatePercent?: number;
  mrp?: number;
  basePrice?: number;
  minOrderQty?: number;
  shelfLifeDays?: number;
  isBatchTracked?: boolean;
  isActive?: boolean;
  createdAtUtc?: string;
}

export interface ProductDto {
  id: string;
  companyId: string;
  companyName?: string;
  categoryId: string;
  categoryName?: string;
  brandId: string;
  brandName?: string;
  baseUomId: string;
  baseUomCode?: string;
  code: string;
  name: string;
  sku: string;
  barcode?: string;
  hsnCode: string;
  gstRatePercent: number;
  mrp: number;
  basePrice: number;
  minOrderQty: number;
  shelfLifeDays?: number;
  isBatchTracked: boolean;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  baseUnit: string;
  conversionFactor: number;
  status: 'Active' | 'Inactive';
}

export interface UnitOfMeasureDto {
  id: string;
  companyId: string;
  companyName?: string;
  code: string;
  name: string;
  baseUnitCode: string;
  conversionFactor: number;
  isFractionalAllowed: boolean;
  isActive: boolean;
  createdAtUtc: string;
}

export interface Warehouse {
  id: string;
  companyId?: string;
  branchId?: string;
  branchName?: string;
  code: string;
  name: string;
  type?: string;
  warehouseType?: string;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  managerEmployeeId?: string;
  manager?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  storageAreaSqFt?: number;
  capacitySft?: number;
  palletCapacity?: number;
  cartonCapacity?: number;
  contactNumber?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  remarks?: string;
  isTemperatureControlled?: boolean;
}

export interface WarehouseDto {
  id: string;
  companyId: string;
  branchId: string;
  code: string;
  name: string;
  warehouseType: string;
  status: string;
  managerEmployeeId?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  capacitySqFt?: number;
  palletCapacity?: number;
  cartonCapacity?: number;
  contactNumber?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  remarks?: string;
  isTemperatureControlled: boolean;
  isActive: boolean;
  createdAtUtc: string;
}

export interface SalesRep {
  id: string;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email: string;
  territory?: string;
  region?: string;
  target?: number;
  monthlyTarget?: number;
  status: 'Active' | 'Inactive';
}
