import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import {
  apiGetInstructorCourses,
  apiGetInstructorCourseStudents,
} from '../services/api';
import { BarChart3, Users, Trophy, ActivitySquare } from 'lucide-react';

interface InstructorCourse {
  id: number;
  title: string;
  enrollment_count?: number;
}

interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  progress: number;
  completed: number;
}

export const AnalyticsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    if (user.role !== 'instructor' && user.role !== 'admin') return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const c = await apiGetInstructorCourses(token);
        setCourses(c);

        const allEnrollments: Enrollment[] = [];
        for (const course of c) {
          const e = await apiGetInstructorCourseStudents(course.id, token);
          allEnrollments.push(...e);
        }
        setEnrollments(allEnrollments);
      } catch (e: any) {
        setError(e.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user]);

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-red-600">Only instructors and admins can view this page.</p>
      </div>
    );
  }

  const totalCourses = courses.length;
  const totalEnrollments = enrollments.length;
  const completedCount = enrollments.filter((e) => e.completed).length;
  const averageProgress =
    enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teaching Analytics</h1>
          <p className="text-gray-600">
            High-level overview of engagement and progress across your courses.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Active courses</p>
            <p className="text-xl font-semibold text-gray-900">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Enrollments</p>
            <p className="text-xl font-semibold text-gray-900">{totalEnrollments}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Completed</p>
            <p className="text-xl font-semibold text-gray-900">
              {completedCount}{' '}
              <span className="text-xs text-gray-500">
                ({totalEnrollments ? Math.round((completedCount / totalEnrollments) * 100) : 0}
                %)
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <ActivitySquare className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Avg. progress</p>
            <p className="text-xl font-semibold text-gray-900">
              {Math.round(averageProgress)}%
            </p>
          </div>
        </div>
      </div>

      {/* Per-course progress table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">
            Course performance
          </h2>
        </div>
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            Loading analytics...
          </div>
        ) : totalCourses === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            Create a course to see analytics here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Course
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Enrollments
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Avg. progress
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Completion rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const courseEnrollments = enrollments.filter(
                    (e) => e.course_id === course.id,
                  );
                  const ce = courseEnrollments.length;
                  const avg =
                    ce > 0
                      ? courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / ce
                      : 0;
                  const completed = courseEnrollments.filter((e) => e.completed).length;
                  const completionRate = ce ? Math.round((completed / ce) * 100) : 0;

                  return (
<tr key={course.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {course.title}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {ce}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {Math.round(avg)}%
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {completionRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
