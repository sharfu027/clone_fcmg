import { apiClient } from '../api/apiClient';
import {
  FleetVehicle,
  DriverProfile,
  LogisticsDeliveryOrder,
  DeliveryRoute,
  DispatchQueueItem,
  ProofOfDelivery,
  DeliveryExceptionRecord,
  LogisticsMetrics
} from '../types/logistics';

export const logisticsService = {
  // Vehicles CRUD
  async getVehicles(): Promise<FleetVehicle[]> {
    return apiClient.get<FleetVehicle[]>('/api/v1/logistics/vehicles');
  },

  async createVehicle(payload: Partial<FleetVehicle>): Promise<FleetVehicle> {
    return apiClient.post<FleetVehicle>('/api/v1/logistics/vehicles', payload);
  },

  // Drivers
  async getDrivers(): Promise<DriverProfile[]> {
    return apiClient.get<DriverProfile[]>('/api/v1/logistics/drivers');
  },

  // Delivery Orders
  async getDeliveryOrders(): Promise<LogisticsDeliveryOrder[]> {
    return apiClient.get<LogisticsDeliveryOrder[]>('/api/v1/logistics/deliveries');
  },

  async createDeliveryOrder(payload: Partial<LogisticsDeliveryOrder>): Promise<LogisticsDeliveryOrder> {
    return apiClient.post<LogisticsDeliveryOrder>('/api/v1/logistics/deliveries', payload);
  },

  // Routes
  async getRoutes(): Promise<DeliveryRoute[]> {
    return apiClient.get<DeliveryRoute[]>('/api/v1/logistics/routes');
  },

  // Dispatch Queue
  async getDispatchQueue(): Promise<DispatchQueueItem[]> {
    return apiClient.get<DispatchQueueItem[]>('/api/v1/logistics/dispatch');
  },

  // Proof of Delivery
  async submitProofOfDelivery(payload: Partial<ProofOfDelivery>): Promise<ProofOfDelivery> {
    return apiClient.post<ProofOfDelivery>('/api/v1/logistics/pod', payload);
  },

  // Exceptions
  async getExceptions(): Promise<DeliveryExceptionRecord[]> {
    return apiClient.get<DeliveryExceptionRecord[]>('/api/v1/logistics/exceptions');
  },

  // Logistics Metrics
  async getLogisticsMetrics(): Promise<LogisticsMetrics> {
    return apiClient.get<LogisticsMetrics>('/api/v1/logistics/metrics');
  }
};
