import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Label } from 'recharts';
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
} from 'recharts';
import { Tooltip, Cell } from 'recharts';
// import { TrendingUp } from 'lucide-react'; // Removed unused import
import { useAppSelector } from '@/hooks/hooks';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AxiosRequest from '@/services/axiosInspector';
import { toast } from 'react-toastify';

import { Card } from '../ui/card';
import { getUserStats, IUserStats } from '@/services/userService';
import { getServerErrorMessage, SectionEnum } from '@/lib/errorMsg';
import { getSellerVerificationStats } from '@/services/sellerVerificationService';

export default function AdminDashboard() {
  type ComplaintChartDatum = { name: string; value: number; fill: string };
  let pendingComplaints = 0;
  let totalComplaints = 0;
  let complaintsChartData: ComplaintChartDatum[] = [];

  const [stats, setStats] = useState<{
    total: number;
    PENDING: number;
    UNDER_REVIEW: number;
    REJECTED: number;
    RESOLVED: number;
  } | null>(null);

  interface ISellerVerificationStats {
    pendingVerifications: number;
    approvedVerifications: number;
    rejectedVerifications: number;
    verifiedSellers: number;
  }

  const userData = useAppSelector((state) => state.user);
  const authData = useAppSelector((state) => state.auth);
  const [userStats, setUserStats] = useState<IUserStats | null>(null);
  const [verificationStats, setVerificationStats] =
    useState<ISellerVerificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const axiosInstance = AxiosRequest().axiosInstance;
  const token = authData?.token;

  // Prepare chart data for user types
  const chartData = React.useMemo(() => {
    if (!userStats) return [];
    const sellers = userStats.sellers ?? 0;
    const bidders = userStats.bidders ?? 0;
    const admins = userStats.admins ?? 0;

    return [
      { type: 'Sellers', value: sellers, fill: '#FF8C00' },
      { type: 'Bidders', value: bidders, fill: '#fcba04' },
      { type: 'Admins', value: admins, fill: '#3D0C02' },
    ];
  }, [userStats]);

  const total = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  useEffect(() => {
    async function fetchUserStats() {
      try {
        const stats = await getUserStats(axiosInstance);
        setUserStats(stats);
      } catch (error) {
        toast.error('Failed to fetch user stats');
      }
    }
    fetchUserStats();

    const fetchComplaintStats = async () => {
      try {
        const response = await axiosInstance.get('/complaints/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching complaint stats:', err);
      }
    };
    fetchComplaintStats();
  }, [token]);

  useEffect(() => {
    getSellerVerificationStats(axiosInstance)
      .then((data) => {
        setVerificationStats(data);
      })
      .catch((error) => {
        console.error('Error fetching verification stats:', error);
        toast.error(
          `Error fetching verification stats: ${getServerErrorMessage(
            error,
            SectionEnum.SELLER_VERIFICATION,
          )}`,
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-white">
      {/*<section className="relative w-full mb-5">
        
        <div className="relative h-64 w-full">
          <img
            src={userData.banner_photo}
            alt="cover-image"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div className="flex items-end">
                  <img
                    src={userData.profile_photo}
                    alt="user-avatar-image"
                    className="rounded-md w-20 h-20 object-cover shadow-lg shadow-white/10 border-2 border-white/20"
                  />
                  <div className="flex flex-col items-start ml-4 md:ml-6 mb-2">
                    <div className="text-white/80 font-medium leading-none text-sm">
                      Hello,
                    </div>
                    <h3 className="font-manrope font-bold text-2xl md:text-4xl text-white">
                      {userData.username || 'Admin'}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings/profile')}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>*/}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 min-h-screen">
        <div className="flex gap-6 mb-8">
          <div className="hidden md:block w-3/5 border rounded-lg">
            <div className="w-full">
              <Card className="text-gray-800 border-none relative p-0 overflow-hidden">
                <div className="relative w-full h-64">
                  <img
                    src={userData.banner_photo}
                    alt="cover-image"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="w-full max-w-7xl mx-auto">
                      <div className="flex items-end justify-between">
                        <div className="flex items-end">
                          <img
                            src={userData.profile_photo}
                            alt="user-avatar-image"
                            className="rounded-md w-20 h-20 object-cover"
                          />
                          <div className="flex flex-col items-start ml-4 md:ml-6 mb-2">
                            <div className="text-white/80 font-medium leading-none text-sm">
                              Hello,
                            </div>
                            <h3 className="font-manrope font-bold text-2xl md:text-4xl text-white">
                              {userData.username || 'Guest'}
                            </h3>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/settings')}
                        >
                          Go to Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <div className="w-full md:w-2/5 flex flex-col gap-6 justify-center">
            <Card className="flex flex-row border-none shadow-none items-center justify-center p-6">
              <div className="flex flex-col items-center justify-center">
                <PieChart width={200} height={200}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="type"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={5}
                    label={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {total.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Users
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${value}`,
                      `${props.payload.type}`,
                    ]}
                    contentStyle={{
                      background: '#fff',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                    }}
                  />
                </PieChart>
              </div>
              {/* Legend on right side */}
              <div className="flex flex-col gap-3 ml-8">
                {chartData.map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <span
                      style={{ background: item.fill }}
                      className="inline-block w-3 h-3 rounded-full"
                    ></span>
                    <span className="text-sm text-gray-700 font-semibold">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        <div className="flex gap-6 mb-4">
          <div className="mb-8 w-1/2">
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-12">
              <span className="text-3xl font-bold text-orange-600">
                {stats?.PENDING ?? 0}
              </span>
              <span className="text-lg text-gray-700 mt-2">
                Pending Complaints
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {stats ? `Out of ${stats.total} total` : ''}
              </span>
            </div>
          </div>
          <div className="w-1/2">
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-12">
              <span className="text-3xl font-bold text-blue-600">
                {verificationStats?.pendingVerifications ?? 0}
              </span>
              <span className="text-lg text-gray-700 mt-2">
                Pending Seller Verifications
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {verificationStats
                  ? `Out of ${verificationStats.approvedVerifications + verificationStats.pendingVerifications + verificationStats.rejectedVerifications} total`
                  : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
