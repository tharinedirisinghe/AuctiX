import { Card } from '@/components/ui/card';
import ComplaintDataTable from '../components/organisms/complaintDataTable';
import { useEffect, useState } from 'react';
import useAxiosRequest from '@/services/axiosInspector';

export default function ComplaintReports() {
  interface User {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    profile_photo: string | null;
    role: string;
  }

  interface Complaint {
    id: string;
    reportedUser: User;
    reportedBy: User;
    reason: string;
    dateReported: string;
    status: string;
  }

  const [stats, setStats] = useState<{
    total: number;
    PENDING: number;
    UNDER_REVIEW: number;
    REJECTED: number;
    RESOLVED: number;
  } | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { axiosInstance } = useAxiosRequest();

  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      setError(null); // Reset error state before fetching
      try {
        const response = await axiosInstance.get('/complaints');
        console.log('API Response:', response.data);
        setComplaints(
          Array.isArray(response.data.content) ? response.data.content : [],
        );
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError('Failed to fetch complaints. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();

    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/complaints/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching complaint stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-white">
      <header className="relative h-28 w-full bg-yellow-400">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <h1 className="text-4xl font-bold text-white absolute bottom-0 left-0 right-0 px-6 md:px-8 mb-4">
          Complaints
        </h1>
      </header>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card
            className={`p-4 border border-gray-100 shadow-none bg-gray-100 cursor-pointer hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-100 transition-all ${
              selectedStatus === 'all'
                ? 'border-2 border-yellow-300 shadow-lg shadow-yellow-100'
                : ''
            }`}
            onClick={() => setSelectedStatus('all')}
          >
            <div className="text-4xl font-bold">{stats?.total ?? 0}</div>
            <div className="text-sm font-semibold text-gray-500">
              All Reports
            </div>
          </Card>
          <Card
            className={`p-4 shadow-none cursor-pointer hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-100 transition-all ${
              selectedStatus === 'PENDING'
                ? 'border-2 border-yellow-300 shadow-lg shadow-yellow-100'
                : ''
            }`}
            onClick={() => setSelectedStatus('PENDING')}
          >
            <div className="text-4xl font-bold">{stats?.PENDING ?? 0}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </Card>
          <Card
            className={`p-4 shadow-none cursor-pointer hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-100 transition-all ${
              selectedStatus === 'UNDER_REVIEW'
                ? 'border-2 border-yellow-300 shadow-lg shadow-yellow-100'
                : ''
            }`}
            onClick={() => setSelectedStatus('UNDER_REVIEW')}
          >
            <div className="text-4xl font-bold">{stats?.UNDER_REVIEW ?? 0}</div>
            <div className="text-sm text-gray-500">Under Review</div>
          </Card>
          <Card
            className={`p-4 shadow-none cursor-pointer hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-100 transition-all ${
              selectedStatus === 'REJECTED'
                ? 'border-2 border-yellow-300 shadow-lg shadow-yellow-100'
                : ''
            }`}
            onClick={() => setSelectedStatus('REJECTED')}
          >
            <div className="text-4xl font-bold">{stats?.REJECTED ?? 0}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </Card>
        </div>

        <ComplaintDataTable
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />
      </div>
    </div>
  );
}
