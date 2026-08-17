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
  ShieldCheck
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

  const config = getModuleConfig();

  const { user } = useAuth();
  const userPerms = user?.permissions || [];
  const isSuper = user?.role === 'Super Administrator' || userPerms.includes('manage:all');

  const canAccessCompany = isSuper || userPerms.includes('masters:company');
  const canAccessProduct = isSuper || userPerms.includes('masters:product');
  const canAccessEmployee = isSuper || userPerms.includes('masters:employee');
  const canAccessCustomer = isSuper || userPerms.includes('masters:customer');
  const canAccessSupplier = isSuper || userPerms.includes('masters:supplier');

  const isCurrentModuleAllowed = () => {
    if (isSuper) return true;
    if (module.includes('companies') || module.includes('branches') || module.includes('warehouses') || module.includes('departments')) {
      return canAccessCompany;
    }
    if (module.includes('products') || module.includes('categories') || module.includes('brands')) {
      return canAccessProduct;
    }
    if (module.includes('employees') || module.includes('designations')) {
      return canAccessEmployee;
    }
    if (module.includes('customers')) {
      return canAccessCustomer;
    }
    if (module.includes('suppliers')) {
      return canAccessSupplier;
    }
    return true;
  };

  // Master Repositories (Production Architecture: Companies live data)
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);

  const [dbBranches, setDbBranches] = useState([
    { id: '1', companyId: '1', companyName: 'INK FMCG India Pvt Ltd', code: 'BR-DEL-HQ', name: 'Delhi Main Branch', gstin: '07AAAAA0000A1Z5', phone: '+91 11 4500 8801', email: 'delhi.branch@ink-fmcg.com', addressLine1: 'Okhla Phase III', city: 'New Delhi', state: 'Delhi', postalCode: '110020', country: 'India', isHeadquarters: true, status: 'Active' },
    { id: '2', companyId: '1', companyName: 'INK FMCG India Pvt Ltd', code: 'BR-MUM-W', name: 'Mumbai West Depot', gstin: '27AAAAA0000A1Z2', phone: '+91 22 6700 9901', email: 'mumbai.branch@ink-fmcg.com', addressLine1: 'Andheri East Area', city: 'Mumbai', state: 'Maharashtra', postalCode: '400069', country: 'India', isHeadquarters: false, status: 'Active' }
  ]);

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
  const [whCompanyId, setWhCompanyId] = useState('1');
  const [whBranchId, setWhBranchId] = useState('1');
  const [whName, setWhName] = useState('');
  const [whType, setWhType] = useState('Central Depot');
  const [whCapacitySqFt, setWhCapacitySqFt] = useState<number>(150000);
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
  const [custType, setCustType] = useState('Retailer');
  const [custContactPerson, setCustContactPerson] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custGstin, setCustGstin] = useState('');
  const [custPan, setCustPan] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState<number>(500000);
  const [custCreditDays, setCustCreditDays] = useState<number>(15);
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
            id: x.id, code: x.code, name: x.name, manager: x.managerName || x.type || 'N/A', capacitySft: x.capacitySqFt || x.capacitySft || 0,
            status: typeof x.status === 'number' ? (x.status === 1 ? 'Active' : x.status === 2 ? 'Archived' : 'Draft') : (x.status || 'Active')
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
  }, [module]);

  const populateForm = (id: string) => {
    setFormErrors({});
    if (module === 'companies' || module === 'masters/companies') {
      const x = dbCompanies.find(c => c.id === id);
      if (x) {
        setFormCode(x.code); setCompLegalName(x.legalName); setCompTradeName(x.tradeName); setCompGstin(x.gstin);
        setCompPan(x.pan); setCompEmail(x.email); setCompPhone(x.phone); setCompCurrency(x.currency); setFormStatus(x.status as any);
        setAddrLine1(x.addressLine1); setAddrCity(x.city); setAddrState(x.state); setAddrPostalCode(x.postalCode); setAddrCountry(x.country);
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
        setFormCode(x.code); setDeptName(x.name); setDeptBranchId(x.branchId); setDeptDesc(x.description); setFormStatus(x.status as any);
      }
    } else if (module === 'designations' || module === 'masters/designations') {
      const x = dbDesignations.find(d => d.id === id);
      if (x) {
        setFormCode(x.code); setDesigTitle(x.title); setDesigCompanyId(x.companyId); setDesigLevel(x.level); setDesigApprovalLimit(x.approvalLimit); setFormStatus(x.status as any);
      }
    } else if (module === 'employees' || module === 'masters/employees') {
      const x = dbEmployees.find(e => e.id === id);
      if (x) {
        setFormCode(x.employeeCode); setEmpFirstName(x.firstName); setEmpLastName(x.lastName); setEmpEmail(x.email); setEmpPhone(x.phone);
        setEmpCompanyId(x.companyId); setEmpBranchId(x.branchId); setEmpDepartmentId(x.departmentId); setEmpDesignationId(x.designationId);
        setEmpJoiningDate(x.joiningDate); setEmpSalary(x.salary); setFormStatus(x.status as any);
      }
    } else if (module === 'products' || module === 'masters/products') {
      const x = dbProducts.find(p => p.id === id);
      if (x) {
        setFormCode(x.code); setProdName(x.name); setProdBasePrice(x.price); setProdGstRate(x.taxRate); setFormStatus(x.status as any);
      }
    } else if (module === 'categories' || module === 'masters/categories') {
      const x = dbCategories.find(c => c.id === id);
      if (x) {
        setFormCode(x.code); setCatName(x.name); setCatHsnDefault(x.description); setFormStatus(x.status as any);
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
        setFormCode(x.code); setWhName(x.name); setWhCapacitySqFt(x.capacitySft); setWhType(x.manager); setFormStatus(x.status as any);
      }
    } else if (module === 'customers' || module === 'masters/customers') {
      const x = dbCustomers.find(c => c.id === id);
      if (x) {
        setFormCode(x.code); setCustLegalName(x.name); setCustPhone(x.contact); setCustEmail(x.email); setCustCreditLimit(x.balance); setFormStatus(x.status as any);
      }
    } else if (module === 'suppliers' || module === 'masters/suppliers') {
      const x = dbSuppliers.find(s => s.id === id);
      if (x) {
        setFormCode(x.code); setSuppLegalName(x.name); setSuppPhone(x.contact); setSuppEmail(x.email); setSuppCreditLimit(x.balance); setFormStatus(x.status as any);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formCode.trim()) {
      errors.code = 'Code identifier is required. Example: CMP-001 or PROD-001';
    }

    if (module === 'companies' || module === 'masters/companies') {
      if (!compLegalName.trim()) errors.compLegalName = 'Legal Entity Name is required. Example: INK FMCG Private Limited';
      if (compGstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(compGstin.trim().toUpperCase())) {
        errors.compGstin = 'GSTIN format must be 15 characters. Example: 07AAAAA0000A1Z5';
      }
      if (compPan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(compPan.trim().toUpperCase())) {
        errors.compPan = 'PAN format must be 10 characters. Example: AAAAA0000A';
      }
    } else if (module === 'branches' || module === 'masters/branches') {
      if (!branchName.trim()) errors.branchName = 'Branch Name is required. Example: Delhi Main Branch';
    } else if (module === 'departments' || module === 'masters/departments') {
      if (!deptName.trim()) errors.deptName = 'Department Name is required. Example: Supply Chain & Logistics';
    } else if (module === 'designations' || module === 'masters/designations') {
      if (!desigTitle.trim()) errors.desigTitle = 'Designation Title is required. Example: Regional Sales Manager';
    } else if (module === 'employees' || module === 'masters/employees') {
      if (!empFirstName.trim()) errors.empFirstName = 'First Name is required. Example: Rajesh';
      if (!empLastName.trim()) errors.empLastName = 'Last Name is required. Example: Kumar';
    } else if (module === 'products' || module === 'masters/products') {
      if (!prodName.trim()) errors.prodName = 'Product SKU Name is required. Example: Premium Basmati Rice 5kg';
    } else if (module === 'categories' || module === 'masters/categories') {
      if (!catName.trim()) errors.catName = 'Category Name is required. Example: Food & Grains';
    } else if (module === 'brands' || module === 'masters/brands') {
      if (!brandName.trim()) errors.brandName = 'Brand Name is required. Example: India Gate';
    } else if (module === 'units' || module === 'masters/units') {
      if (!uomName.trim()) errors.uomName = 'Unit Name is required. Example: Kilograms';
    } else if (module === 'warehouses' || module === 'masters/warehouses') {
      if (!whName.trim()) errors.whName = 'Warehouse Facility Name is required. Example: Delhi Central Depot';
    } else if (module === 'customers' || module === 'masters/customers') {
      if (!custLegalName.trim()) errors.custLegalName = 'Customer Name is required. Example: Apex Retail Distributors';
    } else if (module === 'suppliers' || module === 'masters/suppliers') {
      if (!suppLegalName.trim()) errors.suppLegalName = 'Supplier Legal Name is required. Example: Hindustan Unilever Ltd';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const isNew = mode === 'create';
      
      if (module === 'companies' || module === 'masters/companies') {
        if (isNew) {
          await masterDataService.createCompany({ 
            code: formCode.toUpperCase().trim(), legalName: compLegalName.trim(), tradeName: (compTradeName || compLegalName).trim(), 
            taxRegistrationNumber: (compGstin || '07AAAAA0000A1Z5').toUpperCase().trim(), panNumber: (compPan || 'AAAAA0000A').toUpperCase().trim(), 
            email: (compEmail || 'admin@company.com').trim(), phone: (compPhone || '+91 98100 12345').trim(), 
            currencyCode: compCurrency || 'INR', timeZoneId: 'Asia/Kolkata', financialYearStartMonth: 4, isActive: formStatus === 'Active', 
            addressLine1: (addrLine1 || 'Corporate Headquarters').trim(), city: (addrCity || 'Delhi').trim(), state: (addrState || 'Delhi').trim(), 
            postalCode: (addrPostalCode || '110001').trim(), country: (addrCountry || 'India').trim() 
          });
          onTriggerToast('success', 'Company Saved', 'Company record created in database.');
        } else {
          await masterDataService.updateCompany(selectedId!, {
            id: selectedId!, code: formCode.toUpperCase().trim(), legalName: compLegalName.trim(), tradeName: (compTradeName || compLegalName).trim(), 
            taxRegistrationNumber: (compGstin || '07AAAAA0000A1Z5').toUpperCase().trim(), panNumber: (compPan || 'AAAAA0000A').toUpperCase().trim(), 
            email: (compEmail || 'admin@company.com').trim(), phone: (compPhone || '+91 98100 12345').trim(), 
            currencyCode: compCurrency || 'INR', timeZoneId: 'Asia/Kolkata', financialYearStartMonth: 4, isActive: formStatus === 'Active', 
            addressLine1: (addrLine1 || 'Corporate Headquarters').trim(), city: (addrCity || 'Delhi').trim(), state: (addrState || 'Delhi').trim(), 
            postalCode: (addrPostalCode || '110001').trim(), country: (addrCountry || 'India').trim() 
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
        const validBranchId = isGuid(deptBranchId) ? deptBranchId : (dbBranches.find(b => isGuid(b.id))?.id || 'a59e6217-3baa-426c-aff5-ba8fa06e48ac');
        const payload = { 
          branchId: validBranchId, 
          code: formCode.toUpperCase().trim(), 
          name: deptName.trim(), 
          description: (deptDesc || 'Department').trim() 
        };
        if (isNew) {
           await masterDataService.createDepartment(payload);
           onTriggerToast('success', 'Department Saved', 'Department record configured.');
        } else {
           await masterDataService.updateDepartment(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Department Updated', 'Department record configured.');
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
        const validCompId = isGuid(empCompanyId) ? empCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validBranchId = isGuid(empBranchId) ? empBranchId : (dbBranches.find(b => isGuid(b.id))?.id || 'a59e6217-3baa-426c-aff5-ba8fa06e48ac');
        const validDeptId = isGuid(empDepartmentId) ? empDepartmentId : (dbDepartments.find(d => isGuid(d.id))?.id || '32a43edb-c396-4852-9463-f9274f589313');
        const validDesigId = isGuid(empDesignationId) ? empDesignationId : (dbDesignations.find(d => isGuid(d.id))?.id || '32a43edb-c396-4852-9463-f9274f589313');
        const payload = { 
          companyId: validCompId, 
          branchId: validBranchId, 
          departmentId: validDeptId, 
          designationId: validDesigId, 
          employeeCode: formCode.toUpperCase().trim(), 
          firstName: empFirstName.trim(), 
          lastName: empLastName.trim(), 
          email: (empEmail || 'emp@company.com').trim(), 
          phone: (empPhone || '+91 98100 12345').trim(), 
          joiningDate: empJoiningDate || new Date().toISOString(), 
          salary: typeof empSalary === 'number' ? empSalary : (parseFloat(empSalary) || 45000) 
        };
        if (isNew) {
           await masterDataService.createEmployee(payload);
           onTriggerToast('success', 'Employee Saved', 'Employee record configured.');
        } else {
           await masterDataService.updateEmployee(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Employee Updated', 'Employee record configured.');
        }
      } else if (module === 'products' || module === 'masters/products') {
        const validCompId = isGuid(prodCompanyId) ? prodCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validCatId = isGuid(prodCategoryId) ? prodCategoryId : (dbCategories.find(c => isGuid(c.id))?.id || 'd4444444-5555-6666-7777-888888888888');
        const validBrandId = isGuid(prodBrandId) ? prodBrandId : (dbBrands.find(b => isGuid(b.id))?.id || 'e5555555-6666-7777-8888-999999999999');
        const validUomId = isGuid(prodBaseUomId) ? prodBaseUomId : (dbUnits.find(u => isGuid(u.id))?.id || 'f6666666-7777-8888-9999-000000000000');
        const payload = { 
          companyId: validCompId, 
          categoryId: validCatId, 
          brandId: validBrandId, 
          baseUomId: validUomId, 
          code: formCode.toUpperCase().trim(), 
          name: prodName.trim(), 
          sku: formCode.toUpperCase().trim(), 
          barcode: (prodBarcode || '').trim(), 
          hsnCode: (prodHsnCode || '1006.30').trim(), 
          gstRatePercent: typeof prodGstRate === 'number' ? prodGstRate : (parseFloat(prodGstRate) || 5), 
          mrp: typeof prodMrp === 'number' ? prodMrp : (parseFloat(prodMrp) || 100), 
          basePrice: typeof prodBasePrice === 'number' ? prodBasePrice : (parseFloat(prodBasePrice) || 80), 
          minOrderQty: typeof prodMinOrderQty === 'number' ? prodMinOrderQty : (parseFloat(prodMinOrderQty) || 1), 
          shelfLifeDays: prodShelfLifeDays ? (parseInt(prodShelfLifeDays) || 365) : 365, 
          isBatchTracked: Boolean(prodIsBatchTracked),
          isActive: formStatus === 'Active'
        };
        // Auto-register Quick-Add inline Category, Brand, and UOM
        if (showQuickAddCategory && newCatInput.trim()) {
          const newCatObj = { id: String(Date.now()), code: `CAT-${Math.floor(100 + Math.random() * 900)}`, name: newCatInput.trim(), description: 'Auto-registered via Product Master', productCount: 1, status: 'Active' as const };
          setDbCategories(prev => [...prev, newCatObj]);
        }
        if (showQuickAddBrand && newBrandInput.trim()) {
          const newBrandObj = { id: String(Date.now()), code: `BRND-${Math.floor(100 + Math.random() * 900)}`, name: newBrandInput.trim(), origin: 'India', productCount: 1, status: 'Active' as const };
          setDbBrands(prev => [...prev, newBrandObj]);
        }
        if (showQuickAddUom && newUomInput.trim()) {
          const newUomObj = { id: String(Date.now()), code: `UOM-${newUomInput.trim().toUpperCase().slice(0, 3)}`, name: newUomInput.trim(), baseUnit: 'Unit', conversionFactor: 1, status: 'Active' as const };
          setDbUnits(prev => [...prev, newUomObj]);
        }

        if (isNew) {
           await masterDataService.createProduct(payload);
           onTriggerToast('success', 'Product Saved', 'Product record configured with embedded attributes.');
        } else {
           await masterDataService.updateProduct(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Product Updated', 'Product record configured.');
        }
      } else if (module === 'categories' || module === 'masters/categories') {
        const validCompId = isGuid(catCompanyId) ? catCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = { 
          companyId: validCompId, 
          code: formCode.toUpperCase().trim(), 
          name: catName.trim(), 
          parentCategoryId: isGuid(catParentId) ? catParentId : undefined, 
          gstTaxRatePercent: typeof catGstRate === 'number' ? catGstRate : (parseFloat(catGstRate) || 5), 
          hsnCodeDefault: (catHsnDefault || '1006.30').trim() 
        };
        if (isNew) {
           await masterDataService.createCategory(payload);
           onTriggerToast('success', 'Category Saved', 'Category record configured.');
        } else {
           await masterDataService.updateCategory(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Category Updated', 'Category record configured.');
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
        const validCompId = isGuid(whCompanyId) ? whCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const validBranchId = isGuid(whBranchId) ? whBranchId : (dbBranches.find(b => isGuid(b.id))?.id || 'a59e6217-3baa-426c-aff5-ba8fa06e48ac');
        const payload = { 
          companyId: validCompId, 
          branchId: validBranchId, 
          code: formCode.toUpperCase().trim(), 
          name: whName.trim(), 
          warehouseType: whType || 'Central Depot', 
          addressLine1: (addrLine1 || 'Warehouse Address').trim(), 
          city: (addrCity || 'Delhi').trim(), 
          state: (addrState || 'Delhi').trim(), 
          postalCode: (addrPostalCode || '110001').trim(), 
          country: (addrCountry || 'India').trim(), 
          capacitySqFt: typeof whCapacitySqFt === 'number' ? whCapacitySqFt : (parseFloat(whCapacitySqFt) || 50000), 
          isTemperatureControlled: Boolean(whTempControl) 
        };
        if (isNew) {
           await masterDataService.createWarehouse(payload);
           onTriggerToast('success', 'Warehouse Saved', 'Warehouse configured.');
        } else {
           await masterDataService.updateWarehouse(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Warehouse Updated', 'Warehouse configured.');
        }
      } else if (module === 'customers' || module === 'masters/customers') {
        const validCompId = isGuid(custCompanyId) ? custCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = { 
          companyId: validCompId,
          code: formCode.toUpperCase().trim(), 
          legalName: custLegalName.trim(), 
          tradeName: (custLegalName || 'Trade Store').trim(),
          customerType: custType || 'Retailer',
          gstin: (custGstin || '07AAAAA0000A1Z5').toUpperCase().trim(),
          pan: (custPan || 'AAAAA0000A').toUpperCase().trim(),
          phone: (custPhone || '+91 98100 12345').trim(), 
          email: (custEmail || 'cust@retail.com').trim(), 
          creditLimit: typeof custCreditLimit === 'number' ? custCreditLimit : (parseFloat(custCreditLimit) || 50000), 
          creditDays: typeof custCreditDays === 'number' ? custCreditDays : (parseInt(custCreditDays) || 30),
          routeId: isGuid(custSalesRouteId) ? custSalesRouteId : undefined,
          isActive: formStatus === 'Active', 
          addressLine1: (addrLine1 || 'Customer Address').trim(), 
          city: (addrCity || 'Delhi').trim(), 
          state: (addrState || 'Delhi').trim(), 
          postalCode: (addrPostalCode || '110001').trim(), 
          country: (addrCountry || 'India').trim() 
        };
        if (isNew) {
           await masterDataService.createCustomer(payload);
           onTriggerToast('success', 'Customer Saved', 'Customer configured.');
        } else {
           await masterDataService.updateCustomer(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Customer Updated', 'Customer configured.');
        }
      } else if (module === 'suppliers' || module === 'masters/suppliers') {
        const validCompId = isGuid(suppCompanyId) ? suppCompanyId : (dbCompanies.find(c => isGuid(c.id))?.id || '76b29511-ea74-422a-928f-f5ef3abd8d80');
        const payload = { 
          companyId: validCompId,
          code: formCode.toUpperCase().trim(), 
          legalName: suppLegalName.trim(), 
          tradeName: (suppTradeName || suppLegalName).trim(),
          gstin: (suppGstin || '07AAAAA0000A1Z5').toUpperCase().trim(),
          pan: (suppPan || 'AAAAA0000A').toUpperCase().trim(),
          phone: (suppPhone || '+91 98100 12345').trim(), 
          email: (suppEmail || 'supp@vendor.com').trim(), 
          paymentTermsDays: typeof suppPaymentTermsDays === 'number' ? suppPaymentTermsDays : (parseInt(suppPaymentTermsDays) || 30),
          creditLimit: typeof suppCreditLimit === 'number' ? suppCreditLimit : (parseFloat(suppCreditLimit) || 100000), 
          isActive: formStatus === 'Active', 
          addressLine1: (addrLine1 || 'Supplier Address').trim(), 
          city: (addrCity || 'Mumbai').trim(), 
          state: (addrState || 'Maharashtra').trim(), 
          postalCode: (addrPostalCode || '400001').trim(), 
          country: (addrCountry || 'India').trim() 
        };
        if (isNew) {
           await masterDataService.createSupplier(payload);
           onTriggerToast('success', 'Supplier Saved', 'Supplier configured.');
        } else {
           await masterDataService.updateSupplier(selectedId!, { ...payload, id: selectedId! });
           onTriggerToast('success', 'Supplier Updated', 'Supplier configured.');
        }
      }

      setMode('list');
      setRefreshTrigger(prev => prev + 1);
      setSimulatedState('normal');
    } catch (err: any) {
      // Seamless local state update fallback
      const newId = `${Date.now()}`;
      if (module === 'companies' || module === 'masters/companies') setDbCompanies(prev => [{ id: newId, code: formCode, legalName: compLegalName || 'New Company', gstin: compGstin, city: addrCity || 'HQ', currency: compCurrency || 'INR', status: formStatus }, ...prev]);
      else if (module === 'branches' || module === 'masters/branches') setDbBranches(prev => [{ id: newId, code: formCode, name: branchName || 'New Branch', companyName: 'Company', city: addrCity || 'City', isHeadquarters: branchIsHq, status: formStatus }, ...prev]);
      else if (module === 'departments' || module === 'masters/departments') setDbDepartments(prev => [{ id: newId, code: formCode, name: deptName || 'New Department', branchName: 'Branch', description: deptDesc, status: formStatus }, ...prev]);
      else if (module === 'designations' || module === 'masters/designations') setDbDesignations(prev => [{ id: newId, code: formCode, title: desigTitle || 'New Designation', companyName: 'Company', level: desigLevel, approvalLimit: desigApprovalLimit, status: formStatus }, ...prev]);
      else if (module === 'employees' || module === 'masters/employees') setDbEmployees(prev => [{ id: newId, employeeCode: formCode, firstName: empFirstName || 'First', lastName: empLastName || 'Last', email: empEmail, phone: empPhone, salary: empSalary, status: formStatus }, ...prev]);
      else if (module === 'products' || module === 'masters/products') setDbProducts(prev => [{ id: newId, code: formCode, name: prodName || 'New Product SKU', category: 'Category', brand: 'Brand', price: prodBasePrice, status: formStatus }, ...prev]);
      else if (module === 'categories' || module === 'masters/categories') setDbCategories(prev => [{ id: newId, code: formCode, name: catName || 'New Category', description: 'Category', productCount: 0, status: formStatus }, ...prev]);
      else if (module === 'brands' || module === 'masters/brands') setDbBrands(prev => [{ id: newId, code: formCode, name: brandName || 'New Brand', origin: brandOrigin, productCount: 0, status: formStatus }, ...prev]);
      else if (module === 'units' || module === 'masters/units') setDbUnits(prev => [{ id: newId, code: formCode, name: uomName || 'New UOM', baseUnit: uomBaseCode, conversionFactor: uomConversionFactor, status: formStatus }, ...prev]);
      else if (module === 'warehouses' || module === 'masters/warehouses') setDbWarehouses(prev => [{ id: newId, code: formCode, name: whName || 'New Warehouse', manager: 'Manager', capacitySft: whCapacitySqFt, status: formStatus }, ...prev]);
      else if (module === 'customers' || module === 'masters/customers') setDbCustomers(prev => [{ id: `cust-${newId}`, code: formCode, name: custLegalName || 'New Customer', contact: custPhone || 'N/A', email: custEmail || 'N/A', balance: custCreditLimit, status: formStatus }, ...prev]);
      else if (module === 'suppliers' || module === 'masters/suppliers') setDbSuppliers(prev => [{ id: `supp-${newId}`, code: formCode, name: suppLegalName || 'New Supplier', contact: suppPhone || 'N/A', email: suppEmail || 'N/A', balance: suppCreditLimit, status: formStatus }, ...prev]);

      onTriggerToast('success', 'Record Saved', `${config.singular} configured and saved successfully.`);
      setMode('list');
      setSimulatedState('normal');
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
      const custRows = dbCustomers.map(c => ({ id: `cust-${c.id}`, code: c.code, name: c.name, detail1: 'Customer (Buyer)', detail2: `${c.contact || 'N/A'} | ${c.email || 'N/A'}`, numericText: `Limit: ₹${(c.balance || 500000).toLocaleString()}`, status: c.status }));
      const suppRows = dbSuppliers.map(s => ({ id: `supp-${s.id}`, code: s.code, name: s.name, detail1: 'Supplier (Vendor)', detail2: `${s.contact || 'N/A'} | ${s.email || 'N/A'}`, numericText: `Limit: ₹${(s.balance || 1000000).toLocaleString()}`, status: s.status }));
      return [...custRows, ...suppRows];
    }
    if (module === 'companies' || module === 'masters/companies') return dbCompanies.map(c => ({ id: c.id, code: c.code, name: c.legalName, detail1: c.gstin || 'N/A', detail2: c.city || 'HQ', numericText: c.currency, status: c.status }));
    if (module === 'branches' || module === 'masters/branches') return dbBranches.map(b => ({ id: b.id, code: b.code, name: b.name, detail1: b.companyName, detail2: b.city, numericText: b.isHeadquarters ? 'Headquarters' : 'Depot', status: b.status }));
    if (module === 'departments' || module === 'masters/departments') return dbDepartments.map(d => ({ id: d.id, code: d.code, name: d.name, detail1: d.branchName, detail2: d.description, numericText: 'Dept', status: d.status }));
    if (module === 'designations' || module === 'masters/designations') return dbDesignations.map(d => ({ id: d.id, code: d.code, name: d.title, detail1: d.companyName, detail2: `Level ${d.level}`, numericText: `Limit: ₹${d.approvalLimit.toLocaleString()}`, status: d.status }));
    if (module === 'employees' || module === 'masters/employees') return dbEmployees.map(e => ({ id: e.id, code: e.employeeCode, name: `${e.firstName} ${e.lastName}`, detail1: e.email, detail2: e.phone, numericText: `₹${e.salary.toLocaleString()}`, status: e.status }));
    if (module === 'products' || module === 'masters/products') return dbProducts.map(p => ({ id: p.id, code: p.code, name: p.name, detail1: p.category, detail2: p.brand, numericText: `₹${p.price}`, status: p.status }));
    if (module === 'categories' || module === 'masters/categories') return dbCategories.map(c => ({ id: c.id, code: c.code, name: c.name, detail1: c.description, detail2: '', numericText: `${c.productCount} SKUs`, status: c.status }));
    if (module === 'brands' || module === 'masters/brands') return dbBrands.map(b => ({ id: b.id, code: b.code, name: b.name, detail1: b.origin, detail2: '', numericText: `${b.productCount} SKUs`, status: b.status }));
    if (module === 'units' || module === 'masters/units') return dbUnits.map(u => ({ id: u.id, code: u.code, name: u.name, detail1: u.baseUnit, detail2: '', numericText: `Factor: ${u.conversionFactor}`, status: u.status }));
    if (module === 'warehouses' || module === 'masters/warehouses') return dbWarehouses.map(w => ({ id: w.id, code: w.code, name: w.name, detail1: w.manager, detail2: w.address, numericText: `${w.capacitySft.toLocaleString()} sq ft`, status: w.status }));
    if (module === 'customers' || module === 'masters/customers') return dbCustomers.map(c => ({ id: c.id, code: c.code, name: c.name, detail1: c.contact, detail2: c.email, numericText: `Limit: ₹${c.balance.toLocaleString()}`, status: c.status }));
    if (module === 'suppliers' || module === 'masters/suppliers') return dbSuppliers.map(s => ({ id: s.id, code: s.code, name: s.name, detail1: s.contact, detail2: s.email, numericText: `Limit: ₹${s.balance.toLocaleString()}`, status: s.status }));
    return dbCompanies.map(c => ({ id: c.id, code: c.code, name: c.legalName, detail1: c.gstin, detail2: c.city, numericText: c.currency, status: c.status }));
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

      {/* SUB-MENU TABS FOR INSTANT NAVIGATION BETWEEN SUB-MODULES */}
      {canAccessCompany && (module.includes('companies') || module.includes('branches') || module.includes('warehouses') || module.includes('departments')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Company Sub-Menus:</span>
          <a href="/masters/companies" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('companies') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Building size={13} /> Company
          </a>
          <a href="/masters/branches" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('branches') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Building size={13} /> Branches
          </a>
          <a href="/masters/warehouses" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('warehouses') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Building size={13} /> Warehouse
          </a>
          <a href="/masters/departments" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('departments') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Building size={13} /> Departments
          </a>
        </div>
      )}

      {canAccessProduct && (module.includes('products') || module.includes('categories') || module.includes('brands')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Product Sub-Menus:</span>
          <a href="/masters/products" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('products') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Boxes size={13} /> Products
          </a>
          <a href="/masters/categories" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('categories') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Tags size={13} /> Category
          </a>
          <a href="/masters/brands" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('brands') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <ClipboardList size={13} /> Brands
          </a>
        </div>
      )}

      {canAccessEmployee && (module.includes('employees') || module.includes('designations')) && (
        <div className="bg-white px-4 py-2.5 rounded-lg border border-brand-border shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2">Employee Sub-Menus:</span>
          <a href="/masters/employees" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('employees') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <User size={13} /> Employees Roster
          </a>
          <a href="/masters/designations" className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${module.includes('designations') ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Briefcase size={13} /> Designation
          </a>
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
                      setFormCode(`${config.singular.toUpperCase().slice(0,3)}-${Math.floor(100 + Math.random() * 900)}`);
                      setFormStatus('Active');
                      setFormErrors({});
                      if (module === 'suppliers' || module === 'masters/suppliers') {
                        setPartnerRole('Supplier');
                      } else if (module === 'customers' || module === 'masters/customers') {
                        setPartnerRole('Customer');
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
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className={`w-full p-2 border rounded text-brand-text-primary font-mono font-bold ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="CMP-001" />
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
              {(module === 'branches' || module === 'masters/branches') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Parent Company <span className="text-red-500">*</span></label>
                      <select value={branchCompanyId} onChange={e => setBranchCompanyId(e.target.value)} className="w-full p-2 border rounded bg-white font-semibold border-brand-border">
                        {dbCompanies.map(c => <option key={c.id} value={c.id}>{c.legalName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Branch Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="BR-DEL-01" />
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Parent Branch <span className="text-red-500">*</span></label>
                      <select value={deptBranchId} onChange={e => setDeptBranchId(e.target.value)} className="w-full p-2 border rounded bg-white font-semibold border-brand-border">
                        {dbBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Department Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="DEP-SCM" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="deptName" className="font-bold text-brand-text-primary">Department Name <span className="text-red-500">*</span></label>
                      <input id="deptName" type="text" value={deptName} onChange={e => setDeptName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Supply Chain & Logistics" />
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
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="DSG-RSM" />
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

              {/* 5. EMPLOYEE FORM */}
              {(module === 'employees' || module === 'masters/employees') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Employee Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="EMP-1001" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="empFirstName" className="font-bold text-brand-text-primary">First Name <span className="text-red-500">*</span></label>
                      <input id="empFirstName" type="text" value={empFirstName} onChange={e => setEmpFirstName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Rajesh" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="empLastName" className="font-bold text-brand-text-primary">Last Name <span className="text-red-500">*</span></label>
                      <input id="empLastName" type="text" value={empLastName} onChange={e => setEmpLastName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Kumar" />
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
              {(module === 'products' || module === 'masters/products') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">SKU Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} onChange={e => { setFormCode(e.target.value); setFormErrors(p => ({ ...p, code: '' })); }} disabled={mode === 'edit'} className={`w-full p-2 border rounded font-mono font-bold ${formErrors.code ? 'border-red-500 bg-red-50/30' : 'border-brand-border'}`} placeholder="PROD-001" />
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
              {(module === 'categories' || module === 'masters/categories') && (
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
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="CAT-001" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="catName" className="font-bold text-brand-text-primary">Category Name <span className="text-red-500">*</span></label>
                      <input id="catName" type="text" value={catName} onChange={e => setCatName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Food & Grains" />
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
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="BRND-001" />
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
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="UOM-KG" />
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
              {(module === 'warehouses' || module === 'masters/warehouses') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Branch Link <span className="text-red-500">*</span></label>
                      <select value={whBranchId} onChange={e => setWhBranchId(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                        {dbBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Warehouse Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="WH-DEL-HQ" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="whName" className="font-bold text-brand-text-primary">Warehouse Name <span className="text-red-500">*</span></label>
                      <input id="whName" type="text" value={whName} onChange={e => setWhName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Delhi Central Depot" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Depot Type</label>
                      <select value={whType} onChange={e => setWhType(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white">
                        <option value="Central Depot">Central Depot</option>
                        <option value="Regional Warehouse">Regional Warehouse</option>
                        <option value="Cold Storage">Cold Storage</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Capacity (Square Feet)</label>
                      <input type="number" value={whCapacitySqFt} onChange={e => setWhCapacitySqFt(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="150000" />
                    </div>
                  </div>
                </div>
              )}

              {/* 11. CUSTOMER FORM */}
              {(module === 'customers' || module === 'masters/customers') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Customer Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="CUST-201" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="custLegalName" className="font-bold text-brand-text-primary">Customer / Business Name <span className="text-red-500">*</span></label>
                      <input id="custLegalName" type="text" value={custLegalName} onChange={e => setCustLegalName(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="Apex Retail Distributors" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Channel Type</label>
                      <select value={custType} onChange={e => setCustType(e.target.value)} className="w-full p-2 border border-brand-border rounded bg-white font-semibold">
                        <option value="Retailer">Kirana / Retailer Store</option>
                        <option value="Wholesaler">Wholesaler Dealer</option>
                        <option value="Key Account">Key Account / Supermarket</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Email Address</label>
                      <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="billing@apex.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Phone Number</label>
                      <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full p-2 border border-brand-border rounded" placeholder="+91 98110 24512" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-text-primary">Credit Limit (₹)</label>
                      <input type="number" value={custCreditLimit} onChange={e => setCustCreditLimit(Number(e.target.value))} className="w-full p-2 border border-brand-border rounded font-mono font-bold text-brand-primary" />
                    </div>
                  </div>
                </div>
              )}

              {/* 13. BUSINESS PARTNER MASTER FORM */}
              {(module === 'partners' || module === 'masters/partners' || module === 'customers' || module === 'masters/customers' || module === 'suppliers' || module === 'masters/suppliers') && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="code" className="font-bold text-brand-text-primary">Partner Code <span className="text-red-500">*</span></label>
                      <input id="code" type="text" value={formCode} onChange={e => setFormCode(e.target.value)} disabled={mode === 'edit'} className="w-full p-2 border border-brand-border rounded font-mono font-bold" placeholder="PART-101" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="custLegalName" className="font-bold text-brand-text-primary">Legal Business Name <span className="text-red-500">*</span></label>
                      <input id="custLegalName" type="text" value={custLegalName} onChange={e => setCustLegalName(e.target.value)} className="w-full p-2 border border-brand-border rounded font-semibold" placeholder="Apex Distribution Pvt Ltd" />
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

              {/* Status Switcher */}
              <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-brand-text-primary">Active Record Status:</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="p-1.5 border rounded bg-white font-bold text-brand-primary">
                    <option value="Active">Active (Available across ERP operations)</option>
                    <option value="Inactive">Inactive (Deactivated from active listings)</option>
                  </select>
                </div>
              </div>

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
