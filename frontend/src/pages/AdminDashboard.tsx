import { Card } from '@/components/ui/card';
import {
  Users,
  ShieldCheck,
  Activity,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="bg-white min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-black">
            Welcome to AuctiX Admin Panel
          </h1>
          <p className="text-lg text-gray-600">
            Manage your auction platform with powerful admin tools and oversight
            capabilities.
          </p>
        </header>

        {/* Admin Capabilities Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-full mr-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black">
                User Management
              </h3>
            </div>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center">
                <Search className="h-4 w-4 mr-2 text-gray-600" />
                <span>Search users by name, email, or username</span>
              </div>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-600" />
                <span>Filter users by role, status, and registration date</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2 text-gray-600" />
                <span>View detailed user profiles and activity history</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-full mr-4">
                <ShieldCheck className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black">
                Seller Verification
              </h3>
            </div>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-gray-600" />
                <span>Review and approve seller verification requests</span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                <span>Reject applications with detailed feedback</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2 text-gray-600" />
                <span>Manage submitted documents and verification status</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Super Admin Section */}
        <Card className="p-6 mb-8 border-l-4 border-l-yellow-500 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-yellow-100 rounded-full mr-4">
              <Activity className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black">
              Super Admin Oversight
            </h3>
          </div>
          <div className="text-gray-700">
            <p className="text-base">
              Super administrators can monitor all admin activities, review
              administrative decisions, and maintain oversight of platform
              management operations.
            </p>
          </div>
        </Card>

        {/* Quick Access Navigation */}
        <Card className="p-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-black">
            Quick Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/users"
              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-black mb-2">
                    User Management
                  </h4>
                  <p className="text-sm text-gray-600">
                    Access the user management section to search, filter, and
                    manage all platform users.
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </Link>

            <Link
              to="/seller-verification-management"
              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-black mb-2">
                    Verification Requests
                  </h4>
                  <p className="text-sm text-gray-600">
                    Review pending seller verification requests and manage
                    approval processes.
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </Link>

            <Link
              to="/complaints"
              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-black mb-2">
                    Complaints Management
                  </h4>
                  <p className="text-sm text-gray-600">
                    Review and manage user complaints and platform issues.
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
