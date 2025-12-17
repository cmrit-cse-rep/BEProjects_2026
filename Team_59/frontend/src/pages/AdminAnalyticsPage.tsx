import React from 'react';
import { useAuth } from '../store/auth';
import { BarChart2 } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          You must be an admin to access System Analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <BarChart2 className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
      </div>
      <p className="text-sm text-gray-600">
        Analytics dashboard coming soon (user growth, course usage, ML/AR stats).
      </p>
    </div>
  );
};
