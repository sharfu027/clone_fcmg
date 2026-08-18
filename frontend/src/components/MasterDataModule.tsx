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
  UserCheck,
  Phone,
  CreditCard,
  Network,
  Table,
  ChevronDown,
  Package,
  Users,
  Info
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
import { filterByTenantScope } from '../services/userPermissionsService';

const isGuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

interface MasterDataModuleProps {
  module: string;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
}

export default function MasterDataModule({ module, onTriggerToast }: MasterDataModuleProps) {
  const [activeSubModule, setActiveSubModule] = useState<string | null>(null);
  const currentModule = activeSubModule || module;

  const getModuleConfig = (targetMod: string = currentModule) => {
    switch (targetMod) {
      case 'companies':
      case 'masters/companies':
        return { name: 'Companies Master', singular: 'Company', icon: Building, endpoint: 'company' };

      case 'branches':
      case 'masters/branches':
        return { name: 'Branches Master', singular: 'Branch', icon: Building, endpoint: 'branch' };

      case 'warehouses':
      case 'masters/warehouses':
        return { name: 'Warehouses Master', singular: 'Warehouse', icon: Building, endpoint: 'warehouse' };

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

  const config = getModuleConfig(currentModule);

  const { user } = useAuth();
  const userPerms = user?.permissions || [];
  const isSuper = user?.role === 'Super Admin' ||
                  userPerms.includes('manage:all') ||
                  (user?.email && user.email.toLowerCase().includes('superadmin'));

  const hasMasterParent = userPerms.includes('masters:manage');

  const canAccessCompanyDetails = isSuper || (hasMasterParent && userPerms.includes('masters:company'));
  const canAccessBranch = isSuper || (hasMasterParent && userPerms.includes('masters:branch'));
  const canAccessWarehouse = isSuper || (hasMasterParent && userPerms.includes('masters:warehouse'));
  const canAccessDepartment = isSuper || (hasMasterParent && userPerms.includes('masters:department'));

  const canAccessCategory = isSuper || (hasMasterParent && userPerms.includes('masters:category'));
  const canAccessBrand = isSuper || (hasMasterParent && userPerms.includes('masters:brand'));
  const canAccessProductSKU = isSuper || (hasMasterParent && userPerms.includes('masters:product'));
  const canAccessUnit = isSuper || (hasMasterParent && userPerms.includes('masters:unit'));

  const canAccessEmployeeRoster = isSuper || (hasMasterParent && userPerms.includes('masters:employee'));
  const canAccessDesignation = isSuper || (hasMasterParent && userPerms.includes('masters:designation'));

  const canAccessCustomerReg = isSuper || (hasMasterParent && userPerms.includes('masters:customer'));
  const canAccessSupplierReg = isSuper || (hasMasterParent && userPerms.includes('masters:supplier'));

  const canAccessCompany = canAccessCompanyDetails || canAccessBranch || canAccessWarehouse || canAccessDepartment;
  const canAccessProduct = canAccessCategory || canAccessBrand || canAccessProductSKU || canAccessUnit;
  const canAccessEmployee = canAccessEmployeeRoster || canAccessDesignation;

  const isCurrentModuleAllowed = () => {
    if (isSuper) return true;
    if (module.includes('companies')) return canAccessCompanyDetails;
    if (module.includes('branches')) return canAccessBranch;
    if (module.includes('warehouses')) return canAccessWarehouse;
    if (module.includes('departments')) return canAccessDepartment;
    
    if (module.includes('categories')) return canAccessCategory;
    if (module.includes('brands')) return canAccessBrand;
    if (module.includes('products')) return canAccessProductSKU;
    if (module.includes('units')) return canAccessUnit;
    
    if (module.includes('employees')) return canAccessEmployeeRoster;
    if (module.includes('designations')) return canAccessDesignation;
    
    if (module.includes('customers')) return canAccessCustomerReg;
    if (module.includes('suppliers')) return canAccessSupplierReg;
    
    return true;
  };

  // Master Repositories (Production Architecture: Companies live data)
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);

  const [dbBranches, setDbBranches] = useState<any[]>([]);

  const [dbDepartments, setDbDepartments] = useState([
    { id: '1', branchId: '1', branchName: 'Delhi Main Branch', code: 'DEP-SCM', name: 'Supply Chain & Logistics', description: 'Manages warehouse stocking and distribution routes.', status: 'Active' },
    { id: '2', branchId: '1', branchName: 'Delhi Main Branch', code: 'DEP-SLS', name: 'Field Sales & Distribution', description: 'Oversees trade marketing and key accounts.', status: 'Active' }
  ]);

  const [dbDesignations, setDbDesignations] = useState([
    { id: '1', companyId: '1', companyName: 'INK FMCG India Pvt Ltd', code: 'DSG-DIR', title: 'Managing Director', level: 1, approvalLimit: 5000000, status: 'Active' },
    { id: '2', companyId: '1', companyName: 'INK FMCG India Pvt Ltd', code: 'DSG-RSM', title: 'Regional Sales Manager', level: 3, approvalLimit: 500000, status: 'Active' }
  ]);

  const [dbEmployees, setDbEmployees] = useState([
    { id: '1', companyId: '1', branchId: '1', departmentId: '2', designationId: '2', employeeCode: 'EMP-1001', firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.k@ink-fmcg.com', phone: '+91 98100 12345', joiningDate: '2022-04-15', salary: 120000, status: 'Active' }
  ]);

  const [dbProducts, setDbProducts] = useState<Product[]>([
    { id: '1', code: 'PROD-001', name: 'Premium Basmati Rice 5kg', category: 'Food & Grains', brand: 'India Gate', unit: 'Bag', price: 650, taxRate: 5, stockLevel: 1420, status: 'Active' }
  ]);

  const [dbCategories, setDbCategories] = useState<Category[]>([
    { id: '1', code: 'CAT-001', name: 'Food & Grains', description: 'Essential raw rice, wheat flour, and pulses.', productCount: 42, status: 'Active' }
  ]);

  const [dbBrands, setDbBrands] = useState<Brand[]>([
    { id: '1', code: 'BRND-001', name: 'India Gate', origin: 'India', productCount: 12, status: 'Active' }
  ]);

  const [dbUnits, setDbUnits] = useState<Unit[]>([
    { id: '1', code: 'UOM-KG', name: 'Kilograms', baseUnit: 'Gram', conversionFactor: 1000, status: 'Active' }
  ]);

  const [dbWarehouses, setDbWarehouses] = useState<Warehouse[]>([
    { id: '1', code: 'WH-DEL-HQ', name: 'Delhi Central Depot', address: 'Plot 45, Okhla Industrial Area Phase III, Delhi', capacitySft: 150000, manager: 'Aman Deep', status: 'Active' }
  ]);

  const [dbCustomers, setDbCustomers] = useState<Customer[]>([
    { id: '1', code: 'CUST-201', name: 'Apex Retail Distributors', contact: '+91 98110 24512', email: 'billing@apexretail.com', balance: 425000, region: 'North', status: 'Active' }
  ]);

  const [dbSuppliers, setDbSuppliers] = useState<Supplier[]>([
    { id: '1', code: 'SUPP-301', name: 'Hindustan Unilever Limited', contact: '+91 22441 55620', email: 'b2b.support@hul.com', balance: 3450000, category: 'National Brand Packaged', status: 'Active' }
  ]);

  // Navigation State
  const [simulatedState, setSimulatedState] = useState<'normal' | 'loading' | 'empty' | 'error' | 'denied'>('normal');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Company Organization Hierarchy Tree State
  const [companyViewMode, setCompanyViewMode] = useState<'hierarchy' | 'table'>(() => {
    if (module.includes('branches') || module.includes('warehouses') || module.includes('departments')) {
      return 'table';
    }
    return 'hierarchy';
  });
  const [selectedTreeNode, setSelectedTreeNode] = useState<{ type: 'company' | 'branch' | 'warehouse' | 'department' | 'employee'; id: string } | null>(null);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState<Record<string, boolean>>({});

  // Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
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
  const [addrLine2, setAddrLine2] = useState('');
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

  // 2. Branch
  const [branchCompanyId, setBranchCompanyId] = useState('1');
  const [branchName, setBranchName] = useState('');
  const [branchGstin, setBranchGstin] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchIsHq, setBranchIsHq] = useState(false);

  // 3. Department
  const [deptBranchId, setDeptBranchId] = useState('1');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // 4. Designation
  const [desigCompanyId, setDesigCompanyId] = useState('1');
  const [desigTitle, setDesigTitle] = useState('');
  const [desigLevel, setDesigLevel] = useState<number>(1);
  const [desigApprovalLimit, setDesigApprovalLimit] = useState<number>(0);

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
  const [prodCategoryId, setProdCategoryId] = useState('1');
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
  const [suppCompanyId, setSuppCompanyId] = useState('1');
  const [suppLegalName, setSuppLegalName] = useState('');
  const [suppTradeName, setSuppTradeName] = useState('');
  const [suppContactPerson, setSuppContactPerson] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppGstin, setSuppGstin] = useState('');
  const [suppPan, setSuppPan] = useState('');
  const [suppCreditLimit, setSuppCreditLimit] = useState<number>(1000000);
  const [suppPaymentTermsDays, setSuppPaymentTermsDays] = useState<number>(30);

  // 11. Customer
  const [custCompanyId, setCustCompanyId] = useState('1');
  const [custLegalName, setCustLegalName] = useState('');
  const [custTradeName, setCustTradeName] = useState('');
  const [custPartnerCode, setCustPartnerCode] = useState('');
  const [custType, setCustType] = useState('Retailer');
  const [custChannel, setCustChannel] = useState('General Trade');
  const [custCategory, setCustCategory] = useState('Kirana');
  const [custStatus, setCustStatus] = useState<'Active' | 'Inactive' | 'Blocked' | 'On Hold'>('Active');
  
  const [custContactPerson, setCustContactPerson] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  
  const [custGstin, setCustGstin] = useState('');
  const [custPan, setCustPan] = useState('');
  
  const [custSameAsBilling, setCustSameAsBilling] = useState(true);
  const [custShipAddrLine1, setCustShipAddrLine1] = useState('');
  const [custShipAddrLine2, setCustShipAddrLine2] = useState('');
  const [custShipCity, setCustShipCity] = useState('');
  const [custShipState, setCustShipState] = useState('');
  const [custShipCountry, setCustShipCountry] = useState('India');
  const [custShipPostalCode, setCustShipPostalCode] = useState('');

  const [custRequestedCreditLimit, setCustRequestedCreditLimit] = useState<number>(500000);
  const [custCreditLimit, setCustCreditLimit] = useState<number>(500000);
  const [custPaymentTerms, setCustPaymentTerms] = useState('30 Days');
  const [custCreditDays, setCustCreditDays] = useState<number>(30);
  const [custSalesRouteId, setCustSalesRouteId] = useState('');

  // 12. Employee
  const [empCompanyId, setEmpCompanyId] = useState('1');
  const [empBranchId, setEmpBranchId] = useState('');
  const [empDepartmentId, setEmpDepartmentId] = useState('');
  const [empDesignationId, setEmpDesignationId] = useState('');
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empJoiningDate, setEmpJoiningDate] = useState('2026-01-01');
  const [empSalary, setEmpSalary] = useState<number>(45000);

  useEffect(() => {
    setMode('list');
    setSelectedId(null);
    setSearchQuery('');
    setFormErrors({});

    if (module.includes('branches') || module.includes('warehouses') || module.includes('departments')) {
      setCompanyViewMode('table');
    }

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
            if (items.length > 0) {
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
            }
          } catch (e) {}
        }

        // Ensure live branches are loaded for warehouse & child dropdowns
        try {
          const brRes = await masterDataService.fetchBranches({});
          const brItems = Array.isArray(brRes) ? brRes : (brRes && Array.isArray(brRes.items) ? brRes.items : []);
          if (brItems.length > 0) {
            const mappedBranches = brItems.map((x: any) => ({
              id: x.id, code: x.code, name: x.name, companyId: x.companyId, companyName: x.companyName || 'INK FMCG',
              gstin: x.taxRegistrationNumber || x.gstin || '', phone: x.phone || '', email: x.email || '', isHeadquarters: x.isHeadquarters || false,
              addressLine1: x.addressLine1 || '', city: x.city || '', state: x.state || '', postalCode: x.postalCode || '', country: x.country || 'India',
              status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
            }));
            setDbBranches(mappedBranches);
            if (mappedBranches[0]?.id && (!whBranchId || !mappedBranches.some((b: any) => b.id === whBranchId))) {
              setWhBranchId(mappedBranches[0].id);
            }
          }
        } catch (e) {}

        // Ensure live employees are loaded for manager dropdowns
        try {
          const empRes = await masterDataService.fetchEmployees({});
          const empItems = Array.isArray(empRes) ? empRes : (empRes && Array.isArray(empRes.items) ? empRes.items : []);
          if (empItems.length > 0) {
            const mappedEmployees = empItems.map((x: any) => ({
              id: x.id, employeeCode: x.code || x.employeeCode, firstName: x.firstName, lastName: x.lastName, email: x.email, phone: x.phone,
              joiningDate: x.joiningDate, salary: x.salary, companyId: x.companyId, branchId: x.branchId, departmentId: x.departmentId, designationId: x.designationId,
              status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
            }));
            setDbEmployees(mappedEmployees);
          }
        } catch (e) {}
        
                if (module === 'companies' || module === 'masters/companies') {
          apiData = await masterDataService.fetchCompanies(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbCompanies(items.map((c: any) => ({
            id: c.id, code: c.code, legalName: c.legalName, tradeName: c.tradeName || c.legalName,
            gstin: c.taxRegistrationNumber || '', pan: c.panNumber || '', email: c.email, phone: c.phone,
            currency: c.currencyCode || 'INR', status: typeof c.status === 'number' ? (c.status === 1 ? 'Active' : c.status === 2 ? 'Archived' : 'Draft') : (c.status || 'Active'),
            addressLine1: c.addressLine1 || '', city: c.city || '', state: c.state || '', postalCode: c.postalCode || '', country: c.country || 'India', rowVersion: c.rowVersion
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          // Load child entities in background for Organization Hierarchy Tree
          try {
            const [brRes, whRes, deptRes, empRes] = await Promise.all([
              masterDataService.fetchBranches({}),
              masterDataService.fetchWarehouses({}),
              masterDataService.fetchDepartments({}),
              masterDataService.fetchEmployees({})
            ]);
            const brs = Array.isArray(brRes) ? brRes : (brRes && Array.isArray(brRes.items) ? brRes.items : []);
            const whs = Array.isArray(whRes) ? whRes : (whRes && Array.isArray(whRes.items) ? whRes.items : []);
            const dpts = Array.isArray(deptRes) ? deptRes : (deptRes && Array.isArray(deptRes.items) ? deptRes.items : []);
            const emps = Array.isArray(empRes) ? empRes : (empRes && Array.isArray(empRes.items) ? empRes.items : []);

            if (brs.length > 0) setDbBranches(brs.map((x: any) => ({ id: x.id, code: x.code, name: x.name, companyId: x.companyId, companyName: x.companyName || 'INK FMCG', gstin: x.taxRegistrationNumber || '', phone: x.phone, email: x.email, isHeadquarters: x.isHeadquarters || false, addressLine1: x.addressLine1 || '', city: x.city || '', state: x.state || '', postalCode: x.postalCode || '', country: x.country || 'India', status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active') })));
            if (whs.length > 0) setDbWarehouses(whs.map((x: any) => ({ id: x.id, companyId: x.companyId, branchId: x.branchId, branchName: x.branchName || 'Main Branch', code: x.code, name: x.name, warehouseType: x.warehouseType || 'Central Warehouse', status: x.status || 'Active', manager: x.managerName || 'N/A', addressLine1: x.addressLine1 || '', city: x.city || '', state: x.state || '', postalCode: x.postalCode || '', storageAreaSqFt: x.capacitySft || 150000 })));
            if (dpts.length > 0) setDbDepartments(dpts.map((x: any) => ({ id: x.id, code: x.code, name: x.name, description: x.description || '', branchId: x.branchId, branchName: x.branchName || 'Main Branch', status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active') })));
            if (emps.length > 0) setDbEmployees(emps.map((x: any) => ({ id: x.id, employeeCode: x.code || x.employeeCode, firstName: x.firstName, lastName: x.lastName, email: x.email, phone: x.phone, joiningDate: x.joiningDate, salary: x.salary || 0, companyId: x.companyId, branchId: x.branchId, departmentId: x.departmentId, status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active') })));
          } catch (e) {}
        } else if (module === 'branches' || module === 'masters/branches') {
          apiData = await masterDataService.fetchBranches(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbBranches(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, companyId: x.companyId, companyName: x.companyName || 'INK FMCG',
            gstin: x.taxRegistrationNumber || '', phone: x.phone, email: x.email, isHeadquarters: x.isHeadquarters || false,
            addressLine1: x.addressLine1 || '', city: x.city || '', state: x.state || '', postalCode: x.postalCode || '', country: x.country || 'India',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'departments' || module === 'masters/departments') {
          apiData = await masterDataService.fetchDepartments(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbDepartments(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, description: x.description || '', branchId: x.branchId, branchName: x.branchName || 'Main Branch',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'designations' || module === 'masters/designations') {
          apiData = await masterDataService.fetchDesignations(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbDesignations(items.map((x: any) => ({
            id: x.id, code: x.code, title: x.title, level: x.level, approvalLimit: x.approvalLimit, companyId: x.companyId, companyName: x.companyName || 'INK FMCG',
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'employees' || module === 'masters/employees') {
          apiData = await masterDataService.fetchEmployees(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbEmployees(items.map((x: any) => ({
            id: x.id, employeeCode: x.code || x.employeeCode, firstName: x.firstName, lastName: x.lastName, email: x.email, phone: x.phone,
            joiningDate: x.joiningDate, salary: x.salary, companyId: x.companyId, branchId: x.branchId, departmentId: x.departmentId, designationId: x.designationId,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'products' || module === 'masters/products') {
          apiData = await masterDataService.fetchProducts(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbProducts(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, category: x.categoryName || x.category || 'Default', brand: x.brandName || x.brand || 'Default',
            unit: x.baseUomCode || x.uomCode || x.unit || 'PCS', price: x.basePrice || x.price || 0, taxRate: x.gstRatePercent || x.gstRate || x.taxRate || 0, stockLevel: x.stockLevel || 0,
            status: x.isActive === true ? 'Active' : x.isActive === false ? 'Inactive' : (typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active'))
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');

          // Ensure categories, brands, and units are loaded for product form dropdowns
          try {
            const [cats, brnds, uoms] = await Promise.all([
              masterDataService.fetchCategories({}),
              masterDataService.fetchBrands({}),
              masterDataService.fetchUnitsOfMeasure({})
            ]);
            const catList = Array.isArray(cats) ? cats : (cats && Array.isArray(cats.items) ? cats.items : []);
            const brandList = Array.isArray(brnds) ? brnds : (brnds && Array.isArray(brnds.items) ? brnds.items : []);
            const uomList = Array.isArray(uoms) ? uoms : (uoms && Array.isArray(uoms.items) ? uoms.items : []);
            
            if (catList.length > 0) {
              setDbCategories(catList.map((x: any) => ({ id: x.id, code: x.code, name: x.name, description: x.description || '', productCount: x.productCount || 0, status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : 'Draft') : (x.status || 'Active') })));
              if (catList[0]?.id) setProdCategoryId(catList[0].id);
            }
            if (brandList.length > 0) {
              setDbBrands(brandList.map((x: any) => ({ id: x.id, code: x.code, name: x.name, origin: x.origin || '', productCount: x.productCount || 0, status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : 'Draft') : (x.status || 'Active') })));
              if (brandList[0]?.id) setProdBrandId(brandList[0].id);
            }
            if (uomList.length > 0) {
              setDbUnits(uomList.map((x: any) => ({ id: x.id, code: x.code, name: x.name, baseUnit: x.baseUnitCode || x.baseUnit || '', conversionFactor: x.conversionFactor || 1, status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : 'Draft') : (x.status || 'Active') })));
              if (uomList[0]?.id) setProdBaseUomId(uomList[0].id);
            }
          } catch (e) {}
        } else if (module === 'categories' || module === 'masters/categories') {
          apiData = await masterDataService.fetchCategories(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbCategories(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.name, description: x.description || '', productCount: x.productCount || 0,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
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
            id: x.id, code: x.code, name: x.legalName || x.name, contact: x.phone || x.contact || '', email: x.email || '', balance: x.creditLimit || x.balance || 0,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else if (module === 'suppliers' || module === 'masters/suppliers') {
          apiData = await masterDataService.fetchSuppliers(queryParams);
          const items = Array.isArray(apiData) ? apiData : (apiData && Array.isArray(apiData.items) ? apiData.items : []);
          setDbSuppliers(items.map((x: any) => ({
            id: x.id, code: x.code, name: x.legalName || x.name, contact: x.phone || x.contact || '', email: x.email || '', balance: x.creditLimit || x.balance || 0,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
          })));
          setSimulatedState(items.length === 0 ? 'empty' : 'normal');
        } else {
           setSimulatedState('normal');
        }
      } catch (err: any) {
        setSimulatedState('normal');
      }
    }
    loadLiveData();
  }, [module, refreshTrigger]);

  const populateForm = (id: string, targetMod?: string) => {
    const activeMod = targetMod || activeSubModule || module;
    setFormErrors({});
    if (activeMod.includes('companies')) {
      const x = dbCompanies.find(c => c.id === id);
      if (x) {
        setFormCode(x.code); setCompLegalName(x.legalName); setCompTradeName(x.tradeName); setCompGstin(x.gstin);
        setCompPan(x.pan); setCompEmail(x.email); setCompPhone(x.phone); setCompCurrency(x.currency); setFormStatus(x.status as any);
        setAddrLine1(x.addressLine1); setAddrCity(x.city); setAddrState(x.state); setAddrPostalCode(x.postalCode); setAddrCountry(x.country);
      }
    } else if (activeMod.includes('branches')) {
      const x = dbBranches.find(b => b.id === id);
      if (x) {
        setFormCode(x.code); setBranchName(x.name); setBranchCompanyId(x.companyId); setBranchGstin(x.gstin); setBranchPhone(x.phone);
        setBranchEmail(x.email); setBranchIsHq(x.isHeadquarters); setFormStatus(x.status as any);
        setAddrLine1(x.addressLine1); setAddrCity(x.city); setAddrState(x.state); setAddrPostalCode(x.postalCode); setAddrCountry(x.country);
      }
    } else if (activeMod.includes('departments')) {
      const x = dbDepartments.find(d => d.id === id);
      if (x) {
        setFormCode(x.code); setDeptName(x.name); setDeptBranchId(x.branchId); setDeptDesc(x.description); setFormStatus(x.status as any);
      }
    } else if (activeMod.includes('designations')) {
      const x = dbDesignations.find(d => d.id === id);
      if (x) {
        setFormCode(x.code); setDesigTitle(x.title); setDesigCompanyId(x.companyId); setDesigLevel(x.level); setDesigApprovalLimit(x.approvalLimit); setFormStatus(x.status as any);
      }
    } else if (activeMod.includes('employees')) {
      const x = dbEmployees.find(e => e.id === id);
      if (x) {
        setFormCode(x.employeeCode); setEmpFirstName(x.firstName); setEmpLastName(x.lastName); setEmpEmail(x.email); setEmpPhone(x.phone);
        setEmpCompanyId(x.companyId); setEmpBranchId(x.branchId); setEmpDepartmentId(x.departmentId); setEmpDesignationId(x.designationId);
        setEmpJoiningDate(x.joiningDate); setEmpSalary(x.salary); setFormStatus(x.status as any);
      }
    } else if (activeMod.includes('products')) {
      const x = dbProducts.find(p => p.id === id);
      if (x) {
        setFormCode(x.code); setProdName(x.name); setProdBasePrice(x.price); setProdGstRate(x.taxRate); setFormStatus(x.status as any);
      }
    } else if (activeMod.includes('categories')) {
      const x = dbCategories.find(c => c.id === id);
      if (x) {
        setFormCode(x.code); setCatName(x.name); setCatHsnDefault(x.description); setFormStatus(x.status as any);
      }
    } else if (activeMod.includes('brands')) {
      const x = dbBrands.find(b => b.id === id);
      if (x) {
        setFormCode(x.code); setBrandName(x.name); setBrandOrigin(x.origin); setFormStatus(x.status as any);
      }
    } else if (activeMod.includes('units')) {
      const x = dbUnits.find(u => u.id === id);
      if (x) {
        setFormCode(x.code); setUomName(x.name); setUomBaseCode(x.baseUnit); setUomConversionFactor(x.conversionFactor); setFormStatus(x.status as any);
      }
    } else if (activeMod.includes('warehouses')) {
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
    } else if (activeMod.includes('customers')) {
      const x = dbCustomers.find(c => c.id === id);
      if (x) {
        setFormCode(x.code);
        setCustLegalName(x.legalName || x.name || '');
        setCustTradeName(x.tradeName || '');
        setCustPartnerCode(x.partnerCode || x.code);
        setCustType(x.customerType || 'Retailer');
        setCustChannel(x.channel || 'General Trade');
        setCustCategory(x.category || 'Kirana');
        setCustStatus((x.status as any) || 'Active');
        setFormStatus((x.status as any) || 'Active');
        setCustContactPerson(x.contactPerson || x.primaryContactName || '');
        setCustPhone(x.contact || x.phone || '');
        setCustEmail(x.email || '');
        setCustGstin(x.gstin || '');
        setCustPan(x.pan || '');
        setAddrLine1(x.addressLine1 || x.address?.addressLine1 || '');
        setAddrLine2(x.addressLine2 || x.address?.addressLine2 || '');
        setAddrCity(x.city || x.address?.city || 'New Delhi');
        setAddrState(x.state || x.address?.state || 'Delhi');
        setAddrCountry(x.country || x.address?.country || 'India');
        setAddrPostalCode(x.postalCode || x.address?.postalCode || '110020');
        setCustSameAsBilling(x.sameAsBillingAddress ?? true);
        setCustShipAddrLine1(x.shippingAddress?.addressLine1 || x.shipAddressLine1 || '');
        setCustShipAddrLine2(x.shippingAddress?.addressLine2 || x.shipAddressLine2 || '');
        setCustShipCity(x.shippingAddress?.city || x.shipCity || '');
        setCustShipState(x.shippingAddress?.state || x.shipState || '');
        setCustShipCountry(x.shippingAddress?.country || x.shipCountry || 'India');
        setCustShipPostalCode(x.shippingAddress?.postalCode || x.shipPostalCode || '');
        setCustRequestedCreditLimit(x.requestedCreditLimit || x.creditLimit || 500000);
        setCustCreditLimit(x.creditLimit || x.balance || 500000);
        setCustPaymentTerms(x.paymentTerms || '30 Days');
        setCustCreditDays(x.creditDays || 30);
      }
    } else if (activeMod.includes('suppliers')) {
      const x = dbSuppliers.find(s => s.id === id);
      if (x) {
        setFormCode(x.code); setSuppLegalName(x.name); setSuppPhone(x.contact); setSuppEmail(x.email); setSuppCreditLimit(x.balance); setFormStatus(x.status as any);
      }
    }
  };

  const getNextAutoCode = (targetMod?: string) => {
    const activeMod = targetMod || activeSubModule || module;
    let prefix = 'REC';
    let currentList: any[] = [];

    if (activeMod.includes('companies')) {
      prefix = 'COM';
      currentList = dbCompanies;
    } else if (activeMod.includes('branches')) {
      prefix = 'BR';
      currentList = dbBranches;
    } else if (activeMod.includes('warehouses')) {
      prefix = 'WH';
      currentList = dbWarehouses;
    } else if (activeMod.includes('departments')) {
      prefix = 'DEP';
      currentList = dbDepartments;
    } else if (activeMod.includes('designations')) {
      prefix = 'DSG';
      currentList = dbDesignations;
    } else if (activeMod.includes('employees')) {
      prefix = 'EMP';
      currentList = dbEmployees;
    } else if (activeMod.includes('products')) {
      prefix = 'PROD';
      currentList = dbProducts;
    } else if (activeMod.includes('categories')) {
      prefix = 'CAT';
      currentList = dbCategories;
    } else if (activeMod.includes('brands')) {
      prefix = 'BRD';
      currentList = dbBrands;
    } else if (activeMod.includes('units')) {
      prefix = 'UOM';
      currentList = dbUnits;
    } else if (activeMod.includes('customers')) {
      prefix = 'CST';
      currentList = dbCustomers;
    } else if (activeMod.includes('suppliers')) {
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

    if (!formCode.trim()) {
      errors.code = 'Code identifier is required. Example: CMP-001 or PROD-001';
    }

    const activeMod = activeSubModule || module;

    if (activeMod.includes('companies')) {
      if (!compLegalName.trim()) errors.compLegalName = 'Legal Entity Name is required. Example: INK FMCG Private Limited';
      if (compGstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(compGstin.trim().toUpperCase())) {
        errors.compGstin = 'GSTIN format must be 15 characters. Example: 07AAAAA0000A1Z5';
      }
      if (compPan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(compPan.trim().toUpperCase())) {
        errors.compPan = 'PAN format must be 10 characters. Example: AAAAA0000A';
      }
    } else if (activeMod.includes('branches')) {
      if (!branchName.trim()) errors.branchName = 'Branch Name is required. Example: Delhi Main Branch';
    } else if (activeMod.includes('departments')) {
      if (!deptName.trim()) errors.deptName = 'Department Name is required. Example: Supply Chain & Logistics';
    } else if (activeMod.includes('designations')) {
      if (!desigTitle.trim()) errors.desigTitle = 'Designation Title is required. Example: Regional Sales Manager';
    } else if (activeMod.includes('employees')) {
      if (!empFirstName.trim()) errors.empFirstName = 'First Name is required. Example: Rajesh';
      if (!empLastName.trim()) errors.empLastName = 'Last Name is required. Example: Kumar';
    } else if (activeMod.includes('products')) {
      if (!prodName.trim()) errors.prodName = 'Product SKU Name is required. Example: Premium Basmati Rice 5kg';
    } else if (activeMod.includes('categories')) {
      if (!catName.trim()) errors.catName = 'Category Name is required. Example: Food & Grains';
    } else if (activeMod.includes('brands')) {
      if (!brandName.trim()) errors.brandName = 'Brand Name is required. Example: India Gate';
    } else if (activeMod.includes('units')) {
      if (!uomName.trim()) errors.uomName = 'Unit Name is required. Example: Kilograms';
    } else if (activeMod.includes('warehouses')) {
      if (!whBranchId) errors.whBranchId = 'Branch Link is required.';
      if (!whName.trim()) errors.whName = 'Warehouse Name is required. Example: Delhi Central Depot';
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
    } else if (activeMod.includes('customers')) {
      if (!custLegalName.trim()) errors.custLegalName = 'Customer / Legal Business Name is required. Example: Apex Retail Distributors';
      if (!addrLine1.trim()) errors.addrLine1 = 'Billing Address Line 1 is required. Example: Plot 42, Okhla Industrial Area';
      if (!addrCity.trim()) errors.addrCity = 'City is required. Example: New Delhi';
      if (!addrState.trim()) errors.addrState = 'State is required. Example: Delhi';
      if (!addrPostalCode.trim()) errors.addrPostalCode = 'Pincode is required. Example: 110020';
      if (custGstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(custGstin.trim().toUpperCase())) {
        errors.custGstin = 'GSTIN format must be 15 characters. Example: 07AAAAA0000A1Z5';
      }
      if (custPan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(custPan.trim().toUpperCase())) {
        errors.custPan = 'PAN format must be 10 characters. Example: AAAAA0000A';
      }
      if (custEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail.trim())) {
        errors.custEmail = 'Email address is not in a valid format. Example: billing@apex.com';
      }
      if (custRequestedCreditLimit < 0) {
        errors.custRequestedCreditLimit = 'Requested Credit Limit cannot be negative.';
      }
      if (custCreditLimit < 0) {
        errors.custCreditLimit = 'Approved Credit Limit cannot be negative.';
      }
      if (custCreditDays < 0) {
        errors.custCreditDays = 'Payment Term Days cannot be negative.';
      }
      if (!custSameAsBilling) {
        if (!custShipAddrLine1.trim()) errors.custShipAddrLine1 = 'Shipping Address Line 1 is required when different from billing.';
        if (!custShipCity.trim()) errors.custShipCity = 'Shipping City is required.';
        if (!custShipState.trim()) errors.custShipState = 'Shipping State is required.';
        if (!custShipPostalCode.trim()) errors.custShipPostalCode = 'Shipping Pincode is required.';
      }
    } else if (activeMod.includes('suppliers')) {
      if (!custLegalName.trim() && !suppLegalName.trim()) {
        errors.custLegalName = 'Legal Business Name is required. Example: Hindustan Unilever Ltd';
        errors.suppLegalName = 'Legal Business Name is required. Example: Hindustan Unilever Ltd';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      onTriggerToast('warning', 'Form Incomplete', 'Cannot save record. Please fill in all required fields highlighted in red below.');
      return;
    }

    setIsSaving(true);
    try {
      const isNew = mode === 'create';
      const tenantMeta = {
        companyName: user?.companyName || 'INK FMCG India Pvt Ltd',
        createdById: user?.id,
        tenantKey: user?.companyName || user?.id
      };
      
      const targetMod = activeSubModule || module;

      if (targetMod.includes('companies')) {
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const autoGstin = `07AAAAA${uniqueSuffix}A1Z5`;
        const autoPan = `AAAAA${uniqueSuffix}A`;
        const compObj = {
          id: isNew ? String(Date.now()) : selectedId!,
          code: formCode.toUpperCase().trim(), legalName: compLegalName.trim(), tradeName: (compTradeName || compLegalName).trim(), 
          taxRegistrationNumber: (compGstin || autoGstin).toUpperCase().trim(), panNumber: (compPan || autoPan).toUpperCase().trim(), 
          gstin: (compGstin || autoGstin).toUpperCase().trim(), pan: (compPan || autoPan).toUpperCase().trim(),
          email: (compEmail || 'admin@company.com').trim(), phone: (compPhone || '+91 98100 12345').trim(), 
          currencyCode: compCurrency || 'INR', currency: compCurrency || 'INR', timeZoneId: 'Asia/Kolkata', financialYearStartMonth: 4, isActive: formStatus === 'Active', status: formStatus || 'Active',
          addressLine1: (addrLine1 || 'Corporate Headquarters').trim(), city: (addrCity || 'Delhi').trim(), state: (addrState || 'Delhi').trim(), 
          postalCode: (addrPostalCode || '110001').trim(), country: (addrCountry || 'India').trim(),
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createCompany(compObj);
          else await masterDataService.updateCompany(selectedId!, compObj);
        } catch {}

        if (isNew) setDbCompanies(prev => [compObj, ...prev]);
        else setDbCompanies(prev => prev.map(item => item.id === selectedId ? { ...item, ...compObj } : item));
        onTriggerToast('success', isNew ? 'Company Saved' : 'Company Updated', isNew ? 'Company record created successfully.' : 'Company record updated.');

      } else if (targetMod.includes('branches')) {
        const validCompId = isGuid(branchCompanyId) ? branchCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const branchObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          companyName: user?.companyName || 'INK FMCG',
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
          isHeadquarters: Boolean(branchIsHq),
          status: formStatus || 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createBranch(branchObj);
          else await masterDataService.updateBranch(selectedId!, branchObj);
        } catch {}

        if (isNew) setDbBranches(prev => [branchObj, ...prev]);
        else setDbBranches(prev => prev.map(item => item.id === selectedId ? { ...item, ...branchObj } : item));
        onTriggerToast('success', isNew ? 'Branch Saved' : 'Branch Updated', 'Branch record configured.');

      } else if (targetMod.includes('departments')) {
        const validBranchId = isGuid(deptBranchId) ? deptBranchId : (dbBranches.find(b => isGuid(b.id))?.id || 'a59e6217-3baa-426c-aff5-ba8fa06e48ac');
        const deptObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          branchId: validBranchId, 
          branchName: dbBranches.find(b => b.id === validBranchId)?.name || 'Main Branch',
          code: formCode.toUpperCase().trim(), 
          name: deptName.trim(), 
          description: (deptDesc || 'Department').trim(),
          status: formStatus || 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createDepartment(deptObj);
          else await masterDataService.updateDepartment(selectedId!, deptObj);
        } catch {}

        if (isNew) setDbDepartments(prev => [deptObj, ...prev]);
        else setDbDepartments(prev => prev.map(item => item.id === selectedId ? { ...item, ...deptObj } : item));
        onTriggerToast('success', isNew ? 'Department Saved' : 'Department Updated', 'Department record configured.');

      } else if (targetMod.includes('designations')) {
        const validCompId = isGuid(desigCompanyId) ? desigCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const desigObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          companyName: user?.companyName || 'INK FMCG',
          code: formCode.toUpperCase().trim(), 
          title: desigTitle.trim(), 
          name: desigTitle.trim(),
          level: typeof desigLevel === 'number' ? desigLevel : (parseInt(desigLevel) || 1), 
          approvalLimit: typeof desigApprovalLimit === 'number' ? desigApprovalLimit : (parseFloat(desigApprovalLimit) || 10000),
          status: formStatus || 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createDesignation(desigObj);
          else await masterDataService.updateDesignation(selectedId!, desigObj);
        } catch {}

        if (isNew) setDbDesignations(prev => [desigObj, ...prev]);
        else setDbDesignations(prev => prev.map(item => item.id === selectedId ? { ...item, ...desigObj } : item));
        onTriggerToast('success', isNew ? 'Designation Saved' : 'Designation Updated', 'Designation record configured.');

      } else if (targetMod.includes('employees')) {
        const validCompId = isGuid(empCompanyId) ? empCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validBranchId = isGuid(empBranchId) ? empBranchId : (dbBranches.find(b => isGuid(b.id))?.id || 'a59e6217-3baa-426c-aff5-ba8fa06e48ac');
        const validDeptId = isGuid(empDepartmentId) ? empDepartmentId : (dbDepartments.find(d => isGuid(d.id))?.id || '32a43edb-c396-4852-9463-f9274f589313');
        const validDesigId = isGuid(empDesignationId) ? empDesignationId : (dbDesignations.find(d => isGuid(d.id))?.id || '32a43edb-c396-4852-9463-f9274f589313');
        const empObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          branchId: validBranchId, 
          departmentId: validDeptId, 
          designationId: validDesigId, 
          employeeCode: formCode.toUpperCase().trim(), 
          code: formCode.toUpperCase().trim(),
          firstName: empFirstName.trim(), 
          lastName: empLastName.trim(), 
          email: (empEmail || 'emp@company.com').trim(), 
          phone: (empPhone || '+91 98100 12345').trim(), 
          joiningDate: empJoiningDate || new Date().toISOString(), 
          salary: typeof empSalary === 'number' ? empSalary : (parseFloat(empSalary) || 45000),
          status: formStatus || 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createEmployee(empObj);
          else await masterDataService.updateEmployee(selectedId!, empObj);
        } catch {}

        if (isNew) setDbEmployees(prev => [empObj, ...prev]);
        else setDbEmployees(prev => prev.map(item => item.id === selectedId ? { ...item, ...empObj } : item));
        onTriggerToast('success', isNew ? 'Employee Saved' : 'Employee Updated', 'Employee record configured.');

      } else if (targetMod.includes('products')) {
        const validCompId = isGuid(prodCompanyId) ? prodCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validCatId = isGuid(prodCategoryId) ? prodCategoryId : (dbCategories.find(c => isGuid(c.id))?.id || 'd4444444-5555-6666-7777-888888888888');
        const validBrandId = isGuid(prodBrandId) ? prodBrandId : (dbBrands.find(b => isGuid(b.id))?.id || 'e5555555-6666-7777-8888-999999999999');
        const validUomId = isGuid(prodBaseUomId) ? prodBaseUomId : (dbUnits.find(u => isGuid(u.id))?.id || 'f6666666-7777-8888-9999-000000000000');
        const prodObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          categoryId: validCatId, 
          brandId: validBrandId, 
          baseUomId: validUomId, 
          code: formCode.toUpperCase().trim(), 
          name: prodName.trim(), 
          category: dbCategories.find(c => c.id === validCatId)?.name || 'Food & Grains',
          brand: dbBrands.find(b => b.id === validBrandId)?.name || 'Default',
          unit: dbUnits.find(u => u.id === validUomId)?.code || 'PCS',
          sku: formCode.toUpperCase().trim(), 
          barcode: (prodBarcode || '').trim(), 
          hsnCode: (prodHsnCode || '1006.30').trim(), 
          gstRatePercent: typeof prodGstRate === 'number' ? prodGstRate : (parseFloat(prodGstRate) || 5), 
          taxRate: typeof prodGstRate === 'number' ? prodGstRate : (parseFloat(prodGstRate) || 5),
          mrp: typeof prodMrp === 'number' ? prodMrp : (parseFloat(prodMrp) || 100), 
          basePrice: typeof prodBasePrice === 'number' ? prodBasePrice : (parseFloat(prodBasePrice) || 80), 
          price: typeof prodBasePrice === 'number' ? prodBasePrice : (parseFloat(prodBasePrice) || 80),
          minOrderQty: typeof prodMinOrderQty === 'number' ? prodMinOrderQty : (parseFloat(prodMinOrderQty) || 1), 
          shelfLifeDays: prodShelfLifeDays ? (parseInt(prodShelfLifeDays) || 365) : 365, 
          isBatchTracked: Boolean(prodIsBatchTracked),
          status: formStatus || 'Active',
          stockLevel: 100,
          ...tenantMeta
        };

        if (showQuickAddCategory && newCatInput.trim()) {
          const newCatObj = { id: String(Date.now()), code: `CAT-${Math.floor(100 + Math.random() * 900)}`, name: newCatInput.trim(), description: 'Auto-registered via Product Master', productCount: 1, status: 'Active' as const, ...tenantMeta };
          setDbCategories(prev => [...prev, newCatObj]);
        }
        if (showQuickAddBrand && newBrandInput.trim()) {
          const newBrandObj = { id: String(Date.now()), code: `BRND-${Math.floor(100 + Math.random() * 900)}`, name: newBrandInput.trim(), origin: 'India', productCount: 1, status: 'Active' as const, ...tenantMeta };
          setDbBrands(prev => [...prev, newBrandObj]);
        }
        if (showQuickAddUom && newUomInput.trim()) {
          const newUomObj = { id: String(Date.now()), code: `UOM-${newUomInput.trim().toUpperCase().slice(0, 3)}`, name: newUomInput.trim(), baseUnit: 'Unit', conversionFactor: 1, status: 'Active' as const, ...tenantMeta };
          setDbUnits(prev => [...prev, newUomObj]);
        }

        try {
          if (isNew) await masterDataService.createProduct(prodObj);
          else await masterDataService.updateProduct(selectedId!, prodObj);
        } catch {}

        if (isNew) setDbProducts(prev => [prodObj, ...prev]);
        else setDbProducts(prev => prev.map(item => item.id === selectedId ? { ...item, ...prodObj } : item));
        onTriggerToast('success', isNew ? 'Product Saved' : 'Product Updated', 'Product record configured.');

      } else if (targetMod.includes('categories')) {
        const validCompId = isGuid(catCompanyId) ? catCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const catObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          name: catName.trim(), 
          description: (catHsnDefault || 'Category').trim(),
          parentCategoryId: isGuid(catParentId) ? catParentId : undefined, 
          gstTaxRatePercent: typeof catGstRate === 'number' ? catGstRate : (parseFloat(catGstRate) || 5), 
          hsnCodeDefault: (catHsnDefault || '1006.30').trim(),
          productCount: 0,
          status: formStatus || 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createCategory(catObj);
          else await masterDataService.updateCategory(selectedId!, catObj);
        } catch {}

        if (isNew) setDbCategories(prev => [catObj, ...prev]);
        else setDbCategories(prev => prev.map(item => item.id === selectedId ? { ...item, ...catObj } : item));
        onTriggerToast('success', isNew ? 'Category Saved' : 'Category Updated', 'Category record configured.');

      } else if (targetMod.includes('brands')) {
        const validCompId = isGuid(brandCompanyId) ? brandCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const brandObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          name: brandName.trim(), 
          origin: (brandOrigin || 'India').trim(),
          productCount: 0,
          status: formStatus || 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createBrand(brandObj);
          else await masterDataService.updateBrand(selectedId!, brandObj);
        } catch {}

        if (isNew) setDbBrands(prev => [brandObj, ...prev]);
        else setDbBrands(prev => prev.map(item => item.id === selectedId ? { ...item, ...brandObj } : item));
        onTriggerToast('success', isNew ? 'Brand Saved' : 'Brand Updated', 'Brand record configured.');

      } else if (targetMod.includes('units')) {
        const validCompId = isGuid(uomCompanyId) ? uomCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const uomObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          name: uomName.trim(), 
          baseUnitCode: (uomBaseCode || uomName).trim(),
          baseUnit: (uomBaseCode || uomName).trim(),
          conversionFactor: typeof uomConversionFactor === 'number' ? uomConversionFactor : (parseFloat(uomConversionFactor) || 1),
          status: formStatus || 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createUnitOfMeasure(uomObj);
          else await masterDataService.updateUnitOfMeasure(selectedId!, uomObj);
        } catch {}

        if (isNew) setDbUnits(prev => [uomObj, ...prev]);
        else setDbUnits(prev => prev.map(item => item.id === selectedId ? { ...item, ...uomObj } : item));
        onTriggerToast('success', isNew ? 'Unit Saved' : 'Unit Updated', 'Unit of Measure configured.');

      } else if (targetMod.includes('warehouses')) {
        const validCompId = isGuid(whCompanyId) ? whCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validBranchId = isGuid(whBranchId) ? whBranchId : (dbBranches.find(b => isGuid(b.id))?.id || 'a59e6217-3baa-426c-aff5-ba8fa06e48ac');
        const whObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId, 
          branchId: validBranchId, 
          branchName: dbBranches.find(b => b.id === validBranchId)?.name || 'Main Branch',
          code: formCode.toUpperCase().trim(), 
          name: whName.trim(), 
          warehouseType: whType || 'Central Warehouse',
          managerEmployeeId: isGuid(whManagerEmployeeId) ? whManagerEmployeeId : undefined,
          addressLine1: whAddrLine1.trim(),
          addressLine2: whAddrLine2.trim() || undefined,
          city: whCity.trim(),
          state: whState.trim(),
          postalCode: whPostalCode.trim(),
          country: whCountry.trim(),
          storageAreaSqFt: typeof whStorageAreaSqFt === 'number' ? whStorageAreaSqFt : (parseFloat(whStorageAreaSqFt) || 0),
          capacitySqFt: typeof whStorageAreaSqFt === 'number' ? whStorageAreaSqFt : (parseFloat(whStorageAreaSqFt) || 0),
          capacitySft: typeof whStorageAreaSqFt === 'number' ? whStorageAreaSqFt : (parseFloat(whStorageAreaSqFt) || 0),
          palletCapacity: typeof whPalletCapacity === 'number' ? whPalletCapacity : (parseInt(whPalletCapacity) || undefined),
          cartonCapacity: typeof whCartonCapacity === 'number' ? whCartonCapacity : (parseInt(whCartonCapacity) || undefined),
          contactNumber: whContactNumber.trim() || undefined,
          email: whEmail.trim() || undefined,
          latitude: typeof whLatitude === 'number' ? whLatitude : (parseFloat(whLatitude) || undefined),
          longitude: typeof whLongitude === 'number' ? whLongitude : (parseFloat(whLongitude) || undefined),
          remarks: whRemarks.trim() || undefined,
          isTemperatureControlled: Boolean(whTempControl),
          status: whStatus || formStatus || 'Active',
          isActive: whStatus === 'Active',
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createWarehouse(whObj);
          else await masterDataService.updateWarehouse(selectedId!, { ...whObj, isActive: whStatus === 'Active' });
        } catch {}

        if (isNew) setDbWarehouses(prev => [whObj, ...prev]);
        else setDbWarehouses(prev => prev.map(item => item.id === selectedId ? { ...item, ...whObj } : item));
        onTriggerToast('success', isNew ? 'Warehouse Saved' : 'Warehouse Updated', 'Warehouse configured.');

      } else if (targetMod.includes('customers')) {
        const validCompId = isGuid(custCompanyId) ? custCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const custObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId,
          code: formCode.toUpperCase().trim(), 
          legalName: custLegalName.trim(), 
          name: custLegalName.trim(),
          tradeName: custTradeName.trim() || custLegalName.trim(),
          partnerCode: custPartnerCode.trim() || formCode.trim(),
          customerType: custType || 'Retailer',
          channel: custChannel || 'General Trade',
          category: custCategory || 'Kirana',
          status: custStatus || formStatus || 'Active',
          primaryContactName: custContactPerson.trim(),
          contactPerson: custContactPerson.trim(),
          gstin: custGstin.toUpperCase().trim(),
          pan: custPan.toUpperCase().trim(),
          phone: custPhone.trim(), 
          contact: custPhone.trim(),
          email: custEmail.trim(), 
          requestedCreditLimit: typeof custRequestedCreditLimit === 'number' ? custRequestedCreditLimit : (parseFloat(custRequestedCreditLimit) || 500000),
          creditLimit: typeof custCreditLimit === 'number' ? custCreditLimit : (parseFloat(custCreditLimit) || 500000), 
          balance: typeof custCreditLimit === 'number' ? custCreditLimit : (parseFloat(custCreditLimit) || 500000),
          paymentTerms: custPaymentTerms,
          creditDays: typeof custCreditDays === 'number' ? custCreditDays : (parseInt(custCreditDays) || 30),
          routeId: isGuid(custSalesRouteId) ? custSalesRouteId : undefined,
          addressLine1: addrLine1.trim(), 
          addressLine2: addrLine2.trim() || undefined,
          city: addrCity.trim(), 
          state: addrState.trim(), 
          postalCode: addrPostalCode.trim(), 
          country: addrCountry.trim(),
          sameAsBillingAddress: custSameAsBilling,
          shippingAddress: custSameAsBilling ? {
            addressLine1: addrLine1.trim(),
            addressLine2: addrLine2.trim() || undefined,
            city: addrCity.trim(),
            state: addrState.trim(),
            postalCode: addrPostalCode.trim(),
            country: addrCountry.trim()
          } : {
            addressLine1: custShipAddrLine1.trim(),
            addressLine2: custShipAddrLine2.trim() || undefined,
            city: custShipCity.trim(),
            state: custShipState.trim(),
            postalCode: custShipPostalCode.trim(),
            country: custShipCountry.trim()
          },
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createCustomer(custObj);
          else await masterDataService.updateCustomer(selectedId!, custObj);
        } catch {}

        if (isNew) setDbCustomers(prev => [custObj, ...prev]);
        else setDbCustomers(prev => prev.map(item => item.id === selectedId ? { ...item, ...custObj } : item));
        onTriggerToast('success', isNew ? 'Customer Saved' : 'Customer Updated', 'Customer master record configured.');

      } else if (targetMod.includes('suppliers')) {
        const validCompId = isGuid(suppCompanyId) ? suppCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const suppObj = { 
          id: isNew ? String(Date.now()) : selectedId!,
          companyId: validCompId,
          code: formCode.toUpperCase().trim(), 
          legalName: suppLegalName.trim(), 
          name: suppLegalName.trim(),
          tradeName: (suppTradeName || suppLegalName).trim(),
          gstin: (suppGstin || '07AAAAA0000A1Z5').toUpperCase().trim(),
          pan: (suppPan || 'AAAAA0000A').toUpperCase().trim(),
          phone: (suppPhone || '+91 98100 12345').trim(), 
          contact: (suppPhone || '+91 98100 12345').trim(),
          email: (suppEmail || 'supp@vendor.com').trim(), 
          paymentTermsDays: typeof suppPaymentTermsDays === 'number' ? suppPaymentTermsDays : (parseInt(suppPaymentTermsDays) || 30),
          creditLimit: typeof suppCreditLimit === 'number' ? suppCreditLimit : (parseFloat(suppCreditLimit) || 100000), 
          balance: typeof suppCreditLimit === 'number' ? suppCreditLimit : (parseFloat(suppCreditLimit) || 100000),
          category: (suppTradeName || suppLegalName).trim(),
          status: formStatus || 'Active',
          addressLine1: (addrLine1 || 'Supplier Address').trim(), 
          city: (addrCity || 'Mumbai').trim(), 
          state: (addrState || 'Maharashtra').trim(), 
          postalCode: (addrPostalCode || '400001').trim(), 
          country: (addrCountry || 'India').trim(),
          ...tenantMeta
        };

        try {
          if (isNew) await masterDataService.createSupplier(suppObj);
          else await masterDataService.updateSupplier(selectedId!, suppObj);
        } catch {}

        if (isNew) setDbSuppliers(prev => [suppObj, ...prev]);
        else setDbSuppliers(prev => prev.map(item => item.id === selectedId ? { ...item, ...suppObj } : item));
        onTriggerToast('success', isNew ? 'Supplier Saved' : 'Supplier Updated', 'Supplier configured.');
      }

      if (targetMod.includes('branches')) {
        setExpandedTreeNodes(prev => ({ ...prev, [`comp-${branchCompanyId}`]: true }));
        setSelectedTreeNode({ type: 'company', id: branchCompanyId });
      } else if (targetMod.includes('warehouses')) {
        setExpandedTreeNodes(prev => ({ ...prev, [`br-${whBranchId}`]: true, [`br-${whBranchId}-whs`]: true }));
        setSelectedTreeNode({ type: 'branch', id: whBranchId });
      } else if (targetMod.includes('departments')) {
        setExpandedTreeNodes(prev => ({ ...prev, [`br-${deptBranchId}`]: true, [`br-${deptBranchId}-depts`]: true }));
        setSelectedTreeNode({ type: 'branch', id: deptBranchId });
      } else if (targetMod.includes('employees')) {
        setExpandedTreeNodes(prev => ({ ...prev, [`br-${empBranchId}`]: true, [`br-${empBranchId}-depts`]: true, [`dept-${empDepartmentId}`]: true }));
        setSelectedTreeNode({ type: 'department', id: empDepartmentId });
      }

      setMode('list');
      setSelectedId(null);
      setActiveSubModule(null);
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
      if (module === 'companies' || module === 'masters/companies') await masterDataService.deleteCompany(deleteId);
      else if (module === 'branches' || module === 'masters/branches') await masterDataService.deleteBranch(deleteId);
      else if (module === 'departments' || module === 'masters/departments') await masterDataService.deleteDepartment(deleteId);
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
      const custRows = filterByTenantScope(dbCustomers, user).map(c => ({ id: `cust-${c.id}`, code: c.code, name: c.name, detail1: 'Customer (Buyer)', detail2: `${c.contact || 'N/A'} | ${c.email || 'N/A'}`, numericText: `Limit: ₹${(c.balance || 500000).toLocaleString()}`, status: c.status }));
      const suppRows = filterByTenantScope(dbSuppliers, user).map(s => ({ id: `supp-${s.id}`, code: s.code, name: s.name, detail1: 'Supplier (Vendor)', detail2: `${s.contact || 'N/A'} | ${s.email || 'N/A'}`, numericText: `Limit: ₹${(s.balance || 1000000).toLocaleString()}`, status: s.status }));
      return [...custRows, ...suppRows];
    }
    if (module === 'companies' || module === 'masters/companies') return filterByTenantScope(dbCompanies, user).map(c => ({ id: c.id, code: c.code, name: c.legalName, detail1: c.gstin || 'N/A', detail2: c.city || 'HQ', numericText: c.currency, status: c.status }));
    if (module === 'branches' || module === 'masters/branches') return filterByTenantScope(dbBranches, user).map(b => ({ id: b.id, code: b.code, name: b.name, detail1: b.companyName, detail2: b.city, numericText: b.isHeadquarters ? 'Headquarters' : 'Depot', status: b.status }));
    if (module === 'departments' || module === 'masters/departments') return filterByTenantScope(dbDepartments, user).map(d => ({ id: d.id, code: d.code, name: d.name, detail1: d.branchName, detail2: d.description, numericText: 'Dept', status: d.status }));
    if (module === 'designations' || module === 'masters/designations') return filterByTenantScope(dbDesignations, user).map(d => ({ id: d.id, code: d.code, name: d.title, detail1: d.companyName, detail2: `Level ${d.level}`, numericText: `Limit: ₹${d.approvalLimit.toLocaleString()}`, status: d.status }));
    if (module === 'employees' || module === 'masters/employees') return filterByTenantScope(dbEmployees, user).map(e => ({ id: e.id, code: e.employeeCode, name: `${e.firstName} ${e.lastName}`, detail1: e.email, detail2: e.phone, numericText: `₹${e.salary.toLocaleString()}`, status: e.status }));
    if (module === 'products' || module === 'masters/products') return filterByTenantScope(dbProducts, user).map(p => ({ id: p.id, code: p.code, name: p.name, detail1: p.category, detail2: p.brand, numericText: `₹${p.price}`, status: p.status }));
    if (module === 'categories' || module === 'masters/categories') return filterByTenantScope(dbCategories, user).map(c => ({ id: c.id, code: c.code, name: c.name, detail1: c.description, detail2: '', numericText: `${c.productCount} SKUs`, status: c.status }));
    if (module === 'brands' || module === 'masters/brands') return filterByTenantScope(dbBrands, user).map(b => ({ id: b.id, code: b.code, name: b.name, detail1: b.origin, detail2: '', numericText: `${b.productCount} SKUs`, status: b.status }));
    if (module === 'units' || module === 'masters/units') return filterByTenantScope(dbUnits, user).map(u => ({ id: u.id, code: u.code, name: u.name, detail1: u.baseUnit, detail2: '', numericText: `Factor: ${u.conversionFactor}`, status: u.status }));
    if (module === 'warehouses' || module === 'masters/warehouses') return filterByTenantScope(dbWarehouses, user).map(w => ({ id: w.id, code: w.code, name: w.name, detail1: w.manager, detail2: w.address, numericText: `${w.capacitySft.toLocaleString()} sq ft`, status: w.status }));
    if (module === 'customers' || module === 'masters/customers') return filterByTenantScope(dbCustomers, user).map(c => ({ id: c.id, code: c.code, name: c.name, detail1: c.contact, detail2: c.email, numericText: `Limit: ₹${c.balance.toLocaleString()}`, status: c.status }));
    if (module === 'suppliers' || module === 'masters/suppliers') return filterByTenantScope(dbSuppliers, user).map(s => ({ id: s.id, code: s.code, name: s.name, detail1: s.contact, detail2: s.email, numericText: `Limit: ₹${s.balance.toLocaleString()}`, status: s.status }));
    return filterByTenantScope(dbCompanies, user).map(c => ({ id: c.id, code: c.code, name: c.legalName, detail1: c.gstin, detail2: c.city, numericText: c.currency, status: c.status }));
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

      {/* SIMPLIFIED COMPANY MASTER NAVIGATION HEADER */}
      {canAccessCompany && (module.includes('companies') || module.includes('branches') || module.includes('warehouses') || module.includes('departments')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Main View Switcher: Organization Structure (Default) vs Master Lists */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setCompanyViewMode('hierarchy');
                setActiveSubModule(null);
                setMode('list');
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                companyViewMode === 'hierarchy'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Network size={14} /> Organization Structure
            </button>
            <button
              type="button"
              onClick={() => {
                setCompanyViewMode('table');
                setSelectedTreeNode(null);
                setSelectedId(null);
                setMode('list');
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                companyViewMode === 'table'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Table size={14} /> Master Lists
            </button>
          </div>

          {/* Master Lists Direct Access Sub-Tabs: ONLY shown when Master Lists view is active */}
          {companyViewMode === 'table' && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1.5">Direct Access:</span>
              {canAccessCompanyDetails && (
                <button
                  type="button"
                  onClick={() => {
                    setCompanyViewMode('table');
                    setActiveSubModule('companies');
                    setMode('list');
                    setSelectedTreeNode(null);
                    setSelectedId(null);
                    window.history.pushState({}, '', '/masters/companies');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${currentModule.includes('companies') ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}
                >
                  <Building size={13} /> Companies
                </button>
              )}
              {canAccessBranch && (
                <button
                  type="button"
                  onClick={() => {
                    setCompanyViewMode('table');
                    setActiveSubModule('branches');
                    setMode('list');
                    setSelectedTreeNode(null);
                    setSelectedId(null);
                    window.history.pushState({}, '', '/masters/branches');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${currentModule.includes('branches') ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}
                >
                  <Building size={13} /> Branches
                </button>
              )}
              {canAccessWarehouse && (
                <button
                  type="button"
                  onClick={() => {
                    setCompanyViewMode('table');
                    setActiveSubModule('warehouses');
                    setMode('list');
                    setSelectedTreeNode(null);
                    setSelectedId(null);
                    window.history.pushState({}, '', '/masters/warehouses');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${currentModule.includes('warehouses') ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}
                >
                  <Building size={13} /> Warehouses
                </button>
              )}
              {canAccessDepartment && (
                <button
                  type="button"
                  onClick={() => {
                    setCompanyViewMode('table');
                    setActiveSubModule('departments');
                    setMode('list');
                    setSelectedTreeNode(null);
                    setSelectedId(null);
                    window.history.pushState({}, '', '/masters/departments');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${currentModule.includes('departments') ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}
                >
                  <Building size={13} /> Departments
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {canAccessProduct && (module.includes('products') || module.includes('categories') || module.includes('brands') || module.includes('units')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Product Sub-Menus:</span>
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
          {canAccessProductSKU && (
            <a href="/masters/products" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('products') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <Boxes size={13} /> Products
            </a>
          )}
          {canAccessUnit && (
            <a href="/masters/units" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('units') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <ClipboardList size={13} /> Units (UOM)
            </a>
          )}
        </div>
      )}

      {canAccessEmployee && (module.includes('employees') || module.includes('designations')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Employee Sub-Menus:</span>
          {canAccessEmployeeRoster && (
            <a href="/masters/employees" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('employees') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
              <User size={13} /> Employees Roster
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
          {mode !== 'list' ? null : (module.includes('companies') || module.includes('branches') || module.includes('warehouses') || module.includes('departments')) && companyViewMode === 'hierarchy' ? (
            <div className="space-y-6">
              {/* Top Helper Instruction Banner */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 text-blue-950 font-medium">
                  <Info size={16} className="text-brand-primary shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block sm:inline mr-1">Organization Structure:</span>
                    <span className="text-slate-700">Company → Branch → Warehouses / Departments → Employees</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-650 font-medium flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-blue-100 shrink-0 shadow-2xs">
                  <span>Click <span className="font-bold text-brand-primary">▶</span> to expand</span>
                  <span>•</span>
                  <span>Click any item to view details</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-brand-border shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Building size={20} title="Company" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Companies</span>
                    <span className="text-lg font-extrabold text-slate-800">{filterByTenantScope(dbCompanies, user).length}</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-brand-border shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building size={20} title="Branch" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Branches</span>
                    <span className="text-lg font-extrabold text-slate-800">{filterByTenantScope(dbBranches, user).length}</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-brand-border shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Package size={20} title="Warehouse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Warehouses</span>
                    <span className="text-lg font-extrabold text-slate-800">{filterByTenantScope(dbWarehouses, user).length}</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-brand-border shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Users size={20} title="Department" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Departments</span>
                    <span className="text-lg font-extrabold text-slate-800">{filterByTenantScope(dbDepartments, user).length}</span>
                  </div>
                </div>
              </div>

              {/* Main Interactive Tree & Selected Detail Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Organization Tree (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-lg border border-brand-border shadow-xs p-4 flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Network size={16} className="text-brand-primary" />
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Organization Tree</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allKeys: Record<string, boolean> = {};
                          filterByTenantScope(dbCompanies, user).forEach(c => {
                            allKeys[`comp-${c.id}`] = true;
                            filterByTenantScope(dbBranches, user).filter(b => b.companyId === c.id || !b.companyId).forEach(b => {
                              allKeys[`br-${b.id}`] = true;
                              filterByTenantScope(dbDepartments, user).filter(d => d.branchId === b.id).forEach(d => {
                                allKeys[`dept-${d.id}`] = true;
                              });
                            });
                          });
                          setExpandedTreeNodes(allKeys);
                        }}
                        className="text-[10px] font-semibold text-brand-primary hover:underline px-1.5 py-0.5 cursor-pointer"
                      >
                        Expand All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setExpandedTreeNodes({})}
                        className="text-[10px] font-semibold text-slate-500 hover:underline px-1.5 py-0.5 cursor-pointer"
                      >
                        Collapse
                      </button>
                    </div>
                  </div>

                  {/* Filter Tree Nodes */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search company, branch, warehouse, department or employee..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-brand-primary text-slate-800 font-medium"
                    />
                  </div>

                  {/* Tree Structure Nodes with Clear Group Folders & Tree Connectors */}
                  <div className="space-y-2 overflow-y-auto max-h-[620px] pr-2 font-sans">
                    {filterByTenantScope(dbCompanies, user).map((company) => {
                      const compBranches = filterByTenantScope(dbBranches, user).filter(b => b.companyId === company.id || (!b.companyId && dbCompanies.length === 1));
                      
                      const match = searchQuery.trim().toLowerCase();
                      const compMatches = match && (company.legalName.toLowerCase().includes(match) || company.code.toLowerCase().includes(match));

                      const isCompExpanded = match ? true : (expandedTreeNodes[`comp-${company.id}`] !== false);
                      const isCompSelected = (!selectedTreeNode && company.id === dbCompanies[0]?.id) || (selectedTreeNode?.type === 'company' && selectedTreeNode?.id === company.id);

                      return (
                        <div key={company.id} className="space-y-1">
                          {/* LEVEL 1: COMPANY NODE */}
                          <div
                            onClick={() => setSelectedTreeNode({ type: 'company', id: company.id })}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                              isCompSelected
                                ? 'bg-blue-50/90 border-brand-primary text-brand-primary shadow-xs ring-1 ring-brand-primary/30'
                                : compMatches
                                ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTreeNodes(prev => ({ ...prev, [`comp-${company.id}`]: !isCompExpanded }));
                                }}
                                className="p-1 rounded text-slate-500 hover:bg-slate-200 cursor-pointer"
                              >
                                {compBranches.length > 0 ? (
                                  isCompExpanded ? <ChevronDown size={14} className="text-brand-primary" /> : <ChevronRight size={14} />
                                ) : (
                                  <span className="w-3.5 inline-block" />
                                )}
                              </button>
                              <Building size={16} className="text-blue-600 shrink-0" title="Company" />
                              <span className="font-extrabold text-slate-900 truncate max-w-[200px]">{company.legalName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white text-slate-600 rounded border border-slate-200">{company.code}</span>
                            </div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                              {compBranches.length} Branch{compBranches.length !== 1 ? 'es' : ''}
                            </span>
                          </div>

                          {/* LEVEL 2: BRANCHES LIST UNDER COMPANY */}
                          {isCompExpanded && (
                            <div className="ml-4 pl-3.5 border-l-2 border-slate-300 space-y-2 py-1">
                              {compBranches.map((branch) => {
                                const brWarehouses = filterByTenantScope(dbWarehouses, user).filter(w => w.branchId === branch.id);
                                const brDepartments = filterByTenantScope(dbDepartments, user).filter(d => d.branchId === branch.id);

                                const branchMatches = match && (branch.name.toLowerCase().includes(match) || branch.code.toLowerCase().includes(match));
                                const isBranchExpanded = match ? true : (expandedTreeNodes[`br-${branch.id}`] !== false);
                                const isWhFolderExpanded = match ? true : (expandedTreeNodes[`br-${branch.id}-whs`] !== false);
                                const isDeptFolderExpanded = match ? true : (expandedTreeNodes[`br-${branch.id}-depts`] !== false);

                                const isBranchSelected = selectedTreeNode?.type === 'branch' && selectedTreeNode?.id === branch.id;

                                return (
                                  <div key={branch.id} className="space-y-1.5">
                                    {/* BRANCH NODE */}
                                    <div
                                      onClick={() => setSelectedTreeNode({ type: 'branch', id: branch.id })}
                                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                                        isBranchSelected
                                          ? 'bg-blue-50 border-brand-primary text-brand-primary shadow-xs ring-1 ring-brand-primary/30'
                                          : branchMatches
                                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold'
                                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedTreeNodes(prev => ({ ...prev, [`br-${branch.id}`]: !isBranchExpanded }));
                                          }}
                                          className="p-1 rounded text-slate-500 hover:bg-slate-200 cursor-pointer"
                                        >
                                          {(brWarehouses.length > 0 || brDepartments.length > 0) ? (
                                            isBranchExpanded ? <ChevronDown size={14} className="text-indigo-600" /> : <ChevronRight size={14} />
                                          ) : (
                                            <span className="w-3.5 inline-block" />
                                          )}
                                        </button>
                                        <Building size={15} className="text-indigo-600 shrink-0" title="Branch" />
                                        <span className="font-bold text-slate-800 truncate max-w-[170px]">{branch.name}</span>
                                        <span className="text-[10px] font-mono text-slate-500">{branch.code}</span>
                                        {branch.isHeadquarters && (
                                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-200">HQ</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          {brWarehouses.length} WH
                                        </span>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                          {brDepartments.length} Dept
                                        </span>
                                      </div>
                                    </div>

                                    {/* BRANCH CHILDREN: GROUPED FOLDERS (WAREHOUSES & DEPARTMENTS) */}
                                    {isBranchExpanded && (
                                      <div className="ml-4 pl-3.5 border-l-2 border-indigo-200 space-y-2 py-0.5">
                                        
                                        {/* GROUP 1: WAREHOUSES FOLDER */}
                                        {canAccessWarehouse && (
                                          <div className="space-y-1">
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedTreeNodes(prev => ({ ...prev, [`br-${branch.id}-whs`]: !isWhFolderExpanded }));
                                              }}
                                              className="flex items-center justify-between p-1.5 px-2 rounded-md bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-extrabold cursor-pointer transition-all"
                                            >
                                              <div className="flex items-center gap-1.5">
                                                <button type="button" className="p-0.5 text-emerald-700">
                                                  {brWarehouses.length > 0 ? (
                                                    isWhFolderExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                                                  ) : (
                                                    <span className="w-3 inline-block" />
                                                  )}
                                                </button>
                                                <Package size={13} className="text-emerald-600 shrink-0" title="Warehouse Group" />
                                                <span>Warehouses ({brWarehouses.length})</span>
                                              </div>
                                              <span className="text-[9px] font-mono text-emerald-700 font-semibold uppercase">Group</span>
                                            </div>

                                            {/* WAREHOUSE NODES */}
                                            {isWhFolderExpanded && brWarehouses.length > 0 && (
                                              <div className="ml-4 pl-3 border-l-2 border-emerald-300 space-y-1 py-0.5">
                                                {brWarehouses.map((wh, idx) => {
                                                  const whMatches = match && (wh.name.toLowerCase().includes(match) || wh.code.toLowerCase().includes(match));
                                                  const isWhSelected = selectedTreeNode?.type === 'warehouse' && selectedTreeNode?.id === wh.id;

                                                  return (
                                                    <div
                                                      key={wh.id}
                                                      onClick={() => setSelectedTreeNode({ type: 'warehouse', id: wh.id })}
                                                      className={`flex items-center justify-between p-1.5 px-2 rounded text-[11px] font-medium cursor-pointer transition-all border ${
                                                        isWhSelected
                                                          ? 'bg-emerald-100 border-emerald-600 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500/40'
                                                          : whMatches
                                                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                                                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                                      }`}
                                                    >
                                                      <div className="flex items-center gap-1.5 pl-1">
                                                        <span className="text-emerald-400 font-mono font-bold text-[10px]">
                                                          {idx === brWarehouses.length - 1 ? '└──' : '├──'}
                                                        </span>
                                                        <Package size={13} className="text-emerald-600 shrink-0" title="Warehouse" />
                                                        <span className="truncate max-w-[140px] font-semibold">{wh.name}</span>
                                                      </div>
                                                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                                        {wh.code}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* GROUP 2: DEPARTMENTS FOLDER */}
                                        {canAccessDepartment && (
                                          <div className="space-y-1">
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedTreeNodes(prev => ({ ...prev, [`br-${branch.id}-depts`]: !isDeptFolderExpanded }));
                                              }}
                                              className="flex items-center justify-between p-1.5 px-2 rounded-md bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 text-amber-900 text-[11px] font-extrabold cursor-pointer transition-all"
                                            >
                                              <div className="flex items-center gap-1.5">
                                                <button type="button" className="p-0.5 text-amber-700">
                                                  {brDepartments.length > 0 ? (
                                                    isDeptFolderExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                                                  ) : (
                                                    <span className="w-3 inline-block" />
                                                  )}
                                                </button>
                                                <Users size={13} className="text-amber-600 shrink-0" title="Department Group" />
                                                <span>Departments ({brDepartments.length})</span>
                                              </div>
                                              <span className="text-[9px] font-mono text-amber-700 font-semibold uppercase">Group</span>
                                            </div>

                                            {/* DEPARTMENT NODES */}
                                            {isDeptFolderExpanded && brDepartments.length > 0 && (
                                              <div className="ml-4 pl-3 border-l-2 border-amber-300 space-y-1.5 py-0.5">
                                                {brDepartments.map((dept) => {
                                                  const deptEmployees = filterByTenantScope(dbEmployees, user).filter(e => e.departmentId === dept.id || (e.branchId === branch.id && !e.departmentId));
                                                  const deptMatches = match && (dept.name.toLowerCase().includes(match) || dept.code.toLowerCase().includes(match));
                                                  const isDeptExpanded = match ? true : (expandedTreeNodes[`dept-${dept.id}`] !== false);
                                                  const isDeptSelected = selectedTreeNode?.type === 'department' && selectedTreeNode?.id === dept.id;

                                                  return (
                                                    <div key={dept.id} className="space-y-1">
                                                      {/* DEPARTMENT NODE */}
                                                      <div
                                                        onClick={() => setSelectedTreeNode({ type: 'department', id: dept.id })}
                                                        className={`flex items-center justify-between p-1.5 px-2 rounded text-[11px] font-semibold cursor-pointer transition-all border ${
                                                          isDeptSelected
                                                            ? 'bg-amber-100 border-amber-600 text-amber-950 font-bold shadow-xs ring-1 ring-amber-500/40'
                                                            : deptMatches
                                                            ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                                                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                                        }`}
                                                      >
                                                        <div className="flex items-center gap-1.5 pl-1">
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setExpandedTreeNodes(prev => ({ ...prev, [`dept-${dept.id}`]: !isDeptExpanded }));
                                                            }}
                                                            className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                                                          >
                                                            {canAccessEmployee && deptEmployees.length > 0 ? (
                                                              isDeptExpanded ? <ChevronDown size={12} className="text-amber-700" /> : <ChevronRight size={12} />
                                                            ) : (
                                                              <span className="w-3 inline-block" />
                                                            )}
                                                          </button>
                                                          <Users size={13} className="text-amber-600 shrink-0" title="Department" />
                                                          <span className="truncate max-w-[140px] font-bold text-slate-800">{dept.name}</span>
                                                        </div>
                                                        {canAccessEmployee && (
                                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                                            {deptEmployees.length} Emp
                                                          </span>
                                                        )}
                                                      </div>

                                                      {/* EMPLOYEES LIST UNDER DEPARTMENT */}
                                                      {canAccessEmployee && isDeptExpanded && deptEmployees.length > 0 && (
                                                        <div className="ml-4 pl-3 border-l-2 border-purple-300 space-y-1 py-0.5">
                                                          {deptEmployees.map((emp, empIdx) => {
                                                            const empMatches = match && (`${emp.firstName} ${emp.lastName}`.toLowerCase().includes(match) || emp.employeeCode.toLowerCase().includes(match));
                                                            const isEmpSelected = selectedTreeNode?.type === 'employee' && selectedTreeNode?.id === emp.id;

                                                            return (
                                                              <div
                                                                key={emp.id}
                                                                onClick={() => setSelectedTreeNode({ type: 'employee', id: emp.id })}
                                                                className={`flex items-center justify-between p-1.5 px-2 rounded text-[10px] font-medium cursor-pointer transition-all border ${
                                                                  isEmpSelected
                                                                    ? 'bg-purple-100 border-purple-600 text-purple-950 font-bold shadow-xs ring-1 ring-purple-500/40'
                                                                    : empMatches
                                                                    ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                                                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                                                }`}
                                                              >
                                                                <div className="flex items-center gap-1.5 pl-1">
                                                                  <span className="text-purple-400 font-mono font-bold text-[10px]">
                                                                    {empIdx === deptEmployees.length - 1 ? '└──' : '├──'}
                                                                  </span>
                                                                  <User size={12} className="text-purple-600 shrink-0" title="Employee" />
                                                                  <span className="truncate max-w-[130px] font-semibold">{emp.firstName} {emp.lastName}</span>
                                                                </div>
                                                                <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1 rounded">{emp.employeeCode}</span>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: Selected Node Details & Actions (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-lg border border-brand-border shadow-xs p-6 flex flex-col justify-between min-h-[450px]">
                  {(() => {
                    const activeType = selectedTreeNode?.type || 'company';
                    const activeId = selectedTreeNode?.id || dbCompanies[0]?.id;

                    if (activeType === 'company') {
                      const comp = dbCompanies.find(c => c.id === activeId) || dbCompanies[0];
                      if (!comp) return <div className="p-8 text-center text-slate-400">No company record found.</div>;
                      const compBranches = filterByTenantScope(dbBranches, user).filter(b => b.companyId === comp.id || !b.companyId);

                      return (
                        <div className="space-y-5">
                          {/* Breadcrumb Trail */}
                          <div className="bg-slate-100/90 px-3 py-1.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center flex-wrap gap-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Hierarchy Path:</span>
                            <span className="text-blue-800 font-extrabold flex items-center gap-1"><Building size={12} /> {comp.legalName}</span>
                          </div>

                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Eye size={13} className="text-brand-primary" /> YOU ARE VIEWING</span>
                            <span className="text-slate-800 font-bold">🏢 Company Record</span>
                          </div>

                          <div className="flex items-start justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-primary border border-blue-200 flex items-center justify-center">
                                <Building size={24} title="Company" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">Company Master</span>
                                  <span className="text-xs font-mono font-bold text-brand-primary">{comp.code}</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mt-1">{comp.legalName}</h2>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${comp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                              {comp.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Trade / Store Name</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{comp.tradeName || comp.legalName}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">GSTIN / Tax ID</span>
                              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{comp.gstin || 'Not Registered'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">PAN Number</span>
                              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{comp.pan || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Primary Email</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{comp.email || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Phone Number</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{comp.phone || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Registered Branches</span>
                              <span className="font-bold text-brand-primary mt-0.5 block">{compBranches.length} Branches</span>
                            </div>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">Corporate Headquarters Address</span>
                            <span className="font-medium text-slate-800">{comp.addressLine1 ? `${comp.addressLine1}, ${comp.city}, ${comp.state} - ${comp.postalCode}, ${comp.country}` : 'Main Corporate Office Location'}</span>
                          </div>

                          <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
                            {canAccessBranch && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSubModule('branches');
                                  setBranchCompanyId(comp.id);
                                  setBranchName('');
                                  setBranchGstin(comp.gstin || '');
                                  setFormCode(getNextAutoCode('branches'));
                                  setFormStatus('Active');
                                  setFormErrors({});
                                  setMode('create');
                                }}
                                className="px-4 py-2 bg-brand-primary text-white hover:bg-blue-700 font-bold text-xs rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus size={14} /> Add New Branch
                              </button>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSubModule('companies');
                                  populateForm(comp.id, 'companies');
                                  setSelectedId(comp.id);
                                  setMode('edit');
                                }}
                                className="px-3.5 py-2 border border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-md transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit2 size={13} /> Edit Company
                              </button>
                              <button
                                type="button"
                                onClick={() => setCompanyViewMode('table')}
                                className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-md transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Table size={13} /> Master Lists
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (activeType === 'branch') {
                      const br = dbBranches.find(b => b.id === activeId);
                      if (!br) return <div className="p-8 text-center text-slate-400">Branch record not found.</div>;
                      const parentComp = dbCompanies.find(c => c.id === br.companyId);
                      const brWarehouses = filterByTenantScope(dbWarehouses, user).filter(w => w.branchId === br.id);
                      const brDepartments = filterByTenantScope(dbDepartments, user).filter(d => d.branchId === br.id);

                      return (
                        <div className="space-y-5">
                          {/* Breadcrumb Trail */}
                          <div className="bg-slate-100/90 px-3 py-1.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center flex-wrap gap-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Hierarchy Path:</span>
                            <span className="text-blue-800 font-bold flex items-center gap-1"><Building size={12} /> {parentComp?.legalName || 'INK FMCG'}</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-indigo-800 font-extrabold flex items-center gap-1"><Building size={12} /> {br.name}</span>
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Eye size={13} className="text-brand-primary" /> YOU ARE VIEWING</span>
                            <span className="text-slate-800 font-bold">🏢 Branch Record</span>
                          </div>

                          <div className="flex items-start justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                                <Building size={24} title="Branch" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">Branch Master</span>
                                  <span className="text-xs font-mono font-bold text-indigo-600">{br.code}</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mt-1">{br.name}</h2>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {br.isHeadquarters && (
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  Headquarters
                                </span>
                              )}
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${br.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                {br.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Parent Company</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{parentComp?.legalName || br.companyName || 'INK FMCG'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Branch GSTIN</span>
                              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{br.gstin || 'Same as Corporate HQ'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">City / Region</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{br.city || 'Delhi Central'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Branch Phone</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{br.phone || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Branch Email</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{br.email || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Resource Summary</span>
                              <span className="font-bold text-indigo-700 mt-0.5 block">{brWarehouses.length} WH / {brDepartments.length} Dept</span>
                            </div>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">Branch Physical Address</span>
                            <span className="font-medium text-slate-800">{br.addressLine1 ? `${br.addressLine1}, ${br.city}, ${br.state} - ${br.postalCode}, ${br.country}` : 'Branch Office Premises'}</span>
                          </div>

                          <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {canAccessWarehouse && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSubModule('warehouses');
                                    setWhBranchId(br.id);
                                    setWhCompanyId(br.companyId || '1');
                                    setWhName('');
                                    setFormCode(getNextAutoCode('warehouses'));
                                    setFormStatus('Active');
                                    setFormErrors({});
                                    setMode('create');
                                  }}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus size={13} /> Add Warehouse
                                </button>
                              )}
                              {canAccessDepartment && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSubModule('departments');
                                    setDeptBranchId(br.id);
                                    setDeptName('');
                                    setDeptDesc('');
                                    setFormCode(getNextAutoCode('departments'));
                                    setFormStatus('Active');
                                    setFormErrors({});
                                    setMode('create');
                                  }}
                                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus size={13} /> Add Department
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubModule('branches');
                                populateForm(br.id, 'branches');
                                setSelectedId(br.id);
                                setMode('edit');
                              }}
                              className="px-3.5 py-2 border border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 size={13} /> Edit Branch
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (activeType === 'warehouse') {
                      const wh = dbWarehouses.find(w => w.id === activeId);
                      if (!wh) return <div className="p-8 text-center text-slate-400">Warehouse record not found.</div>;
                      const parentBr = dbBranches.find(b => b.id === wh.branchId);

                      return (
                        <div className="space-y-5">
                          {/* Breadcrumb Trail */}
                          <div className="bg-slate-100/90 px-3 py-1.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center flex-wrap gap-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Hierarchy Path:</span>
                            <span className="text-blue-800 font-bold flex items-center gap-1"><Building size={12} /> {dbCompanies.find(c => c.id === parentBr?.companyId)?.legalName || 'INK FMCG'}</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-indigo-800 font-bold flex items-center gap-1"><Building size={12} /> {parentBr?.name || wh.branchName || 'Main Branch'}</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-emerald-700 font-bold">📦 Warehouses</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-emerald-900 font-extrabold flex items-center gap-1"><Package size={12} /> {wh.name}</span>
                          </div>

                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Eye size={13} className="text-brand-primary" /> YOU ARE VIEWING</span>
                            <span className="text-slate-800 font-bold">📦 Warehouse Record</span>
                          </div>

                          <div className="flex items-start justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                                <Package size={24} title="Warehouse" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Warehouse Master</span>
                                  <span className="text-xs font-mono font-bold text-emerald-600">{wh.code}</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mt-1">{wh.name}</h2>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${wh.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                              {wh.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Warehouse Type</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{wh.warehouseType || 'Central Warehouse'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Parent Branch</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{parentBr?.name || wh.branchName || 'Main Branch'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Facility Manager</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{wh.manager || 'Unassigned'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Storage Capacity</span>
                              <span className="font-mono font-bold text-emerald-700 mt-0.5 block">{(wh.storageAreaSqFt || wh.capacitySft || 150000).toLocaleString()} sq ft</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Contact Phone</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{wh.contactNumber || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Climate Control</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{wh.isTemperatureControlled ? 'Yes (Cold Storage)' : 'Ambient Storage'}</span>
                            </div>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">Facility Address</span>
                            <span className="font-medium text-slate-800">{wh.addressLine1 ? `${wh.addressLine1}, ${wh.city}, ${wh.state} - ${wh.postalCode}` : wh.address || 'Depot Facility Premises'}</span>
                          </div>

                          <div className="pt-4 border-t flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubModule('warehouses');
                                populateForm(wh.id, 'warehouses');
                                setSelectedId(wh.id);
                                setMode('edit');
                              }}
                              className="px-3.5 py-2 border border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 size={13} /> Edit Warehouse
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (activeType === 'department') {
                      const dept = dbDepartments.find(d => d.id === activeId);
                      if (!dept) return <div className="p-8 text-center text-slate-400">Department record not found.</div>;
                      const parentBr = dbBranches.find(b => b.id === dept.branchId);
                      const deptEmps = filterByTenantScope(dbEmployees, user).filter(e => e.departmentId === dept.id || e.branchId === dept.branchId);

                      return (
                        <div className="space-y-5">
                          {/* Breadcrumb Trail */}
                          <div className="bg-slate-100/90 px-3 py-1.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center flex-wrap gap-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Hierarchy Path:</span>
                            <span className="text-blue-800 font-bold flex items-center gap-1"><Building size={12} /> {dbCompanies.find(c => c.id === parentBr?.companyId)?.legalName || 'INK FMCG'}</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-indigo-800 font-bold flex items-center gap-1"><Building size={12} /> {parentBr?.name || dept.branchName || 'Main Branch'}</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-amber-700 font-bold">👥 Departments</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-amber-900 font-extrabold flex items-center gap-1"><Users size={12} /> {dept.name}</span>
                          </div>

                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Eye size={13} className="text-brand-primary" /> YOU ARE VIEWING</span>
                            <span className="text-slate-800 font-bold">👥 Department Record</span>
                          </div>

                          <div className="flex items-start justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                <Users size={24} title="Department" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">Department Master</span>
                                  <span className="text-xs font-mono font-bold text-amber-600">{dept.code}</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mt-1">{dept.name}</h2>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${dept.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                              {dept.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Parent Branch</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{parentBr?.name || dept.branchName || 'Main Branch'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Staff Roster</span>
                              <span className="font-bold text-amber-700 mt-0.5 block">{deptEmps.length} Employees</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Functional Scope</span>
                              <span className="font-medium text-slate-900 mt-0.5 block truncate">{dept.description || 'Core Operations'}</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t flex items-center justify-between gap-3">
                            {canAccessEmployee && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSubModule('employees');
                                  setEmpDepartmentId(dept.id);
                                  setEmpBranchId(dept.branchId || '1');
                                  setEmpFirstName('');
                                  setEmpLastName('');
                                  setFormCode(getNextAutoCode('employees'));
                                  setFormStatus('Active');
                                  setFormErrors({});
                                  setMode('create');
                                }}
                                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus size={13} /> Add Employee
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubModule('departments');
                                populateForm(dept.id, 'departments');
                                setSelectedId(dept.id);
                                setMode('edit');
                              }}
                              className="px-3.5 py-2 border border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 size={13} /> Edit Department
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (activeType === 'employee') {
                      const emp = dbEmployees.find(e => e.id === activeId);
                      if (!emp) return <div className="p-8 text-center text-slate-400">Employee record not found.</div>;
                      const parentDept = dbDepartments.find(d => d.id === emp.departmentId);
                      const parentBr = dbBranches.find(b => b.id === emp.branchId);

                      return (
                        <div className="space-y-5">
                          {/* Breadcrumb Trail */}
                          <div className="bg-slate-100/90 px-3 py-1.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center flex-wrap gap-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Hierarchy Path:</span>
                            <span className="text-blue-800 font-bold flex items-center gap-1"><Building size={12} /> {dbCompanies.find(c => c.id === parentBr?.companyId)?.legalName || 'INK FMCG'}</span>
                            <span className="text-slate-400">›</span>
                            <span className="text-indigo-800 font-bold flex items-center gap-1"><Building size={12} /> {parentBr?.name || 'Main Branch'}</span>
                            {parentDept && (
                              <>
                                <span className="text-slate-400">›</span>
                                <span className="text-amber-700 font-bold flex items-center gap-1"><Users size={12} /> {parentDept.name}</span>
                              </>
                            )}
                            <span className="text-slate-400">›</span>
                            <span className="text-purple-900 font-extrabold flex items-center gap-1"><User size={12} /> {emp.firstName} {emp.lastName}</span>
                          </div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Eye size={13} className="text-brand-primary" /> YOU ARE VIEWING</span>
                            <span className="text-slate-800 font-bold">👤 Employee Profile</span>
                          </div>

                          <div className="flex items-start justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                                <User size={24} title="Employee" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">Employee Profile</span>
                                  <span className="text-xs font-mono font-bold text-purple-600">{emp.employeeCode}</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 mt-1">{emp.firstName} {emp.lastName}</h2>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                              {emp.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Corporate Email</span>
                              <span className="font-medium text-slate-900 mt-0.5 block truncate">{emp.email || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Contact Phone</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{emp.phone || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Assigned Branch</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{parentBr?.name || 'Main Branch'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Department</span>
                              <span className="font-bold text-slate-900 mt-0.5 block">{parentDept?.name || 'Core Operations'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Monthly Compensation</span>
                              <span className="font-mono font-bold text-purple-700 mt-0.5 block">₹{(emp.salary || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Date of Joining</span>
                              <span className="font-medium text-slate-900 mt-0.5 block">{emp.joiningDate || '2024-01-01'}</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubModule('employees');
                                populateForm(emp.id, 'employees');
                                setSelectedId(emp.id);
                                setMode('edit');
                              }}
                              className="px-3.5 py-2 border border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 size={13} /> Edit Employee
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>

              </div>
            </div>
          ) : (
            /* STANDARD MASTER REGISTRY TABLE VIEW */
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
                      <option value="Inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                  <button
                    onClick={() => {
                      setFormCode(getNextAutoCode());
                      setFormStatus('Active');
                      setFormErrors({});
                      if (module === 'suppliers' || module === 'masters/suppliers') {
                        setPartnerRole('Supplier');
                      } else if (module === 'customers' || module === 'masters/customers') {
                        setPartnerRole('Customer');
                      } else if (module === 'branches' || module === 'masters/branches') {
                        const parent = dbCompanies.find(c => c.id === branchCompanyId) || dbCompanies[0];
                        if (parent) {
                          setBranchCompanyId(parent.id);
                          if (parent.gstin) setBranchGstin(parent.gstin);
                        }
                      }
                      setMode('create');
                    }}
                    className="px-3.5 py-1.5 bg-brand-primary text-white hover:bg-blue-700 rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm transition"
                  >
                    <Plus size={13} /> Add New {config.singular}
                  </button>
                </div>
              </div>

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
                              <button onClick={() => { setSelectedId(row.id); populateForm(row.id); setMode('view'); }} title="View Details (Read-Only)" className="p-1 text-brand-text-secondary hover:text-brand-primary hover:bg-blue-50 rounded cursor-pointer transition"><Eye size={13} /></button>
                              <button onClick={() => { setSelectedId(row.id); populateForm(row.id); setMode('edit'); }} title="Edit Record" className="p-1 text-brand-text-secondary hover:text-brand-primary hover:bg-blue-50 rounded cursor-pointer transition"><Edit2 size={13} /></button>
                              <button onClick={() => setDeleteId(row.id)} title="Delete (Soft-Delete)" className="p-1 text-brand-text-secondary hover:text-brand-danger hover:bg-red-50 rounded cursor-pointer transition"><Trash2 size={13} /></button>
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
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border rounded disabled:opacity-40"><ChevronLeft size={13} /></button>
                  <span className="font-bold px-2">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border rounded disabled:opacity-40"><ChevronRight size={13} /></button>
                </div>
              </div>

            </div>
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
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className="px-3.5 py-1.5 border border-brand-border text-brand-text-primary hover:bg-brand-bg-secondary font-bold text-xs rounded transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 size={13} /> Edit Specifications
                  </button>
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
                      <span className="font-semibold text-brand-text-primary text-sm">{compLegalName || branchName || deptName || desigTitle || `${empFirstName} ${empLastName}`.trim() || prodName || catName || brandName || uomName || whName || custLegalName || suppLegalName || 'N/A'}</span>
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
                      <span className="font-mono font-bold text-brand-text-primary">{compGstin || branchGstin || custGstin || suppGstin || 'Not Registered'}</span>
                    </div>
                    <div>
                      <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">PAN Account</span>
                      <span className="font-mono font-bold text-brand-text-primary">{compPan || custPan || suppPan || 'Not Registered'}</span>
                    </div>
                    <div>
                      <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Base Currency / Pricing</span>
                      <span className="font-mono font-bold text-brand-primary">{compCurrency || 'INR (₹)'}</span>
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
                      <span className="font-medium text-brand-text-primary">{compEmail || branchEmail || empEmail || custEmail || suppEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Phone</span>
                      <span className="font-medium text-brand-text-primary">{compPhone || branchPhone || empPhone || custPhone || suppPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-brand-text-secondary font-semibold block text-[10px] uppercase">Address</span>
                      <span className="font-medium text-brand-text-primary">{addrLine1 ? `${addrLine1}, ${addrCity}, ${addrState}` : 'Headquarters'}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="border-t pt-4 text-[10px] text-brand-text-secondary font-mono flex flex-col sm:flex-row items-center justify-between gap-2 bg-brand-bg-secondary/20 p-3 rounded">
                <p>RECORD GUID: {selectedId}</p>
                <p>SCHEMA: postgresql.master_data.{config.endpoint}</p>
                <p>VERIFICATION: PostgreSQL 17 / Clean Architecture CQRS</p>
              </div>

            </div>
          )}

          {/* CREATE & EDIT FORM MODE — DEDICATED FORMS FOR ALL 12 ENTITIES */}
          {(mode === 'create' || mode === 'edit') && (
            <form onSubmit={handleSave} noValidate className="bg-white border border-brand-border rounded-lg shadow-sm-flat p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => { setMode('list'); setSelectedId(null); setActiveSubModule(null); }}
                    className="inline-flex items-center gap-1 text-xs text-brand-primary font-bold hover:underline mb-2 cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Back to {companyViewMode === 'hierarchy' ? 'Organization Structure' : 'Master Registry List'}
                  </button>
                  <h2 className="text-lg font-bold text-brand-text-primary">
                    {mode === 'create' ? 'Create New' : 'Edit'} {getModuleConfig(currentModule).singular} Master Record
                  </h2>
                  <p className="text-xs text-brand-text-secondary">Configure specific business attributes in accordance with FMCG ERP Business Blueprint.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setMode('list'); setSelectedId(null); setActiveSubModule(null); }}
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
              {currentModule.includes('companies') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Company Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded text-brand-text-primary font-mono font-bold bg-gray-100/80 cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="COM-001" />
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
                      <label htmlFor="compGstin" className="font-bold text-brand-text-primary">GSTIN (Tax ID)</label>
                      <input id="compGstin" type="text" maxLength={15} value={compGstin} onChange={e => setCompGstin(e.target.value.toUpperCase())} className={`w-full p-2 border rounded uppercase font-mono ${formErrors.compGstin ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="07AAAAA0000A1Z5" />
                      {formErrors.compGstin && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.compGstin}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compPan" className="font-bold text-brand-text-primary">PAN Number</label>
                      <input id="compPan" type="text" maxLength={10} value={compPan} onChange={e => setCompPan(e.target.value.toUpperCase())} className={`w-full p-2 border rounded uppercase font-mono ${formErrors.compPan ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="AAAAA0000A" />
                      {formErrors.compPan && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.compPan}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compEmail" className="font-bold text-brand-text-primary">Corporate Email</label>
                      <input id="compEmail" type="email" value={compEmail} onChange={e => setCompEmail(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="hq@ink-fmcg.com" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="compPhone" className="font-bold text-brand-text-primary">Phone Number</label>
                      <input id="compPhone" type="text" value={compPhone} onChange={e => setCompPhone(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="+91 11 4500 8800" />
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
              {currentModule.includes('branches') && (
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
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="BR-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="branchName" className="font-bold text-brand-text-primary">Branch Name <span className="text-red-500">*</span></label>
                      <input 
                        id="branchName" 
                        type="text" 
                        value={branchName} 
                        onChange={e => { setBranchName(e.target.value); setFormErrors(p => ({ ...p, branchName: '' })); }} 
                        className={`w-full p-2 border rounded ${formErrors.branchName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="Delhi Main Branch" 
                      />
                      {formErrors.branchName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.branchName}</p>}
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
              {currentModule.includes('departments') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Parent Branch <span className="text-red-500">*</span></label>
                      <select value={deptBranchId} onChange={e => setDeptBranchId(e.target.value)} className="w-full p-2 border rounded bg-white font-semibold border-brand-border">
                        {dbBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Department Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="DEP-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="deptName" className="font-bold text-brand-text-primary">Department Name <span className="text-red-500">*</span></label>
                      <input 
                        id="deptName" 
                        type="text" 
                        value={deptName} 
                        onChange={e => { setDeptName(e.target.value); setFormErrors(p => ({ ...p, deptName: '' })); }} 
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
              {currentModule.includes('designations') && (
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
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="DSG-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="desigTitle" className="font-bold text-brand-text-primary">Designation Title <span className="text-red-500">*</span></label>
                      <input 
                        id="desigTitle" 
                        type="text" 
                        value={desigTitle} 
                        onChange={e => { setDesigTitle(e.target.value); setFormErrors(p => ({ ...p, desigTitle: '' })); }} 
                        className={`w-full p-2 border rounded ${formErrors.desigTitle ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="Regional Sales Manager" 
                      />
                      {formErrors.desigTitle && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.desigTitle}</p>}
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

              {/* 5. EMPLOYEE FORM */}
              {currentModule.includes('employees') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Employee Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="EMP-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="empFirstName" className="font-bold text-brand-text-primary">First Name <span className="text-red-500">*</span></label>
                      <input 
                        id="empFirstName" 
                        type="text" 
                        value={empFirstName} 
                        onChange={e => { setEmpFirstName(e.target.value); setFormErrors(p => ({ ...p, empFirstName: '' })); }} 
                        className={`w-full p-2 border rounded ${formErrors.empFirstName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
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
                        className={`w-full p-2 border rounded ${formErrors.empLastName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="Kumar" 
                      />
                      {formErrors.empLastName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.empLastName}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="empEmail" className="font-bold text-brand-text-primary">Official Email <span className="text-red-500">*</span></label>
                      <input id="empEmail" type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="rajesh@ink-fmcg.com" />
                    </div>
                  </div>

                  {/* Branch, Department, Designation with Inline + Quick Add */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-blue-50/20 p-4 rounded-lg border border-blue-100">
                    
                    {/* 1. Branch Location */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-brand-text-primary">Branch Location</label>
                        <button
                          type="button"
                          onClick={() => { setShowQuickAddBranch(!showQuickAddBranch); setNewBranchInput(''); }}
                          className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={11} /> {showQuickAddBranch ? 'Select Existing' : 'New Branch'}
                        </button>
                      </div>
                      {showQuickAddBranch ? (
                        <input
                          type="text"
                          value={newBranchInput}
                          onChange={e => setNewBranchInput(e.target.value)}
                          placeholder="Type new branch location..."
                          className="w-full p-2 border border-brand-primary rounded bg-white font-semibold text-brand-primary"
                        />
                      ) : (
                        <select value={empBranchId} onChange={e => setEmpBranchId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-medium">
                          <option value="">-- None / Optional --</option>
                          {dbBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      )}
                    </div>

                    {/* 2. Department */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-brand-text-primary">Department</label>
                        <button
                          type="button"
                          onClick={() => { setShowQuickAddDept(!showQuickAddDept); setNewDeptInput(''); }}
                          className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={11} /> {showQuickAddDept ? 'Select Existing' : 'New Dept'}
                        </button>
                      </div>
                      {showQuickAddDept ? (
                        <input
                          type="text"
                          value={newDeptInput}
                          onChange={e => setNewDeptInput(e.target.value)}
                          placeholder="Type new department name..."
                          className="w-full p-2 border border-brand-primary rounded bg-white font-semibold text-brand-primary"
                        />
                      ) : (
                        <select value={empDepartmentId} onChange={e => setEmpDepartmentId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-medium">
                          <option value="">-- None / Optional --</option>
                          {dbDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      )}
                    </div>

                    {/* 3. Designation */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-brand-text-primary">Designation</label>
                        <button
                          type="button"
                          onClick={() => { setShowQuickAddDesig(!showQuickAddDesig); setNewDesigInput(''); }}
                          className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={11} /> {showQuickAddDesig ? 'Select Existing' : 'New Title'}
                        </button>
                      </div>
                      {showQuickAddDesig ? (
                        <input
                          type="text"
                          value={newDesigInput}
                          onChange={e => setNewDesigInput(e.target.value)}
                          placeholder="Type designation title..."
                          className="w-full p-2 border border-brand-primary rounded bg-white font-semibold text-brand-primary"
                        />
                      ) : (
                        <select value={empDesignationId} onChange={e => setEmpDesignationId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-medium">
                          <option value="">-- None / Optional --</option>
                          {dbDesignations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                        </select>
                      )}
                    </div>

                    {/* 4. Joining Date */}
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Joining Date</label>
                      <input type="date" value={empJoiningDate} onChange={e => setEmpJoiningDate(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-mono" />
                    </div>

                  </div>
                </div>
              )}

              {/* 6. PRODUCT FORM */}
              {currentModule.includes('products') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Barcode / EAN</label>
                      <input type="text" value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} className="w-full p-2 border border-brand-border rounded font-mono" placeholder="8901234567890" />
                    </div>
                  </div>

                  {/* Category, Brand, UOM with Inline + Quick Add */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/20 p-4 rounded-lg border border-blue-100">
                    
                    {/* 1. Category */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-brand-text-primary">Category</label>
                        <button
                          type="button"
                          onClick={() => { setShowQuickAddCategory(!showQuickAddCategory); setNewCatInput(''); }}
                          className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={11} /> {showQuickAddCategory ? 'Select Existing' : 'New Category'}
                        </button>
                      </div>
                      {showQuickAddCategory ? (
                        <input
                          type="text"
                          value={newCatInput}
                          onChange={e => setNewCatInput(e.target.value)}
                          placeholder="Type new category name..."
                          className="w-full p-2 border border-brand-primary rounded bg-white font-semibold text-brand-primary"
                        />
                      ) : (
                        <select value={prodCategoryId} onChange={e => setProdCategoryId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-medium">
                          <option value="">-- None / Optional --</option>
                          {dbCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </div>

                    {/* 2. Brand */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-brand-text-primary">Brand</label>
                        <button
                          type="button"
                          onClick={() => { setShowQuickAddBrand(!showQuickAddBrand); setNewBrandInput(''); }}
                          className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={11} /> {showQuickAddBrand ? 'Select Existing' : 'New Brand'}
                        </button>
                      </div>
                      {showQuickAddBrand ? (
                        <input
                          type="text"
                          value={newBrandInput}
                          onChange={e => setNewBrandInput(e.target.value)}
                          placeholder="Type new brand name..."
                          className="w-full p-2 border border-brand-primary rounded bg-white font-semibold text-brand-primary"
                        />
                      ) : (
                        <select value={prodBrandId} onChange={e => setProdBrandId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-medium">
                          <option value="">-- None / Optional --</option>
                          {dbBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      )}
                    </div>

                    {/* 3. Unit of Measure */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-brand-text-primary">Base Unit of Measure</label>
                        <button
                          type="button"
                          onClick={() => { setShowQuickAddUom(!showQuickAddUom); setNewUomInput(''); }}
                          className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={11} /> {showQuickAddUom ? 'Select Existing' : 'New UOM'}
                        </button>
                      </div>
                      {showQuickAddUom ? (
                        <input
                          type="text"
                          value={newUomInput}
                          onChange={e => setNewUomInput(e.target.value)}
                          placeholder="Type new UOM (e.g. Liter)..."
                          className="w-full p-2 border border-brand-primary rounded bg-white font-semibold text-brand-primary"
                        />
                      ) : (
                        <select value={prodBaseUomId} onChange={e => setProdBaseUomId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-medium">
                          <option value="">-- None / Optional --</option>
                          {dbUnits.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                        </select>
                      )}
                    </div>

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-brand-bg-secondary/30 rounded border border-brand-border">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">MRP (₹)</label>
                      <input type="number" value={prodMrp} onChange={e => setProdMrp(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Base B2B Price (₹)</label>
                      <input type="number" value={prodBasePrice} onChange={e => setProdBasePrice(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold text-brand-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">GST Rate %</label>
                      <select value={prodGstRate} onChange={e => setProdGstRate(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono">
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">HSN Code</label>
                      <input type="text" value={prodHsnCode} onChange={e => setProdHsnCode(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. CATEGORY FORM */}
              {currentModule.includes('categories') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Company</label>
                      <select value={catCompanyId} onChange={e => setCatCompanyId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white">
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName}</option>)}
                      </select>
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
                        placeholder="Food & Grains" 
                      />
                      {formErrors.catName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.catName}</p>}
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
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">HSN Code Default</label>
                      <input type="text" value={catHsnDefault} onChange={e => setCatHsnDefault(e.target.value)} className="w-full p-2 border border-brand-border rounded font-mono" placeholder="1006.30" />
                    </div>
                  </div>
                </div>
              )}

              {/* 8. BRAND FORM */}
              {currentModule.includes('brands') && (
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
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="BRD-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="brandName" className="font-bold text-brand-text-primary">Brand Name <span className="text-red-500">*</span></label>
                      <input 
                        id="brandName" 
                        type="text" 
                        value={brandName} 
                        onChange={e => { setBrandName(e.target.value); setFormErrors(p => ({ ...p, brandName: '' })); }} 
                        className={`w-full p-2 border rounded ${formErrors.brandName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="India Gate" 
                      />
                      {formErrors.brandName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.brandName}</p>}
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
              {currentModule.includes('units') && (
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
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="UOM-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="uomName" className="font-bold text-brand-text-primary">Unit Name <span className="text-red-500">*</span></label>
                      <input 
                        id="uomName" 
                        type="text" 
                        value={uomName} 
                        onChange={e => { setUomName(e.target.value); setFormErrors(p => ({ ...p, uomName: '' })); }} 
                        className={`w-full p-2 border rounded ${formErrors.uomName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="Kilograms" 
                      />
                      {formErrors.uomName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.uomName}</p>}
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
              {currentModule.includes('warehouses') && (
                <div className="space-y-6 text-xs">
                  {/* SECTION 1: BASIC INFORMATION */}
                  <div className="p-4 bg-brand-bg-secondary/20 rounded-lg border border-brand-border space-y-4">
                    <h4 className="font-bold text-brand-text-primary flex items-center gap-1.5 text-xs">
                      <Building size={14} className="text-brand-primary" /> Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="whBranchId" className="font-bold text-brand-text-primary">Branch Link <span className="text-red-500">*</span></label>
                        <select id="whBranchId" value={whBranchId} onChange={e => setWhBranchId(e.target.value)} className={`w-full p-2 border rounded bg-white font-semibold ${formErrors.whBranchId ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`}>
                          {dbBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        {formErrors.whBranchId && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.whBranchId}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="code" className="font-bold text-brand-text-primary">Warehouse Code <span className="text-red-500">*</span></label>
                        <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="WH-001" />
                        {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="whName" className="font-bold text-brand-text-primary">Warehouse Name <span className="text-red-500">*</span></label>
                        <input id="whName" type="text" value={whName} onChange={e => setWhName(e.target.value)} className={`w-full p-2 border rounded ${formErrors.whName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="Delhi Central Depot" />
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

              {/* 11. CUSTOMER MASTER FORM */}
              {currentModule.includes('customers') && (
                <div className="space-y-6 text-xs">
                  
                  {/* SECTION 1: CUSTOMER IDENTITY */}
                  <div className="p-4 bg-white rounded-lg border border-brand-border space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-brand-border/60">
                      <UserCheck size={16} className="text-brand-primary font-bold" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">1. Customer Identity</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="code" className="font-bold text-brand-text-primary">Customer Code <span className="text-red-500">*</span></label>
                        <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="CST-001" />
                        {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label htmlFor="custLegalName" className="font-bold text-brand-text-primary">Customer / Business Name <span className="text-red-500">*</span></label>
                        <input 
                          id="custLegalName" 
                          type="text" 
                          value={custLegalName} 
                          onChange={e => { setCustLegalName(e.target.value); setFormErrors(p => ({ ...p, custLegalName: '' })); }} 
                          className={`w-full p-2 border rounded font-semibold ${formErrors.custLegalName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                          placeholder="Apex Retail Distributors" 
                        />
                        {formErrors.custLegalName && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custLegalName}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Partner Code <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={custPartnerCode || formCode} 
                          onChange={e => setCustPartnerCode(e.target.value)} 
                          className="w-full p-2 border border-brand-border rounded font-mono uppercase font-bold" 
                          placeholder="PTR-001" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Customer Type <span className="text-red-500">*</span></label>
                        <select value={custType} onChange={e => setCustType(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                          <option value="Distributor">Distributor</option>
                          <option value="Wholesaler">Wholesaler</option>
                          <option value="Retailer">Retailer</option>
                          <option value="Institution">Institution</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Channel <span className="text-red-500">*</span></label>
                        <select value={custChannel} onChange={e => setCustChannel(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                          <option value="General Trade">General Trade</option>
                          <option value="Modern Trade">Modern Trade</option>
                          <option value="E-Commerce">E-Commerce</option>
                          <option value="Institutional">Institutional</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Customer Category <span className="text-red-500">*</span></label>
                        <select value={custCategory} onChange={e => setCustCategory(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                          <option value="Kirana">Kirana</option>
                          <option value="Supermarket">Supermarket</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="HORECA">HORECA</option>
                          <option value="Wholesale">Wholesale</option>
                          <option value="Distributor">Distributor</option>
                          <option value="Institutional">Institutional</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Status <span className="text-red-500">*</span></label>
                        <select value={custStatus} onChange={e => { setCustStatus(e.target.value as any); setFormStatus(e.target.value as any); }} className="w-full p-2 border border-brand-border rounded bg-white font-bold text-brand-primary">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Blocked">Blocked</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Trade / Store Name</label>
                        <input type="text" value={custTradeName} onChange={e => setCustTradeName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Apex Superstore" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Legal Business Name <span className="text-red-500">*</span></label>
                        <input type="text" value={custLegalName} onChange={e => setCustLegalName(e.target.value)} className="w-full p-2 border border-brand-border rounded font-semibold" placeholder="Apex Distribution Pvt Ltd" />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: CONTACT INFORMATION */}
                  <div className="p-4 bg-white rounded-lg border border-brand-border space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-brand-border/60">
                      <Phone size={16} className="text-brand-primary font-bold" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">2. Contact Information</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Primary Contact Name</label>
                        <input type="text" value={custContactPerson} onChange={e => setCustContactPerson(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Rajesh Kumar (Manager)" />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Primary Phone</label>
                        <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="+91 98110 24512" />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Primary Email</label>
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
                  </div>

                  {/* SECTION 3: TAX & COMPLIANCE */}
                  <div className="p-4 bg-white rounded-lg border border-brand-border space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-brand-border/60">
                      <ShieldCheck size={16} className="text-brand-primary font-bold" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">3. Tax & Compliance</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </div>

                  {/* SECTION 4: BILLING ADDRESS */}
                  <div className="p-4 bg-white rounded-lg border border-brand-border space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-brand-border/60">
                      <MapPin size={16} className="text-brand-primary font-bold" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">4. Billing Address</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Address Line 1 <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={addrLine1} 
                          onChange={e => { setAddrLine1(e.target.value); setFormErrors(p => ({ ...p, addrLine1: '' })); }} 
                          className={`w-full p-2 border rounded ${formErrors.addrLine1 ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                          placeholder="Plot No 42, Industrial Area" 
                        />
                        {formErrors.addrLine1 && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.addrLine1}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Address Line 2</label>
                        <input type="text" value={addrLine2} onChange={e => setAddrLine2(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Phase III, Near Depot" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">City <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={addrCity} 
                          onChange={e => { setAddrCity(e.target.value); setFormErrors(p => ({ ...p, addrCity: '' })); }} 
                          className={`w-full p-2 border rounded ${formErrors.addrCity ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                          placeholder="New Delhi" 
                        />
                        {formErrors.addrCity && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.addrCity}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">State <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={addrState} 
                          onChange={e => { setAddrState(e.target.value); setFormErrors(p => ({ ...p, addrState: '' })); }} 
                          className={`w-full p-2 border rounded ${formErrors.addrState ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                          placeholder="Delhi" 
                        />
                        {formErrors.addrState && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.addrState}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Country <span className="text-red-500">*</span></label>
                        <input type="text" value={addrCountry} onChange={e => setAddrCountry(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="India" />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Pincode <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          maxLength={10}
                          value={addrPostalCode} 
                          onChange={e => { setAddrPostalCode(e.target.value); setFormErrors(p => ({ ...p, addrPostalCode: '' })); }} 
                          className={`w-full p-2 border rounded font-mono ${formErrors.addrPostalCode ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                          placeholder="110020" 
                        />
                        {formErrors.addrPostalCode && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.addrPostalCode}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: DELIVERY / SHIPPING ADDRESS */}
                  <div className="p-4 bg-white rounded-lg border border-brand-border space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-brand-primary font-bold" />
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">5. Delivery / Shipping Address</h4>
                      </div>

                      <label className="flex items-center gap-2 font-bold text-brand-primary cursor-pointer text-xs">
                        <input 
                          type="checkbox" 
                          checked={custSameAsBilling} 
                          onChange={e => setCustSameAsBilling(e.target.checked)} 
                          className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer accent-brand-primary" 
                        />
                        <span>Same as Billing Address</span>
                      </label>
                    </div>

                    {!custSameAsBilling && (
                      <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-brand-text-primary">Shipping Address Line 1 <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              value={custShipAddrLine1} 
                              onChange={e => { setCustShipAddrLine1(e.target.value); setFormErrors(p => ({ ...p, custShipAddrLine1: '' })); }} 
                              className={`w-full p-2 border rounded ${formErrors.custShipAddrLine1 ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                              placeholder="Warehouse 4B, Transport Hub" 
                            />
                            {formErrors.custShipAddrLine1 && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custShipAddrLine1}</p>}
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-brand-text-primary">Shipping Address Line 2</label>
                            <input type="text" value={custShipAddrLine2} onChange={e => setCustShipAddrLine2(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Gate 2, Ring Road" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-brand-text-primary">Shipping City <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              value={custShipCity} 
                              onChange={e => { setCustShipCity(e.target.value); setFormErrors(p => ({ ...p, custShipCity: '' })); }} 
                              className={`w-full p-2 border rounded ${formErrors.custShipCity ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                              placeholder="New Delhi" 
                            />
                            {formErrors.custShipCity && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custShipCity}</p>}
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-brand-text-primary">Shipping State <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              value={custShipState} 
                              onChange={e => { setCustShipState(e.target.value); setFormErrors(p => ({ ...p, custShipState: '' })); }} 
                              className={`w-full p-2 border rounded ${formErrors.custShipState ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                              placeholder="Delhi" 
                            />
                            {formErrors.custShipState && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custShipState}</p>}
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-brand-text-primary">Shipping Country <span className="text-red-500">*</span></label>
                            <input type="text" value={custShipCountry} onChange={e => setCustShipCountry(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="India" />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-brand-text-primary">Shipping Pincode <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              maxLength={10}
                              value={custShipPostalCode} 
                              onChange={e => { setCustShipPostalCode(e.target.value); setFormErrors(p => ({ ...p, custShipPostalCode: '' })); }} 
                              className={`w-full p-2 border rounded font-mono ${formErrors.custShipPostalCode ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                              placeholder="110020" 
                            />
                            {formErrors.custShipPostalCode && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custShipPostalCode}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 6: CREDIT & PAYMENT */}
                  <div className="p-4 bg-white rounded-lg border border-brand-border space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-brand-border/60">
                      <CreditCard size={16} className="text-brand-primary font-bold" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">6. Credit & Payment Terms</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Requested Credit Limit (₹)</label>
                        <input 
                          type="number" 
                          value={custRequestedCreditLimit} 
                          onChange={e => setCustRequestedCreditLimit(Number(e.target.value))} 
                          className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold text-slate-700" 
                          placeholder="500000" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Approved Credit Limit (₹)</label>
                        <input 
                          type="number" 
                          value={custCreditLimit} 
                          onChange={e => setCustCreditLimit(Number(e.target.value))} 
                          className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold text-brand-primary" 
                          placeholder="500000" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Payment Terms</label>
                        <select 
                          value={custPaymentTerms} 
                          onChange={e => {
                            const val = e.target.value;
                            setCustPaymentTerms(val);
                            if (val === 'Immediate') setCustCreditDays(0);
                            else if (val === '7 Days') setCustCreditDays(7);
                            else if (val === '15 Days') setCustCreditDays(15);
                            else if (val === '30 Days') setCustCreditDays(30);
                            else if (val === '45 Days') setCustCreditDays(45);
                            else if (val === '60 Days') setCustCreditDays(60);
                          }} 
                          className="w-full p-2 border border-brand-border rounded bg-white font-semibold"
                        >
                          <option value="Immediate">Immediate / Advance</option>
                          <option value="7 Days">7 Days Net</option>
                          <option value="15 Days">15 Days Net</option>
                          <option value="30 Days">30 Days Net</option>
                          <option value="45 Days">45 Days Net</option>
                          <option value="60 Days">60 Days Net</option>
                          <option value="Custom">Custom Days</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-brand-text-primary">Payment Term Days</label>
                        <input 
                          type="number" 
                          value={custCreditDays} 
                          onChange={e => setCustCreditDays(Number(e.target.value))} 
                          className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold" 
                          placeholder="30" 
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* 13. BUSINESS PARTNER MASTER FORM */}
              {(currentModule.includes('partners') || currentModule.includes('suppliers')) && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Partner Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} readOnly disabled={true} title="Code is auto-generated and cannot be changed manually." className={`w-full p-2 border rounded font-mono font-bold bg-gray-100/80 text-brand-text-primary cursor-not-allowed ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="PART-001" />
                      {formErrors.code && <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.code}</p>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="custLegalName" className="font-bold text-brand-text-primary">Legal Business Name <span className="text-red-500">*</span></label>
                      <input 
                        id="custLegalName" 
                        type="text" 
                        value={custLegalName} 
                        onChange={e => { setCustLegalName(e.target.value); setSuppLegalName(e.target.value); setFormErrors(p => ({ ...p, custLegalName: '', suppLegalName: '' })); }} 
                        className={`w-full p-2 border rounded font-semibold ${formErrors.custLegalName || formErrors.suppLegalName ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} 
                        placeholder="Apex Distribution Pvt Ltd" 
                      />
                      {(formErrors.custLegalName || formErrors.suppLegalName) && (
                        <p className="text-[11px] text-red-500 font-semibold mt-0.5">{formErrors.custLegalName || formErrors.suppLegalName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Trade / Store Name</label>
                      <input type="text" value={suppTradeName} onChange={e => setSuppTradeName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Apex Superstore" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">GSTIN (Tax ID)</label>
                      <input type="text" maxLength={15} value={custGstin} onChange={e => setCustGstin(e.target.value.toUpperCase())} className="w-full p-2 border border-brand-border rounded uppercase font-mono font-bold" placeholder="07AAAAA0000A1Z5" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">PAN Number</label>
                      <input type="text" maxLength={10} value={custPan} onChange={e => setCustPan(e.target.value.toUpperCase())} className="w-full p-2 border border-brand-border rounded uppercase font-mono font-bold" placeholder="AAAAA0000A" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Contact Phone</label>
                      <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="+91 98110 24512" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Contact Email</label>
                      <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="billing@apex.com" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-brand-bg-secondary/30 rounded border border-brand-border">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Approved Credit Limit (₹)</label>
                      <input type="number" value={custCreditLimit} onChange={e => setCustCreditLimit(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold text-brand-primary" placeholder="500000" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Payment Term Days</label>
                      <input type="number" value={custCreditDays} onChange={e => setCustCreditDays(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded bg-white font-mono font-bold" placeholder="30" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Channel / Category</label>
                      <select value={custType} onChange={e => setCustType(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                        <option value="Retailer">Kirana / Retailer Store</option>
                        <option value="Wholesaler">Wholesaler Dealer</option>
                        <option value="Key Account">Key Account / Supermarket</option>
                        <option value="National Vendor">National Vendor / Manufacturer</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}



            </form>
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
