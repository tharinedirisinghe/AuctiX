import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MyReviewsSection } from '@/components/review/MyReviewsSection';

export default function SellerReviews() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isUserLoggedIn);
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600">You need to be logged in to view reviews.</p>
            <Button 
              onClick={() => navigate('/login')} 
              className="mt-4"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">My Reviews</h1>
              <p className="text-gray-500">
                View and manage reviews from your buyers
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <MyReviewsSection />
      </div>
    </div>
  );
}