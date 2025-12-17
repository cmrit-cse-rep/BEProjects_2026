import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  Edit,
  Eye,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import type { Course } from '../types';
import { Link } from 'react-router-dom';

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

export const MyCoursesPage: React.FC = () => {
  const { user, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch enrolled courses for current user
  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!token) {
        setError('You must be logged in to view your courses.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/me/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Failed to load your courses');
        }

        const data = (await response.json()) as BackendCourse[];

        // Map backend to frontend Course type
        const mapped: Course[] = data.map((c) => ({
          id: c.id.toString(),
          title: c.title,
          description: c.description,
          shortDescription: c.short_description,
          instructor: user?.name || `Instructor #${c.instructor_id}`,
          instructorId: c.instructor_id.toString(),
          thumbnail: c.thumbnail || '/images/default-course.jpg',
          duration: c.duration_minutes,
          level: (c.level as Course['level']) || 'beginner',
          category: c.category || 'General',
          lessons: [], // can be filled when lesson API exists
          enrollmentCount: c.enrollment_count,
          rating: c.rating,
          totalRatings: c.total_ratings,
          tags: [], // add when you support tags in backend
          hasAR: c.has_ar,
          arModels: [],
          price: c.price,
          isEnrolled: c.is_enrolled,
          progress: c.progress,
          createdAt: new Date(), // backend created_at can be added later
          updatedAt: new Date(),
        }));

        setMyCourses(mapped);
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
  }, [token, user]);

  const filteredCourses = myCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    // selectedFilter is reserved for future status support
    return matchesSearch;
  });

  const totalStudents = myCourses.reduce(
    (sum, course) => sum + course.enrollmentCount,
    0,
  );
  const averageRating =
    myCourses.length > 0
      ? myCourses.reduce((sum, course) => sum + course.rating, 0) /
        myCourses.length
      : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-gray-600">Loading your courses...</p>
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

  return (
    <div className="container mx-auto px-4 space-y-6 pb-12">
      {/* Header and Create Course */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Manage and track your course content</p>
        </div>

        <Link to="/my-courses/create" className="mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {myCourses.length}
              </p>
              <p className="text-sm text-gray-600">Total Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">+0%</p>
              <p className="text-sm text-gray-600">Growth Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Search courses"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) =>
                setSelectedFilter(e.target.value as typeof selectedFilter)
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Filter courses by status"
              title="Filter courses by status"
            >
              <option value="all">All Courses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Apply filters"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Link
            to={`/my-courses/${course.id}`}
            key={course.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow block"
            style={{ textDecoration: 'none' }}
          >
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-blue-500 opacity-50" />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {course.title}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    course.level === 'beginner'
                      ? 'bg-green-100 text-green-700'
                      : course.level === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {course.level}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.enrollmentCount}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-400" />
                    {course.rating}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {course.duration} min
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {course.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {course.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{course.tags.length - 2}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/my-courses/${course.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={`Edit ${course.title}`}
                    title="Edit course"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/my-courses/${course.id}/view`}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={`View details for ${course.title}`}
                    title="View details"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by enrolling in a course or creating your first course.
          </p>
          <Link to="/my-courses/create">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Create Course
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};
