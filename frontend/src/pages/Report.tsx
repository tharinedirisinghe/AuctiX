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

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          <Card className="p-4 border-none shadow-none bg-gray-100">
            <div className="text-4xl font-bold">{complaints.length}</div>
            <div className="text-sm font-semibold text-gray-500">Reports</div>
          </Card>
          <Card className="p-4 border-spacing-1 border-yellow-300 shadow-lg shadow-yellow-100">
            <div className="text-4xl font-bold">
              {
                complaints.filter((report) => report.status === 'PENDING')
                  .length
              }
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </Card>
          <Card className="p-4 shadow-none">
            <div className="text-4xl font-bold">
              {
                complaints.filter((report) => report.status === 'UNDER_REVIEW')
                  .length
              }
            </div>
            <div className="text-sm text-gray-500">Under Review</div>
          </Card>
          <Card className="p-4 shadow-none">
            <div className="text-4xl font-bold">
              {
                complaints.filter((report) => report.status === 'REJECTED')
                  .length
              }
            </div>
            <div className="text-sm text-gray-500">Rejected</div>
          </Card>
        </div>

        <ComplaintDataTable />
      </div>
    </div>
  );
}
