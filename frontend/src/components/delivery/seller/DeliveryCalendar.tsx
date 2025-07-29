// File: components/delivery/seller/DeliveryCalendar.tsx
import { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  Eye,
  Edit3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Delivery } from '@/services/deliveryService';
import { getStatusInfo } from '../shared/StatusHelper';

interface DeliveryCalendarProps {
  deliveries: Delivery[];
  onDateClick?: (date: string, deliveries: Delivery[]) => void;
  onDeliveryClick?: (delivery: Delivery) => void;
  onUpdateDate?: (deliveryId: string, currentDate: string) => void;
  isLoading?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  deliveries: Delivery[];
  isToday: boolean;
  isPast: boolean;
}

export const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({
  deliveries,
  onDateClick,
  onDeliveryClick,
  onUpdateDate,
  isLoading = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, -i);
      const dateStr = date.toISOString().split('T')[0];
      const dayDeliveries = deliveries.filter(
        (delivery) => delivery.deliveryDate.split('T')[0] === dateStr
      );

      days.push({
        date,
        isCurrentMonth: false,
        deliveries: dayDeliveries,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayDeliveries = deliveries.filter(
        (delivery) => delivery.deliveryDate.split('T')[0] === dateStr
      );

      days.push({
        date,
        isCurrentMonth: true,
        deliveries: dayDeliveries,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayDeliveries = deliveries.filter(
        (delivery) => delivery.deliveryDate.split('T')[0] === dateStr
      );

      days.push({
        date,
        isCurrentMonth: false,
        deliveries: dayDeliveries,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
      });
    }

    return days;
  }, [deliveries, currentMonth, currentYear]);

  // Get status counts for a day
  const getStatusCounts = (dayDeliveries: Delivery[]) => {
    const counts = {
      PACKING: 0,
      SHIPPING: 0,
      DELIVERED: 0,
      overdue: 0,
    };

    dayDeliveries.forEach((delivery) => {
      const status = delivery.status.toUpperCase() as keyof typeof counts;
      if (status in counts) {
        counts[status]++;
      }

      // Check if overdue
      const deliveryDate = new Date(delivery.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today && delivery.status !== 'DELIVERED') {
        counts.overdue++;
      }
    });

    return counts;
  };

  // Handle day click
  const handleDayClick = (day: CalendarDay) => {
    const dateStr = day.date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    if (onDateClick) {
      onDateClick(dateStr, day.deliveries);
    }
  };

  // Get deliveries for selected date
  const selectedDateDeliveries = selectedDate
    ? deliveries.filter(
        (delivery) => delivery.deliveryDate.split('T')[0] === selectedDate
      )
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Side - Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Delivery Calendar
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-lg px-4">
                  {currentDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  disabled={isLoading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                <span className="text-sm">Packing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Delivered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Overdue</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-100"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dateStr = day.date.toISOString().split('T')[0];
                const statusCounts = getStatusCounts(day.deliveries);
                const totalDeliveries = day.deliveries.length;
                const isSelected = selectedDate === dateStr;

                return (
                  <div
                    key={index}
                    className={`
                      relative p-1 min-h-[80px] border cursor-pointer transition-all hover:bg-gray-50
                      ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                      ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                      ${isSelected ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400' : 'border-gray-200'}
                      ${totalDeliveries > 0 ? 'hover:shadow-md' : ''}
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* Date number */}
                    <div
                      className={`
                        text-sm font-medium mb-1
                        ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${day.isToday ? 'text-blue-600 font-bold' : ''}
                        ${isSelected ? 'text-blue-700 font-bold' : ''}
                      `}
                    >
                      {day.date.getDate()}
                    </div>

                    {/* Delivery indicators */}
                    {totalDeliveries > 0 && (
                      <div className="space-y-1">
                        {/* Status dots */}
                        <div className="flex items-center justify-center space-x-1">
                          {statusCounts.PACKING > 0 && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              <span className="text-xs ml-1">{statusCounts.PACKING}</span>
                            </div>
                          )}
                          {statusCounts.SHIPPING > 0 && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs ml-1">{statusCounts.SHIPPING}</span>
                            </div>
                          )}
                          {statusCounts.DELIVERED > 0 && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs ml-1">{statusCounts.DELIVERED}</span>
                            </div>
                          )}
                        </div>

                        {/* Overdue indicator */}
                        {statusCounts.overdue > 0 && (
                          <div className="flex items-center justify-center">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-500 ml-1">
                              {statusCounts.overdue}
                            </span>
                          </div>
                        )}

                        {/* Total count if multiple deliveries */}
                        {totalDeliveries > 3 && (
                          <div className="text-xs text-center text-gray-600 bg-gray-200 rounded px-1">
                            +{totalDeliveries - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Selected Date Details */}
      <div className="lg:col-span-1">
        {selectedDate && selectedDateDeliveries.length > 0 ? (
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                {selectedDateDeliveries.length} delivery(s)
              </Badge>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-3">
                {selectedDateDeliveries.map((delivery) => {
                  const statusInfo = getStatusInfo(delivery.status);
                  const isOverdue = 
                    new Date(delivery.deliveryDate) < new Date() && 
                    delivery.status !== 'DELIVERED';

                  return (
                    <div
                      key={delivery.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {delivery.auctionImage ? (
                            <img
                              src={delivery.auctionImage}
                              alt={delivery.auctionTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {delivery.auctionTitle}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
                            {delivery.buyerName}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              className={`${statusInfo.color} border text-xs`}
                            >
                              <statusInfo.iconComponent className="w-3 h-3 mr-1" />
                              {statusInfo.text}
                            </Badge>
                            {isOverdue && (
                              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDeliveryClick?.(delivery)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 w-full"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateDate?.(delivery.id, delivery.deliveryDate)}
                              className="border-amber-300 text-amber-600 hover:bg-amber-50 w-full"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit Date
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : selectedDate && selectedDateDeliveries.length === 0 ? (
          <Card className="sticky top-6">
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No deliveries scheduled
              </h3>
              <p className="text-gray-500 text-sm">
                No deliveries for{' '}
                {new Date(selectedDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="sticky top-6">
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a date
              </h3>
              <p className="text-gray-500 text-sm">
                Click on a calendar date to view delivery details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};