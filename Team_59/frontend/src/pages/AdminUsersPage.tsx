import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface AdminUser {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
}

export const AdminUsersPage: React.FC = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`${API_BASE_URL}/api/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Failed to load users');
        }
        const data = (await resp.json()) as AdminUser[];
        setUsers(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          You must be an admin to access User Management.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <Users className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-gray-700">Role</th>
                <th className="px-4 py-2 text-left text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.full_name || '-'}</td>
                  <td className="px-4 py-2 capitalize">{u.role}</td>
                  <td className="px-4 py-2">
                    {u.is_active ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={4}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
