import React from 'react';
import { CheckCircle2, Clock, XCircle, Minus, Star, AlertTriangle } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { getStatusVariant } from '../../utils/supplierUtils';

interface Props {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle2 size={10} />,
  'PENDING APPROVAL': <Clock size={10} />,
  PENDING: <Clock size={10} />,
  BLOCKED: <XCircle size={10} />,
  BLACKLISTED: <XCircle size={10} />,
  INACTIVE: <Minus size={10} />,
  SUSPENDED: <AlertTriangle size={10} />,
  PREFERRED: <Star size={10} />,
};

export function SupplierStatusBadge({ status, showIcon = true, size = 'sm' }: Props) {
  const variant = getStatusVariant(status);
  const icon = STATUS_ICONS[status.toUpperCase()];
  return (
    <Badge variant={variant as any} size={size}>
      {showIcon && icon}
      {status}
    </Badge>
  );
}
