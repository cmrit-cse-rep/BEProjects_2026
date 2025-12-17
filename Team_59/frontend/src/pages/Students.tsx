import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import {
  apiGetInstructorCourses,
  apiGetInstructorCourseStudents,
} from '../services/api';
import { Users, BookOpen } from 'lucide-react';

interface InstructorCourse {
  id: number;
  title: string;
}

interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  progress: number;
  completed: number;
}

export const StudentsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInstructor =
    user && (user.role === 'instructor' || user.role === 'admin');

  // Load instructor's courses
  useEffect(() => {
    if (!token || !isInstructor) return;

    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const data = await apiGetInstructorCourses(token);
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [token, isInstructor]);

  // Load students for selected course
  useEffect(() => {
    if (!token || !isInstructor || !selectedCourseId) return;

    const loadStudents = async () => {
      try {
        setLoading(true);
        const data = await apiGetInstructorCourseStudents(
          selectedCourseId,
          token,
        );
        setStudents(data);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [token, isInstructor, selectedCourseId]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-red-600">You must be logged in.</p>
      </div>
    );
  }

  if (!isInstructor) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-red-600">
          Only instructors and admins can view enrolled students.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">
            View students enrolled in your courses and track their progress.
          </p>
        </div>
      </div>

      {/* Course selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <label
              htmlFor="course-selector"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select course
            </label>
            {loadingCourses ? (
              <p className="text-xs text-gray-500">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="text-xs text-gray-500">
                You have not created any courses yet.
              </p>
            ) : (
              <select
                id="course-selector"
                value={selectedCourseId ?? ''}
                onChange={(e) =>
                  setSelectedCourseId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Students table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Enrolled students
              </h2>
              <p className="text-xs text-gray-500">
                {students.length} student{students.length === 1 ? '' : 's'} in
                this course
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-gray-500">
            No students enrolled in this course yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Student ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Progress
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">
                    Completed Lessons
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-gray-900">
                      #{s.user_id}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {Math.round(s.progress)}%
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {s.completed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};