import React from 'react';
import { ACTIVITY_EVENTS } from '../../../constants/supplierConstants';
import { Plus, CheckCircle2, MapPin, Banknote, Shield, Star, Clock } from 'lucide-react';

// Map icon strings to components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Plus, CheckCircle2, MapPin, Banknote, Shield, Star, Clock,
};

// Event type colors
const TYPE_COLORS: Record<string, string> = {
  created: 'bg-blue-50 border-blue-100 text-brand-primary',
  approved: 'bg-green-50 border-green-100 text-brand-success',
  site: 'bg-purple-50 border-purple-100 text-purple-600',
  bank: 'bg-amber-50 border-amber-100 text-brand-warning',
  compliance: 'bg-sky-50 border-sky-100 text-brand-info',
  performance: 'bg-orange-50 border-orange-100 text-orange-600',
};

export function ActivityTimelineTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Business Activity Timeline</h4>
        <span className="text-[10px] text-brand-text-secondary">Separate from Technical Audit Log (Audit tab)</span>
      </div>
      
      <div className="relative">
        {/* vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-brand-border" />
        
        <div className="space-y-4">
          {ACTIVITY_EVENTS.map(event => {
            const IconComp = ICON_MAP[event.icon] || Clock;
            const colors = TYPE_COLORS[event.type] || TYPE_COLORS.created;
            return (
              <div key={event.id} className="flex gap-4 relative">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${colors}`}>
                  <IconComp size={16} />
                </div>
                <div className="flex-1 bg-white border border-brand-border rounded-lg p-3 text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-brand-text-primary">{event.label}</span>
                    <span className="text-[10px] text-brand-text-secondary flex items-center gap-1">
                      <Clock size={10} /> {event.date}
                    </span>
                  </div>
                  <p className="text-brand-text-secondary">{event.description}</p>
                  <p className="text-[10px] text-brand-text-secondary mt-1">By: <span className="font-semibold">{event.user}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
