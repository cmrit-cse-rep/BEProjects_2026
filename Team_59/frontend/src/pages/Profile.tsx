import React from 'react';
import { useAuth } from '../store/auth';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>Profile page for {user?.name}</p>
        <p className="text-gray-600 mt-2">Coming soon...</p>
      </div>
    </div>
  );
};
