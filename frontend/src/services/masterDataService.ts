import { apiClient } from '../api/apiClient';
import { CompanyDto, BranchDto, DepartmentDto, DesignationDto, UnitOfMeasureDto, BrandDto, CategoryDto, WarehouseDto, ProductDto, SupplierDto, CustomerDto, EmployeeDto } from '../types/masterData';

const API_BASE_URL = '/api/v1/masters';

// 1. Companies
export async function fetchCompanies(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/company`, { params });
}
export async function fetchCompanyById(id: string): Promise<CompanyDto> {
  return apiClient.get<CompanyDto>(`${API_BASE_URL}/company/${id}`);
}
export async function fetchCompanyLookup(): Promise<any[]> {
  return apiClient.get<any[]>(`${API_BASE_URL}/company/lookup`);
}
export async function createCompany(data: Partial<CompanyDto>): Promise<CompanyDto> {
  return apiClient.post<CompanyDto>(`${API_BASE_URL}/company`, data);
}
export async function updateCompany(id: string, data: Partial<CompanyDto>): Promise<CompanyDto> {
  return apiClient.put<CompanyDto>(`${API_BASE_URL}/company/${id}`, data);
}
export async function deleteCompany(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/company/${id}`);
}

// 2. Branches
export async function fetchBranches(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/branch`, { params });
}
export async function createBranch(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/branch`, data);
}
export async function updateBranch(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/branch/${id}`, data);
}
export async function deleteBranch(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/branch/${id}`);
}

// 3. Departments
export async function fetchDepartments(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/department`, { params });
}
export async function createDepartment(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/department`, data);
}
export async function updateDepartment(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/department/${id}`, data);
}
export async function deleteDepartment(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/department/${id}`);
}

// 4. Designations
export async function fetchDesignations(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/designation`, { params });
}
export async function createDesignation(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/designation`, data);
}
export async function updateDesignation(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/designation/${id}`, data);
}
export async function deleteDesignation(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/designation/${id}`);
}

// 5. Units of Measure
export async function fetchUnitsOfMeasure(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/uom`, { params });
}
export async function createUnitOfMeasure(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/uom`, data);
}
export async function updateUnitOfMeasure(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/uom/${id}`, data);
}
export async function deleteUnitOfMeasure(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/uom/${id}`);
}

// 6. Brands
export async function fetchBrands(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/brand`, { params });
}
export async function createBrand(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/brand`, data);
}
export async function updateBrand(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/brand/${id}`, data);
}
export async function deleteBrand(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/brand/${id}`);
}

// 7. Categories
export async function fetchCategories(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/category`, { params });
}
export async function createCategory(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/category`, data);
}
export async function updateCategory(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/category/${id}`, data);
}
export async function deleteCategory(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/category/${id}`);
}

// 8. Warehouses
export async function fetchWarehouses(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/warehouse`, { params });
}
export async function createWarehouse(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/warehouse`, data);
}
export async function updateWarehouse(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/warehouse/${id}`, data);
}
export async function deleteWarehouse(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/warehouse/${id}`);
}

// 9. Products
export async function fetchProducts(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/product`, { params });
}
export async function createProduct(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/product`, data);
}
export async function updateProduct(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/product/${id}`, data);
}
export async function deleteProduct(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/product/${id}`);
}

// 10. Suppliers
export async function fetchSuppliers(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/supplier`, { params });
}
export async function fetchNextSupplierCode(companyId?: string): Promise<string> {
  return apiClient.get<string>(`${API_BASE_URL}/supplier/next-code`, { params: { companyId } });
}
export async function createSupplier(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/supplier`, data);
}
export async function updateSupplier(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/supplier/${id}`, data);
}
export async function deleteSupplier(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/supplier/${id}`);
}

// 11. Customers
export async function fetchCustomers(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/customer`, { params });
}
export async function createCustomer(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/customer`, data);
}
export async function updateCustomer(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/customer/${id}`, data);
}
export async function deleteCustomer(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/customer/${id}`);
}

// 12. Employees
export async function fetchEmployees(params?: Record<string, any>): Promise<any> {
  return apiClient.get<any>(`${API_BASE_URL}/employee`, { params });
}
export async function createEmployee(data: any): Promise<any> {
  return apiClient.post<any>(`${API_BASE_URL}/employee`, data);
}
export async function updateEmployee(id: string, data: any): Promise<any> {
  return apiClient.put<any>(`${API_BASE_URL}/employee/${id}`, data);
}
export async function deleteEmployee(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/employee/${id}`);
}

export async function deleteMasterEntity(entityEndpoint: string, id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE_URL}/${entityEndpoint}/${id}`);
}
