import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [course, setCourse] = useState<BackendCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load course details
  useEffect(() => {
    const fetchCourse = async () => {
      if (!token) {
        setError('You must be logged in to view this course.');
        setLoading(false);
        return;
      }
      if (!id) {
        setError('Invalid course ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Failed to load course');
        }

        const data = (await response.json()) as BackendCourse;
        setCourse(data);
      } catch (err: any) {
        setError(
          typeof err?.message === 'string'
            ? err.message
            : 'Failed to load course',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, token]);

  const handleEnroll = async () => {
    if (!token || !id) return;

    try {
      setEnrolling(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/courses/${id}/enroll`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Enrollment failed');
      }

      // Mark as enrolled locally
      setCourse((prev) =>
        prev ? { ...prev, is_enrolled: true, progress: 0 } : prev,
      );

      // Optionally navigate to My Courses or keep user here
      // navigate('/my-courses');
    } catch (err: any) {
      setError(
        typeof err?.message === 'string'
          ? err.message
          : 'Enrollment failed',
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-gray-600">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600 text-sm">
          {error || 'Course not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {course.title}
      </h1>
      <p className="text-md text-gray-600 mb-2">
        {course.short_description}
      </p>
      <p className="text-sm text-gray-700 mb-2">{course.description}</p>

      {/* Placeholder video or thumbnail */}
      <div className="aspect-video bg-gray-200 rounded-lg mb-6 overflow-hidden shadow">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/h8KXzlTnHjs"
          title={course.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>

      {/* Enrollment section */}
      <div className="mt-6 flex justify-end">
        {course.is_enrolled ? (
          <button
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-medium cursor-default"
            disabled
          >
            Enrolled · Progress {course.progress.toFixed(0)}%
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="bg-primary-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-60"
          >
            {enrolling ? 'Enrolling...' : 'Enroll'}
          </button>
        )}
      </div>
    </div>
  );
};
