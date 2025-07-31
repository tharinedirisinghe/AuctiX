import { Package, Truck, Check, X, Clock, LucideIcon } from 'lucide-react';

export interface StatusInfo {
  text: string;
  color: string;
  iconComponent: LucideIcon;
  bgColor: string;
  textColor: string;
}

export const getStatusInfo = (status: string): StatusInfo => {
  const normalizedStatus = status?.toLowerCase() || '';
  
  switch (normalizedStatus) {
    case 'packing':
      return {
        text: 'Packing',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        iconComponent: Package,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800'
      };
    case 'shipping':
      return {
        text: 'Shipping',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        iconComponent: Truck,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    case 'delivered':
      return {
        text: 'Delivered',
        color: 'bg-green-100 text-green-800 border-green-200',
        iconComponent: Check,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      };
    case 'cancelled':
      return {
        text: 'Cancelled',
        color: 'bg-red-100 text-red-800 border-red-200',
        iconComponent: X,
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
      };
    default:
      return {
        text: 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        iconComponent: Clock,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      };
  }
};

// Status progression order
export const STATUS_ORDER = ['PACKING', 'SHIPPING', 'DELIVERED'] as const;

// Get the numeric value of a status for comparison
export const getStatusOrder = (status: string): number => {
  const normalizedStatus = status?.toUpperCase();
  const index = STATUS_ORDER.indexOf(normalizedStatus as typeof STATUS_ORDER[number]);
  return index === -1 ? 0 : index;
};

// Check if a status change is allowed (no going backwards)
export const isStatusChangeAllowed = (currentStatus: string, newStatus: string): boolean => {
  const currentOrder = getStatusOrder(currentStatus);
  const newOrder = getStatusOrder(newStatus);
  
  // Allow CANCELLED from any status
  if (newStatus.toUpperCase() === 'CANCELLED') {
    return true;
  }
  
  // Only allow forward progression or same status
  return newOrder >= currentOrder;
};

// Get allowed next statuses for a given current status
export const getAllowedNextStatuses = (currentStatus: string): string[] => {
  const currentOrder = getStatusOrder(currentStatus);
  const allowedStatuses: string[] = [];
  
  // Only add the immediate next status, not all future ones
  if (currentOrder < STATUS_ORDER.length - 1) {
    allowedStatuses.push(STATUS_ORDER[currentOrder + 1]);
  }
  
  // Always allow CANCELLED from any status
  allowedStatuses.push('CANCELLED');
  
  return allowedStatuses;
};

// Check if a button should be disabled based on status progression
export const isStatusButtonDisabled = (currentStatus: string, targetStatus: string): boolean => {
  const normalizedCurrent = currentStatus?.toUpperCase();
  const normalizedTarget = targetStatus?.toUpperCase();
  
  // Button is disabled if it's the current status
  if (normalizedCurrent === normalizedTarget) {
    return true;
  }
  
  // Get allowed next statuses
  const allowedStatuses = getAllowedNextStatuses(currentStatus);
  
  // Button is disabled if the target status is not in the allowed next statuses
  return !allowedStatuses.includes(normalizedTarget);
};