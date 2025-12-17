import React, { useState } from 'react';
import { useAuth } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const CreateCoursePage: React.FC = () => {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessons, setLessons] = useState<string[]>([]);
  const [lessonInput, setLessonInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLesson = () => {
    if (lessonInput.trim()) {
      setLessons((prev) => [...prev, lessonInput.trim()]);
      setLessonInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in as an instructor or admin to create a course.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1) Create the course
      const courseResp = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          short_description: description.slice(0, 120) || title,
          description,
          thumbnail: null,
          duration_minutes: 0,
          level: 'beginner',
          category: 'General',
          has_ar: true,
          price: 0,
        }),
      });

      if (!courseResp.ok) {
        const text = await courseResp.text();
        throw new Error(text || 'Failed to create course');
      }

      const createdCourse = await courseResp.json();
      const courseId: number = createdCourse.id;

      // 2) Create simple lessons (only titles + optional first video URL)
      for (let i = 0; i < lessons.length; i++) {
        const lessonTitle = lessons[i];

        await fetch(`${API_BASE_URL}/api/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: lessonTitle,
            description: '',
            type: 'video',
            duration_minutes: 0,
            content: '',
            video_url: i === 0 && videoUrl ? videoUrl : null,
            order: i + 1,
            is_published: true,
          }),
        });
      }

      alert('Course created successfully!');
      setTitle('');
      setDescription('');
      setLessons([]);
      setVideoUrl('');
    } catch (err: any) {
      setError(
        typeof err?.message === 'string'
          ? err.message
          : 'Failed to create course. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Course</h1>
      {user && (
        <p className="text-sm text-gray-500 mb-2">
          Creating as: <span className="font-semibold">{user.name}</span> ({user.role})
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 mb-2">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
          <input
            type="text"
            className="block w-full p-2 border border-gray-300 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="E.g. Human Anatomy Fundamentals"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="block w-full p-2 border border-gray-300 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Course objectives, topics, and outcomes"
            rows={3}
          />
        </div>

        {/* Add lessons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lessons</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded"
              value={lessonInput}
              onChange={(e) => setLessonInput(e.target.value)}
              placeholder="Lesson title"
            />
            <button
              type="button"
              className="bg-primary-600 text-white px-4 py-1 rounded disabled:opacity-50"
              onClick={addLesson}
              disabled={!lessonInput.trim()}
            >
              Add
            </button>
          </div>
          {lessons.length > 0 && (
            <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
              {lessons.map((lesson, idx) => (
                <li key={idx}>{lesson}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Upload/Embed Video (for first lesson demo) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Demo Video (YouTube embed URL for first lesson)
          </label>
          <input
            type="text"
            className="block w-full p-2 border border-gray-300 rounded"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/embed/xyz"
          />
          {videoUrl && (
            <div className="aspect-video bg-gray-200 rounded mt-3 overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={videoUrl}
                title="Demo Course Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-primary-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-700 transition w-full disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </form>
    </div>
  );
};
