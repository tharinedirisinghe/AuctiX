// File: components/delivery/seller/CalendarStats.tsx
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, Check, AlertCircle, Calendar } from 'lucide-react';
import { Delivery } from '@/services/deliveryService';

interface CalendarStatsProps {
  deliveries: Delivery[];
  isLoading?: boolean;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({
  deliveries,
  isLoading = false,
}) => {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = {
      total: deliveries.length,
      packing: 0,
      shipping: 0,
      delivered: 0,
      overdue: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };

    deliveries.forEach((delivery) => {
      const deliveryDate = new Date(delivery.deliveryDate);
      const deliveryDateOnly = new Date(
        deliveryDate.getFullYear(),
        deliveryDate.getMonth(),
        deliveryDate.getDate()
      );

      // Status counts
      const status = delivery.status.toUpperCase();
      if (status === 'PACKING') result.packing++;
      else if (status === 'SHIPPING') result.shipping++;
      else if (status === 'DELIVERED') result.delivered++;

      // Overdue check
      if (deliveryDateOnly < today && status !== 'DELIVERED') {
        result.overdue++;
      }

      // Time-based counts
      if (deliveryDateOnly.getTime() === today.getTime()) {
        result.today++;
      }
      if (deliveryDateOnly >= thisWeek) {
        result.thisWeek++;
      }
      if (deliveryDateOnly >= thisMonth) {
        result.thisMonth++;
      }
    });

    return result;
  }, [deliveries]);

  const statCards = [
    {
      label: 'Total Deliveries',
      value: stats.total,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Due Today',
      value: stats.today,
      icon: AlertCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      label: 'This Week',
      value: stats.thisWeek,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  ];

  const statusCards = [
    {
      label: 'Packing',
      value: stats.packing,
      icon: Package,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Shipping',
      value: stats.shipping,
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Delivered',
      value: stats.delivered,
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className={`${stat.borderColor} border-2 hover:shadow-md transition-shadow`}
        >
          <CardContent className={`p-4 ${stat.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}

      {statusCards.map((stat, index) => (
        <Card
          key={`status-${index}`}
          className={`${stat.borderColor} border-2 hover:shadow-md transition-shadow`}
        >
          <CardContent className={`p-4 ${stat.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};