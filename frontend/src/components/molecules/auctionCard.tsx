import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface AuctionCardProps {
  imageUrl: string;
  productName: string;
  category: string;
  sellerName: string;
  sellerAvatar: string;
  startingPrice: string;
  startTime: string;
  endTime: string;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return 'Ended';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function AuctionCard({
  imageUrl,
  productName,
  category,
  sellerName,
  sellerAvatar,
  startingPrice,
  startTime,
  endTime,
}: AuctionCardProps) {
  const [timerLabel, setTimerLabel] = useState<string>('Ends in:');
  const [countdown, setCountdown] = useState<string>('');
  const [badgeColor, setBadgeColor] = useState<string>(
    'bg-yellow-400 text-gray-900 hover:bg-yellow-400 hover:text-gray-900',
  );

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        // Upcoming auction
        setTimerLabel('Starts in:');
        setCountdown(formatCountdown(start - now));
        setBadgeColor(
          'bg-blue-900 text-white hover:bg-blue-900 hover:text-white',
        );
      } else if (now >= start && now < end) {
        // Ongoing auction
        setTimerLabel('Ends in:');
        setCountdown(formatCountdown(end - now));
        setBadgeColor(
          'bg-yellow-400 text-gray-900 hover:bg-yellow-400 hover:text-gray-900',
        );
      } else {
        // Ended auction
        setTimerLabel('Ended');
        setCountdown('');
        setBadgeColor(
          'bg-red-500 text-white hover:bg-red-500 hover:text-white',
        );
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime]);

  return (
    <Card className="overflow-hidden shadow-none h-full flex flex-col">
      {/* Image with Timer Badge */}
      <div className="relative">
        <img
          src={imageUrl}
          alt="Product"
          className="w-full h-40 object-cover"
        />
        <Badge
          className={`absolute top-0 left-0 ${badgeColor} font-bold px-3 py-1 rounded-none rounded-br-md text-sm flex items-center shadow-none`}
        >
          <Clock className="w-4 h-4 mr-1" />
          {timerLabel}
          {timerLabel !== 'Ended' && <span className="ml-1">{countdown}</span>}
        </Badge>
      </div>

      {/* Card Content */}
      <CardContent className="p-3 flex flex-col flex-1">
        <div className="">
          <h3 className="text-lg leading-5 font-semibold text-gray-900 line-clamp-2">
            {productName}
          </h3>
          <p className="text-gray-600 text-sm">{category}</p>

          {/* Seller Info */}
          <div className="flex items-center gap-1 mt-2">
            <span>By</span>
            <Avatar className="w-5 h-5">
              <AvatarImage src={sellerAvatar} />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <p className="text-sm text-gray-700 font-medium">{sellerName}</p>
          </div>
        </div>

        {/* Time Remaining */}

        {/* Price */}

        <div className="mt-auto pt-6 flex justify-between items-center">
          <p className="text-sm text-gray-700">Starting Price:</p>
          <p className="text-xl font-bold text-gray-500">LKR {startingPrice}</p>
        </div>
      </CardContent>
    </Card>
  );
}
