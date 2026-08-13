import React from 'react';
import { SupplierPerformance } from '../../../../../types/supplier';
import { SupplierPerformanceBar } from '../../shared/SupplierPerformanceBar';
import { SupplierRatingStars } from '../../shared/SupplierRatingStars';
import { formatINR } from '../../../../../utils/formatters';

interface Props {
  performance?: SupplierPerformance;
}

export function PerformanceTab({ performance }: Props) {
  if (!performance) return null;

  return (
    <div className="space-y-6">
      <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Performance Metrics (Last 12 Months)</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded bg-brand-bg-secondary/30 flex flex-col gap-2">
          <span className="text-xs text-brand-text-secondary font-bold uppercase">Overall Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-primary">{performance.overall_rating}</span>
            <SupplierRatingStars rating={performance.overall_rating} showNumber={false} />
          </div>
        </div>
        <div className="p-4 border rounded bg-brand-bg-secondary/30 flex flex-col gap-2 justify-center">
          <SupplierPerformanceBar label="On-Time Delivery" value={performance.on_time_delivery_pct} />
        </div>
        <div className="p-4 border rounded bg-brand-bg-secondary/30 flex flex-col gap-2 justify-center">
          <SupplierPerformanceBar label="Quality / Fill Rate" value={performance.fill_rate_pct} />
        </div>
        <div className="p-4 border rounded bg-brand-bg-secondary/30 flex flex-col gap-2 justify-center">
          <SupplierPerformanceBar label="Defect Rate" value={performance.defect_rate_pct} invert={true} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-brand-bg-secondary/10 p-4 rounded-lg">
        <div>
          <span className="text-brand-text-secondary block mb-1">Total Orders</span>
          <span className="font-bold text-sm">{performance.total_orders}</span>
        </div>
        <div>
          <span className="text-brand-text-secondary block mb-1">Total Value</span>
          <span className="font-bold text-sm font-mono">{formatINR(performance.total_order_value)}</span>
        </div>
        <div>
          <span className="text-brand-text-secondary block mb-1">Lead Time (Avg)</span>
          <span className="font-bold text-sm">{performance.lead_time_days_avg} days</span>
        </div>
        <div>
          <span className="text-brand-text-secondary block mb-1">Total Returns</span>
          <span className="font-bold text-sm">{performance.total_returns}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="border rounded p-4">
          <h5 className="text-sm font-bold mb-3 border-b pb-2">Category Ratings</h5>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold w-1/3">Quality Rating</span>
              <SupplierRatingStars rating={performance.quality_rating} />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold w-1/3">Delivery Rating</span>
              <SupplierRatingStars rating={performance.delivery_rating} />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold w-1/3">Service Rating</span>
              <SupplierRatingStars rating={performance.service_rating} />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold w-1/3">Price Rating</span>
              <SupplierRatingStars rating={performance.price_rating} />
            </div>
          </div>
        </div>
        <div className="border rounded p-4">
          <h5 className="text-sm font-bold mb-3 border-b pb-2">Evaluation Information</h5>
          <div className="space-y-3 text-xs mt-4">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Preferred Supplier Score</span>
              <span className="font-semibold">{performance.preferred_supplier_score}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Last Evaluation Date</span>
              <span className="font-semibold">{performance.last_evaluation_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Next Evaluation Date</span>
              <span className="font-semibold">{performance.next_evaluation_date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
