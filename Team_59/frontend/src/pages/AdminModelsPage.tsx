import React from 'react';
import { useAuth } from '../store/auth';
import { Brain } from 'lucide-react';

export const AdminModelsPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          You must be an admin to access AI Models.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">AI Models</h1>
      </div>
      <p className="text-sm text-gray-600">
        Manage and monitor deployed medical ML models here (placeholder for now).
      </p>
    </div>
  );
};
