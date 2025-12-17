import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { BookOpen, Award, Clock, Box, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface BackendCourse {
  id: number;
  title: string;
  short_description: string;
  description: string;
  instructor_id: number;
  duration_minutes: number;
  enrollment_count: number;
  rating: number;
  total_ratings: number;
  has_ar: boolean;
  is_enrolled: boolean;
  progress: number;
}

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [myCourses, setMyCourses] = useState<BackendCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(`${API_BASE_URL}/api/me/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Failed to load your courses');
        }

        const data = (await resp.json()) as BackendCourse[];
        setMyCourses(data);
      } catch (err: any) {
        setError(
          typeof err?.message === 'string'
            ? err.message
            : 'Failed to load your courses',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [token]);

  const enrolledCoursesCount = myCourses.length;
  const completedLessonsApprox = myCourses.filter(
    (c) => c.progress >= 99,
  ).length; // simple proxy
  const achievementsCount = user?.achievements?.length ?? 0;

  return (
    <div className="container mx-auto space-y-6 pb-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-medical-500 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="opacity-90">
          Ready to continue your medical learning journey?
        </p>
      </div>

      {/* Optional error */}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-lg bg-gray-100 text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Enrolled Courses
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {enrolledCoursesCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-lg bg-gray-100 text-green-600">
            <Clock className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Completed Courses
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {completedLessonsApprox}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-lg bg-gray-100 text-purple-600">
            <Box className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">AR Sessions</p>
            <p className="text-2xl font-bold text-gray-900">Demo</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center">
          <div className="p-3 rounded-lg bg-gray-100 text-yellow-600">
            <Award className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Achievements</p>
            <p className="text-2xl font-bold text-gray-900">
              {achievementsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Continue Learning
            </h2>
            <div className="space-y-4">
              {loading && (
                <p className="text-sm text-gray-600">Loading your courses...</p>
              )}
              {!loading && myCourses.length === 0 && (
                <p className="text-sm text-gray-600">
                  You have not enrolled in any courses yet. Browse courses to get
                  started.
                </p>
              )}
              {!loading &&
                myCourses.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {course.short_description}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${course.progress.toFixed(0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/ar-learning"
                className="w-full block text-left p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
              >
                Start AR Session
              </Link>
              <Link
                to="/courses"
                className="w-full block text-left p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Courses
              </Link>
              <Link
                to="/ml-prediction"
                className="w-full block text-left p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Run ML Diagnosis
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/users"
                  className="w-full block text-left p-3 bg-medical-50 text-medical-700 rounded-lg hover:bg-medical-100 transition-colors flex items-center"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
