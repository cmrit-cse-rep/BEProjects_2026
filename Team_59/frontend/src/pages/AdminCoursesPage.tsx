import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { BookOpen } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface AdminCourse {
  id: number;
  title: string;
  short_description: string;
  enrollment_count: number;
  rating: number;
  has_ar: boolean;
}

export const AdminCoursesPage: React.FC = () => {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`${API_BASE_URL}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Failed to load courses');
        }
        const data = (await resp.json()) as AdminCourse[];
        setCourses(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') {
      fetchCourses();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          You must be an admin to access Course Management.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <BookOpen className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700">Title</th>
                <th className="px-4 py-2 text-left text-gray-700">Enrollments</th>
                <th className="px-4 py-2 text-left text-gray-700">Rating</th>
                <th className="px-4 py-2 text-left text-gray-700">AR</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{c.title}</td>
                  <td className="px-4 py-2">{c.enrollment_count}</td>
                  <td className="px-4 py-2">{c.rating.toFixed(1)}</td>
                  <td className="px-4 py-2">{c.has_ar ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={4}>
                    No courses found.
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
