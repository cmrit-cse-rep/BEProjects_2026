import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const CreateLessonPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    if (!token) {
      setError('You must be logged in as an instructor or admin to create a lesson.');
      return;
    }
    if (!courseId) {
      setError('Missing course ID in route.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/courses/${courseId}/lessons`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            type: 'video',
            duration_minutes: 0,
            content: '',
            video_url: videoUrl || null,
            order: 1,
            is_published: true,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Lesson creation failed');
      }

      setSuccess('Lesson created successfully!');
      setTitle('');
      setDescription('');
      setVideoUrl('');
    } catch (err: any) {
      setError(
        typeof err?.message === 'string'
          ? err.message
          : 'Lesson creation failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Lesson</h1>
      {courseId && (
        <p className="text-sm text-gray-500 mb-1">
          For course ID: <span className="font-mono">{courseId}</span>
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 mb-1">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 mb-1">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lesson Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lesson Title
          </label>
          <input
            type="text"
            className="block w-full p-2 border border-gray-300 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="E.g. Cardiovascular System Overview"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            className="block w-full p-2 border border-gray-300 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Topics covered, learning objectives, etc."
            rows={3}
          />
        </div>

        {/* Video URL (YouTube Embed) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lesson Video (YouTube embed URL)
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
                title="Lesson Video"
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
          {loading ? 'Creating...' : 'Create Lesson'}
        </button>
      </form>
    </div>
  );
};
