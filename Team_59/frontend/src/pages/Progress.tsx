import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, Clock, Award, BookOpen, CheckCircle } from 'lucide-react';
import { useAuth } from '../store/auth';

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

export const ProgressPage: React.FC = () => {
  const { user, token } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<'week' | 'month' | 'year'>('month');

  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo weekly/activity data kept for now
  const weeklyData = [
    { day: 'Mon', hours: 2.5, completed: 3 },
    { day: 'Tue', hours: 3.2, completed: 2 },
    { day: 'Wed', hours: 1.8, completed: 1 },
    { day: 'Thu', hours: 4.1, completed: 4 },
    { day: 'Fri', hours: 2.9, completed: 2 },
    { day: 'Sat', hours: 3.5, completed: 3 },
    { day: 'Sun', hours: 2.1, completed: 1 },
  ];

  const recentActivity = [
    { id: 1, type: 'course', title: 'Heart Anatomy Complete', progress: 100, date: '2024-08-10' },
    { id: 2, type: 'ar', title: 'Respiratory System AR Session', progress: 85, date: '2024-08-09' },
    { id: 3, type: 'quiz', title: 'Cardiovascular Quiz', progress: 92, date: '2024-08-08' },
    { id: 4, type: 'achievement', title: 'AR Explorer Badge Earned', progress: 100, date: '2024-08-07' },
  ];

  useEffect(() => {
    const fetchProgress = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(`${API_BASE_URL}/api/me/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Failed to load progress');
        }

        const data = (await resp.json()) as BackendCourse[];
        setCourses(data);
      } catch (err: any) {
        setError(
          typeof err?.message === 'string'
            ? err.message
            : 'Failed to load progress',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [token]);

  // Derive simple stats from courses
  const totalCourses = courses.length;
  const coursesCompleted = courses.filter((c) => c.progress >= 99).length;
  const overall =
    totalCourses > 0
      ? Math.round(
          courses.reduce((sum, c) => sum + c.progress, 0) / totalCourses,
        )
      : 0;

  const progressStats = {
    overall,
    coursesCompleted,
    totalCourses,
    studyHours: 156, // still demo for now
    arSessions: 34,  // can be wired later
    achievements: user?.achievements?.length ?? 0,
    streak: 15,      // still demo
  };

  const courseProgress = courses.length
    ? courses.map((c) => ({
        name: c.title,
        progress: Math.round(c.progress),
        color: 'bg-blue-500',
      }))
    : [
        { name: 'Human Heart Anatomy', progress: 100, color: 'bg-green-500' },
        { name: 'Respiratory System', progress: 85, color: 'bg-blue-500' },
        { name: 'Nervous System', progress: 60, color: 'bg-yellow-500' },
        { name: 'Digestive System', progress: 30, color: 'bg-red-500' },
        { name: 'Musculoskeletal System', progress: 15, color: 'bg-purple-500' },
      ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'ar':
        return <Target className="w-4 h-4" />;
      case 'quiz':
        return <CheckCircle className="w-4 h-4" />;
      case 'achievement':
        return <Award className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">
            Track your learning journey and achievements
          </p>
        </div>

        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Overall Progress */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <p className="text-primary-100">
              Keep up the great work, {user?.name}!
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary-100" />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>Learning Progress</span>
              <span>{progressStats.overall}%</span>
            </div>
            <div className="w-full bg-primary-700 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressStats.overall}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progressStats.overall}%</div>
            <div className="text-xs text-primary-100">Complete</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {progressStats.coursesCompleted}
              </p>
              <p className="text-sm text-gray-600">Courses Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {progressStats.studyHours}
              </p>
              <p className="text-sm text-gray-600">Study Hours</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {progressStats.arSessions}
              </p>
              <p className="text-sm text-gray-600">AR Sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {progressStats.achievements}
              </p>
              <p className="text-sm text-gray-600">Achievements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Course Progress
          </h3>
          {loading && (
            <p className="text-sm text-gray-600">Loading course progress...</p>
          )}
          {!loading && (
            <div className="space-y-4">
              {courseProgress.map((course, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">
                      {course.name}
                    </span>
                    <span className="text-gray-500">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${course.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Activity Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Weekly Activity
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-2">{day.day}</div>
                <div className="relative">
                  <div
                    className="bg-primary-100 rounded-lg transition-all duration-300 hover:bg-primary-200"
                    style={{ height: `${Math.max(day.hours * 20, 10)}px` }}
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {day.hours}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify_between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activity.type === 'course'
                      ? 'bg-green-100 text-green-600'
                      : activity.type === 'ar'
                      ? 'bg-blue-100 text-blue-600'
                      : activity.type === 'quiz'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">{activity.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activity.progress < 100 && (
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${activity.progress}%` }}
                    />
                  </div>
                )}
                <span className="text-sm font-medium text_gray-700">
                  {activity.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
