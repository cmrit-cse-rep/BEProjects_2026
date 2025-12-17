import React, { useEffect, useState } from 'react';
import { Clock, Users, Star, Book, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface BackendCourse {
  id: number;
  title: string;
  short_description: string;
  description: string;
  instructor_id: number;
  thumbnail?: string | null;
  duration_minutes: number;
  level: string;
  category: string;
  enrollment_count: number;
  rating: number;
  total_ratings: number;
  has_ar: boolean;
  price: number;
  is_enrolled: boolean;
  progress: number;
}

export const CoursesPage: React.FC = () => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!token) {
        setError('You must be logged in to view courses.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Failed to load courses');
        }

        const data = (await response.json()) as BackendCourse[];
        setCourses(data);
      } catch (err: any) {
        setError(
          typeof err?.message === 'string'
            ? err.message
            : 'Failed to load courses',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-600">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Medical Courses</h1>
        <p className="text-gray-600 mb-4">
          No courses are available yet. Instructors can create courses from the
          dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-8 pb-12">
      <h1 className="text-2xl font-bold text-gray-900">Medical Courses</h1>
      <p className="text-gray-600">
        Discover our comprehensive medical education programs
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow block"
            style={{ textDecoration: 'none' }}
          >
            <div className="relative h-48 bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center">
              <Book className="h-16 w-16 text-primary-300" />
              {course.has_ar && (
                <div className="absolute top-3 right-3 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                  <Box className="h-3 w-3" />
                  <span>AR</span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h3>
                <div className="text-lg font-bold text-primary-600">
                  ${course.price}
                </div>
              </div>

              {/* Instructor name can be resolved later via a separate call if needed */}
              <p className="text-sm text-gray-600 mb-2">
                Instructor ID: {course.instructor_id}
              </p>

              <p className="text-sm text-gray-700 mb-4">
                {course.short_description}
              </p>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_minutes}m</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{course.enrollment_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{course.rating.toFixed(1)}</span>
                </div>
              </div>

              {course.is_enrolled && (
                <div className="mt-2 text-xs text-green-600 font-semibold">
                  Enrolled · Progress: {course.progress.toFixed(0)}%
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
