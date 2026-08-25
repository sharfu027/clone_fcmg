import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Save,
  Loader2,
  User,
  Tags,
  Building,
  Users2,
  Boxes,
  Truck,
  MapPin,
  ClipboardList,
  Briefcase,
  ShieldCheck,
  Box,
  Globe,
  Table,
  Layers,
  GitFork,
  Building2,
  Mail,
  UserCheck
} from 'lucide-react';

import { 
  Product, 
  Category, 
  Brand, 
  Unit, 
  Warehouse, 
  Customer, 
  Supplier, 
  SalesRep 
} from '../types';
import * as masterDataService from '../services/masterDataService';
import { useAuth } from '../context/AuthContext';
import CompanyOrganizationHierarchy from './CompanyOrganizationHierarchy';
import ProductClassificationHierarchy from './ProductClassificationHierarchy';
import { Tooltip } from './ui/Tooltip';

const isGuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

interface MasterDataModuleProps {
  module: string;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function MasterDataModule({ module, onTriggerToast }: MasterDataModuleProps) {
  const getModuleConfig = () => {
    switch (module) {
      case 'companies':
      case 'masters/companies':
        return { name: 'Companies Master', singular: 'Company', icon: Building, endpoint: 'company' };

      case 'branches':
      case 'masters/branches':
        return { name: 'Branches Master', singular: 'Branch', icon: Building, endpoint: 'branch' };

      case 'warehouses':
      case 'masters/warehouses':
        return { name: 'Warehouses / Stockists Master', singular: 'Warehouse / Stockist', icon: Building, endpoint: 'warehouse' };

      case 'departments':
      case 'masters/departments':
        return { name: 'Departments Master', singular: 'Department', icon: Building, endpoint: 'department' };

      case 'products':
      case 'masters/products':
        return { name: 'Products SKU Master', singular: 'Product SKU', icon: Boxes, endpoint: 'product' };

      case 'categories':
      case 'masters/categories':
        return { name: 'Product Categories', singular: 'Category', icon: Tags, endpoint: 'category' };

      case 'brands':
      case 'masters/brands':
        return { name: 'Brands & Non-Brands', singular: 'Brand', icon: ClipboardList, endpoint: 'brand' };

      case 'employees':
      case 'masters/employees':
        return { name: 'Employee Roster', singular: 'Employee', icon: User, endpoint: 'employee' };

      case 'employee-roles':
      case 'masters/employee-roles':
        return { name: 'Employee Roles Master', singular: 'Employee Role', icon: UserCheck, endpoint: 'employee-role' };

      case 'designations':
      case 'masters/designations':
        return { name: 'Designations Master', singular: 'Designation', icon: Briefcase, endpoint: 'designation' };

      case 'customers':
      case 'masters/customers':
        return { name: 'Customers Directory (Retail, Wholesale, Inst, School)', singular: 'Customer', icon: Users2, endpoint: 'customer' };

      case 'suppliers':
      case 'masters/suppliers':
        return { name: 'Suppliers Directory (Individual, Community, Company)', singular: 'Supplier', icon: Truck, endpoint: 'supplier' };

      default:
        return { name: 'Master Data Registry', singular: 'Record', icon: Building, endpoint: 'company' };
    }
  };

  const config = getModuleConfig();

  const { user } = useAuth();
  const userPerms = user?.permissions || [];
  const isSuper = user?.role === 'Super Administrator' || 
                  userPerms.includes('manage:all') || 
                  (user?.email && user.email.toLowerCase().includes('superadmin'));

  const hasMasterParent = userPerms.includes('masters:manage');

  const canAccessCompany = isSuper || (hasMasterParent && userPerms.includes('masters:company'));
  const canAccessBranch = isSuper || (hasMasterParent && userPerms.includes('masters:branch'));
  const canAccessWarehouse = isSuper || (hasMasterParent && userPerms.includes('masters:warehouse'));
  const canAccessDepartment = isSuper || (hasMasterParent && userPerms.includes('masters:department'));

  const canAccessProduct = isSuper || (hasMasterParent && userPerms.includes('masters:product'));
  const canAccessCategory = isSuper || (hasMasterParent && userPerms.includes('masters:category'));
  const canAccessBrand = isSuper || (hasMasterParent && userPerms.includes('masters:brand'));
  const canAccessUnit = isSuper || (hasMasterParent && userPerms.includes('masters:unit'));

  const canAccessEmployee = isSuper || (hasMasterParent && userPerms.includes('masters:employee'));
  const canAccessEmployeeRole = isSuper || (hasMasterParent && userPerms.includes('masters:employee_role'));
  const canAccessDesignation = isSuper || (hasMasterParent && userPerms.includes('masters:designation'));
  const canAccessCustomer = isSuper || (hasMasterParent && userPerms.includes('masters:customer'));
  const canAccessSupplier = isSuper || (hasMasterParent && userPerms.includes('masters:supplier'));

  const isCurrentModuleAllowed = () => {
    if (isSuper) return true;
    if (module === 'companies' || module === 'masters/companies') {
      return canAccessCompany;
    }
    if (module === 'branches' || module === 'masters/branches') {
      return canAccessBranch;
    }
    if (module === 'warehouses' || module === 'masters/warehouses') {
      return canAccessWarehouse;
    }
    if (module === 'departments' || module === 'masters/departments') {
      return canAccessDepartment;
    }
    if (module === 'products' || module === 'masters/products') {
      return canAccessProduct;
    }
    if (module === 'categories' || module === 'masters/categories') {
      return canAccessCategory;
    }
    if (module === 'brands' || module === 'masters/brands') {
      return canAccessBrand;
    }
    if (module === 'units' || module === 'masters/units') {
      return canAccessUnit;
    }
    if (module === 'employees' || module === 'masters/employees') {
      return canAccessEmployee;
    }
    if (module === 'employee-roles' || module === 'masters/employee-roles') {
      return canAccessEmployeeRole;
    }
    if (module === 'designations' || module === 'masters/designations') {
      return canAccessDesignation;
    }
    if (module === 'customers' || module === 'masters/customers') {
      return canAccessCustomer;
    }
    if (module === 'suppliers' || module === 'masters/suppliers') {
      return canAccessSupplier;
    }
    return true;
  };

  // Master Repositories (Production Architecture: live data loaded from API)
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [dbBranches, setDbBranches] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbDesignations, setDbDesignations] = useState<any[]>([]);
  const [dbEmployeeRoles, setDbEmployeeRoles] = useState<any[]>([]);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbBrands, setDbBrands] = useState<Brand[]>([]);
  const [dbUnits, setDbUnits] = useState<Unit[]>([]);
  const [dbWarehouses, setDbWarehouses] = useState<Warehouse[]>([]);
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<Supplier[]>([]);

  // Navigation State
  const [simulatedState, setSimulatedState] = useState<'normal' | 'loading' | 'empty' | 'error' | 'denied'>('normal');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Archived' | 'Draft'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State & Errors
  const [formCode, setFormCode] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Shared Address
  const [addrLine1, setAddrLine1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');

  // 1. Company
  const [compLegalName, setCompLegalName] = useState('');
  const [compTradeName, setCompTradeName] = useState('');
  const [compGstin, setCompGstin] = useState('');
  const [compPan, setCompPan] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compCurrency, setCompCurrency] = useState('INR');
  const [compRowVersion, setCompRowVersion] = useState<number>(0);
  const [companyViewType, setCompanyViewType] = useState<'hierarchy' | 'table'>('hierarchy');
  const [hierarchySelectedCompanyId, setHierarchySelectedCompanyId] = useState<string | null>(null);

  // 2. Branch
  const [branchCompanyId, setBranchCompanyId] = useState('1');
  const [branchName, setBranchName] = useState('');
  const [branchGstin, setBranchGstin] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchIsHq, setBranchIsHq] = useState(false);

  // 3. Department
  const [deptCompanyId, setDeptCompanyId] = useState('');
  const [deptBranchId, setDeptBranchId] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // 4. Designation
  const [desigCompanyId, setDesigCompanyId] = useState('1');
  const [desigTitle, setDesigTitle] = useState('');
  const [desigLevel, setDesigLevel] = useState<number>(1);
  const [desigApprovalLimit, setDesigApprovalLimit] = useState<number>(0);

  // 4.1 Employee Role
  const [roleCompanyId, setRoleCompanyId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  // 5. UOM
  const [uomCompanyId, setUomCompanyId] = useState('1');
  const [uomName, setUomName] = useState('');
  const [uomBaseCode, setUomBaseCode] = useState('Gram');
  const [uomConversionFactor, setUomConversionFactor] = useState<number>(1000);
  const [uomIsFractional, setUomIsFractional] = useState(true);

  // 6. Brand
  const [brandCompanyId, setBrandCompanyId] = useState('1');
  const [brandName, setBrandName] = useState('');
  const [brandManufacturer, setBrandManufacturer] = useState('');
  const [brandOrigin, setBrandOrigin] = useState('India');

  // 7. Category
  const [catCompanyId, setCatCompanyId] = useState('1');
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catGstRate, setCatGstRate] = useState<number>(5);
  const [catHsnDefault, setCatHsnDefault] = useState('1006.30');

  // 8. Warehouse
  const [whCompanyId, setWhCompanyId] = useState('');
  const [whBranchId, setWhBranchId] = useState('');
  const [whName, setWhName] = useState('');
  const [whType, setWhType] = useState('Central Warehouse');
  const [whStatus, setWhStatus] = useState<'Active' | 'Inactive' | 'Under Maintenance'>('Active');
  const [whAddrLine1, setWhAddrLine1] = useState('');
  const [whAddrLine2, setWhAddrLine2] = useState('');
  const [whCity, setWhCity] = useState('');
  const [whState, setWhState] = useState('');
  const [whCountry, setWhCountry] = useState('India');
  const [whPostalCode, setWhPostalCode] = useState('');
  const [whStorageAreaSqFt, setWhStorageAreaSqFt] = useState<number | ''>(150000);
  const [whPalletCapacity, setWhPalletCapacity] = useState<number | ''>(5000);
  const [whCartonCapacity, setWhCartonCapacity] = useState<number | ''>(50000);
  const [whManagerEmployeeId, setWhManagerEmployeeId] = useState('');
  const [whContactNumber, setWhContactNumber] = useState('');
  const [whEmail, setWhEmail] = useState('');
  const [whLatitude, setWhLatitude] = useState<number | ''>('');
  const [whLongitude, setWhLongitude] = useState<number | ''>('');
  const [whRemarks, setWhRemarks] = useState('');
  const [whTempControl, setWhTempControl] = useState(false);

  // 9. Product
  const [prodCompanyId, setProdCompanyId] = useState('1');
  const [prodParentCategoryId, setProdParentCategoryId] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [isLegacyRootCategoryProduct, setIsLegacyRootCategoryProduct] = useState(false);
  const [prodBrandId, setProdBrandId] = useState('1');
  const [prodBaseUomId, setProdBaseUomId] = useState('1');
  const [prodName, setProdName] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodHsnCode, setProdHsnCode] = useState('1006.30');
  const [prodGstRate, setProdGstRate] = useState<number>(5);
  const [prodMrp, setProdMrp] = useState<number>(750);
  const [prodBasePrice, setProdBasePrice] = useState<number>(650);
  const [prodMinOrderQty, setProdMinOrderQty] = useState<number>(1);
  const [prodShelfLifeDays, setProdShelfLifeDays] = useState<number>(365);
  const [prodIsBatchTracked, setProdIsBatchTracked] = useState(true);
  const [productViewType, setProductViewType] = useState<'hierarchy' | 'table'>('hierarchy');
  const [hierarchySelectedProductId, setHierarchySelectedProductId] = useState<string | null>(null);

  // Quick-Add toggles for Product form
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [showQuickAddBrand, setShowQuickAddBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [showQuickAddUom, setShowQuickAddUom] = useState(false);
  const [newUomInput, setNewUomInput] = useState('');
  const [showQuickAddBranch, setShowQuickAddBranch] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showQuickAddDept, setShowQuickAddDept] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [showQuickAddDesig, setShowQuickAddDesig] = useState(false);
  const [newDesigInput, setNewDesigInput] = useState('');

  // Business Partner Role
  const [partnerRole, setPartnerRole] = useState<'Customer' | 'Supplier' | 'Both'>('Customer');

  // 10. Supplier
  const [suppCompanyId, setSuppCompanyId] = useState('');
  const [suppLegalName, setSuppLegalName] = useState('');
  const [suppTradeName, setSuppTradeName] = useState('');
  const [suppType, setSuppType] = useState('Distributor / Stockist');
  const [suppContactPerson, setSuppContactPerson] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppGstin, setSuppGstin] = useState('');
  const [suppPan, setSuppPan] = useState('');
  const [suppPaymentTermsDays, setSuppPaymentTermsDays] = useState<number>(30);
  const [suppAddrLine1, setSuppAddrLine1] = useState('');
  const [suppAddrLine2, setSuppAddrLine2] = useState('');
  const [suppCity, setSuppCity] = useState('');
  const [suppState, setSuppState] = useState('');
  const [suppPostalCode, setSuppPostalCode] = useState('');
  const [suppCountry, setSuppCountry] = useState('India');

  // 11. Customer
  const [custCompanyId, setCustCompanyId] = useState('');
  const [custLegalName, setCustLegalName] = useState('');
  const [custTradeName, setCustTradeName] = useState('');
  const [custType, setCustType] = useState('Retailer');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custGstin, setCustGstin] = useState('');
  const [custPan, setCustPan] = useState('');
  const [custAddrLine1, setCustAddrLine1] = useState('');
  const [custAddrLine2, setCustAddrLine2] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custState, setCustState] = useState('');
  const [custPostalCode, setCustPostalCode] = useState('');
  const [custCountry, setCustCountry] = useState('India');
  const [custCreditLimit, setCustCreditLimit] = useState<number>(50000);
  const [custCreditDays, setCustCreditDays] = useState<number>(30);
  const [custSalesRouteId, setCustSalesRouteId] = useState('');

  // 12. Employee
  const [empCompanyId, setEmpCompanyId] = useState('');
  const [empBranchId, setEmpBranchId] = useState('');
  const [empDepartmentId, setEmpDepartmentId] = useState('');
  const [empWarehouseId, setEmpWarehouseId] = useState('');
  const [empRoleId, setEmpRoleId] = useState('');
  const [empDesignationId, setEmpDesignationId] = useState('');
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [empSalary, setEmpSalary] = useState<number | string>('');

  // Guard Company Read-Only Access for Non-Super Admins
  useEffect(() => {
    if (!isSuper && (module === 'companies' || module === 'masters/companies')) {
      if (mode === 'create' || mode === 'edit') {
        setMode('list');
        onTriggerToast('warning', 'Read-Only Company Profile', 'Standard Administrators have view-only access to Company profiles.');
      }
    }
  }, [mode, isSuper, module, onTriggerToast]);

  useEffect(() => {
    setMode('list');
    setSelectedId(null);
    setSearchQuery('');
    setFormErrors({});

    if (module === 'suppliers' || module === 'masters/suppliers') {
      setPartnerRole('Supplier');
    } else if (module === 'customers' || module === 'masters/customers') {
      setPartnerRole('Customer');
    }

    async function loadLiveData() {
      if (!isCurrentModuleAllowed()) {
        setSimulatedState('denied');
        return;
      }
      setSimulatedState('loading');
      try {
        const queryParams = { search: searchQuery || undefined, status: statusFilter !== 'All' ? statusFilter : undefined };
        let apiData;
        
        // Ensure parent companies are loaded for child dropdowns
        if (dbCompanies.length === 0) {
          try {
            const comps = await masterDataService.fetchCompanies({});
            const items = Array.isArray(comps) ? comps : (comps && Array.isArray(comps.items) ? comps.items : []);
            const mapped = items.map((c: any) => ({
              id: c.id, code: c.code, legalName: c.legalName, tradeName: c.tradeName || c.legalName,
              gstin: c.taxRegistrationNumber || '', pan: c.panNumber || '', email: c.email, phone: c.phone,
              currency: c.currencyCode || 'INR', status: typeof c.status === 'number' ? (c.status === 1 ? 'Active' : c.status === 2 ? 'Archived' : 'Draft') : (c.status || 'Active'),
              addressLine1: c.addressLine1 || '', city: c.city || '', state: c.state || '', postalCode: c.postalCode || '', country: c.country || 'India', rowVersion: c.rowVersion
            }));
            setDbCompanies(mapped);
            if (mapped[0]?.id) {
              setBranchCompanyId(mapped[0].id);
              setDesigCompanyId(mapped[0].id);
              setEmpCompanyId(mapped[0].id);
              setWhCompanyId(mapped[0].id);
            }
          } catch (e) {}
        }

        // Ensure live branches are loaded for warehouse & child dropdowns
        try {
          const brRes = await masterDataService.fetchBranches({});
          const brItems = Array.isArray(brRes) ? brRes : (brRes && Array.isArray(brRes.items) ? brRes.items : []);
          const mappedBranches = brItems.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, companyId: x.companyId, companyName: x.companyName || '',
            gstin: x.taxRegistrationNumber || x.gstin || '', phone: x.phone || '', email: x.email || '', isHeadquarters: x.isHeadquarters || false,
            addressLine1: x.addressLine1 || '', city: x.city || '', state: x.state || '', postalCode: x.postalCode || '', country: x.country || 'India',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          }));
          setDbBranches(mappedBranches);
          if (mappedBranches[0]?.id && (!whBranchId || !mappedBranches.some((b: any) => b.id === whBranchId))) {
            setWhBranchId(mappedBranches[0].id);
          }
        } catch (e) {}

        // Ensure live employees are loaded for manager dropdowns
        try {
          const empRes = await masterDataService.fetchEmployees({});
          const empItems = Array.isArray(empRes) ? empRes : (empRes && Array.isArray(empRes.items) ? empRes.items : []);
          const mappedEmployees = empItems.map((x: any) => ({
            id: x.id, employeeCode: x.code || x.employeeCode, firstName: x.firstName, lastName: x.lastName, email: x.email, phone: x.phone,
            joiningDate: x.joiningDate, salary: x.salary, companyId: x.companyId, branchId: x.branchId, departmentId: x.departmentId, designationId: x.designationId,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          }));
          setDbEmployees(mappedEmployees);
        } catch (e) {}
        
                if (module === 'companies' || module === 'masters/companies') {
          apiData = await masterDataService.fetchCompanies(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          const mappedCompanies = items.map((c: any) => ({
            id: c.id, code: c.code, legalName: c.legalName, tradeName: c.tradeName || c.legalName,
            gstin: c.taxRegistrationNumber || c.gstin || '', pan: c.panNumber || c.pan || '', email: c.email, phone: c.phone,
            currency: c.currencyCode || 'INR', status: typeof c.status === 'number' ? (c.status === 1 ? 'Active' : c.status === 2 ? 'Archived' : 'Draft') : (c.status || 'Active'),
            addressLine1: c.addressLine1 || '', city: c.city || '', state: c.state || '', postalCode: c.postalCode || '', country: c.country || 'India', rowVersion: c.rowVersion
          }));
          setDbCompanies(mappedCompanies);
          if (mappedCompanies.length > 0 && !hierarchySelectedCompanyId) {
            setHierarchySelectedCompanyId(mappedCompanies[0].id);
          }

          // In parallel, ensure branches, warehouses, and departments are loaded for Organization Hierarchy Tree
          try {
            const [brRes, whRes, dpRes] = await Promise.all([
              masterDataService.fetchBranches({ pageSize: 100 }),
              masterDataService.fetchWarehouses({ pageSize: 100 }),
              masterDataService.fetchDepartments({ pageSize: 100 })
            ]);
            const extractList = (res: any): any[] => {
              if (!res) return [];
              if (Array.isArray(res)) return res;
              if (Array.isArray(res.items)) return res.items;
              if (Array.isArray(res.data)) return res.data;
              if (Array.isArray(res.value)) return res.value;
              return [];
            };
            const brList = extractList(brRes);
            const whList = extractList(whRes);
            const dpList = extractList(dpRes);

            setDbBranches(brList.map((x: any) => ({
              id: x.id, code: x.code, name: x.name, companyId: x.companyId, companyName: x.companyName || '',
              gstin: x.taxRegistrationNumber || x.gstin || '', phone: x.phone || '', email: x.email || '', isHeadquarters: x.isHeadquarters || false,
              addressLine1: x.addressLine1 || '', city: x.city || '', state: x.state || '', postalCode: x.postalCode || '', country: x.country || 'India',
              status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
            })));
            setDbWarehouses(whList.map((x: any) => ({
              id: x.id,
              companyId: x.companyId,
              companyName: x.companyName || '',
              branchId: x.branchId || null,
              branchName: x.branchName || '',
              code: x.code,
              name: x.name,
              warehouseType: x.warehouseType || 'Central Warehouse',
              city: x.city || '',
              state: x.state || '',
              status: x.status || (x.isActive ? 'Active' : 'Inactive')
            })));
            setDbDepartments(dpList.map((x: any) => ({
              id: x.id,
              companyId: x.companyId,
              companyName: x.companyName || '',
              branchId: x.branchId || null,
              branchName: x.branchName || '',
              code: x.code,
              name: x.name,
              description: x.description || '',
              status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
            })));
          } catch (e) {}

          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'branches' || module === 'masters/branches') {
          apiData = await masterDataService.fetchBranches(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbBranches(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, companyId: x.companyId, companyName: x.companyName || '',
            gstin: x.taxRegistrationNumber || '', phone: x.phone, email: x.email, isHeadquarters: x.isHeadquarters || false,
            addressLine1: x.addressLine1 || '', city: x.city || '', state: x.state || '', postalCode: x.postalCode || '', country: x.country || 'India',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'departments' || module === 'masters/departments') {
          apiData = await masterDataService.fetchDepartments(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbDepartments(items.map((x: any) => ({
            id: x.id,
            companyId: x.companyId,
            companyName: x.companyName || '',
            branchId: x.branchId || null,
            branchName: x.branchName || '',
            code: x.code,
            name: x.name,
            description: x.description || '',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          try {
            const [compRes, brRes] = await Promise.all([
              masterDataService.fetchCompanies({ pageSize: 100 }),
              masterDataService.fetchBranches({ pageSize: 100 })
            ]);
            const extractList = (res: any): any[] => {
              if (!res) return [];
              if (Array.isArray(res)) return res;
              if (Array.isArray(res.items)) return res.items;
              if (Array.isArray(res.data)) return res.data;
              if (Array.isArray(res.value)) return res.value;
              return [];
            };
            const compList = extractList(compRes);
            const brList = extractList(brRes);
            setDbCompanies(compList);
            setDbBranches(brList);
            if (compList[0]?.id && !isGuid(deptCompanyId)) {
              setDeptCompanyId(compList[0].id);
            }
          } catch (e) {}
        } else if (module === 'employee-roles' || module === 'masters/employee-roles') {
          apiData = await masterDataService.fetchEmployeeRoles(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbEmployeeRoles(items.map((x: any) => ({
            id: x.id,
            code: x.code,
            name: x.name,
            description: x.description || '',
            companyId: x.companyId,
            companyName: x.companyName || '',
            isActive: x.isActive ?? (x.status === 'Active' || x.status === 1),
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || (x.isActive === false ? 'Archived' : 'Active')),
            createdAtUtc: x.createdAtUtc
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          try {
            const compRes = await masterDataService.fetchCompanies({ pageSize: 100 });
            const extractList = (res: any): any[] => {
              if (!res) return [];
              if (Array.isArray(res)) return res;
              if (Array.isArray(res.items)) return res.items;
              if (Array.isArray(res.data)) return res.data;
              if (Array.isArray(res.value)) return res.value;
              return [];
            };
            const compList = extractList(compRes);
            setDbCompanies(compList);
            if (compList[0]?.id && !isGuid(roleCompanyId)) {
              setRoleCompanyId(compList[0].id);
            }
          } catch (e) {}
        } else if (module === 'designations' || module === 'masters/designations') {
          apiData = await masterDataService.fetchDesignations(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbDesignations(items.map((x: any) => ({
            id: x.id, code: x.code, title: x.title, level: x.level, approvalLimit: x.approvalLimit, companyId: x.companyId, companyName: x.companyName || dbCompanies.find(c => c.id === x.companyId)?.legalName || dbCompanies.find(c => c.id === x.companyId)?.name || '',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          try {
            const compRes = await masterDataService.fetchCompanies({ pageSize: 100 });
            const extractList = (res: any): any[] => {
              if (!res) return [];
              if (Array.isArray(res)) return res;
              if (Array.isArray(res.items)) return res.items;
              if (Array.isArray(res.data)) return res.data;
              if (Array.isArray(res.value)) return res.value;
              return [];
            };
            const compList = extractList(compRes);
            setDbCompanies(compList);
          } catch (e) {}
        } else if (module === 'employees' || module === 'masters/employees') {
          apiData = await masterDataService.fetchEmployees(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbEmployees(items.map((x: any) => ({
            id: x.id,
            companyId: x.companyId,
            companyName: x.companyName || dbCompanies.find(c => c.id === x.companyId)?.legalName || '',
            branchId: x.branchId,
            branchName: x.branchName || dbBranches.find(b => b.id === x.branchId)?.name || '',
            departmentId: x.departmentId,
            departmentName: x.departmentName || dbDepartments.find(d => d.id === x.departmentId)?.name || '',
            warehouseId: x.warehouseId,
            warehouseName: x.warehouseName || dbWarehouses.find(w => w.id === x.warehouseId)?.name || '',
            warehouseCode: x.warehouseCode || '',
            designationId: x.designationId,
            designationTitle: x.designationTitle || dbDesignations.find(d => d.id === x.designationId)?.title || '',
            employeeRoleId: x.employeeRoleId,
            employeeRoleName: x.employeeRoleName || dbEmployeeRoles.find(r => r.id === x.employeeRoleId)?.name || '',
            employeeCode: x.employeeCode || x.code,
            code: x.employeeCode || x.code,
            firstName: x.firstName || '',
            lastName: x.lastName || '',
            fullName: x.fullName || `${x.firstName || ''} ${x.lastName || ''}`.trim(),
            name: x.fullName || `${x.firstName || ''} ${x.lastName || ''}`.trim(),
            email: x.email || '',
            phone: x.phone || '',
            joiningDate: x.joiningDate,
            salary: x.salary ?? undefined,
            isActive: x.isActive ?? (x.status === 'Active' || x.status === 1),
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active'),
            createdAtUtc: x.createdAtUtc
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          try {
            const [compRes, brRes, dpRes, desRes, roleRes, whRes] = await Promise.all([
              masterDataService.fetchCompanies({ pageSize: 100 }),
              masterDataService.fetchBranches({ pageSize: 100 }),
              masterDataService.fetchDepartments({ pageSize: 100 }),
              masterDataService.fetchDesignations({ pageSize: 100 }),
              masterDataService.fetchEmployeeRoles({ pageSize: 100 }),
              masterDataService.fetchWarehouses({ pageSize: 100 })
            ]);
            const extractList = (res: any): any[] => {
              if (!res) return [];
              if (Array.isArray(res)) return res;
              if (Array.isArray(res.items)) return res.items;
              if (Array.isArray(res.data)) return res.data;
              if (Array.isArray(res.value)) return res.value;
              return [];
            };
            const compList = extractList(compRes);
            const brList = extractList(brRes);
            const dpList = extractList(dpRes);
            const desList = extractList(desRes);
            const roleList = extractList(roleRes);
            const whList = extractList(whRes);

            setDbCompanies(compList);
            setDbBranches(brList);
            setDbDepartments(dpList);
            setDbDesignations(desList);
            setDbEmployeeRoles(roleList);
            setDbWarehouses(whList);
          } catch (e) {}
        } else if (module === 'products' || module === 'masters/products') {
          apiData = await masterDataService.fetchProducts(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbProducts(items.map((x: any) => ({
            id: x.id,
            companyId: x.companyId || '',
            companyName: x.companyName || '',
            categoryId: x.categoryId || '',
            categoryName: x.categoryName || x.category || '',
            parentCategoryId: x.parentCategoryId || null,
            parentCategoryName: x.parentCategoryName || '',
            brandId: x.brandId || '',
            brandName: x.brandName || x.brand || '',
            baseUomId: x.baseUomId || '',
            baseUomCode: x.baseUomCode || x.uomCode || x.unit || 'PCS',
            code: x.code,
            name: x.name,
            sku: x.sku || x.code,
            barcode: x.barcode || '',
            hsnCode: x.hsnCode || '1006.30',
            gstRatePercent: x.gstRatePercent ?? x.taxRate ?? 5,
            mrp: x.mrp ?? 0,
            basePrice: x.basePrice ?? x.price ?? 0,
            minOrderQty: x.minOrderQty ?? 1,
            shelfLifeDays: x.shelfLifeDays ?? 365,
            isBatchTracked: x.isBatchTracked ?? true,
            category: x.categoryName || x.category || '',
            brand: x.brandName || x.brand || '',
            unit: x.baseUomCode || x.uomCode || x.unit || 'PCS',
            price: x.basePrice ?? x.price ?? 0,
            taxRate: x.gstRatePercent ?? x.taxRate ?? 5,
            stockLevel: x.stockLevel || 0,
            isActive: x.isActive ?? true,
            status: x.isActive === true ? 'Active' : x.isActive === false ? 'Inactive' : (typeof x.status === 'number' ? (x.status === 1 ? 'Active' : 'Inactive') : (x.status || 'Active')),
            createdAtUtc: x.createdAtUtc
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          // Ensure companies, categories, brands, and units are loaded for product form dropdowns
          try {
            const [comps, cats, brnds, uoms] = await Promise.all([
              masterDataService.fetchCompanies({ pageSize: 100 }),
              masterDataService.fetchCategories({ pageSize: 100 }),
              masterDataService.fetchBrands({ pageSize: 100 }),
              masterDataService.fetchUnitsOfMeasure({ pageSize: 100 })
            ]);
            const compList = Array.isArray(comps) ? comps : (comps && Array.isArray(comps.items) ? comps.items : []);
            const catList = Array.isArray(cats) ? cats : (cats && Array.isArray(cats.items) ? cats.items : []);
            const brandList = Array.isArray(brnds) ? brnds : (brnds && Array.isArray(brnds.items) ? brnds.items : []);
            const uomList = Array.isArray(uoms) ? uoms : (uoms && Array.isArray(uoms.items) ? uoms.items : []);
            
            setDbCompanies(compList);
            if (compList[0]?.id && !isGuid(prodCompanyId)) setProdCompanyId(compList[0].id);

            setDbCategories(catList.map((x: any) => ({ 
              id: x.id, 
              code: x.code, 
              name: x.name, 
              parentCategoryId: x.parentCategoryId || null, 
              parentCategoryName: x.parentCategoryName || '', 
              companyId: x.companyId || '', 
              description: x.description || '', 
              productCount: x.productCount || 0, 
              status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : 'Draft') : (x.status || 'Active') 
            })));

            setDbBrands(brandList.map((x: any) => ({ id: x.id, code: x.code, name: x.name, origin: x.origin || '', productCount: x.productCount || 0, status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : 'Draft') : (x.status || 'Active') })));

            setDbUnits(uomList.map((x: any) => ({ id: x.id, code: x.code, name: x.name, baseUnit: x.baseUnitCode || x.baseUnit || '', conversionFactor: x.conversionFactor || 1, status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : 'Draft') : (x.status || 'Active') })));
            if (uomList[0]?.id && !isGuid(prodBaseUomId)) setProdBaseUomId(uomList[0].id);
          } catch (e) {}
        } else if (module === 'categories' || module === 'masters/categories') {
          apiData = await masterDataService.fetchCategories(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbCategories(items.map((x: any) => ({
            id: x.id,
            companyId: x.companyId,
            companyName: x.companyName || dbCompanies.find(c => c.id === x.companyId)?.legalName || '',
            code: x.code,
            name: x.name,
            parentCategoryId: x.parentCategoryId || null,
            parentCategoryName: x.parentCategoryName || '',
            gstTaxRatePercent: x.gstTaxRatePercent ?? 5,
            hsnCodeDefault: x.hsnCodeDefault || '1006.30',
            description: x.hsnCodeDefault || '',
            productCount: x.productCount || 0,
            isActive: x.isActive ?? (x.status === 'Active' || x.status === 1),
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          // Ensure companies are loaded for Category parent company dropdown
          try {
            const compRes = await masterDataService.fetchCompanies({ pageSize: 100 });
            const compList = Array.isArray(compRes) ? compRes : (compRes && Array.isArray(compRes.items) ? compRes.items : []);
            setDbCompanies(compList);
            if (compList[0]?.id && !isGuid(catCompanyId)) {
              setCatCompanyId(compList[0].id);
            }
          } catch (e) {}
        } else if (module === 'brands' || module === 'masters/brands') {
          apiData = await masterDataService.fetchBrands(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbBrands(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, origin: x.origin || '', productCount: x.productCount || 0,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'units' || module === 'masters/units') {
          apiData = await masterDataService.fetchUnitsOfMeasure(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbUnits(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, baseUnit: x.baseUnitCode || x.baseUnit || '', conversionFactor: x.conversionFactor || 1,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'warehouses' || module === 'masters/warehouses') {
          apiData = await masterDataService.fetchWarehouses(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbWarehouses(items.map((x: any) => ({
            id: x.id,
            companyId: x.companyId,
            branchId: x.branchId,
            branchName: x.branchName || dbBranches.find(b => b.id === x.branchId)?.name || 'Main Branch',
            code: x.code,
            name: x.name,
            warehouseType: x.warehouseType || 'Central Warehouse',
            status: x.status || (x.isActive ? 'Active' : 'Inactive'),
            managerEmployeeId: x.managerEmployeeId,
            manager: dbEmployees.find(e => e.id === x.managerEmployeeId) ? `${dbEmployees.find(e => e.id === x.managerEmployeeId)?.firstName} ${dbEmployees.find(e => e.id === x.managerEmployeeId)?.lastName}` : (x.managerName || 'N/A'),
            addressLine1: x.addressLine1 || '',
            addressLine2: x.addressLine2 || '',
            city: x.city || '',
            state: x.state || '',
            postalCode: x.postalCode || '',
            country: x.country || 'India',
            storageAreaSqFt: x.capacitySqFt || x.storageAreaSqFt || x.capacitySft || 0,
            capacitySft: x.capacitySqFt || x.storageAreaSqFt || x.capacitySft || 0,
            palletCapacity: x.palletCapacity,
            cartonCapacity: x.cartonCapacity,
            contactNumber: x.contactNumber,
            email: x.email,
            latitude: x.latitude,
            longitude: x.longitude,
            remarks: x.remarks,
            isTemperatureControlled: x.isTemperatureControlled || false
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'customers' || module === 'masters/customers') {
          apiData = await masterDataService.fetchCustomers(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbCustomers(items.map((x: any) => ({
            id: x.id,
            companyId: x.companyId,
            companyName: x.companyName || dbCompanies.find(c => c.id === x.companyId)?.legalName || '',
            code: x.code,
            name: x.legalName || x.name,
            legalName: x.legalName || x.name,
            tradeName: x.tradeName || '',
            customerType: x.customerType || 'Retailer',
            gstin: x.gstin || '',
            pan: x.pan || '',
            email: x.email || '',
            phone: x.phone || x.contact || '',
            contact: x.phone || x.contact || '',
            addressLine1: x.addressLine1 || '',
            addressLine2: x.addressLine2 || '',
            city: x.city || '',
            state: x.state || '',
            postalCode: x.postalCode || '',
            country: x.country || 'India',
            creditLimit: x.creditLimit ?? 50000,
            balance: x.creditLimit ?? 50000,
            creditDays: x.creditDays ?? 30,
            routeId: x.routeId,
            isActive: x.isActive ?? (x.status === 'Active' || x.status === 1),
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active'),
            createdAtUtc: x.createdAtUtc
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          try {
            const compRes = await masterDataService.fetchCompanies({ pageSize: 100 });
            const compList = Array.isArray(compRes) ? compRes : (compRes && Array.isArray(compRes.items) ? compRes.items : []);
            setDbCompanies(compList);
            if (compList[0]?.id && !isGuid(custCompanyId)) {
              setCustCompanyId(compList[0].id);
            }
          } catch (e) {}
        } else if (module === 'suppliers' || module === 'masters/suppliers') {
          apiData = await masterDataService.fetchSuppliers(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbSuppliers(items.map((x: any) => ({
            id: x.id,
            companyId: x.companyId,
            companyName: x.companyName || dbCompanies.find(c => c.id === x.companyId)?.legalName || '',
            code: x.code,
            name: x.legalName || x.name || '',
            legalName: x.legalName || x.name || '',
            tradeName: x.tradeName || '',
            supplierType: x.supplierType || 'Distributor / Stockist',
            gstin: x.gstin || '',
            pan: x.pan || '',
            contact: x.phone || x.contact || '',
            phone: x.phone || x.contact || '',
            email: x.email || '',
            paymentTermsDays: x.paymentTermsDays ?? 30,
            balance: x.creditLimit || x.balance || 0,
            addressLine1: x.addressLine1 || '',
            addressLine2: x.addressLine2 || '',
            city: x.city || '',
            state: x.state || '',
            postalCode: x.postalCode || '',
            country: x.country || 'India',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          try {
            const compRes = await masterDataService.fetchCompanies({ pageSize: 100 });
            const extractList = (res: any): any[] => {
              if (!res) return [];
              if (Array.isArray(res)) return res;
              if (Array.isArray(res.items)) return res.items;
              if (Array.isArray(res.data)) return res.data;
              if (Array.isArray(res.value)) return res.value;
              return [];
            };
            const compList = extractList(compRes);
            setDbCompanies(compList);
            if (compList[0]?.id && !isGuid(suppCompanyId)) {
              setSuppCompanyId(compList[0].id);
            }
          } catch (e) {}
        } else {
           setSimulatedState('normal');
        }
      } catch (err: any) {
        setSimulatedState('normal');
      }
    }
    loadLiveData();
  }, [module, refreshTrigger]);

  const populateForm = (id: string) => {
    setFormErrors({});
    if (module === 'companies' || module === 'masters/companies') {
      const x = dbCompanies.find(c => c.id === id);
      if (x) {
        setFormCode(x.code);
        setCompLegalName(x.legalName || '');
        setCompTradeName(x.tradeName || '');
        // API returns taxRegistrationNumber (not gstin) and panNumber (not pan)
        setCompGstin((x.taxRegistrationNumber || x.gstin || '').toUpperCase());
        setCompPan((x.panNumber || x.pan || '').toUpperCase());
        setCompEmail(x.email || '');
        setCompPhone(x.phone || '');
        setCompCurrency(x.currencyCode || x.currency || 'INR');
        // Map numeric status enum: 1=Active, 2=Archived, 0=Draft
        const rawStatus = x.status;
        let mappedStatus: 'Active' | 'Inactive' = 'Active';
        if (typeof rawStatus === 'number') {
          mappedStatus = rawStatus === 1 ? 'Active' : 'Active';
        } else if (typeof rawStatus === 'string') {
          mappedStatus = (rawStatus === 'Active') ? 'Active' : 'Active';
        }
        setFormStatus(mappedStatus);
        setAddrLine1(x.addressLine1 || '');
        setAddrCity(x.city || '');
        setAddrState(x.state || '');
        setAddrPostalCode(x.postalCode || '');
        setAddrCountry(x.country || 'India');
        // Optimistic concurrency token — critical for PUT to succeed
        setCompRowVersion(x.rowVersion ?? 0);
      }
    } else if (module === 'branches' || module === 'masters/branches') {
      const x = dbBranches.find(b => b.id === id);
      if (x) {
        setFormCode(x.code); setBranchName(x.name); setBranchCompanyId(x.companyId); setBranchGstin(x.gstin); setBranchPhone(x.phone);
        setBranchEmail(x.email); setBranchIsHq(x.isHeadquarters); setFormStatus(x.status as any);
        setAddrLine1(x.addressLine1); setAddrCity(x.city); setAddrState(x.state); setAddrPostalCode(x.postalCode); setAddrCountry(x.country);
      }
    } else if (module === 'departments' || module === 'masters/departments') {
      const x = dbDepartments.find(d => d.id === id);
      if (x) {
        setFormCode(x.code);
        setDeptName(x.name);
        setDeptCompanyId(x.companyId || (dbCompanies[0]?.id || ''));
        setDeptBranchId(x.branchId || '');
        setDeptDesc(x.description || '');
        setFormStatus(x.status as any);
        setFormErrors({});
      }
    } else if (module === 'employee-roles' || module === 'masters/employee-roles') {
      const x = dbEmployeeRoles.find(r => r.id === id);
      if (x) {
        setFormCode(x.code);
        setRoleName(x.name);
        setRoleDesc(x.description || '');
        setRoleCompanyId(x.companyId || (dbCompanies[0]?.id || ''));
        setFormStatus(x.status as any);
        setFormErrors({});
      }
    } else if (module === 'designations' || module === 'masters/designations') {
      const x = dbDesignations.find(d => d.id === id);
      if (x) {
        setFormCode(x.code); setDesigTitle(x.title); setDesigCompanyId(x.companyId); setDesigLevel(x.level); setDesigApprovalLimit(x.approvalLimit); setFormStatus(x.status as any);
      }
    } else if (module === 'employees' || module === 'masters/employees') {
      const x = dbEmployees.find(e => e.id === id);
      if (x) {
        setFormCode(x.employeeCode || x.code || '');
        setEmpCompanyId(x.companyId || (dbCompanies[0]?.id || ''));
        setEmpBranchId(x.branchId || '');
        setEmpDepartmentId(x.departmentId || '');
        setEmpWarehouseId(x.warehouseId || '');
        setEmpRoleId(x.employeeRoleId || '');
        setEmpDesignationId(x.designationId || '');
        setEmpFirstName(x.firstName || '');
        setEmpLastName(x.lastName || '');
        setEmpEmail(x.email || '');
        setEmpPhone(x.phone || '');
        setEmpJoiningDate(x.joiningDate ? x.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0]);
        setEmpSalary(x.salary !== undefined && x.salary !== null ? x.salary : '');
        setFormStatus((x.status as any) || (x.isActive ? 'Active' : 'Inactive'));
        setFormErrors({});
      }
    } else if (module === 'products' || module === 'masters/products') {
      const x = dbProducts.find(p => p.id === id);
      if (x) {
        setFormCode(x.code);
        setProdName(x.name);
        setProdCompanyId(x.companyId || (dbCompanies[0]?.id || ''));

        // Product Category (any depth in Category Tree)
        setProdCategoryId(x.categoryId || '');
        setProdParentCategoryId(x.parentCategoryId || '');

        setProdBrandId(x.brandId || '');
        setProdBaseUomId(x.baseUomId || '');
        setProdBarcode(x.barcode || '');
        setProdHsnCode(x.hsnCode || '1006.30');
        setProdMrp(x.mrp ?? 0);
        setProdBasePrice(x.basePrice ?? x.price ?? 0);
        setProdGstRate(x.gstRatePercent ?? x.taxRate ?? 5);
        setProdMinOrderQty(x.minOrderQty ?? 1);
        setProdShelfLifeDays(x.shelfLifeDays ?? 365);
        setProdIsBatchTracked(x.isBatchTracked ?? true);
        setFormStatus((x.status as any) || (x.isActive ? 'Active' : 'Inactive'));
        setFormErrors({});
      }
    } else if (module === 'categories' || module === 'masters/categories') {
      const x = dbCategories.find(c => c.id === id);
      if (x) {
        setFormCode(x.code);
        setCatName(x.name);
        setCatCompanyId(x.companyId || (dbCompanies[0]?.id || ''));
        setCatParentId(x.parentCategoryId || '');
        setCatGstRate(x.gstTaxRatePercent ?? 5);
        setCatHsnDefault(x.hsnCodeDefault || x.description || '1006.30');
        setFormStatus((x.status as any) || (x.isActive ? 'Active' : 'Inactive'));
        setFormErrors({});
      }
    } else if (module === 'brands' || module === 'masters/brands') {
      const x = dbBrands.find(b => b.id === id);
      if (x) {
        setFormCode(x.code); setBrandName(x.name); setBrandOrigin(x.origin); setFormStatus(x.status as any);
      }
    } else if (module === 'units' || module === 'masters/units') {
      const x = dbUnits.find(u => u.id === id);
      if (x) {
        setFormCode(x.code); setUomName(x.name); setUomBaseCode(x.baseUnit); setUomConversionFactor(x.conversionFactor); setFormStatus(x.status as any);
      }
    } else if (module === 'warehouses' || module === 'masters/warehouses') {
      const x = dbWarehouses.find(w => w.id === id);
      if (x) {
        setFormCode(x.code);
        setWhName(x.name);
        setWhCompanyId(x.companyId || '');
        setWhBranchId(x.branchId || '');
        setWhType(x.warehouseType || 'Central Warehouse');
        setWhStatus((x.status as any) || 'Active');
        setWhManagerEmployeeId(x.managerEmployeeId || '');
        setWhAddrLine1(x.addressLine1 || '');
        setWhAddrLine2(x.addressLine2 || '');
        setWhCity(x.city || '');
        setWhState(x.state || '');
        setWhCountry(x.country || 'India');
        setWhPostalCode(x.postalCode || '');
        setWhStorageAreaSqFt(x.storageAreaSqFt || x.capacitySft || 150000);
        setWhPalletCapacity(x.palletCapacity ?? '');
        setWhCartonCapacity(x.cartonCapacity ?? '');
        setWhContactNumber(x.contactNumber || '');
        setWhEmail(x.email || '');
        setWhLatitude(x.latitude ?? '');
        setWhLongitude(x.longitude ?? '');
        setWhRemarks(x.remarks || '');
        setWhTempControl(Boolean(x.isTemperatureControlled));
        setFormStatus((x.status as any) || 'Active');
      }
    } else if (module === 'customers' || module === 'masters/customers') {
      const x = dbCustomers.find(c => c.id === id);
      if (x) {
        setFormCode(x.code);
        setCustCompanyId(x.companyId || (dbCompanies[0]?.id || ''));
        setCustLegalName(x.legalName || x.name || '');
        setCustTradeName(x.tradeName || '');
        setCustType(x.customerType || 'Retailer');
        setCustGstin(x.gstin || '');
        setCustPan(x.pan || '');
        setCustEmail(x.email || '');
        setCustPhone(x.phone || x.contact || '');
        setCustAddrLine1(x.addressLine1 || '');
        setCustAddrLine2(x.addressLine2 || '');
        setCustCity(x.city || '');
        setCustState(x.state || '');
        setCustPostalCode(x.postalCode || '');
        setCustCountry(x.country || 'India');
        setCustCreditLimit(x.creditLimit ?? x.balance ?? 50000);
        setCustCreditDays(x.creditDays ?? 30);
        setCustSalesRouteId(x.routeId || '');
        setFormStatus((x.status as any) || (x.isActive ? 'Active' : 'Inactive'));
        setFormErrors({});
      }
    } else if (module === 'suppliers' || module === 'masters/suppliers') {
      const x = dbSuppliers.find(s => s.id === id);
      if (x) {
        setFormCode(x.code);
        setSuppCompanyId(x.companyId || (dbCompanies[0]?.id || ''));
        setSuppLegalName(x.legalName || x.name || '');
        setSuppTradeName(x.tradeName || '');
        setSuppType(x.supplierType || 'Distributor / Stockist');
        setSuppGstin(x.gstin || '');
        setSuppPan(x.pan || '');
        setSuppPhone(x.phone || x.contact || '');
        setSuppEmail(x.email || '');
        setSuppPaymentTermsDays(x.paymentTermsDays ?? 30);
        setSuppAddrLine1(x.addressLine1 || '');
        setSuppAddrLine2(x.addressLine2 || '');
        setSuppCity(x.city || '');
        setSuppState(x.state || '');
        setSuppPostalCode(x.postalCode || '');
        setSuppCountry(x.country || 'India');
        setFormStatus((x.status as any) || 'Active');
        setFormErrors({});
      }
    }
  };

  const getNextAutoCode = () => {
    let prefix = 'REC';
    let currentList: any[] = [];

    if (module === 'companies' || module === 'masters/companies') {
      prefix = 'COM';
      currentList = dbCompanies;
    } else if (module === 'branches' || module === 'masters/branches') {
      prefix = 'BR';
      currentList = dbBranches;
    } else if (module === 'warehouses' || module === 'masters/warehouses') {
      prefix = 'WH';
      currentList = dbWarehouses;
    } else if (module === 'departments' || module === 'masters/departments') {
      prefix = 'DEP';
      currentList = dbDepartments;
    } else if (module === 'designations' || module === 'masters/designations') {
      prefix = 'DSG';
      currentList = dbDesignations;
    } else if (module === 'employees' || module === 'masters/employees') {
      prefix = 'EMP';
      currentList = dbEmployees;
    } else if (module === 'products' || module === 'masters/products') {
      prefix = 'PROD';
      currentList = dbProducts;
    } else if (module === 'categories' || module === 'masters/categories') {
      prefix = 'CAT';
      currentList = dbCategories;
    } else if (module === 'brands' || module === 'masters/brands') {
      prefix = 'BRD';
      currentList = dbBrands;
    } else if (module === 'units' || module === 'masters/units') {
      prefix = 'UOM';
      currentList = dbUnits;
    } else if (module === 'customers' || module === 'masters/customers') {
      prefix = 'CST';
      currentList = dbCustomers;
    } else if (module === 'suppliers' || module === 'masters/suppliers') {
      prefix = 'SUP';
      currentList = dbSuppliers;
    }

    const existingCodes = new Set(
      currentList.map(item => String(item.code || item.employeeCode || '').toUpperCase().trim())
    );

    let counter = 1;
    while (counter < 10000) {
      const candidate = `${prefix}-${String(counter).padStart(3, '0')}`;
      if (!existingCodes.has(candidate)) {
        return candidate;
      }
      counter++;
    }

    return `${prefix}-001`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    let activeCode = formCode.trim();
    if (!activeCode && mode === 'create') {
      activeCode = getNextAutoCode();
      setFormCode(activeCode);
    }

    if (!activeCode) {
      errors.code = 'Code identifier is required. Example: COM-001 or PROD-001';
    }

    if (module === 'companies' || module === 'masters/companies') {
      if (!compLegalName.trim()) errors.compLegalName = 'Legal Entity Name is required. Example: INK FMCG Private Limited';
      // GSTIN is required by backend — validate presence and format
      if (!compGstin.trim()) {
        errors.compGstin = 'GSTIN (Tax Registration Number) is required.';
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(compGstin.trim().toUpperCase())) {
        errors.compGstin = 'GSTIN format must be 15 characters. Example: 07AAAAA0000A1Z5';
      }
      // PAN is required by backend — validate presence and format
      if (!compPan.trim()) {
        errors.compPan = 'PAN Number is required.';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(compPan.trim().toUpperCase())) {
        errors.compPan = 'PAN format must be 10 characters. Example: AAAAA0000A';
      }
      if (!compEmail.trim()) errors.compEmail = 'Corporate Email is required.';
      if (!compPhone.trim()) errors.compPhone = 'Phone number is required.';
      if (!addrLine1.trim()) errors.addrLine1 = 'Address Line 1 is required.';
      if (!addrCity.trim()) errors.addrCity = 'City is required.';
      if (!addrState.trim()) errors.addrState = 'State is required.';
      if (!addrPostalCode.trim()) errors.addrPostalCode = 'Postal Code is required.';
      if (!addrCountry.trim()) errors.addrCountry = 'Country is required.';
    } else if (module === 'branches' || module === 'masters/branches') {
      if (!branchName.trim()) errors.branchName = 'Branch Name is required. Example: Delhi Main Branch';
    } else if (module === 'departments' || module === 'masters/departments') {
      if (!deptCompanyId || !isGuid(deptCompanyId)) {
        errors.deptCompanyId = 'Company is required. Please select a valid Company.';
      }
      if (!deptName.trim()) errors.deptName = 'Department Name is required. Example: Supply Chain & Logistics';
    } else if (module === 'employee-roles' || module === 'masters/employee-roles') {
      if (!roleCompanyId || !isGuid(roleCompanyId)) {
        errors.roleCompanyId = 'Company is required. Please select a valid Company.';
      }
      if (!roleName.trim()) {
        errors.roleName = 'Employee Role Name is required. Example: Sales Representative';
      } else if (roleName.trim().length > 100) {
        errors.roleName = 'Employee Role Name cannot exceed 100 characters.';
      }
      if (!formCode.trim()) {
        errors.code = 'Employee Role Code is required.';
      } else if (formCode.trim().length > 30) {
        errors.code = 'Employee Role Code cannot exceed 30 characters.';
      }
      if (roleDesc.trim().length > 255) {
        errors.roleDesc = 'Description cannot exceed 255 characters.';
      }
    } else if (module === 'designations' || module === 'masters/designations') {
      if (!desigTitle.trim()) errors.desigTitle = 'Designation Title is required. Example: Regional Sales Manager';
    } else if (module === 'employees' || module === 'masters/employees') {
      if (!empCompanyId || !isGuid(empCompanyId)) {
        errors.empCompanyId = 'Company is required. Please select a valid Company.';
      }
      if (!empDepartmentId || !isGuid(empDepartmentId)) {
        errors.empDepartmentId = 'Department is required. Please select a Department.';
      }
      if (!empRoleId || !isGuid(empRoleId)) {
        errors.empRoleId = 'Employee Role is required. Please select an Employee Role.';
      }
      if (!empDesignationId || !isGuid(empDesignationId)) {
        errors.empDesignationId = 'Designation is required. Please select a Designation.';
      }
      if (!formCode.trim()) {
        errors.code = 'Employee Code is required.';
      } else if (formCode.trim().length > 20) {
        errors.code = 'Employee Code cannot exceed 20 characters.';
      }
      if (!empFirstName.trim()) {
        errors.empFirstName = 'First Name is required. Example: Rajesh';
      } else if (empFirstName.trim().length > 50) {
        errors.empFirstName = 'First Name cannot exceed 50 characters.';
      }
      if (!empLastName.trim()) {
        errors.empLastName = 'Last Name is required. Example: Kumar';
      } else if (empLastName.trim().length > 50) {
        errors.empLastName = 'Last Name cannot exceed 50 characters.';
      }
      if (!empEmail.trim()) {
        errors.empEmail = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empEmail.trim())) {
        errors.empEmail = 'Email address is not in a valid format.';
      } else if (empEmail.trim().length > 100) {
        errors.empEmail = 'Email cannot exceed 100 characters.';
      }
      if (!empPhone.trim()) {
        errors.empPhone = 'Phone number is required.';
      } else if (empPhone.trim().length > 20) {
        errors.empPhone = 'Phone number cannot exceed 20 characters.';
      }
      if (!empJoiningDate) {
        errors.empJoiningDate = 'Joining Date is required.';
      }
      if (empSalary !== '' && empSalary !== null && empSalary !== undefined) {
        const numSal = Number(empSalary);
        if (isNaN(numSal) || numSal < 0) {
          errors.empSalary = 'Monthly Salary cannot be negative.';
        }
      }
    } else if (module === 'products' || module === 'masters/products') {
      if (!prodCompanyId || !isGuid(prodCompanyId)) {
        errors.prodCompanyId = 'Company is required. Please select a valid Company.';
      }
      // Category is OPTIONAL — no validation required
      if (!prodBaseUomId || !isGuid(prodBaseUomId)) {
        errors.prodBaseUomId = 'Base Unit of Measure is required. Please select a UOM.';
      }
      if (!prodName.trim()) {
        errors.prodName = 'Product SKU Name is required. Example: Premium Basmati Rice 5kg';
      } else if (prodName.trim().length > 150) {
        errors.prodName = 'Product SKU Name cannot exceed 150 characters.';
      }
      if (formCode.trim().length > 30) {
        errors.code = 'Product Code cannot exceed 30 characters.';
      }
      if (prodMrp !== '' && typeof prodMrp === 'number' && prodMrp < 0) {
        errors.prodMrp = 'MRP cannot be negative.';
      }
      if (prodBasePrice !== '' && typeof prodBasePrice === 'number' && prodBasePrice < 0) {
        errors.prodBasePrice = 'Base Price cannot be negative.';
      }
      if (prodMinOrderQty !== '' && typeof prodMinOrderQty === 'number' && prodMinOrderQty <= 0) {
        errors.prodMinOrderQty = 'Minimum Order Quantity must be greater than 0.';
      }
    } else if (module === 'categories' || module === 'masters/categories') {
      if (!catCompanyId || !isGuid(catCompanyId)) {
        errors.catCompanyId = 'Company is required. Please select a valid Company.';
      }
      if (!catName.trim()) {
        errors.catName = 'Category Name is required. Example: Beverages or Snacks';
      } else if (catName.trim().length > 100) {
        errors.catName = 'Category Name cannot exceed 100 characters.';
      }
      if (catParentId && isGuid(catParentId)) {
        if (selectedId && catParentId === selectedId) {
          errors.catParentId = 'A category cannot be assigned as its own parent.';
        }
      }
    } else if (module === 'brands' || module === 'masters/brands') {
      if (!brandName.trim()) errors.brandName = 'Brand Name is required. Example: India Gate';
    } else if (module === 'units' || module === 'masters/units') {
      if (!uomName.trim()) errors.uomName = 'Unit Name is required. Example: Kilograms';
    } else if (module === 'warehouses' || module === 'masters/warehouses') {
      if (!whCompanyId || !isGuid(whCompanyId)) {
        errors.whCompanyId = 'Company is required. Please select a valid Company.';
      }
      if (!whName.trim()) errors.whName = 'Warehouse / Stockist Name is required. Example: Delhi Central Depot';
      if (!whType.trim()) errors.whType = 'Warehouse Type is required.';
      if (!whStatus.trim()) errors.whStatus = 'Status is required.';
      if (!whAddrLine1.trim()) errors.whAddrLine1 = 'Address Line 1 is required.';
      if (!whCity.trim()) errors.whCity = 'City is required.';
      if (!whState.trim()) errors.whState = 'State is required.';
      if (!whCountry.trim()) errors.whCountry = 'Country is required.';
      if (!whPostalCode.trim()) errors.whPostalCode = 'Pincode is required.';
      if (whEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(whEmail.trim())) {
        errors.whEmail = 'Email address is not in a valid format.';
      }
      if (whStorageAreaSqFt !== '' && typeof whStorageAreaSqFt === 'number' && whStorageAreaSqFt < 0) {
        errors.whStorageAreaSqFt = 'Storage Area cannot be negative.';
      }
      if (whPalletCapacity !== '' && typeof whPalletCapacity === 'number' && whPalletCapacity < 0) {
        errors.whPalletCapacity = 'Pallet Capacity cannot be negative.';
      }
      if (whCartonCapacity !== '' && typeof whCartonCapacity === 'number' && whCartonCapacity < 0) {
        errors.whCartonCapacity = 'Carton Capacity cannot be negative.';
      }
      if (whLatitude !== '' && typeof whLatitude === 'number' && (whLatitude < -90 || whLatitude > 90)) {
        errors.whLatitude = 'Latitude must be between -90 and 90 degrees.';
      }
      if (whLongitude !== '' && typeof whLongitude === 'number' && (whLongitude < -180 || whLongitude > 180)) {
        errors.whLongitude = 'Longitude must be between -180 and 180 degrees.';
      }
    } else if (module === 'customers' || module === 'masters/customers') {
      if (!custCompanyId || !isGuid(custCompanyId)) {
        errors.custCompanyId = 'Company is required. Please select a valid Company.';
      }
      if (!formCode.trim()) {
        errors.code = 'Customer Code is required.';
      } else if (formCode.trim().length > 20) {
        errors.code = 'Customer Code cannot exceed 20 characters.';
      }
      if (!custLegalName.trim()) {
        errors.custLegalName = 'Customer Name is required. Example: Apex Retail Distributors';
      } else if (custLegalName.trim().length > 150) {
        errors.custLegalName = 'Customer Name cannot exceed 150 characters.';
      }
      if (custTradeName && custTradeName.trim().length > 150) {
        errors.custTradeName = 'Customer / Store Name cannot exceed 150 characters.';
      }
      if (!custEmail.trim()) {
        errors.custEmail = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail.trim())) {
        errors.custEmail = 'Email address is not in a valid format.';
      } else if (custEmail.trim().length > 100) {
        errors.custEmail = 'Email cannot exceed 100 characters.';
      }
      if (!custPhone.trim()) {
        errors.custPhone = 'Phone number is required.';
      } else if (custPhone.trim().length > 20) {
        errors.custPhone = 'Phone number cannot exceed 20 characters.';
      }
      if (custGstin && custGstin.trim().length > 30) {
        errors.custGstin = 'GSTIN cannot exceed 30 characters.';
      }
      if (custPan && custPan.trim().length > 20) {
        errors.custPan = 'PAN cannot exceed 20 characters.';
      }
      if (!custAddrLine1.trim()) {
        errors.custAddrLine1 = 'Address Line 1 is required.';
      } else if (custAddrLine1.trim().length > 150) {
        errors.custAddrLine1 = 'Address Line 1 cannot exceed 150 characters.';
      }
      if (custAddrLine2 && custAddrLine2.trim().length > 150) {
        errors.custAddrLine2 = 'Address Line 2 cannot exceed 150 characters.';
      }
      if (!custCity.trim()) {
        errors.custCity = 'City is required.';
      } else if (custCity.trim().length > 50) {
        errors.custCity = 'City cannot exceed 50 characters.';
      }
      if (!custState.trim()) {
        errors.custState = 'State is required.';
      } else if (custState.trim().length > 50) {
        errors.custState = 'State cannot exceed 50 characters.';
      }
      if (!custPostalCode.trim()) {
        errors.custPostalCode = 'Postal / PIN Code is required.';
      } else if (custPostalCode.trim().length > 15) {
        errors.custPostalCode = 'Postal Code cannot exceed 15 characters.';
      }
      if (!custCountry.trim()) {
        errors.custCountry = 'Country is required.';
      } else if (custCountry.trim().length > 50) {
        errors.custCountry = 'Country cannot exceed 50 characters.';
      }
      if (custCreditLimit !== '' && typeof custCreditLimit === 'number' && custCreditLimit < 0) {
        errors.custCreditLimit = 'Credit Limit cannot be negative.';
      }
      if (custCreditDays !== '' && typeof custCreditDays === 'number' && custCreditDays < 0) {
        errors.custCreditDays = 'Credit Days cannot be negative.';
      }
    } else if (module === 'suppliers' || module === 'masters/suppliers') {
      if (!suppCompanyId || !isGuid(suppCompanyId)) {
        errors.suppCompanyId = 'Company is required. Please select a valid Company.';
      }
      if (!formCode.trim()) {
        errors.code = 'Supplier Code is required.';
      } else if (formCode.trim().length > 20) {
        errors.code = 'Supplier Code cannot exceed 20 characters.';
      }
      if (!suppLegalName.trim()) {
        errors.suppLegalName = 'Supplier Name is required. Example: Hindustan Unilever Ltd';
      } else if (suppLegalName.trim().length > 150) {
        errors.suppLegalName = 'Supplier Name cannot exceed 150 characters.';
      }
      if (suppTradeName && suppTradeName.trim().length > 150) {
        errors.suppTradeName = 'Supplier / Business Name cannot exceed 150 characters.';
      }
      if (!suppGstin.trim()) {
        errors.suppGstin = 'GSTIN is required.';
      } else if (suppGstin.trim().length !== 15) {
        errors.suppGstin = 'GSTIN must be exactly 15 characters.';
      }
      if (!suppPan.trim()) {
        errors.suppPan = 'PAN is required.';
      } else if (suppPan.trim().length !== 10) {
        errors.suppPan = 'PAN must be exactly 10 characters.';
      }
      if (!suppEmail.trim()) {
        errors.suppEmail = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suppEmail.trim())) {
        errors.suppEmail = 'Email address is not in a valid format.';
      } else if (suppEmail.trim().length > 100) {
        errors.suppEmail = 'Email cannot exceed 100 characters.';
      }
      if (!suppPhone.trim()) {
        errors.suppPhone = 'Phone number is required.';
      } else if (suppPhone.trim().length > 20) {
        errors.suppPhone = 'Phone number cannot exceed 20 characters.';
      }
      if (suppPaymentTermsDays !== '' && typeof suppPaymentTermsDays === 'number' && suppPaymentTermsDays < 0) {
        errors.suppPaymentTermsDays = 'Payment Terms Days cannot be negative.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const isNew = mode === 'create';
      
      if (module === 'companies' || module === 'masters/companies') {
        if (!isSuper) {
          onTriggerToast('error', 'Action Forbidden', 'Standard Administrators have Read-Only Company access.');
          setMode('list');
          return;
        }
        if (isNew) {
          await masterDataService.createCompany({
            code: formCode.toUpperCase().trim(),
            legalName: compLegalName.trim(),
            tradeName: compTradeName.trim() || compLegalName.trim(),
            taxRegistrationNumber: compGstin.trim().toUpperCase(),
            panNumber: compPan.trim().toUpperCase(),
            email: compEmail.trim(),
            phone: compPhone.trim(),
            currencyCode: compCurrency || 'INR',
            timeZoneId: 'Asia/Kolkata',
            financialYearStartMonth: 4,
            isActive: formStatus === 'Active',
            addressLine1: addrLine1.trim(),
            city: addrCity.trim(),
            state: addrState.trim(),
            postalCode: addrPostalCode.trim(),
            country: addrCountry.trim(),
          });
          onTriggerToast('success', 'Company Saved', 'Company record created in database.');
        } else {
          // rowVersion is required for optimistic concurrency validation on the backend
          await masterDataService.updateCompany(selectedId!, {
            id: selectedId!,
            code: formCode.toUpperCase().trim(),
            legalName: compLegalName.trim(),
            tradeName: compTradeName.trim() || compLegalName.trim(),
            taxRegistrationNumber: compGstin.trim().toUpperCase(),
            panNumber: compPan.trim().toUpperCase(),
            email: compEmail.trim(),
            phone: compPhone.trim(),
            currencyCode: compCurrency || 'INR',
            timeZoneId: 'Asia/Kolkata',
            financialYearStartMonth: 4,
            isActive: formStatus === 'Active',
            addressLine1: addrLine1.trim(),
            city: addrCity.trim(),
            state: addrState.trim(),
            postalCode: addrPostalCode.trim(),
            country: addrCountry.trim(),
            rowVersion: compRowVersion,
          });
          onTriggerToast('success', 'Company Updated', 'Company record updated.');
        }
      } else if (module === 'branches' || module === 'masters/branches') {
        const validCompId = isGuid(branchCompanyId) ? branchCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = { 
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          name: branchName.trim(), 
          gstin: (branchGstin || '07AAAAA0000A1Z5').toUpperCase().trim(), 
          email: (branchEmail || 'branch@company.com').trim(), 
          phone: (branchPhone || '+91 98100 12345').trim(), 
          addressLine1: (addrLine1 || 'Main Branch Address').trim(), 
          city: (addrCity || 'Delhi').trim(), 
          state: (addrState || 'Delhi').trim(), 
          postalCode: (addrPostalCode || '110001').trim(), 
          country: (addrCountry || 'India').trim(), 
          isHeadquarters: Boolean(branchIsHq) 
        };
        if (isNew) {
           await masterDataService.createBranch(payload);
           onTriggerToast('success', 'Branch Saved', 'Branch record configured.');
        } else {
           await masterDataService.updateBranch(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Branch Updated', 'Branch record configured.');
        }
      } else if (module === 'departments' || module === 'masters/departments') {
        const validCompId = isGuid(deptCompanyId) ? deptCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validBranchId = isGuid(deptBranchId) ? deptBranchId : null;
        const payload = { 
          companyId: validCompId,
          branchId: validBranchId, 
          code: formCode.toUpperCase().trim(), 
          name: deptName.trim(), 
          description: (deptDesc || '').trim() || undefined,
          isActive: formStatus === 'Active'
        };
        if (isNew) {
           await masterDataService.createDepartment(payload);
           onTriggerToast('success', 'Department Saved', 'Department record configured.');
        } else {
           await masterDataService.updateDepartment(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Department Updated', 'Department record configured.');
        }
      } else if (module === 'employee-roles' || module === 'masters/employee-roles') {
        const validCompId = isGuid(roleCompanyId) ? roleCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = {
          companyId: validCompId,
          code: formCode.toUpperCase().trim(),
          name: roleName.trim(),
          description: (roleDesc || '').trim() || null,
          isActive: formStatus === 'Active'
        };
        if (isNew) {
          await masterDataService.createEmployeeRole(payload);
          onTriggerToast('success', 'Employee Role Saved', 'Employee functional job role configured.');
        } else {
          await masterDataService.updateEmployeeRole(selectedId!, { ...payload, id: selectedId! });
          onTriggerToast('success', 'Employee Role Updated', 'Employee functional job role updated.');
        }
      } else if (module === 'designations' || module === 'masters/designations') {
        const validCompId = isGuid(desigCompanyId) ? desigCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = { 
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          title: desigTitle.trim(), 
          level: typeof desigLevel === 'number' ? desigLevel : (parseInt(desigLevel) || 1), 
          approvalLimit: typeof desigApprovalLimit === 'number' ? desigApprovalLimit : (parseFloat(desigApprovalLimit) || 10000) 
        };
        if (isNew) {
           await masterDataService.createDesignation(payload);
           onTriggerToast('success', 'Designation Saved', 'Designation record configured.');
        } else {
           await masterDataService.updateDesignation(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Designation Updated', 'Designation record configured.');
        }
      } else if (module === 'employees' || module === 'masters/employees') {
        const payload = { 
          companyId: empCompanyId, 
          branchId: isGuid(empBranchId) ? empBranchId : null, 
          departmentId: empDepartmentId, 
          warehouseId: isGuid(empWarehouseId) ? empWarehouseId : null,
          designationId: empDesignationId, 
          employeeRoleId: empRoleId,
          employeeCode: formCode.toUpperCase().trim(), 
          firstName: empFirstName.trim(), 
          lastName: empLastName.trim(), 
          email: empEmail.toLowerCase().trim(), 
          phone: empPhone.trim(), 
          joiningDate: new Date(empJoiningDate).toISOString(), 
          salary: (empSalary !== '' && empSalary !== null && empSalary !== undefined) ? Number(empSalary) : undefined,
          isActive: formStatus === 'Active'
        };
        if (isNew) {
           await masterDataService.createEmployee(payload);
           onTriggerToast('success', 'Employee Saved', 'Employee staff record created successfully.');
        } else {
           await masterDataService.updateEmployee(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Employee Updated', 'Employee staff record updated successfully.');
        }
      } else if (module === 'products' || module === 'masters/products') {
        const payload = {
          companyId: prodCompanyId,
          categoryId: isGuid(prodCategoryId) ? prodCategoryId : null,
          brandId: isGuid(prodBrandId) ? prodBrandId : null,
          baseUomId: prodBaseUomId,
          code: formCode.toUpperCase().trim(),
          name: prodName.trim(),
          sku: formCode.toUpperCase().trim(),
          barcode: (prodBarcode || '').trim(),
          hsnCode: (prodHsnCode || '1006').trim(),
          gstRatePercent: typeof prodGstRate === 'number' ? prodGstRate : (parseFloat(String(prodGstRate)) || 5),
          mrp: typeof prodMrp === 'number' ? prodMrp : (parseFloat(String(prodMrp)) || 0),
          basePrice: typeof prodBasePrice === 'number' ? prodBasePrice : (parseFloat(String(prodBasePrice)) || 0),
          minOrderQty: typeof prodMinOrderQty === 'number' ? prodMinOrderQty : (parseFloat(String(prodMinOrderQty)) || 1),
          shelfLifeDays: prodShelfLifeDays ? (typeof prodShelfLifeDays === 'number' ? prodShelfLifeDays : (parseInt(String(prodShelfLifeDays)) || null)) : null,
          isBatchTracked: Boolean(prodIsBatchTracked),
          isActive: formStatus === 'Active'
        };

        if (isNew) {
           await masterDataService.createProduct(payload);
           onTriggerToast('success', 'Product Saved', 'Product SKU record configured successfully.');
        } else {
           await masterDataService.updateProduct(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Product Updated', 'Product SKU record updated successfully.');
        }
      } else if (module === 'categories' || module === 'masters/categories') {
        const payload = { 
          companyId: catCompanyId, 
          code: formCode.toUpperCase().trim(), 
          name: catName.trim(), 
          parentCategoryId: isGuid(catParentId) ? catParentId : undefined, 
          gstTaxRatePercent: typeof catGstRate === 'number' ? catGstRate : (parseFloat(String(catGstRate)) || 5), 
          hsnCodeDefault: (catHsnDefault || '1006.30').trim(),
          isActive: formStatus === 'Active'
        };
        if (isNew) {
           await masterDataService.createCategory(payload);
           onTriggerToast('success', 'Category Saved', 'Category record configured successfully.');
        } else {
           await masterDataService.updateCategory(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Category Updated', 'Category record updated successfully.');
        }
      } else if (module === 'brands' || module === 'masters/brands') {
        const validCompId = isGuid(brandCompanyId) ? brandCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = { 
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          name: brandName.trim(), 
          manufacturerName: (brandManufacturer || 'FMCG Manufacturer').trim(), 
          originCountry: (brandOrigin || 'India').trim() 
        };
        if (isNew) {
           await masterDataService.createBrand(payload);
           onTriggerToast('success', 'Brand Saved', 'Brand record configured.');
        } else {
           await masterDataService.updateBrand(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Brand Updated', 'Brand record configured.');
        }
      } else if (module === 'units' || module === 'masters/units') {
        const validCompId = isGuid(uomCompanyId) ? uomCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = { 
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          name: uomName.trim(), 
          baseUnitCode: (uomBaseCode || formCode).toUpperCase().trim(), 
          conversionFactor: typeof uomConversionFactor === 'number' ? uomConversionFactor : (parseFloat(uomConversionFactor) || 1), 
          isFractionalAllowed: true 
        };
        if (isNew) {
           await masterDataService.createUnitOfMeasure(payload);
           onTriggerToast('success', 'Unit Saved', 'Unit of Measure configured.');
        } else {
           await masterDataService.updateUnitOfMeasure(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Unit Updated', 'Unit of Measure configured.');
        }
      } else if (module === 'warehouses' || module === 'masters/warehouses') {
        const validBranch = isGuid(whBranchId) ? dbBranches.find(b => b.id === whBranchId) : null;
        const validCompId = isGuid(whCompanyId) ? whCompanyId : (validBranch?.companyId || dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validBranchId = isGuid(whBranchId) ? whBranchId : null;
        const validManagerId = isGuid(whManagerEmployeeId) ? whManagerEmployeeId : undefined;

        const payload = { 
          companyId: validCompId, 
          branchId: validBranchId, 
          code: formCode.toUpperCase().trim(), 
          name: whName.trim(), 
          warehouseType: whType || 'Central Warehouse',
          status: whStatus || 'Active',
          managerEmployeeId: validManagerId,
          addressLine1: (whAddrLine1 || 'Warehouse Address').trim(),
          addressLine2: (whAddrLine2 || '').trim() || undefined,
          city: (whCity || 'Delhi').trim(),
          state: (whState || 'Delhi').trim(),
          postalCode: (whPostalCode || '110001').trim(),
          country: (whCountry || 'India').trim(),
          capacitySqFt: typeof whStorageAreaSqFt === 'number' ? whStorageAreaSqFt : undefined,
          palletCapacity: typeof whPalletCapacity === 'number' ? whPalletCapacity : undefined,
          cartonCapacity: typeof whCartonCapacity === 'number' ? whCartonCapacity : undefined,
          contactNumber: whContactNumber.trim() || undefined,
          email: whEmail.trim() || undefined,
          latitude: typeof whLatitude === 'number' ? whLatitude : undefined,
          longitude: typeof whLongitude === 'number' ? whLongitude : undefined,
          remarks: whRemarks.trim() || undefined,
          isTemperatureControlled: Boolean(whTempControl),
          isActive: whStatus === 'Active'
        };
        if (isNew) {
           await masterDataService.createWarehouse(payload);
           onTriggerToast('success', 'Warehouse / Stockist Saved', 'Warehouse / Stockist configured.');
        } else {
           await masterDataService.updateWarehouse(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Warehouse / Stockist Updated', 'Warehouse / Stockist configured.');
        }
      } else if (module === 'customers' || module === 'masters/customers') {
        const payload = { 
          companyId: custCompanyId,
          code: formCode.toUpperCase().trim(), 
          legalName: custLegalName.trim(), 
          tradeName: custTradeName.trim() ? custTradeName.trim() : undefined,
          customerType: custType || 'Retailer',
          gstin: custGstin.trim() ? custGstin.toUpperCase().trim() : undefined,
          pan: custPan.trim() ? custPan.toUpperCase().trim() : undefined,
          phone: custPhone.trim(), 
          email: custEmail.trim(), 
          creditLimit: typeof custCreditLimit === 'number' ? custCreditLimit : (parseFloat(String(custCreditLimit)) || 0), 
          creditDays: typeof custCreditDays === 'number' ? custCreditDays : (parseInt(String(custCreditDays), 10) || 0),
          routeId: isGuid(custSalesRouteId) ? custSalesRouteId : undefined,
          isActive: formStatus === 'Active', 
          addressLine1: custAddrLine1.trim(), 
          addressLine2: custAddrLine2.trim() ? custAddrLine2.trim() : undefined, 
          city: custCity.trim(), 
          state: custState.trim(), 
          postalCode: custPostalCode.trim(), 
          country: custCountry.trim() || 'India'
        };
        if (isNew) {
           await masterDataService.createCustomer(payload);
           onTriggerToast('success', 'Customer Saved', 'Customer master account configured successfully.');
        } else {
           await masterDataService.updateCustomer(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Customer Updated', 'Customer master account updated successfully.');
        }
      } else if (module === 'suppliers' || module === 'masters/suppliers') {
        const payload = { 
          companyId: suppCompanyId,
          code: formCode.toUpperCase().trim(), 
          legalName: suppLegalName.trim(), 
          tradeName: suppTradeName.trim() ? suppTradeName.trim() : undefined,
          supplierType: suppType || 'Distributor / Stockist',
          gstin: suppGstin.toUpperCase().trim(),
          pan: suppPan.toUpperCase().trim(),
          phone: suppPhone.trim(), 
          email: suppEmail.trim(), 
          paymentTermsDays: typeof suppPaymentTermsDays === 'number' ? suppPaymentTermsDays : (parseInt(String(suppPaymentTermsDays), 10) || 30),
          creditLimit: 0, 
          isActive: formStatus === 'Active', 
          addressLine1: (suppAddrLine1 || 'Registered Office').trim(), 
          addressLine2: suppAddrLine2.trim() ? suppAddrLine2.trim() : undefined,
          city: (suppCity || 'Mumbai').trim(), 
          state: (suppState || 'Maharashtra').trim(), 
          postalCode: (suppPostalCode || '400001').trim(), 
          country: (suppCountry || 'India').trim() 
        };
        if (isNew) {
           await masterDataService.createSupplier(payload);
           onTriggerToast('success', 'Supplier Saved', 'Supplier master account configured successfully.');
        } else {
           await masterDataService.updateSupplier(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Supplier Updated', 'Supplier master account updated successfully.');
        }
      }

      setMode('list');
      setRefreshTrigger(prev => prev + 1);
      setSimulatedState('normal');
    } catch (err: any) {
      console.error('Master Data save error:', err);
      const errorMsg = err?.data?.detail || err?.data?.title || err?.message || 'Failed to save record to PostgreSQL database.';
      const lower = errorMsg.toLowerCase();
      const newErrors: Record<string, string> = {};

      if (lower.includes('gstin') || lower.includes('tax registration')) {
        if (module === 'companies' || module === 'masters/companies') newErrors.compGstin = errorMsg;
        else if (module === 'branches' || module === 'masters/branches') newErrors.branchGstin = errorMsg;
        else if (module === 'suppliers' || module === 'masters/suppliers') newErrors.suppGstin = errorMsg;
        else newErrors.custGstin = errorMsg;
      } else if (lower.includes('code')) {
        newErrors.code = errorMsg;
      } else if (lower.includes('legal name') || lower.includes('name')) {
        if (module === 'companies' || module === 'masters/companies') newErrors.compLegalName = errorMsg;
        else if (module === 'branches' || module === 'masters/branches') newErrors.branchName = errorMsg;
        else if (module === 'departments' || module === 'masters/departments') newErrors.deptName = errorMsg;
        else if (module === 'warehouses' || module === 'masters/warehouses') newErrors.whName = errorMsg;
        else if (module === 'products' || module === 'masters/products') newErrors.prodName = errorMsg;
        else if (module === 'categories' || module === 'masters/categories') newErrors.catName = errorMsg;
        else if (module === 'brands' || module === 'masters/brands') newErrors.brandName = errorMsg;
        else if (module === 'units' || module === 'masters/units') newErrors.uomName = errorMsg;
        else if (module === 'suppliers' || module === 'masters/suppliers') newErrors.suppLegalName = errorMsg;
        else newErrors.custLegalName = errorMsg;
      } else {
        newErrors.code = errorMsg;
      }

      setFormErrors(newErrors);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      if (module === 'companies' || module === 'masters/companies') {
        if (!isSuper) {
          onTriggerToast('error', 'Action Forbidden', 'Only Super Administrators can delete or archive Companies.');
          setDeleteId(null);
          return;
        }
        await masterDataService.deleteCompany(deleteId);
      }
      else if (module === 'branches' || module === 'masters/branches') await masterDataService.deleteBranch(deleteId);
      else if (module === 'departments' || module === 'masters/departments') await masterDataService.deleteDepartment(deleteId);
      else if (module === 'employee-roles' || module === 'masters/employee-roles') await masterDataService.deleteEmployeeRole(deleteId);
      else if (module === 'designations' || module === 'masters/designations') await masterDataService.deleteDesignation(deleteId);
      else if (module === 'employees' || module === 'masters/employees') await masterDataService.deleteEmployee(deleteId);
      else if (module === 'products' || module === 'masters/products') await masterDataService.deleteProduct(deleteId);
      else if (module === 'categories' || module === 'masters/categories') await masterDataService.deleteCategory(deleteId);
      else if (module === 'brands' || module === 'masters/brands') await masterDataService.deleteBrand(deleteId);
      else if (module === 'units' || module === 'masters/units') await masterDataService.deleteUnitOfMeasure(deleteId);
      else if (module === 'warehouses' || module === 'masters/warehouses') await masterDataService.deleteWarehouse(deleteId);
      else if (module === 'customers' || module === 'masters/customers') await masterDataService.deleteCustomer(deleteId);
      else if (module === 'suppliers' || module === 'masters/suppliers') await masterDataService.deleteSupplier(deleteId);
      
      onTriggerToast('success', 'Deleted', 'Record was deleted successfully.');
      setDeleteId(null);
      
      // Update local state without full reload for instant UX
      if (module === 'companies' || module === 'masters/companies') setDbCompanies(dbCompanies.filter(x => x.id !== deleteId));
      else if (module === 'branches' || module === 'masters/branches') setDbBranches(dbBranches.filter(x => x.id !== deleteId));
      else if (module === 'departments' || module === 'masters/departments') setDbDepartments(dbDepartments.filter(x => x.id !== deleteId));
      else if (module === 'employee-roles' || module === 'masters/employee-roles') setDbEmployeeRoles(dbEmployeeRoles.filter(x => x.id !== deleteId));
      else if (module === 'designations' || module === 'masters/designations') setDbDesignations(dbDesignations.filter(x => x.id !== deleteId));
      else if (module === 'employees' || module === 'masters/employees') setDbEmployees(dbEmployees.filter(x => x.id !== deleteId));
      else if (module === 'products' || module === 'masters/products') setDbProducts(dbProducts.filter(x => x.id !== deleteId));
      else if (module === 'categories' || module === 'masters/categories') setDbCategories(dbCategories.filter(x => x.id !== deleteId));
      else if (module === 'brands' || module === 'masters/brands') setDbBrands(dbBrands.filter(x => x.id !== deleteId));
      else if (module === 'units' || module === 'masters/units') setDbUnits(dbUnits.filter(x => x.id !== deleteId));
      else if (module === 'warehouses' || module === 'masters/warehouses') setDbWarehouses(dbWarehouses.filter(x => x.id !== deleteId));
      else if (module === 'customers' || module === 'masters/customers') setDbCustomers(dbCustomers.filter(x => x.id !== deleteId));
      else if (module === 'suppliers' || module === 'masters/suppliers') setDbSuppliers(dbSuppliers.filter(x => x.id !== deleteId));

    } catch (err: any) {
      onTriggerToast('error', 'Delete Failed', err?.data?.detail || err?.message || 'Failed to delete record.');
      setDeleteId(null);
    }
  };

  const getActiveArray = () => {
    if (module === 'partners' || module === 'masters/partners') {
      const custRows = dbCustomers.map(c => ({ id: `cust-${c.id}`, code: c.code, name: c.name, detail1: 'Customer (Buyer)', detail2: `${c.contact || 'N/A'} | ${c.email || 'N/A'}`, numericText: `Limit: ₹${(c.balance || 500000).toLocaleString()}`, status: c.status }));
      const suppRows = dbSuppliers.map(s => ({ id: `supp-${s.id}`, code: s.code, name: s.name, detail1: 'Supplier (Vendor)', detail2: `${s.contact || 'N/A'} | ${s.email || 'N/A'}`, numericText: `Limit: ₹${(s.balance || 1000000).toLocaleString()}`, status: s.status }));
      return [...custRows, ...suppRows];
    }
    if (module === 'companies' || module === 'masters/companies') return dbCompanies.map(c => {
      // Normalize numeric status enum from backend (0=Draft,1=Active,2=Archived) to display string
      let statusDisplay: string;
      if (typeof c.status === 'number') {
        statusDisplay = c.status === 1 ? 'Active' : c.status === 2 ? 'Archived' : 'Draft';
      } else {
        statusDisplay = c.status || (c.isActive ? 'Active' : 'Archived');
      }
      const gstin = c.taxRegistrationNumber || c.gstin || 'N/A';
      const currency = c.currencyCode || c.currency || 'INR';
      const location = c.city ? (c.state ? `${c.city}, ${c.state}` : c.city) : 'HQ';
      return { id: c.id, code: c.code, name: c.legalName, detail1: gstin, detail2: location, numericText: currency, status: statusDisplay };
    });
    if (module === 'branches' || module === 'masters/branches') return dbBranches.map(b => ({ id: b.id, code: b.code, name: b.name, detail1: b.companyName, detail2: b.city, numericText: b.isHeadquarters ? 'Headquarters' : 'Depot', status: b.status }));
    if (module === 'departments' || module === 'masters/departments') return dbDepartments.map(d => ({ id: d.id, code: d.code, name: d.name, detail1: d.branchName ? `Branch: ${d.branchName}` : (d.companyName ? `Company: ${d.companyName}` : 'Company Level'), detail2: d.description || 'Department', numericText: 'Dept', status: d.status }));
    if (module === 'employee-roles' || module === 'masters/employee-roles') return dbEmployeeRoles.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      detail1: r.companyName || 'Company Scoped',
      detail2: r.description || 'Employee Functional Role',
      numericText: r.companyName ? r.companyName.split(' ')[0] : 'Role',
      status: r.status || (r.isActive !== false ? 'Active' : 'Archived')
    }));
    if (module === 'designations' || module === 'masters/designations') return dbDesignations.map(d => ({ id: d.id, code: d.code, name: d.title, detail1: d.companyName || dbCompanies.find(c => c.id === d.companyId)?.legalName || '', detail2: `Level ${d.level}`, numericText: `Limit: ₹${(d.approvalLimit ?? 0).toLocaleString()}`, status: d.status }));
    if (module === 'employees' || module === 'masters/employees') return dbEmployees.map(e => ({
      id: e.id,
      code: e.employeeCode || e.code,
      name: e.fullName || `${e.firstName} ${e.lastName}`.trim(),
      detail1: e.employeeRoleName ? `Role: ${e.employeeRoleName}` : (e.email || '—'),
      detail2: `${e.designationTitle || '—'} | ${e.branchName ? e.branchName : 'Company Level'}${e.warehouseName ? ` | WH: ${e.warehouseName}` : ''}`,
      numericText: e.salary !== undefined && e.salary !== null && e.salary !== '' ? `₹${Number(e.salary).toLocaleString('en-IN')}` : '—',
      status: e.status
    }));
    if (module === 'products' || module === 'masters/products') return dbProducts.map(p => ({ id: p.id, code: p.code, name: p.name, detail1: p.categoryName || 'Unclassified', detail2: p.brandName || 'Unbranded', numericText: `₹${p.basePrice ?? p.price ?? 0}`, status: p.isActive ? 'Active' : 'Inactive' }));
    if (module === 'categories' || module === 'masters/categories') return dbCategories.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      detail1: c.parentCategoryName ? `Sub of: ${c.parentCategoryName}` : 'Root Category',
      detail2: `GST: ${c.gstTaxRatePercent ?? 5}% | HSN: ${c.hsnCodeDefault || '1006.30'}`,
      numericText: `${c.productCount || 0} SKUs`,
      status: c.status
    }));
    if (module === 'brands' || module === 'masters/brands') return dbBrands.map(b => ({ id: b.id, code: b.code, name: b.name, detail1: b.origin, detail2: '', numericText: `${b.productCount} SKUs`, status: b.status }));
    if (module === 'units' || module === 'masters/units') return dbUnits.map(u => ({ id: u.id, code: u.code, name: u.name, detail1: u.baseUnit, detail2: '', numericText: `Factor: ${u.conversionFactor}`, status: u.status }));
    if (module === 'warehouses' || module === 'masters/warehouses') return dbWarehouses.map(w => ({ id: w.id, code: w.code, name: w.name, detail1: w.branchName ? `Branch: ${w.branchName}` : (w.companyName ? `Company: ${w.companyName}` : (w.manager || 'Company Level')), detail2: w.address || w.warehouseType || 'Warehouse / Stockist', numericText: `${(w.capacitySft || w.storageAreaSqFt || 0).toLocaleString()} sq ft`, status: w.status }));
    if (module === 'customers' || module === 'masters/customers') return dbCustomers.map(c => ({
      id: c.id,
      code: c.code,
      name: c.legalName || c.name,
      detail1: c.customerType || 'Retailer',
      detail2: `${c.phone || c.contact || 'N/A'} | ${c.email || 'N/A'}`,
      numericText: `Limit: ₹${(c.creditLimit ?? c.balance ?? 0).toLocaleString('en-IN')}`,
      status: c.status
    }));
    if (module === 'suppliers' || module === 'masters/suppliers') return dbSuppliers.map(s => ({
      id: s.id,
      code: s.code,
      name: s.legalName || s.name,
      detail1: `${s.supplierType || 'Distributor / Stockist'}${s.companyName ? ` | ${s.companyName}` : ''}`,
      detail2: `Terms: Net ${s.paymentTermsDays ?? 30} Days | ${s.phone || s.contact || s.email || '—'}`,
      numericText: `Net ${s.paymentTermsDays ?? 30}D`,
      status: s.status
    }));
    return dbCompanies.map(c => ({ id: c.id, code: c.code, name: c.legalName, detail1: c.taxRegistrationNumber || c.gstin || 'N/A', detail2: c.city || 'HQ', numericText: c.currencyCode || c.currency || 'INR', status: typeof c.status === 'number' ? (c.status === 1 ? 'Active' : c.status === 2 ? 'Archived' : 'Draft') : (c.status || 'Active') }));
  };

  const rawRows = getActiveArray();
  const filteredRows = rawRows.filter(r => {
    const matchesSearch = r.code.toLowerCase().includes(searchQuery.toLowerCase()) || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.detail1.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRows = filteredRows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (!isCurrentModuleAllowed() || simulatedState === 'denied') {
    return null;
  }

  const ConfigIcon = config.icon;

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-white p-5 rounded-lg border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-brand-primary rounded-lg flex items-center justify-center">
            <ConfigIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] text-brand-text-secondary">
              <span>Platform</span>
              <span>/</span>
              <span>Master Data</span>
              <span>/</span>
              <span className="text-brand-text-primary font-bold">{config.name}</span>
            </div>
            <h1 className="text-lg font-bold text-brand-text-primary tracking-tight mt-0.5">{config.name} Registry</h1>
          </div>
        </div>

        {/* Developer Debug State Simulator - Hidden in Production */}
        {(typeof window !== 'undefined' && (window.location.search.includes('debug=true') || localStorage.getItem('debug_mode') === 'true')) && (
          <div className="flex items-center gap-2 bg-brand-bg-secondary p-1 rounded border border-brand-border self-start md:self-auto">
            <span className="text-[10px] text-brand-text-secondary font-bold px-2 uppercase tracking-wider">Debug State:</span>
            {(['normal', 'loading', 'empty', 'error', 'denied'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSimulatedState(st)}
                className={`px-2 py-1 text-[9px] font-bold rounded capitalize cursor-pointer transition ${
                  simulatedState === st ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* COMPANY DUAL-VIEW SWITCHER: Organization Hierarchy vs Master Registry Table */}
      {canAccessCompany && (module === 'companies' || module === 'masters/companies') && mode === 'list' && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setCompanyViewType('hierarchy')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                companyViewType === 'hierarchy'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-text-primary hover:bg-white/60'
              }`}
            >
              <Layers size={13} /> Organization Hierarchy
            </button>
            <button
              type="button"
              onClick={() => setCompanyViewType('table')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                companyViewType === 'table'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-text-primary hover:bg-white/60'
              }`}
            >
              <Table size={13} /> Master Registry Table
            </button>
          </div>

          {isSuper && (
            <button
              type="button"
              onClick={async () => {
                setFormCode(getNextAutoCode());
                setFormStatus('Active');
                setFormErrors({});
                setMode('create');
                try {
                  const nextCode = await masterDataService.fetchNextCompanyCode();
                  if (nextCode) setFormCode(nextCode);
                } catch {
                  // Fallback to getNextAutoCode() already set
                }
              }}
              className="px-3.5 py-1.5 bg-brand-primary text-white hover:bg-blue-700 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition self-start sm:self-auto"
            >
              <Plus size={13} /> Add New Company
            </button>
          )}
        </div>
      )}

      {/* SUB-MENU TABS FOR NON-COMPANY PAGES (Branches, Warehouses, Departments) */}
      {(canAccessCompany || canAccessBranch || canAccessWarehouse || canAccessDepartment) && (module.includes('branches') || module.includes('warehouses') || module.includes('departments')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Company Sub-Menus:</span>
          {canAccessCompany && (
            <a href="/masters/companies" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${(module === 'companies' || module === 'masters/companies') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Building size={13} /> Company
            </a>
          )}
          {canAccessBranch && (
            <a href="/masters/branches" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('branches') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Building size={13} /> Branches
            </a>
          )}
          {canAccessWarehouse && (
            <a href="/masters/warehouses" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('warehouses') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Building size={13} /> Warehouse / Stockist
            </a>
          )}
          {canAccessDepartment && (
            <a href="/masters/departments" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('departments') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Building size={13} /> Departments
            </a>
          )}
        </div>
      )}

      {/* PRODUCT DUAL-VIEW SWITCHER: Product Classification Hierarchy vs Master Registry Table */}
      {canAccessProduct && (module === 'products' || module === 'masters/products') && mode === 'list' && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setProductViewType('hierarchy')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                productViewType === 'hierarchy'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-text-primary hover:bg-white/60'
              }`}
            >
              <Layers size={13} /> Product Classification Hierarchy
            </button>
            <button
              type="button"
              onClick={() => setProductViewType('table')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                productViewType === 'table'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-text-primary hover:bg-white/60'
              }`}
            >
              <Table size={13} /> Master Registry Table
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormCode(getNextAutoCode());
              setProdName('');
              setProdBarcode('');
              setProdHsnCode('1006');
              setProdGstRate(5);
              setProdMrp(100);
              setProdBasePrice(80);
              setProdMinOrderQty(1);
              setProdShelfLifeDays(365);
              setProdIsBatchTracked(true);
              setFormStatus('Active');
              setFormErrors({});
              if (dbCompanies[0]?.id) setProdCompanyId(dbCompanies[0].id);
              setProdCategoryId(''); // Category is OPTIONAL — default to no selection
              setProdBrandId('');   // Brand is OPTIONAL — default to no selection
              if (dbUnits[0]?.id) setProdBaseUomId(dbUnits[0].id);
              setMode('create');
            }}
            className="px-3.5 py-1.5 bg-brand-primary text-white hover:bg-blue-700 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition self-start sm:self-auto"
          >
            <Plus size={13} /> Add New SKU
          </button>
        </div>
      )}

      {/* SUB-MENU TABS FOR NON-PRODUCT PAGES (Categories, Brands, Units) */}
      {(canAccessProduct || canAccessCategory || canAccessBrand || canAccessUnit) && (module.includes('categories') || module.includes('brands') || module.includes('units')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Product Sub-Menus:</span>
          {canAccessProduct && (
            <a href="/masters/products" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${(module === 'products' || module === 'masters/products') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Boxes size={13} /> Products
            </a>
          )}
          {canAccessCategory && (
            <a href="/masters/categories" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('categories') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Tags size={13} /> Category
            </a>
          )}
          {canAccessBrand && (
            <a href="/masters/brands" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('brands') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <ClipboardList size={13} /> Brands
            </a>
          )}
          {canAccessUnit && (
            <a href="/masters/units" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('units') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Boxes size={13} /> Units of Measure
            </a>
          )}
        </div>
      )}

      {(canAccessEmployee || canAccessEmployeeRole || canAccessDesignation) && (module.includes('employees') || module.includes('employee-roles') || module.includes('designations')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Employee Sub-Menus:</span>
          {canAccessEmployee && (
            <a href="/masters/employees" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('employees') && !module.includes('employee-roles') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <User size={13} /> Employees Roster
            </a>
          )}
          {canAccessEmployeeRole && (
            <a href="/masters/employee-roles" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('employee-roles') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <UserCheck size={13} /> Employee Roles
            </a>
          )}
          {canAccessDesignation && (
            <a href="/masters/designations" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('designations') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Briefcase size={13} /> Designation
            </a>
          )}
        </div>
      )}

      {/* DISPLAY WINDOW WITH REAL & DEBUG STATE HANDLING */}
      {simulatedState === 'loading' ? (
        <div className="bg-white p-24 border border-brand-border rounded-lg text-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto" />
          <p className="text-xs text-brand-text-secondary font-medium">Loading real-time {config.name.toLowerCase()} master data from PostgreSQL...</p>
        </div>
      ) : simulatedState === 'error' ? (
        <div className="bg-white p-12 border border-brand-border rounded-lg text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <div className="w-12 h-12 bg-red-50 text-brand-danger rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-text-primary">Master Data Connection Exception</h3>
            <p className="text-xs text-brand-text-secondary mt-1">Unable to communicate with the master data REST controller service or database connection pool.</p>
          </div>
          <button
            onClick={() => setSimulatedState('normal')}
            className="px-4 py-2 bg-brand-primary text-white font-bold text-xs rounded hover:bg-blue-700 transition cursor-pointer shadow-xs"
          >
            Retry Loading Data
          </button>
        </div>
      ) : simulatedState === 'denied' ? (
        <div className="bg-white p-12 border border-brand-border rounded-lg text-center space-y-4 shadow-sm max-w-lg mx-auto">
          <div className="w-12 h-12 bg-amber-50 text-brand-warning rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-text-primary">Access Permission Restricted</h3>
            <p className="text-xs text-brand-text-secondary mt-1">Your current user account role lacks permissions to access or configure {config.name.toLowerCase()} master data records.</p>
          </div>
          <button
            onClick={() => setSimulatedState('normal')}
            className="px-4 py-2 border border-brand-border text-brand-text-primary font-bold text-xs rounded hover:bg-brand-bg-secondary transition cursor-pointer"
          >
            Return to Default State
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* LIST VIEW */}
          {mode === 'list' && (
            (module === 'companies' || module === 'masters/companies') && companyViewType === 'hierarchy' ? (
              <CompanyOrganizationHierarchy
                companies={dbCompanies}
                branches={dbBranches}
                warehouses={dbWarehouses}
                departments={dbDepartments}
                selectedCompanyId={hierarchySelectedCompanyId || dbCompanies[0]?.id || null}
                onSelectCompany={(companyId) => setHierarchySelectedCompanyId(companyId)}
                onEditCompany={(companyId) => {
                  if (!isSuper) return;
                  setSelectedId(companyId);
                  populateForm(companyId);
                  setMode('edit');
                }}
                onAddNewBranch={(companyId) => {
                  setBranchCompanyId(companyId);
                  const parent = dbCompanies.find(c => c.id === companyId);
                  if (parent?.gstin) {
                    setBranchGstin(parent.gstin);
                  }
                  window.location.href = '/masters/branches';
                }}
                onAddNewWarehouse={(companyId) => {
                  setWhCompanyId(companyId);
                  window.location.href = '/masters/warehouses';
                }}
                onAddNewDepartment={(companyId) => {
                  const companyBranches = dbBranches.filter(b => b.companyId === companyId);
                  if (companyBranches.length > 0) {
                    setDeptBranchId(companyBranches[0].id);
                  }
                  window.location.href = '/masters/departments';
                }}
                onViewFullRegistry={() => setCompanyViewType('table')}
                isLoading={simulatedState === 'loading'}
              />
            ) : (module === 'products' || module === 'masters/products') && productViewType === 'hierarchy' ? (
              <ProductClassificationHierarchy
                products={dbProducts}
                categories={dbCategories}
                brands={dbBrands}
                unitsOfMeasure={dbUnits}
                selectedProductId={hierarchySelectedProductId || dbProducts[0]?.id || null}
                onSelectProduct={(productId) => setHierarchySelectedProductId(productId)}
                onEditProduct={(productId) => {
                  setSelectedId(productId);
                  populateForm(productId);
                  setMode('edit');
                }}
                onViewFullRegistry={() => setProductViewType('table')}
                onCreateCategory={canAccessCategory ? () => {
                  window.location.href = '/masters/categories';
                } : undefined}
                isLoading={simulatedState === 'loading'}
              />
            ) : (
              <div className="space-y-4">
                {/* COMPANY SUB-MENUS: Displayed ONLY in Master Registry Table View */}
                {(module === 'companies' || module === 'masters/companies') && (
                  <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Company Sub-Menus:</span>
                    {canAccessCompany && (
                      <a href="/masters/companies" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition bg-brand-primary text-white shadow-xs">
                        <Building size={13} /> Company
                      </a>
                    )}
                    {canAccessBranch && (
                      <a href="/masters/branches" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition text-slate-700 hover:bg-slate-100">
                        <Building size={13} /> Branches
                      </a>
                    )}
                    {canAccessWarehouse && (
                      <a href="/masters/warehouses" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition text-slate-700 hover:bg-slate-100">
                        <Building size={13} /> Warehouse / Stockist
                      </a>
                    )}
                    {canAccessDepartment && (
                      <a href="/masters/departments" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition text-slate-700 hover:bg-slate-100">
                        <Building size={13} /> Departments
                      </a>
                    )}
                  </div>
                )}

                {/* PRODUCT SUB-MENUS: Displayed ONLY in Master Registry Table View */}
                {(module === 'products' || module === 'masters/products') && (
                  <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Product Sub-Menus:</span>
                    {canAccessProduct && (
                      <a href="/masters/products" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition bg-brand-primary text-white shadow-xs">
                        <Boxes size={13} /> Products
                      </a>
                    )}
                    {canAccessCategory && (
                      <a href="/masters/categories" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition text-slate-700 hover:bg-slate-100">
                        <Tags size={13} /> Category
                      </a>
                    )}
                    {canAccessBrand && (
                      <a href="/masters/brands" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition text-slate-700 hover:bg-slate-100">
                        <ClipboardList size={13} /> Brands
                      </a>
                    )}
                    {canAccessUnit && (
                      <a href="/masters/units" className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition text-slate-700 hover:bg-slate-100">
                        <Boxes size={13} /> Units of Measure
                      </a>
                    )}
                  </div>
                )}

                <div className="bg-white border border-brand-border rounded-lg shadow-sm-flat overflow-hidden flex flex-col">
                  
                  <div className="p-4 border-b border-brand-border bg-brand-bg-secondary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:max-w-2xl">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-brand-text-secondary" />
                        <input
                          type="text"
                          placeholder={`Search ${config.name.toLowerCase()}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary text-brand-text-primary"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                        <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Status:</span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="text-xs bg-white border border-brand-border rounded px-2 py-1 focus:outline-none focus:border-brand-primary text-brand-text-primary font-medium"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Active">Active Only</option>
                          {(module === 'companies' || module === 'masters/companies') ? (
                            <>
                              <option value="Archived">Archived Only</option>
                              <option value="Draft">Draft Only</option>
                            </>
                          ) : (
                            <option value="Inactive">Inactive Only</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                      {((module !== 'companies' && module !== 'masters/companies') || isSuper) && (
                        <button
                          onClick={async () => {
                            setFormCode(getNextAutoCode());
                            setFormStatus('Active');
                            setFormErrors({});
                            if (module === 'companies' || module === 'masters/companies') {
                              try {
                                const nextCode = await masterDataService.fetchNextCompanyCode();
                                if (nextCode) setFormCode(nextCode);
                              } catch {
                                // Fallback to getNextAutoCode()
                              }
                            } else if (module === 'suppliers' || module === 'masters/suppliers') {
                              setPartnerRole('Supplier');
                              if (dbCompanies[0]?.id) setSuppCompanyId(dbCompanies[0].id);
                              setSuppLegalName('');
                              setSuppTradeName('');
                              setSuppType('Distributor / Stockist');
                              setSuppContactPerson('');
                              setSuppEmail('');
                              setSuppPhone('');
                              setSuppGstin('');
                              setSuppPan('');
                              setSuppPaymentTermsDays(30);
                              setSuppAddrLine1('');
                              setSuppAddrLine2('');
                              setSuppCity('');
                              setSuppState('');
                              setSuppPostalCode('');
                              setSuppCountry('India');
                              try {
                                const nextCode = await masterDataService.fetchNextSupplierCode(dbCompanies[0]?.id);
                                if (nextCode) setFormCode(nextCode);
                              } catch {}
                            } else if (module === 'customers' || module === 'masters/customers') {
                              setPartnerRole('Customer');
                              if (dbCompanies[0]?.id) setCustCompanyId(dbCompanies[0].id);
                              setCustLegalName('');
                              setCustTradeName('');
                              setCustType('Retailer');
                              setCustEmail('');
                              setCustPhone('');
                              setCustGstin('');
                              setCustPan('');
                              setCustAddrLine1('');
                              setCustAddrLine2('');
                              setCustCity('');
                              setCustState('');
                              setCustPostalCode('');
                              setCustCountry('India');
                              setCustCreditLimit(50000);
                              setCustCreditDays(30);
                              setCustSalesRouteId('');
                            } else if (module === 'branches' || module === 'masters/branches') {
                              const parent = dbCompanies.find(c => c.id === branchCompanyId) || dbCompanies[0];
                              if (parent) {
                                setBranchCompanyId(parent.id);
                                if (parent.gstin) setBranchGstin(parent.gstin);
                              }
                            } else if (module === 'employees' || module === 'masters/employees') {
                              if (dbCompanies[0]?.id) setEmpCompanyId(dbCompanies[0].id);
                              setEmpBranchId('');
                              setEmpDepartmentId('');
                              setEmpWarehouseId('');
                              setEmpRoleId('');
                              setEmpDesignationId('');
                              setEmpFirstName('');
                              setEmpLastName('');
                              setEmpEmail('');
                              setEmpPhone('');
                              setEmpSalary('');
                              setEmpJoiningDate(new Date().toISOString().split('T')[0]);
                            }
                            setMode('create');
                          }}
                          className="px-3.5 py-1.5 bg-brand-primary text-white hover:bg-blue-700 rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm transition"
                        >
                          <Plus size={13} /> Add New {config.singular}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isSuper && (module === 'companies' || module === 'masters/companies') && dbCompanies.length === 0 && (
                    <div className="mx-4 my-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span>No company has been assigned to your account. Please contact the Super Administrator.</span>
                    </div>
                  )}

                  {/* TABLE CONTAINER */}
                  <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                      <thead className="bg-brand-bg-secondary border-b border-brand-border sticky top-0 z-10">
                        <tr className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                          <th className="p-3 w-32">Code</th>
                          <th className="p-3">Primary Identifier / Name</th>
                          <th className="p-3 w-48">Primary Attribute</th>
                          <th className="p-3 w-48">Secondary Attribute</th>
                          <th className="p-3 w-40 text-right">Metrics / Limit</th>
                          <th className="p-3 w-28 text-center">Status</th>
                          <th className="p-3 w-28 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {simulatedState === 'empty' || paginatedRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-brand-text-secondary text-xs font-medium">
                              No {config.name.toLowerCase()} master data records found matching your query.
                            </td>
                          </tr>
                        ) : (
                          paginatedRows.map((row) => (
                            <tr key={row.id} className="hover:bg-brand-bg-secondary/40 transition text-xs">
                              <td className="p-3 font-mono font-bold text-brand-text-primary">{row.code}</td>
                              <td className="p-3 font-semibold text-brand-text-primary truncate">{row.name}</td>
                              <td className="p-3 text-brand-text-secondary truncate">{row.detail1}</td>
                              <td className="p-3 text-brand-text-secondary truncate">{row.detail2}</td>
                              <td className="p-3 text-right font-mono font-semibold">{row.numericText}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Active' ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Tooltip content="View Details">
                                    <button onClick={() => { setSelectedId(row.id); populateForm(row.id); setMode('view'); }} aria-label="View Details" className="p-1 text-brand-text-secondary hover:text-brand-primary hover:bg-blue-50 rounded cursor-pointer transition"><Eye size={13} /></button>
                                  </Tooltip>
                                  {(isSuper || (module !== 'companies' && module !== 'masters/companies')) && (
                                    <>
                                      <Tooltip content="Edit Record">
                                        <button onClick={() => { setSelectedId(row.id); populateForm(row.id); setMode('edit'); }} aria-label="Edit Record" className="p-1 text-brand-text-secondary hover:text-brand-primary hover:bg-blue-50 rounded cursor-pointer transition"><Edit2 size={13} /></button>
                                      </Tooltip>
                                      <Tooltip content="Delete Record">
                                        <button onClick={() => setDeleteId(row.id)} aria-label="Delete Record" className="p-1 text-brand-text-secondary hover:text-brand-danger hover:bg-red-50 rounded cursor-pointer transition"><Trash2 size={13} /></button>
                                      </Tooltip>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION */}
                  <div className="p-4 border-t border-brand-border bg-brand-bg-secondary/10 flex items-center justify-between text-xs">
                    <span className="text-brand-text-secondary">Total {totalRows} records</span>
                    <div className="flex items-center gap-1">
                      <Tooltip content="Previous Page">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous Page" className="p-1.5 border rounded disabled:opacity-40"><ChevronLeft size={13} /></button>
                      </Tooltip>
                      <span className="font-bold px-2">Page {currentPage} of {totalPages}</span>
                      <Tooltip content="Next Page">
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next Page" className="p-1.5 border rounded disabled:opacity-40"><ChevronRight size={13} /></button>
                      </Tooltip>
                    </div>
                  </div>

                </div>
              </div>
            )
          )}

          {/* READ-ONLY VIEW MODE */}
          {mode === 'view' && selectedId && (
            <div className="bg-white border border-brand-border rounded-lg shadow-sm-flat p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => { setMode('list'); setSelectedId(null); }}
                    className="inline-flex items-center gap-1 text-xs text-brand-primary font-bold hover:underline mb-2 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Back to Master Registry List
                  </button>
                  <h2 className="text-lg font-bold text-brand-text-primary">
                    {config.singular} Read-Only Master Record Profile
                  </h2>
                  <p className="text-xs text-brand-text-secondary">Official ERP Master Registry specifications and metadata.</p>
                </div>

                <div className="flex items-center gap-3">
                  {(isSuper || (module !== 'companies' && module !== 'masters/companies')) && (
                    <button
                      type="button"
                      onClick={() => setMode('edit')}
                      className="px-3.5 py-1.5 border border-brand-border text-brand-text-primary hover:bg-brand-bg-secondary font-bold text-xs rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={13} /> Edit Specifications
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setMode('list'); setSelectedId(null); }}
                    className="px-4 py-1.5 bg-brand-primary text-white hover:bg-blue-700 font-bold text-xs rounded transition cursor-pointer shadow-sm"
                  >
                    Done Reviewing
                  </button>
                </div>
              </div>

              {/* READ-ONLY FIELD CARDS GRID */}
              {(module === 'companies' || module === 'masters/companies') ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Column 1: Company Identity */}
                  <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                    <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <Building size={14} className="text-brand-primary" /> Company Identity
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Company Code</span>
                        <span className="font-mono text-sm font-bold text-brand-primary">{formCode || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Legal Entity Name</span>
                        <span className="font-semibold text-brand-text-primary text-sm">{compLegalName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Trade / Brand Name</span>
                        <span className="font-medium text-brand-text-primary">{compTradeName || 'Same as Legal Name'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${formStatus === 'Active' ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                          {formStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Tax & Financial Parameters */}
                  <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                    <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <ShieldCheck size={14} className="text-brand-primary" /> Tax & Financial Controls
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">GSTIN (Tax ID)</span>
                        <span className="font-mono font-bold text-brand-text-primary">{compGstin || 'Not Registered'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">PAN Account</span>
                        <span className="font-mono font-bold text-brand-text-primary">{compPan || 'Not Registered'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Base Currency</span>
                        <span className="font-mono font-bold text-brand-primary">{compCurrency || 'INR (₹)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Communication & Registered Office */}
                  <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                    <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <MapPin size={14} className="text-brand-primary" /> Communication & Registered Office
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Corporate Email</span>
                        <span className="font-medium text-brand-text-primary">{compEmail || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Phone Number</span>
                        <span className="font-medium text-brand-text-primary">{compPhone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Registered Address</span>
                        <span className="font-medium text-brand-text-primary">{addrLine1 ? `${addrLine1}, ${addrCity}, ${addrState} ${addrPostalCode}, ${addrCountry}` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (module === 'products' || module === 'masters/products') ? (
                /* PRODUCT-SPECIFIC READ-ONLY VIEW */
                <div className="space-y-6 text-xs">
                  {/* Row 1: Identity */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Product Identity */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Boxes size={14} className="text-brand-primary" /> Product Identity
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Product Code</span>
                          <span className="font-mono text-sm font-bold text-brand-primary">{formCode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">SKU</span>
                          <span className="font-mono font-bold text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.sku || formCode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Product Name</span>
                          <span className="font-semibold text-brand-text-primary text-sm">{prodName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${formStatus === 'Active' ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                            {formStatus}
                          </span>
                        </div>
                        {dbProducts.find(p => p.id === selectedId)?.companyName && (
                          <div>
                            <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Company</span>
                            <span className="font-medium text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.companyName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Classification */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Tags size={14} className="text-brand-primary" /> Classification
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Category</span>
                          <span className="font-medium text-brand-text-primary">
                            {dbProducts.find(p => p.id === selectedId)?.categoryName || <span className="text-slate-400 italic font-normal">Not Applicable</span>}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Brand</span>
                          <span className="font-medium text-brand-text-primary">
                            {dbProducts.find(p => p.id === selectedId)?.brandName || <span className="text-slate-400 italic font-normal">Not Applicable</span>}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Base Unit of Measure</span>
                          <span className="font-mono font-bold text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.baseUomCode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">HSN Code</span>
                          <span className="font-mono font-bold text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.hsnCode || prodHsnCode || 'N/A'}</span>
                        </div>
                        {dbProducts.find(p => p.id === selectedId)?.barcode && (
                          <div>
                            <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Barcode / EAN</span>
                            <span className="font-mono text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.barcode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <ShieldCheck size={14} className="text-brand-primary" /> Pricing & Taxation
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">MRP</span>
                          <span className="font-mono text-lg font-bold text-brand-primary">₹{(dbProducts.find(p => p.id === selectedId)?.mrp ?? prodMrp ?? 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Base B2B Price</span>
                          <span className="font-mono font-bold text-brand-text-primary">₹{(dbProducts.find(p => p.id === selectedId)?.basePrice ?? prodBasePrice ?? 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">GST Rate</span>
                          <span className="font-mono font-bold text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.gstRatePercent ?? prodGstRate ?? 5}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Logistics */}
                  <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border">
                    <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 mb-3">
                      <MapPin size={14} className="text-brand-primary" /> Logistics & Inventory Controls
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Min. Order Qty</span>
                        <span className="font-mono font-bold text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.minOrderQty ?? prodMinOrderQty ?? 1}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Shelf Life</span>
                        <span className="font-mono font-bold text-brand-text-primary">{dbProducts.find(p => p.id === selectedId)?.shelfLifeDays ?? prodShelfLifeDays ?? '—'} days</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Batch Tracking</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${(dbProducts.find(p => p.id === selectedId)?.isBatchTracked ?? prodIsBatchTracked) ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                          {(dbProducts.find(p => p.id === selectedId)?.isBatchTracked ?? prodIsBatchTracked) ? 'Enabled (FEFO)' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Record GUID</span>
                        <span className="font-mono text-[10px] text-brand-text-secondary break-all">{selectedId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (module === 'customers' || module === 'masters/customers') ? (
                /* CUSTOMER-SPECIFIC READ-ONLY VIEW */
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Card 1: Identity & Classification */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Users2 size={14} className="text-brand-primary" /> Identity & Classification
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Customer Code</span>
                          <span className="font-mono text-sm font-bold text-brand-primary">{formCode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Customer Name</span>
                          <span className="font-semibold text-brand-text-primary text-sm">{custLegalName || 'N/A'}</span>
                        </div>
                        {custTradeName && (
                          <div>
                            <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Customer / Store Name</span>
                            <span className="font-medium text-brand-text-primary">{custTradeName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Channel / Customer Type</span>
                          <span className="font-semibold text-brand-text-primary">{custType || 'Retailer'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${formStatus === 'Active' ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                            {formStatus}
                          </span>
                        </div>
                        {dbCustomers.find(c => c.id === selectedId)?.companyName && (
                          <div>
                            <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Parent Company</span>
                            <span className="font-medium text-brand-text-primary">{dbCustomers.find(c => c.id === selectedId)?.companyName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Tax & Legal */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <ShieldCheck size={14} className="text-brand-primary" /> Tax & Legal Controls
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">GSTIN (Tax ID)</span>
                          <span className="font-mono font-bold text-brand-text-primary">{custGstin || 'Not Registered'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">PAN Number</span>
                          <span className="font-mono font-bold text-brand-text-primary">{custPan || 'Not Registered'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Base Currency</span>
                          <span className="font-mono font-bold text-brand-primary">INR (₹)</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Financial & Credit Controls */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <CreditCard size={14} className="text-brand-primary" /> Financial & Credit Terms
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Approved Credit Limit</span>
                          <span className="font-mono text-base font-bold text-brand-primary">₹{(custCreditLimit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Payment Term (Days)</span>
                          <span className="font-mono font-bold text-brand-text-primary">{custCreditDays ?? 30} Days</span>
                        </div>
                        {custSalesRouteId && (
                          <div>
                            <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Assigned Route GUID</span>
                            <span className="font-mono text-[10px] text-brand-text-secondary break-all">{custSalesRouteId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 4: Contact & Delivery Address */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <MapPin size={14} className="text-brand-primary" /> Contact & Delivery Location
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Email Address</span>
                          <span className="font-medium text-brand-text-primary break-all">{custEmail || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Phone Number</span>
                          <span className="font-mono font-medium text-brand-text-primary">{custPhone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Billing & Shipping Address</span>
                          <span className="font-medium text-brand-text-primary block leading-relaxed">
                            {custAddrLine1 ? (
                              <>
                                {custAddrLine1}
                                {custAddrLine2 && <>, {custAddrLine2}</>}
                                <br />
                                {custCity}, {custState} {custPostalCode}
                                <br />
                                {custCountry || 'India'}
                              </>
                            ) : (
                              'N/A'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (module === 'suppliers' || module === 'masters/suppliers') ? (
                /* SUPPLIER-SPECIFIC READ-ONLY VIEW */
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Card 1: Identity & Classification */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Building size={14} className="text-brand-primary" /> Identity & Classification
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Supplier Code</span>
                          <span className="font-mono text-sm font-bold text-brand-primary">{formCode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Supplier Name</span>
                          <span className="font-semibold text-brand-text-primary text-sm">{suppLegalName || 'N/A'}</span>
                        </div>
                        {suppTradeName && (
                          <div>
                            <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Supplier / Business Name</span>
                            <span className="font-medium text-brand-text-primary">{suppTradeName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Supplier Type</span>
                          <span className="font-semibold text-brand-text-primary">{suppType || 'Distributor / Stockist'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${formStatus === 'Active' ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                            {formStatus}
                          </span>
                        </div>
                        {dbSuppliers.find(s => s.id === selectedId)?.companyName && (
                          <div>
                            <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Parent Company</span>
                            <span className="font-medium text-brand-text-primary">{dbSuppliers.find(s => s.id === selectedId)?.companyName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Tax & Compliance */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <ShieldCheck size={14} className="text-brand-primary" /> Tax & Compliance
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">GSTIN (Tax ID)</span>
                          <span className="font-mono font-bold text-brand-text-primary">{suppGstin || 'Not Registered'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">PAN Number</span>
                          <span className="font-mono font-bold text-brand-text-primary">{suppPan || 'Not Registered'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Currency</span>
                          <span className="font-mono font-bold text-brand-primary">INR (₹)</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Commercial & Payment Terms */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <CreditCard size={14} className="text-brand-primary" /> Commercial & Payment Terms
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Payment Terms</span>
                          <span className="font-mono text-base font-bold text-brand-primary">Net {suppPaymentTermsDays ?? 30} Days</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Payment Policy</span>
                          <span className="font-medium text-brand-text-primary">
                            {(suppPaymentTermsDays === 0 || suppPaymentTermsDays === '0') ? 'Immediate / Advance' : `Credit window: ${suppPaymentTermsDays} days from invoice`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Contact & Registered Office */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <MapPin size={14} className="text-brand-primary" /> Contact & Registered Office
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Official Email</span>
                          <span className="font-medium text-brand-text-primary break-all">{suppEmail || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Phone Number</span>
                          <span className="font-mono font-medium text-brand-text-primary">{suppPhone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Registered Address</span>
                          <span className="font-medium text-brand-text-primary block leading-relaxed">
                            {suppAddrLine1 ? (
                              <>
                                {suppAddrLine1}
                                {suppAddrLine2 && <>, {suppAddrLine2}</>}
                                <br />
                                {suppCity}, {suppState} {suppPostalCode}
                                <br />
                                {suppCountry || 'India'}
                              </>
                            ) : (
                              'N/A'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (module === 'employees' || module === 'masters/employees') ? (
                /* EMPLOYEE-SPECIFIC READ-ONLY VIEW */
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Card 1: Identity */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <User size={14} className="text-brand-primary" /> Identity & Profile
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Employee Code</span>
                          <span className="font-mono text-sm font-bold text-brand-primary">{formCode || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Full Name</span>
                          <span className="font-semibold text-brand-text-primary text-sm">{`${empFirstName} ${empLastName}`.trim() || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${formStatus === 'Active' ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                            {formStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Organization */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Building2 size={14} className="text-brand-primary" /> Organization Assignment
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Parent Company</span>
                          <span className="font-semibold text-brand-text-primary">{dbCompanies.find(c => c.id === empCompanyId)?.legalName || dbEmployees.find(e => e.id === selectedId)?.companyName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Branch Location</span>
                          <span className="font-medium text-brand-text-primary">
                            {dbBranches.find(b => b.id === empBranchId)?.name || dbEmployees.find(e => e.id === selectedId)?.branchName || <span className="text-slate-500 font-normal italic">Not Assigned / Company Level</span>}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Warehouse / Stockist</span>
                          <span className="font-medium text-brand-text-primary">
                            {dbWarehouses.find(w => w.id === empWarehouseId)?.name || dbEmployees.find(e => e.id === selectedId)?.warehouseName || <span className="text-slate-400 italic">None (Company Direct)</span>}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Department</span>
                          <span className="font-medium text-brand-text-primary">{dbDepartments.find(d => d.id === empDepartmentId)?.name || dbEmployees.find(e => e.id === selectedId)?.departmentName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Employee Role</span>
                          <span className="font-medium text-brand-text-primary">
                            {dbEmployeeRoles.find(r => r.id === empRoleId)?.name || dbEmployees.find(e => e.id === selectedId)?.employeeRoleName || <span className="text-slate-400 italic">Not Assigned</span>}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Designation</span>
                          <span className="font-medium text-brand-text-primary">{dbDesignations.find(d => d.id === empDesignationId)?.title || dbEmployees.find(e => e.id === selectedId)?.designationTitle || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Employment & Compensation */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Briefcase size={14} className="text-brand-primary" /> Employment & Compensation
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Joining Date</span>
                          <span className="font-mono font-bold text-brand-text-primary">{empJoiningDate || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Monthly Salary</span>
                          <span className="font-mono text-base font-bold text-brand-primary">
                            {empSalary !== '' && empSalary !== null && empSalary !== undefined ? `₹${Number(empSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Not Disclosed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Contact & Communication */}
                    <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                      <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Mail size={14} className="text-brand-primary" /> Communication & Contact
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Official Email</span>
                          <span className="font-medium text-brand-text-primary break-all">{empEmail || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Phone Number</span>
                          <span className="font-mono font-medium text-brand-text-primary">{empPhone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Column 1: Core Identifier Card */}
                  <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                    <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <Building size={14} className="text-brand-primary" /> Identity Specifications
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Record Code</span>
                        <span className="font-mono text-sm font-bold text-brand-primary">{formCode || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Legal Entity / Title</span>
                        <span className="font-semibold text-brand-text-primary text-sm">{branchName || deptName || desigTitle || `${empFirstName} ${empLastName}`.trim() || catName || brandName || uomName || whName || custLegalName || suppLegalName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${formStatus === 'Active' ? 'bg-green-50 text-brand-success border border-green-200' : 'bg-gray-50 text-brand-text-secondary border'}`}>
                          {formStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Commercial & Tax Parameters */}
                  <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                    <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <ShieldCheck size={14} className="text-brand-primary" /> Tax & Trade Controls
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">GSTIN / Tax ID</span>
                        <span className="font-mono font-bold text-brand-text-primary">{branchGstin || custGstin || suppGstin || 'Not Registered'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">PAN Account</span>
                        <span className="font-mono font-bold text-brand-text-primary">{custPan || suppPan || 'Not Registered'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Base Currency / Pricing</span>
                        <span className="font-mono font-bold text-brand-primary">INR (₹)</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Contact & Address */}
                  <div className="bg-brand-bg-secondary/30 p-4 rounded-lg border border-brand-border space-y-3">
                    <h3 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <MapPin size={14} className="text-brand-primary" /> Communication & Location
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Email</span>
                        <span className="font-medium text-brand-text-primary">{branchEmail || empEmail || custEmail || suppEmail || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Phone</span>
                        <span className="font-medium text-brand-text-primary">{branchPhone || empPhone || custPhone || suppPhone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Address</span>
                        <span className="font-medium text-brand-text-primary">{addrLine1 ? `${addrLine1}, ${addrCity}, ${addrState}` : 'Headquarters'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 text-[10px] text-brand-text-secondary font-mono flex flex-col sm:flex-row items-center justify-between gap-2 bg-brand-bg-secondary/20 p-3 rounded">
                <p>RECORD GUID: {selectedId}</p>
                <p>SCHEMA: postgresql.master_data.{config.endpoint}</p>
                <p>VERIFICATION: PostgreSQL 17 / Clean Architecture CQRS</p>
              </div>

            </div>
          )}

          {/* CREATE & EDIT FORM MODE — DEDICATED FORMS FOR ALL 12 ENTITIES */}
          {(mode === 'create' || mode === 'edit') && (
            (!isSuper && (module === 'companies' || module === 'masters/companies')) ? (
              <div className="bg-white border border-brand-border rounded-lg shadow-sm-flat p-8 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-12 h-12 bg-amber-50 text-brand-warning rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary">Company Master is Read-Only</h3>
                  <p className="text-xs text-brand-text-secondary mt-1">
                    Company creation and modification are restricted to the Super Administrator. Standard Administrators have view-only access to their assigned company.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('list'); setSelectedId(null); }}
                  className="px-4 py-2 bg-brand-primary text-white font-bold text-xs rounded hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  Return to Company Overview
                </button>
              </div>
            ) : (
            <form onSubmit={handleSave} noValidate className="bg-white border border-brand-border rounded-lg shadow-sm-flat p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => { setMode('list'); setSelectedId(null); }}
                    className="inline-flex items-center gap-1 text-xs text-brand-primary font-bold hover:underline mb-2 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Back to Master Registry List
                  </button>
                  <h2 className="text-lg font-bold text-brand-text-primary">
                    {mode === 'create' ? 'Create New' : 'Edit'} {config.singular} Master Record
                  </h2>
                  <p className="text-xs text-brand-text-secondary">Configure specific business attributes in accordance with FMCG ERP Business Blueprint.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setMode('list'); setSelectedId(null); }}
                    className="px-3.5 py-1.5 border border-brand-border text-brand-text-primary hover:bg-brand-bg-secondary font-bold text-xs rounded transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-brand-primary text-white hover:bg-blue-700 font-bold text-xs rounded transition cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {mode === 'create' ? 'Save New Record' : 'Save Changes'}
                  </button>
                </div>
              </div>



              {/* DEDICATED FORM LAYOUTS FOR ALL 12 ENTITIES */}
              
              {/* 1. COMPANY FORM */}
              {(module === 'companies' || module === 'masters/companies') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Company Code <span className="text-red-500">*</span></label>
                      <input 
                        id="code" 
                        type="text" 
                        value={formCode} 
                        readOnly 
                        disabled={true} 
                        title="Code is auto-generated and cannot be changed manually." 
                        className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="COM-001" 
                      />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compLegalName" className="font-bold text-brand-text-primary">Legal Entity Name <span className="text-red-500">*</span></label>
                      <input id="compLegalName" type="text" value={compLegalName} onChange={e => setCompLegalName(e.target.value)} className={`w-full p-2 border rounded ${formErrors.compLegalName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="INK FMCG Private Limited" />
                      {formErrors.compLegalName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.compLegalName}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compTradeName" className="font-bold text-brand-text-primary">Trade / Brand Name</label>
                      <input id="compTradeName" type="text" value={compTradeName} onChange={e => setCompTradeName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="INK Foods" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="compGstin" className="font-bold text-brand-text-primary">GSTIN (Tax ID) <span className="text-red-500">*</span></label>
                      <input id="compGstin" type="text" maxLength={15} value={compGstin} onChange={e => setCompGstin(e.target.value.toUpperCase())} className={`w-full p-2 border rounded uppercase font-mono ${formErrors.compGstin ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="07AAAAA0000A1Z5" />
                      {formErrors.compGstin && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.compGstin}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compPan" className="font-bold text-brand-text-primary">PAN Number <span className="text-red-500">*</span></label>
                      <input id="compPan" type="text" maxLength={10} value={compPan} onChange={e => setCompPan(e.target.value.toUpperCase())} className={`w-full p-2 border rounded uppercase font-mono ${formErrors.compPan ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="AAAAA0000A" />
                      {formErrors.compPan && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.compPan}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compEmail" className="font-bold text-brand-text-primary">Corporate Email <span className="text-red-500">*</span></label>
                      <input id="compEmail" type="email" value={compEmail} onChange={e => setCompEmail(e.target.value)} className={`w-full p-2 border rounded ${formErrors.compEmail ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="hq@ink-fmcg.com" />
                      {formErrors.compEmail && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.compEmail}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compPhone" className="font-bold text-brand-text-primary">Phone Number <span className="text-red-500">*</span></label>
                      <input id="compPhone" type="text" value={compPhone} onChange={e => setCompPhone(e.target.value)} className={`w-full p-2 border rounded ${formErrors.compPhone ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="+91 11 4500 8800" />
                      {formErrors.compPhone && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.compPhone}</p>}
                    </div>
                  </div>

                  <div className="p-4 bg-brand-bg-secondary/30 rounded-lg border space-y-3">
                    <h4 className="font-bold text-brand-text-primary flex items-center gap-1.5"><MapPin size={14} /> Registered Address & Base Currency</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="font-semibold text-brand-text-secondary">Address Line 1</label>
                        <input type="text" value={addrLine1} onChange={e => setAddrLine1(e.target.value)} className="w-full p-2 border rounded bg-white border-brand-border" placeholder="Plot 101, Okhla Estate" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-brand-text-secondary">Base Currency</label>
                        <select value={compCurrency} onChange={e => setCompCurrency(e.target.value)} className="w-full p-2 border rounded bg-white font-bold border-brand-border">
                          <option value="INR">INR (₹ - Indian Rupee)</option>
                          <option value="USD">USD ($ - US Dollar)</option>
                          <option value="EUR">EUR (€ - Euro)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className="font-semibold text-brand-text-secondary">City</label><input type="text" value={addrCity} onChange={e => setAddrCity(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white" placeholder="New Delhi" /></div>
                      <div><label className="font-semibold text-brand-text-secondary">State</label><input type="text" value={addrState} onChange={e => setAddrState(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white" placeholder="Delhi" /></div>
                      <div><label className="font-semibold text-brand-text-secondary">Postal Code</label><input type="text" value={addrPostalCode} onChange={e => setAddrPostalCode(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white" placeholder="110020" /></div>
                      <div><label className="font-semibold text-brand-text-secondary">Country</label><input type="text" value={addrCountry} onChange={e => setAddrCountry(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white" placeholder="India" /></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. BRANCH FORM */}
              {(module === 'branches' || module === 'masters/branches') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Parent Company <span className="text-red-500">*</span></label>
                      <select 
                        value={branchCompanyId} 
                        onChange={e => {
                          const selectedId = e.target.value;
                          setBranchCompanyId(selectedId);
                          const parent = dbCompanies.find(c => c.id === selectedId);
                          if (parent?.gstin) {
                            setBranchGstin(parent.gstin);
                          }
                        }} 
                        className="w-full p-2 border rounded bg-white font-semibold border-brand-border"
                      >
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Branch Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className="w-full p-2 border border-brand-border rounded font-mono font-bold bg-gray-100/80 cursor-not-allowed" placeholder="BR-001" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="branchName" className="font-bold text-brand-text-primary">Branch Name <span className="text-red-500">*</span></label>
                      <input id="branchName" type="text" value={branchName} onChange={e => setBranchName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Delhi Main Branch" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Branch GSTIN</label>
                      <input type="text" value={branchGstin} onChange={e => setBranchGstin(e.target.value)} className="w-full p-2 border border-brand-border rounded uppercase font-mono" placeholder="07AAAAA0000A1Z5" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Branch Phone</label>
                      <input type="text" value={branchPhone} onChange={e => setBranchPhone(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="+91 11 4500 8801" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Branch Email</label>
                      <input type="email" value={branchEmail} onChange={e => setBranchEmail(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="delhi@ink-fmcg.com" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded border border-blue-100">
                    <input type="checkbox" id="hqCheck" checked={branchIsHq} onChange={e => setBranchIsHq(e.target.checked)} className="w-4 h-4 text-brand-primary rounded" />
                    <label htmlFor="hqCheck" className="font-bold text-brand-text-primary cursor-pointer">Designate as Corporate Headquarters Branch</label>
                  </div>
                </div>
              )}

              {/* 3. DEPARTMENT FORM */}
              {(module === 'departments' || module === 'masters/departments') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select 
                        value={deptCompanyId} 
                        onChange={e => {
                          setDeptCompanyId(e.target.value);
                          setDeptBranchId('');
                          setFormErrors(p => ({ ...p, deptCompanyId: '' }));
                        }} 
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.deptCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                      </select>
                      {formErrors.deptCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.deptCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Parent Branch <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <select 
                        value={deptBranchId} 
                        onChange={e => setDeptBranchId(e.target.value)} 
                        className="w-full p-2 border rounded bg-white font-medium border-brand-border"
                      >
                        <option value="">-- No Parent Branch / Company Level --</option>
                        {dbBranches.filter(b => !deptCompanyId || b.companyId === deptCompanyId).map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Department Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className="w-full p-2 border border-brand-border rounded font-mono font-bold bg-gray-100/80 cursor-not-allowed" placeholder="DEP-001" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="deptName" className="font-bold text-brand-text-primary">Department Name <span className="text-red-500">*</span></label>
                      <input 
                        id="deptName" 
                        type="text" 
                        value={deptName} 
                        onChange={e => {
                          setDeptName(e.target.value);
                          setFormErrors(p => ({ ...p, deptName: '' }));
                        }} 
                        className={`w-full p-2 border rounded ${formErrors.deptName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="Supply Chain & Logistics" 
                      />
                      {formErrors.deptName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.deptName}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-brand-text-primary">Description & Operational Mandate</label>
                    <textarea rows={3} value={deptDesc} onChange={e => setDeptDesc(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Oversees raw material procurement, warehouse inventory, and trade routes." />
                  </div>
                </div>
              )}

              {/* 4. DESIGNATION FORM */}
              {(module === 'designations' || module === 'masters/designations') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select value={desigCompanyId} onChange={e => setDesigCompanyId(e.target.value)} className="w-full p-2 border rounded bg-white font-semibold border-brand-border">
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Designation Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className="w-full p-2 border border-brand-border rounded font-mono font-bold bg-gray-100/80 cursor-not-allowed" placeholder="DSG-001" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="desigTitle" className="font-bold text-brand-text-primary">Designation Title <span className="text-red-500">*</span></label>
                      <input id="desigTitle" type="text" value={desigTitle} onChange={e => setDesigTitle(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Regional Sales Manager" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Hierarchy Level (1 = Executive, 10 = Entry)</label>
                      <input type="number" min={1} max={20} value={desigLevel} onChange={e => setDesigLevel(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded font-mono font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Financial Approval Limit (₹)</label>
                      <input type="number" value={desigApprovalLimit} onChange={e => setDesigApprovalLimit(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded font-mono font-bold text-brand-primary" placeholder="500000" />
                    </div>
                  </div>
                </div>
              )}

              {/* 4.1. EMPLOYEE ROLE FORM */}
              {(module === 'employee-roles' || module === 'masters/employee-roles') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select
                        value={roleCompanyId}
                        onChange={e => { setRoleCompanyId(e.target.value); setFormErrors(p => ({ ...p, roleCompanyId: '' })); }}
                        disabled={!isSuper}
                        className={`w-full p-2 border rounded font-semibold ${!isSuper ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${formErrors.roleCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                      </select>
                      {formErrors.roleCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.roleCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Employee Role Code <span className="text-red-500">*</span></label>
                      <input
                        id="code"
                        type="text"
                        value={formCode}
                        onChange={e => { setFormCode(e.target.value); setFormErrors(p => ({ ...p, code: '' })); }}
                        className={`w-full p-2 border rounded font-mono font-bold bg-white uppercase ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="ROL-001"
                      />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="roleName" className="font-bold text-brand-text-primary">Employee Role Name <span className="text-red-500">*</span></label>
                      <input
                        id="roleName"
                        type="text"
                        value={roleName}
                        onChange={e => { setRoleName(e.target.value); setFormErrors(p => ({ ...p, roleName: '' })); }}
                        className={`w-full p-2 border rounded bg-white ${formErrors.roleName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="Sales Representative"
                      />
                      {formErrors.roleName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.roleName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Description (Optional)</label>
                      <input
                        type="text"
                        value={roleDesc}
                        onChange={e => { setRoleDesc(e.target.value); setFormErrors(p => ({ ...p, roleDesc: '' })); }}
                        className="w-full p-2 border border-brand-border rounded bg-white"
                        placeholder="Handles customer order acquisition and retail field visits"
                      />
                      {formErrors.roleDesc && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.roleDesc}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Status</label>
                      <select
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as any)}
                        className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Archived / Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. EMPLOYEE FORM */}
              {(module === 'employees' || module === 'masters/employees') && (
                <div className="space-y-6 text-xs">
                  {/* Row 1: Company, Code, First & Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select
                        value={empCompanyId}
                        onChange={e => {
                          const newCompId = e.target.value;
                          setEmpCompanyId(newCompId);
                          setFormErrors(p => ({ ...p, empCompanyId: '' }));
                          // Clear branch & department if incompatible
                          if (empBranchId && !dbBranches.some(b => b.id === empBranchId && b.companyId === newCompId)) {
                            setEmpBranchId('');
                            setEmpDepartmentId('');
                          }
                          // Clear warehouse if incompatible
                          if (empWarehouseId && !dbWarehouses.some(w => w.id === empWarehouseId && w.companyId === newCompId)) {
                            setEmpWarehouseId('');
                          }
                          // Clear role if incompatible
                          if (empRoleId && !dbEmployeeRoles.some(r => r.id === empRoleId && r.companyId === newCompId)) {
                            setEmpRoleId('');
                          }
                        }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.empCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                      </select>
                      {formErrors.empCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Employee Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="EMP-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="empFirstName" className="font-bold text-brand-text-primary">First Name <span className="text-red-500">*</span></label>
                      <input
                        id="empFirstName"
                        type="text"
                        value={empFirstName}
                        onChange={e => { setEmpFirstName(e.target.value); setFormErrors(p => ({ ...p, empFirstName: '' })); }}
                        className={`w-full p-2 border rounded font-medium ${formErrors.empFirstName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="Rajesh"
                      />
                      {formErrors.empFirstName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empFirstName}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="empLastName" className="font-bold text-brand-text-primary">Last Name <span className="text-red-500">*</span></label>
                      <input
                        id="empLastName"
                        type="text"
                        value={empLastName}
                        onChange={e => { setEmpLastName(e.target.value); setFormErrors(p => ({ ...p, empLastName: '' })); }}
                        className={`w-full p-2 border rounded font-medium ${formErrors.empLastName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="Kumar"
                      />
                      {formErrors.empLastName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empLastName}</p>}
                    </div>
                  </div>

                  {/* Row 2: Organization Assignment */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50/60 p-4 rounded-lg border border-slate-200">
                    {/* Branch Location */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Branch Location <span className="text-xs font-normal text-slate-500">(optional)</span></label>
                      <select
                        value={empBranchId}
                        onChange={e => {
                          const newBranchId = e.target.value;
                          setEmpBranchId(newBranchId);
                          setFormErrors(p => ({ ...p, empBranchId: '' }));
                          // Clear department if incompatible with new branch
                          if (empDepartmentId) {
                            const dept = dbDepartments.find(d => d.id === empDepartmentId);
                            if (dept) {
                              if (!newBranchId && dept.branchId) {
                                setEmpDepartmentId('');
                              } else if (newBranchId && dept.branchId && dept.branchId !== newBranchId) {
                                setEmpDepartmentId('');
                              }
                            }
                          }
                          // Clear warehouse if incompatible with new branch
                          if (empWarehouseId) {
                            const wh = dbWarehouses.find(w => w.id === empWarehouseId);
                            if (wh) {
                              if (!newBranchId && wh.branchId) {
                                setEmpWarehouseId('');
                              } else if (newBranchId && wh.branchId && wh.branchId !== newBranchId) {
                                setEmpWarehouseId('');
                              }
                            }
                          }
                        }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.empBranchId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- No Branch / Company Level --</option>
                        {dbBranches
                          .filter(b => !empCompanyId || b.companyId === empCompanyId)
                          .map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                      </select>
                      {formErrors.empBranchId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empBranchId}</p>}
                    </div>

                    {/* Warehouse / Stockist (optional) */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Warehouse / Stockist <span className="text-xs font-normal text-slate-500">(optional)</span></label>
                      <select
                        value={empWarehouseId}
                        onChange={e => { setEmpWarehouseId(e.target.value); setFormErrors(p => ({ ...p, empWarehouseId: '' })); }}
                        className="w-full p-2 border rounded bg-white font-medium border-brand-border"
                      >
                        <option value="">-- No Warehouse / Stockist --</option>
                        {dbWarehouses
                          .filter(w => (!empCompanyId || w.companyId === empCompanyId) && (!empBranchId ? !w.branchId : (!w.branchId || w.branchId === empBranchId)) && w.status !== 'Inactive')
                          .map(w => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.code}){w.branchName ? ` — ${w.branchName}` : ' (Company Level)'}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Department <span className="text-red-500">*</span></label>
                      <select
                        value={empDepartmentId}
                        onChange={e => { setEmpDepartmentId(e.target.value); setFormErrors(p => ({ ...p, empDepartmentId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.empDepartmentId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Department --</option>
                        {dbDepartments
                          .filter(d => (!empCompanyId || d.companyId === empCompanyId) && (!empBranchId ? !d.branchId : (!d.branchId || d.branchId === empBranchId)))
                          .map(d => <option key={d.id} value={d.id}>{d.name}{d.branchName ? ` — ${d.branchName}` : ' (Company Level)'}</option>)}
                      </select>
                      {formErrors.empDepartmentId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empDepartmentId}</p>}
                    </div>

                    {/* Employee Role */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Employee Role <span className="text-red-500">*</span></label>
                      <select
                        value={empRoleId}
                        onChange={e => { setEmpRoleId(e.target.value); setFormErrors(p => ({ ...p, empRoleId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.empRoleId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Role --</option>
                        {dbEmployeeRoles
                          .filter(r => (!empCompanyId || r.companyId === empCompanyId) && r.isActive !== false)
                          .map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                      </select>
                      {formErrors.empRoleId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empRoleId}</p>}
                    </div>

                    {/* Designation */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Designation Title <span className="text-red-500">*</span></label>
                      <select
                        value={empDesignationId}
                        onChange={e => { setEmpDesignationId(e.target.value); setFormErrors(p => ({ ...p, empDesignationId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.empDesignationId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Designation --</option>
                        {dbDesignations
                          .filter(d => !empCompanyId || d.companyId === empCompanyId)
                          .map(d => <option key={d.id} value={d.id}>{d.title} (Level {d.level || 1})</option>)}
                      </select>
                      {formErrors.empDesignationId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empDesignationId}</p>}
                    </div>
                  </div>

                  {/* Row 3: Contact, Joining Date & Salary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-brand-bg-secondary/30 rounded-lg border border-brand-border">
                    <div className="space-y-1">
                      <label htmlFor="empEmail" className="font-bold text-brand-text-primary">Official Email <span className="text-red-500">*</span></label>
                      <input
                        id="empEmail"
                        type="email"
                        value={empEmail}
                        onChange={e => { setEmpEmail(e.target.value); setFormErrors(p => ({ ...p, empEmail: '' })); }}
                        className={`w-full p-2 border rounded bg-white ${formErrors.empEmail ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="rajesh.kumar@ink-fmcg.com"
                      />
                      {formErrors.empEmail && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empEmail}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="empPhone" className="font-bold text-brand-text-primary">Contact Phone <span className="text-red-500">*</span></label>
                      <input
                        id="empPhone"
                        type="text"
                        value={empPhone}
                        onChange={e => { setEmpPhone(e.target.value); setFormErrors(p => ({ ...p, empPhone: '' })); }}
                        className={`w-full p-2 border rounded bg-white ${formErrors.empPhone ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="+91 98110 12345"
                      />
                      {formErrors.empPhone && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empPhone}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Joining Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={empJoiningDate}
                        onChange={e => { setEmpJoiningDate(e.target.value); setFormErrors(p => ({ ...p, empJoiningDate: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-mono ${formErrors.empJoiningDate ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      />
                      {formErrors.empJoiningDate && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empJoiningDate}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Monthly Salary (₹)</label>
                      <input
                        type="number"
                        min={0}
                        step="1000"
                        value={empSalary}
                        onChange={e => { setEmpSalary(e.target.value === '' ? '' : Number(e.target.value)); setFormErrors(p => ({ ...p, empSalary: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-mono font-bold text-brand-primary ${formErrors.empSalary ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="45000"
                      />
                      {formErrors.empSalary && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empSalary}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. PRODUCT FORM */}
              {(module === 'products' || module === 'masters/products') && (
                <div className="space-y-6 text-xs">

                  {/* Row 1: Company */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select
                        value={prodCompanyId}
                        onChange={e => { setProdCompanyId(e.target.value); setFormErrors(p => ({ ...p, prodCompanyId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.prodCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                      </select>
                      {formErrors.prodCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.prodCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">SKU Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="PROD-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label htmlFor="prodName" className="font-bold text-brand-text-primary">Product Name <span className="text-red-500">*</span></label>
                      <input id="prodName" type="text" value={prodName} onChange={e => { setProdName(e.target.value); setFormErrors(p => ({ ...p, prodName: '' })); }} className={`w-full p-2 border rounded ${formErrors.prodName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="Premium Basmati Rice 5kg" />
                      {formErrors.prodName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.prodName}</p>}
                    </div>
                  </div>

                  {/* Row 2: Category (Tree), Brand, Base UOM */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/20 p-4 rounded-lg border border-blue-100">
                    {/* 1. Product Category (Hierarchical Tree Select) — OPTIONAL */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">
                        Product Category <span className="text-[10px] font-normal text-slate-400 normal-case">(optional)</span>
                      </label>
                      <select
                        value={prodCategoryId}
                        onChange={e => { 
                          setProdCategoryId(e.target.value); 
                          setFormErrors(p => ({ ...p, prodCategoryId: '' })); 
                        }}
                        className="w-full p-2 border rounded bg-white font-medium border-brand-border"
                      >
                        <option value="">-- No Category / Unclassified --</option>
                        {(() => {
                          const companyCats = dbCategories.filter(c => !prodCompanyId || !c.companyId || c.companyId === prodCompanyId);
                          const roots = companyCats.filter(c => !c.parentCategoryId || !companyCats.some(p => p.id === c.parentCategoryId));
                          const options: { id: string; name: string; code: string; depth: number }[] = [];
                          
                          const traverse = (cat: Category, depth: number) => {
                            options.push({ id: cat.id, name: cat.name, code: cat.code, depth });
                            const children = companyCats.filter(c => c.parentCategoryId === cat.id && c.id !== cat.id);
                            children.forEach(child => traverse(child, depth + 1));
                          };

                          roots.forEach(r => traverse(r, 0));
                          return options.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {'\u00A0\u00A0'.repeat(opt.depth)}{opt.depth > 0 ? '└─ ' : ''}{opt.name} ({opt.code})
                            </option>
                          ));
                        })()}
                      </select>
                    </div>

                    {/* 2. Brand */}
                    {/* 2. Brand (Optional) */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">
                        Brand <span className="text-[10px] font-normal text-slate-400 normal-case">(optional)</span>
                      </label>
                      <select
                        value={prodBrandId}
                        onChange={e => { setProdBrandId(e.target.value); setFormErrors(p => ({ ...p, prodBrandId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.prodBrandId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- No Brand / Unbranded --</option>
                        {dbBrands
                          .filter(b => !prodCompanyId || !b.companyId || b.companyId === prodCompanyId)
                          .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                      {formErrors.prodBrandId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.prodBrandId}</p>}
                    </div>

                    {/* 3. Base Unit of Measure */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Base Unit of Measure <span className="text-red-500">*</span></label>
                      <select
                        value={prodBaseUomId}
                        onChange={e => { setProdBaseUomId(e.target.value); setFormErrors(p => ({ ...p, prodBaseUomId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.prodBaseUomId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select UOM --</option>
                        {dbUnits
                          .filter(u => !prodCompanyId || !u.companyId || u.companyId === prodCompanyId)
                          .map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                      </select>
                      {formErrors.prodBaseUomId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.prodBaseUomId}</p>}
                    </div>
                  </div>

                  {/* Row 3: Pricing & Tax */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-brand-bg-secondary/30 rounded border border-brand-border">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">MRP (₹) <span className="text-red-500">*</span></label>
                      <input type="number" min={0} step="0.01" value={prodMrp} onChange={e => { setProdMrp(Number(e.target.value)); setFormErrors(p => ({ ...p, prodMrp: '' })); }} className={`w-full p-2 border rounded bg-white font-mono font-bold ${formErrors.prodMrp ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} />
                      {formErrors.prodMrp && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.prodMrp}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Base B2B Price (₹) <span className="text-red-500">*</span></label>
                      <input type="number" min={0} step="0.01" value={prodBasePrice} onChange={e => { setProdBasePrice(Number(e.target.value)); setFormErrors(p => ({ ...p, prodBasePrice: '' })); }} className={`w-full p-2 border rounded bg-white font-mono font-bold text-brand-primary ${formErrors.prodBasePrice ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} />
                      {formErrors.prodBasePrice && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.prodBasePrice}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">GST Rate %</label>
                      <select value={prodGstRate} onChange={e => setProdGstRate(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono">
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">HSN Code</label>
                      <input type="text" maxLength={10} value={prodHsnCode} onChange={e => setProdHsnCode(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-mono" placeholder="1006" />
                    </div>
                  </div>

                  {/* Row 4: Logistics / Optional */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Min. Order Qty</label>
                      <input type="number" min={0.0001} step="0.0001" value={prodMinOrderQty} onChange={e => { setProdMinOrderQty(Number(e.target.value)); setFormErrors(p => ({ ...p, prodMinOrderQty: '' })); }} className={`w-full p-2 border rounded bg-white font-mono ${formErrors.prodMinOrderQty ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} />
                      {formErrors.prodMinOrderQty && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.prodMinOrderQty}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Shelf Life (days)</label>
                      <input type="number" min={1} step={1} value={prodShelfLifeDays} onChange={e => setProdShelfLifeDays(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono" placeholder="365" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Barcode / EAN</label>
                      <input type="text" value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} className="w-full p-2 border border-brand-border rounded font-mono" placeholder="8901234567890" />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <label className="font-bold text-brand-text-primary">Batch Tracking</label>
                      <label className="flex items-center gap-2 p-2 border border-brand-border rounded bg-white cursor-pointer">
                        <input type="checkbox" checked={prodIsBatchTracked} onChange={e => setProdIsBatchTracked(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
                        <span className="font-medium text-brand-text-primary">{prodIsBatchTracked ? 'Enabled (FEFO)' : 'Disabled'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. CATEGORY FORM */}
              {(module === 'categories' || module === 'masters/categories') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select
                        value={catCompanyId}
                        onChange={e => { setCatCompanyId(e.target.value); setFormErrors(p => ({ ...p, catCompanyId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.catCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                      </select>
                      {formErrors.catCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.catCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Category Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="CAT-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="catName" className="font-bold text-brand-text-primary">Category Name <span className="text-red-500">*</span></label>
                      <input
                        id="catName"
                        type="text"
                        value={catName}
                        onChange={e => { setCatName(e.target.value); setFormErrors(p => ({ ...p, catName: '' })); }}
                        className={`w-full p-2 border rounded ${formErrors.catName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="Beverages or Carbonated Drinks"
                      />
                      {formErrors.catName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.catName}</p>}
                    </div>
                  </div>

                  {/* Classification Hierarchy Level: Root vs Subcategory */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50/30 p-4 rounded-lg border border-amber-200/60">
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-brand-text-primary flex items-center justify-between">
                        <span>Parent Category (Optional)</span>
                        <span className="text-[10px] text-brand-text-secondary font-normal">
                          {catParentId ? 'Child Category' : 'Top-Level Root Category'}
                        </span>
                      </label>
                      <select
                        value={catParentId}
                        onChange={e => { setCatParentId(e.target.value); setFormErrors(p => ({ ...p, catParentId: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-medium ${formErrors.catParentId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- None / Top-Level (Root Category) --</option>
                        {(() => {
                          // Helper to get all descendant IDs to prevent cycle assignment
                          const getDescendantIds = (catId: string, allCats: Category[]): Set<string> => {
                            const descendants = new Set<string>();
                            const stack = [catId];
                            while (stack.length > 0) {
                              const curr = stack.pop()!;
                              allCats.forEach(c => {
                                if (c.parentCategoryId === curr && !descendants.has(c.id)) {
                                  descendants.add(c.id);
                                  stack.push(c.id);
                                }
                              });
                            }
                            return descendants;
                          };

                          const excludedIds = selectedId ? new Set([selectedId, ...getDescendantIds(selectedId, dbCategories)]) : new Set<string>();
                          const companyCats = dbCategories.filter(c => (!catCompanyId || !c.companyId || c.companyId === catCompanyId) && !excludedIds.has(c.id));
                          const roots = companyCats.filter(c => !c.parentCategoryId || !companyCats.some(p => p.id === c.parentCategoryId));
                          const options: { id: string; name: string; code: string; depth: number }[] = [];
                          
                          const traverse = (cat: Category, depth: number) => {
                            options.push({ id: cat.id, name: cat.name, code: cat.code, depth });
                            const children = companyCats.filter(c => c.parentCategoryId === cat.id && c.id !== cat.id);
                            children.forEach(child => traverse(child, depth + 1));
                          };

                          roots.forEach(r => traverse(r, 0));
                          return options.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {'\u00A0\u00A0'.repeat(opt.depth)}{opt.depth > 0 ? '└─ ' : ''}{opt.name} ({opt.code})
                            </option>
                          ));
                        })()}
                      </select>
                      {formErrors.catParentId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.catParentId}</p>}
                      <p className="text-[11px] text-brand-text-secondary mt-0.5">
                        Leave as &quot;None / Top-Level&quot; to create a primary Root Category. Select any existing Category to nest under it at arbitrary depth.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Default GST Rate %</label>
                      <select value={catGstRate} onChange={e => setCatGstRate(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold">
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">HSN Code Default</label>
                      <input type="text" maxLength={10} value={catHsnDefault} onChange={e => setCatHsnDefault(e.target.value)} className="w-full p-2 border border-brand-border rounded font-mono" placeholder="1006.30" />
                    </div>
                  </div>
                </div>
              )}

              {/* 8. BRAND FORM */}
              {(module === 'brands' || module === 'masters/brands') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company</label>
                      <select value={brandCompanyId} onChange={e => setBrandCompanyId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white">
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Brand Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className="w-full p-2 border border-brand-border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed" placeholder="BRD-001" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="brandName" className="font-bold text-brand-text-primary">Brand Name <span className="text-red-500">*</span></label>
                      <input id="brandName" type="text" value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="India Gate" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Manufacturer Name</label>
                      <input type="text" value={brandManufacturer} onChange={e => setBrandManufacturer(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="KRBL Limited" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Origin Country</label>
                      <input type="text" value={brandOrigin} onChange={e => setBrandOrigin(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="India" />
                    </div>
                  </div>
                </div>
              )}

              {/* 9. UOM FORM */}
              {(module === 'units' || module === 'masters/units') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company</label>
                      <select value={uomCompanyId} onChange={e => setUomCompanyId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white">
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">UOM Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className="w-full p-2 border border-brand-border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed" placeholder="UOM-001" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="uomName" className="font-bold text-brand-text-primary">Unit Name <span className="text-red-500">*</span></label>
                      <input id="uomName" type="text" value={uomName} onChange={e => setUomName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Kilograms" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Base Unit Code Reference</label>
                      <input type="text" value={uomBaseCode} onChange={e => setUomBaseCode(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Gram" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Conversion Factor</label>
                      <input type="number" step="0.001" value={uomConversionFactor} onChange={e => setUomConversionFactor(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded font-mono" placeholder="1000" />
                    </div>
                  </div>
                </div>
              )}

              {/* 10. WAREHOUSE FORM */}
              {/* 10. WAREHOUSE FORM (Production-Grade FMCG ERP Layout) */}
              {(module === 'warehouses' || module === 'masters/warehouses') && (
                <div className="space-y-6 text-xs">
                  {/* SECTION 1: BASIC INFORMATION */}
                  <div className="p-4 bg-brand-bg-secondary/20 rounded-lg border border-brand-border space-y-4">
                    <h4 className="font-bold text-brand-text-primary flex items-center gap-1.5 text-xs">
                      <Building size={14} className="text-brand-primary" /> Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="whCompanyId" className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                        <select 
                          id="whCompanyId" 
                          value={whCompanyId} 
                          onChange={e => {
                            setWhCompanyId(e.target.value);
                            setWhBranchId('');
                            setFormErrors(p => ({ ...p, whCompanyId: '' }));
                          }} 
                          className={`w-full p-2 border rounded bg-white font-semibold ${formErrors.whCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        >
                          <option value="">-- Select Company --</option>
                          {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                        </select>
                        {formErrors.whCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whCompanyId}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whBranchId" className="font-bold text-brand-text-primary">Parent Branch <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <select 
                          id="whBranchId" 
                          value={whBranchId} 
                          onChange={e => setWhBranchId(e.target.value)} 
                          className="w-full p-2 border rounded bg-white font-semibold border-brand-border"
                        >
                          <option value="">-- No Parent Branch / Company Level --</option>
                          {dbBranches.filter(b => !whCompanyId || b.companyId === whCompanyId).map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="code" className="font-bold text-brand-text-primary">Warehouse Code <span className="text-red-500">*</span></label>
                        <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="WH-001" />
                        {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whName" className="font-bold text-brand-text-primary">Warehouse / Stockist Name <span className="text-red-500">*</span></label>
                        <input id="whName" type="text" value={whName} onChange={e => { setWhName(e.target.value); setFormErrors(p => ({ ...p, whName: '' })); }} className={`w-full p-2 border rounded ${formErrors.whName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="Delhi Central Depot" />
                        {formErrors.whName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whName}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="whType" className="font-bold text-brand-text-primary">Warehouse Type <span className="text-red-500">*</span></label>
                        <select id="whType" value={whType} onChange={e => setWhType(e.target.value)} className={`w-full p-2 border rounded bg-white font-semibold ${formErrors.whType ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}>
                          <option value="Central Warehouse">Central Warehouse</option>
                          <option value="Regional Warehouse">Regional Warehouse</option>
                          <option value="Distribution Center">Distribution Center</option>
                          <option value="Depot">Depot</option>
                          <option value="Transit Warehouse">Transit Warehouse</option>
                          <option value="Cold Storage">Cold Storage</option>
                          <option value="Third-Party Warehouse">Third-Party Warehouse</option>
                        </select>
                        {formErrors.whType && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whType}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whStatus" className="font-bold text-brand-text-primary">Status <span className="text-red-500">*</span></label>
                        <select id="whStatus" value={whStatus} onChange={e => setWhStatus(e.target.value as any)} className={`w-full p-2 border rounded bg-white font-bold ${formErrors.whStatus ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Under Maintenance">Under Maintenance</option>
                        </select>
                        {formErrors.whStatus && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whStatus}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: WAREHOUSE LOCATION */}
                  <div className="p-4 bg-brand-bg-secondary/20 rounded-lg border border-brand-border space-y-4">
                    <h4 className="font-bold text-brand-text-primary flex items-center gap-1.5 text-xs">
                      <MapPin size={14} className="text-brand-primary" /> Warehouse Location
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor="whAddrLine1" className="font-bold text-brand-text-primary">Address Line 1 <span className="text-red-500">*</span></label>
                          <input id="whAddrLine1" type="text" value={whAddrLine1} onChange={e => setWhAddrLine1(e.target.value)} className={`w-full p-2 border rounded bg-white ${formErrors.whAddrLine1 ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="Plot 45, Okhla Industrial Area Phase 3" />
                          {formErrors.whAddrLine1 && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whAddrLine1}</p>}
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="whAddrLine2" className="font-semibold text-brand-text-secondary">Address Line 2</label>
                          <input id="whAddrLine2" type="text" value={whAddrLine2} onChange={e => setWhAddrLine2(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white" placeholder="Near Transport Hub" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor="whCity" className="font-bold text-brand-text-primary">City <span className="text-red-500">*</span></label>
                          <input id="whCity" type="text" value={whCity} onChange={e => setWhCity(e.target.value)} className={`w-full p-2 border rounded bg-white ${formErrors.whCity ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="New Delhi" />
                          {formErrors.whCity && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whCity}</p>}
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="whState" className="font-bold text-brand-text-primary">State <span className="text-red-500">*</span></label>
                          <input id="whState" type="text" value={whState} onChange={e => setWhState(e.target.value)} className={`w-full p-2 border rounded bg-white ${formErrors.whState ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="Delhi" />
                          {formErrors.whState && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whState}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor="whCountry" className="font-bold text-brand-text-primary">Country <span className="text-red-500">*</span></label>
                          <input id="whCountry" type="text" value={whCountry} onChange={e => setWhCountry(e.target.value)} className={`w-full p-2 border rounded bg-white ${formErrors.whCountry ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="India" />
                          {formErrors.whCountry && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whCountry}</p>}
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="whPostalCode" className="font-bold text-brand-text-primary">Pincode <span className="text-red-500">*</span></label>
                          <input id="whPostalCode" type="text" value={whPostalCode} onChange={e => setWhPostalCode(e.target.value)} className={`w-full p-2 border rounded bg-white font-mono ${formErrors.whPostalCode ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="110020" />
                          {formErrors.whPostalCode && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whPostalCode}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: CAPACITY & OPERATIONS */}
                  <div className="p-4 bg-brand-bg-secondary/20 rounded-lg border border-brand-border space-y-4">
                    <h4 className="font-bold text-brand-text-primary flex items-center gap-1.5 text-xs">
                      <Box size={14} className="text-brand-primary" /> Capacity & Operations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="whStorageAreaSqFt" className="font-bold text-brand-text-primary">Storage Area (sq ft)</label>
                        <input id="whStorageAreaSqFt" type="number" value={whStorageAreaSqFt} onChange={e => setWhStorageAreaSqFt(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full p-2 border rounded bg-white font-mono font-bold ${formErrors.whStorageAreaSqFt ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="150000" />
                        {formErrors.whStorageAreaSqFt && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whStorageAreaSqFt}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whPalletCapacity" className="font-bold text-brand-text-primary">Pallet Capacity</label>
                        <input id="whPalletCapacity" type="number" value={whPalletCapacity} onChange={e => setWhPalletCapacity(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full p-2 border rounded bg-white font-mono ${formErrors.whPalletCapacity ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="5000" />
                        {formErrors.whPalletCapacity && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whPalletCapacity}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whCartonCapacity" className="font-bold text-brand-text-primary">Carton Capacity</label>
                        <input id="whCartonCapacity" type="number" value={whCartonCapacity} onChange={e => setWhCartonCapacity(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full p-2 border rounded bg-white font-mono ${formErrors.whCartonCapacity ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="50000" />
                        {formErrors.whCartonCapacity && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whCartonCapacity}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: WAREHOUSE CONTACT */}
                  <div className="p-4 bg-brand-bg-secondary/20 rounded-lg border border-brand-border space-y-4">
                    <h4 className="font-bold text-brand-text-primary flex items-center gap-1.5 text-xs">
                      <User size={14} className="text-brand-primary" /> Warehouse Contact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="whManagerEmployeeId" className="font-bold text-brand-text-primary">Warehouse Manager</label>
                        <select id="whManagerEmployeeId" value={whManagerEmployeeId} onChange={e => setWhManagerEmployeeId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                          <option value="">-- Select Employee Manager --</option>
                          {dbEmployees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whContactNumber" className="font-bold text-brand-text-primary">Contact Number</label>
                        <input id="whContactNumber" type="text" value={whContactNumber} onChange={e => setWhContactNumber(e.target.value)} className={`w-full p-2 border rounded bg-white ${formErrors.whContactNumber ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="+91 98110 54321" />
                        {formErrors.whContactNumber && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whContactNumber}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whEmail" className="font-bold text-brand-text-primary">Email</label>
                        <input id="whEmail" type="email" value={whEmail} onChange={e => setWhEmail(e.target.value)} className={`w-full p-2 border rounded bg-white ${formErrors.whEmail ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="warehouse.delhi@inkfmcg.com" />
                        {formErrors.whEmail && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whEmail}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: LOCATION / ADDITIONAL INFORMATION */}
                  <div className="p-4 bg-brand-bg-secondary/20 rounded-lg border border-brand-border space-y-4">
                    <h4 className="font-bold text-brand-text-primary flex items-center gap-1.5 text-xs">
                      <Globe size={14} className="text-brand-primary" /> Location / Additional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="whLatitude" className="font-bold text-brand-text-primary">Latitude</label>
                        <input id="whLatitude" type="number" step="0.000001" value={whLatitude} onChange={e => setWhLatitude(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full p-2 border rounded bg-white font-mono ${formErrors.whLatitude ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="28.5355" />
                        {formErrors.whLatitude && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whLatitude}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whLongitude" className="font-bold text-brand-text-primary">Longitude</label>
                        <input id="whLongitude" type="number" step="0.000001" value={whLongitude} onChange={e => setWhLongitude(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full p-2 border rounded bg-white font-mono ${formErrors.whLongitude ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="77.2610" />
                        {formErrors.whLongitude && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whLongitude}</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="whRemarks" className="font-bold text-brand-text-primary">Remarks</label>
                      <textarea id="whRemarks" rows={3} value={whRemarks} onChange={e => setWhRemarks(e.target.value)} className={`w-full p-2 border rounded bg-white ${formErrors.whRemarks ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="Internal notes, loading dock access hours, and operational details..." />
                      {formErrors.whRemarks && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whRemarks}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* 11. CUSTOMER FORM */}
              {(module === 'customers' || module === 'masters/customers') && (
                <div className="space-y-6 text-xs">
                  {/* Row 1: Company, Code, Customer Name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select
                        value={custCompanyId}
                        onChange={e => { setCustCompanyId(e.target.value); setFormErrors(p => ({ ...p, custCompanyId: '' })); }}
                        disabled={!isSuper}
                        className={`w-full p-2 border rounded bg-white font-medium ${!isSuper ? 'bg-gray-100/80 cursor-not-allowed' : ''} ${formErrors.custCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                      </select>
                      {formErrors.custCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Customer Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="CST-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="custLegalName" className="font-bold text-brand-text-primary">Customer Name <span className="text-red-500">*</span></label>
                      <input
                        id="custLegalName"
                        type="text"
                        value={custLegalName}
                        onChange={e => { setCustLegalName(e.target.value); setFormErrors(p => ({ ...p, custLegalName: '' })); }}
                        className={`w-full p-2 border rounded font-medium ${formErrors.custLegalName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="Apex Retail Distributors Pvt Ltd"
                      />
                      {formErrors.custLegalName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custLegalName}</p>}
                    </div>
                  </div>

                  {/* Row 2: Channel, Tax & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Channel / Customer Type <span className="text-red-500">*</span></label>
                      <select value={custType} onChange={e => setCustType(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                        <option value="Retailer">Kirana / Retailer Store</option>
                        <option value="Wholesaler">Wholesaler Dealer</option>
                        <option value="Modern Trade">Modern Trade / Supermarket</option>
                        <option value="Institution">Institutional / B2B</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">GSTIN (Tax ID)</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={custGstin}
                        onChange={e => { setCustGstin(e.target.value.toUpperCase()); setFormErrors(p => ({ ...p, custGstin: '' })); }}
                        className={`w-full p-2 border rounded uppercase font-mono font-bold ${formErrors.custGstin ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="07AAAAA0000A1Z5"
                      />
                      {formErrors.custGstin && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custGstin}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">PAN Number</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={custPan}
                        onChange={e => { setCustPan(e.target.value.toUpperCase()); setFormErrors(p => ({ ...p, custPan: '' })); }}
                        className={`w-full p-2 border rounded uppercase font-mono font-bold ${formErrors.custPan ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="AAAAA0000A"
                      />
                      {formErrors.custPan && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custPan}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Contact Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={custEmail}
                        onChange={e => { setCustEmail(e.target.value); setFormErrors(p => ({ ...p, custEmail: '' })); }}
                        className={`w-full p-2 border rounded ${formErrors.custEmail ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="billing@apex.com"
                      />
                      {formErrors.custEmail && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custEmail}</p>}
                    </div>
                  </div>

                  {/* Row 3: Phone & Credit Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-brand-bg-secondary/30 rounded border border-brand-border">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Contact Phone <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={custPhone}
                        onChange={e => { setCustPhone(e.target.value); setFormErrors(p => ({ ...p, custPhone: '' })); }}
                        className={`w-full p-2 border rounded bg-white ${formErrors.custPhone ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="+91 98110 24512"
                      />
                      {formErrors.custPhone && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custPhone}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Approved Credit Limit (₹)</label>
                      <input
                        type="number"
                        min={0}
                        step="1000"
                        value={custCreditLimit}
                        onChange={e => { setCustCreditLimit(Number(e.target.value)); setFormErrors(p => ({ ...p, custCreditLimit: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-mono font-bold text-brand-primary ${formErrors.custCreditLimit ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="500000"
                      />
                      {formErrors.custCreditLimit && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custCreditLimit}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Payment Term Days</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={custCreditDays}
                        onChange={e => { setCustCreditDays(Number(e.target.value)); setFormErrors(p => ({ ...p, custCreditDays: '' })); }}
                        className={`w-full p-2 border rounded bg-white font-mono font-bold ${formErrors.custCreditDays ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="30"
                      />
                      {formErrors.custCreditDays && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custCreditDays}</p>}
                    </div>
                  </div>

                  {/* Row 4: Dedicated Customer Address */}
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-brand-text-primary text-[11px] uppercase tracking-wider">
                      Business & Delivery Address Specifications
                    </h4>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Customer / Store Name</label>
                      <input
                        type="text"
                        value={custTradeName}
                        onChange={e => { setCustTradeName(e.target.value); setFormErrors(p => ({ ...p, custTradeName: '' })); }}
                        className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                        placeholder="Apex Superstore"
                      />
                      {formErrors.custTradeName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custTradeName}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Address Line 1 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={custAddrLine1}
                          onChange={e => { setCustAddrLine1(e.target.value); setFormErrors(p => ({ ...p, custAddrLine1: '' })); }}
                          className={`w-full p-2 border rounded bg-white ${formErrors.custAddrLine1 ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                          placeholder="Shop No. 12, Main Market Road"
                        />
                        {formErrors.custAddrLine1 && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custAddrLine1}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Address Line 2</label>
                        <input
                          type="text"
                          value={custAddrLine2}
                          onChange={e => setCustAddrLine2(e.target.value)}
                          className="w-full p-2 border border-brand-border rounded bg-white"
                          placeholder="Near Central Metro Station"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">City <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={custCity}
                          onChange={e => { setCustCity(e.target.value); setFormErrors(p => ({ ...p, custCity: '' })); }}
                          className={`w-full p-2 border rounded bg-white ${formErrors.custCity ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                          placeholder="New Delhi"
                        />
                        {formErrors.custCity && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custCity}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">State <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={custState}
                          onChange={e => { setCustState(e.target.value); setFormErrors(p => ({ ...p, custState: '' })); }}
                          className={`w-full p-2 border rounded bg-white ${formErrors.custState ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                          placeholder="Delhi"
                        />
                        {formErrors.custState && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custState}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">PIN / Postal Code <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          maxLength={15}
                          value={custPostalCode}
                          onChange={e => { setCustPostalCode(e.target.value); setFormErrors(p => ({ ...p, custPostalCode: '' })); }}
                          className={`w-full p-2 border rounded bg-white font-mono ${formErrors.custPostalCode ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                          placeholder="110001"
                        />
                        {formErrors.custPostalCode && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custPostalCode}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Country <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={custCountry}
                          onChange={e => { setCustCountry(e.target.value); setFormErrors(p => ({ ...p, custCountry: '' })); }}
                          className={`w-full p-2 border rounded bg-white ${formErrors.custCountry ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                          placeholder="India"
                        />
                        {formErrors.custCountry && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custCountry}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 13. SUPPLIER MASTER FORM */}
              {(module === 'partners' || module === 'masters/partners' || module === 'suppliers' || module === 'masters/suppliers') && (
                <div className="space-y-6 text-xs">
                  {/* Row 1: Company, Code, Supplier Name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company <span className="text-red-500">*</span></label>
                      <select
                        value={suppCompanyId}
                        onChange={e => { setSuppCompanyId(e.target.value); setFormErrors(p => ({ ...p, suppCompanyId: '' })); }}
                        disabled={!isSuper}
                        className={`w-full p-2 border rounded bg-white font-medium ${!isSuper ? 'bg-gray-100/80 cursor-not-allowed' : ''} ${formErrors.suppCompanyId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                      >
                        <option value="">-- Select Company --</option>
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName || c.code}</option>)}
                      </select>
                      {formErrors.suppCompanyId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.suppCompanyId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="suppCode" className="font-bold text-brand-text-primary">Supplier Code <span className="text-red-500">*</span></label>
                      <input id="suppCode" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="SUP-000001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="suppLegalName" className="font-bold text-brand-text-primary">Supplier Name <span className="text-red-500">*</span></label>
                      <input
                        id="suppLegalName"
                        type="text"
                        value={suppLegalName}
                        onChange={e => { setSuppLegalName(e.target.value); setFormErrors(p => ({ ...p, suppLegalName: '' })); }}
                        className={`w-full p-2 border rounded font-medium ${formErrors.suppLegalName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="Hindustan Unilever Ltd"
                      />
                      {formErrors.suppLegalName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.suppLegalName}</p>}
                    </div>
                  </div>

                  {/* Row 2: Supplier Type, Tax IDs & Payment Terms */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Supplier Type <span className="text-red-500">*</span></label>
                      <select
                        value={suppType}
                        onChange={e => setSuppType(e.target.value)}
                        className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                      >
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Distributor / Stockist">Distributor / Stockist</option>
                        <option value="Wholesaler">Wholesaler</option>
                        <option value="Importer">Importer</option>
                        <option value="Packaging Supplier">Packaging Supplier</option>
                        <option value="Service Provider">Service Provider</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">GSTIN (Tax ID) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        maxLength={15}
                        value={suppGstin}
                        onChange={e => { setSuppGstin(e.target.value.toUpperCase()); setFormErrors(p => ({ ...p, suppGstin: '' })); }}
                        className={`w-full p-2 border rounded uppercase font-mono font-bold ${formErrors.suppGstin ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="27AAAAA0000A1Z5"
                      />
                      {formErrors.suppGstin && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.suppGstin}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">PAN Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        maxLength={10}
                        value={suppPan}
                        onChange={e => { setSuppPan(e.target.value.toUpperCase()); setFormErrors(p => ({ ...p, suppPan: '' })); }}
                        className={`w-full p-2 border rounded uppercase font-mono font-bold ${formErrors.suppPan ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="AAAAA0000A"
                      />
                      {formErrors.suppPan && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.suppPan}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Payment Terms / Credit Period <span className="text-red-500">*</span></label>
                      <select
                        value={suppPaymentTermsDays}
                        onChange={e => setSuppPaymentTermsDays(Number(e.target.value))}
                        className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                      >
                        <option value={0}>Immediate / Advance</option>
                        <option value={15}>Net 15 Days</option>
                        <option value={30}>Net 30 Days</option>
                        <option value={45}>Net 45 Days (MSME Standard)</option>
                        <option value={60}>Net 60 Days</option>
                        <option value={90}>Net 90 Days</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Contact Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Contact Official Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={suppEmail}
                        onChange={e => { setSuppEmail(e.target.value); setFormErrors(p => ({ ...p, suppEmail: '' })); }}
                        className={`w-full p-2 border rounded font-medium ${formErrors.suppEmail ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="vendor.billing@hul.com"
                      />
                      {formErrors.suppEmail && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.suppEmail}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Contact Phone <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={suppPhone}
                        onChange={e => { setSuppPhone(e.target.value); setFormErrors(p => ({ ...p, suppPhone: '' })); }}
                        className={`w-full p-2 border rounded font-medium ${formErrors.suppPhone ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}
                        placeholder="+91 22 3983 0000"
                      />
                      {formErrors.suppPhone && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.suppPhone}</p>}
                    </div>
                  </div>

                  {/* Row 4: Registered Office Address */}
                  <div className="p-4 bg-brand-bg-secondary/30 rounded-lg border border-brand-border space-y-4">
                    <h4 className="font-bold text-brand-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-2">
                      <MapPin size={13} className="text-brand-primary" /> Registered Vendor Address
                    </h4>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Supplier / Business Name</label>
                      <input
                        type="text"
                        value={suppTradeName}
                        onChange={e => { setSuppTradeName(e.target.value); setFormErrors(p => ({ ...p, suppTradeName: '' })); }}
                        className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                        placeholder="HUL FMCG Division"
                      />
                      {formErrors.suppTradeName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.suppTradeName}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Address Line 1</label>
                        <input
                          type="text"
                          value={suppAddrLine1}
                          onChange={e => setSuppAddrLine1(e.target.value)}
                          className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                          placeholder="Unilever House, B.D. Sawant Marg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={suppAddrLine2}
                          onChange={e => setSuppAddrLine2(e.target.value)}
                          className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                          placeholder="Chakala, Andheri (East)"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">City</label>
                        <input
                          type="text"
                          value={suppCity}
                          onChange={e => setSuppCity(e.target.value)}
                          className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">State</label>
                        <input
                          type="text"
                          value={suppState}
                          onChange={e => setSuppState(e.target.value)}
                          className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                          placeholder="Maharashtra"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Postal / PIN Code</label>
                        <input
                          type="text"
                          value={suppPostalCode}
                          onChange={e => setSuppPostalCode(e.target.value)}
                          className="w-full p-2 border border-brand-border rounded bg-white font-mono font-medium"
                          placeholder="400099"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Country</label>
                        <input
                          type="text"
                          value={suppCountry}
                          onChange={e => setSuppCountry(e.target.value)}
                          className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                          placeholder="India"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}



            </form>
            )
          )}

        </div>
      )}

      {/* SOFT-DELETE CONFIRMATION DIALOG */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-brand-border p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-red-50 text-brand-danger flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-brand-text-primary">Confirm Master Record Soft-Delete</h3>
              <p className="text-xs text-brand-text-secondary mt-1">
                Are you sure you want to deactivate and soft-delete this {config.singular.toLowerCase()} record? This will call the backend DELETE API endpoint.
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <button onClick={() => setDeleteId(null)} className="px-3.5 py-1.5 border rounded hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={confirmDelete} className="px-3.5 py-1.5 bg-brand-danger text-white rounded hover:bg-red-700 cursor-pointer shadow-sm">Deactivate & Soft Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
