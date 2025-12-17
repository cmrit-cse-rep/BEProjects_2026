import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, Video, Target, Plus, Filter } from 'lucide-react';
import { useAuth } from '../store/auth';

interface ScheduleItem {
  id: string;
  title: string;
  type: 'course' | 'ar-session' | 'quiz' | 'assignment';
  startTime: string;
  endTime: string;
  date: string;
  instructor?: string;
  location?: string;
  description?: string;
  status: 'upcoming' | 'completed' | 'missed';
}

export const SchedulePage: React.FC = () => {
  const {} = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  const scheduleItems: ScheduleItem[] = [
    {
      id: '1',
      title: 'Heart Anatomy - Advanced Concepts',
      type: 'course',
      startTime: '09:00',
      endTime: '10:30',
      date: '2024-08-12',
      instructor: 'Dr. Sarah Johnson',
      location: 'Virtual Classroom',
      description: 'Deep dive into cardiac chambers and valve functions',
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'AR Heart Model Exploration',
      type: 'ar-session',
      startTime: '11:00',
      endTime: '12:00',
      date: '2024-08-12',
      instructor: 'Dr. Sarah Johnson',
      location: 'AR Lab',
      description: 'Interactive 3D exploration of heart structures',
      status: 'upcoming'
    },
    {
      id: '3',
      title: 'Cardiovascular System Quiz',
      type: 'quiz',
      startTime: '14:00',
      endTime: '14:30',
      date: '2024-08-12',
      description: 'Assessment on heart anatomy and physiology',
      status: 'upcoming'
    },
    {
      id: '4',
      title: 'Respiratory System Basics',
      type: 'course',
      startTime: '10:00',
      endTime: '11:30',
      date: '2024-08-13',
      instructor: 'Dr. Michael Chen',
      location: 'Virtual Classroom',
      description: 'Introduction to lung anatomy and breathing mechanisms',
      status: 'upcoming'
    },
    {
      id: '5',
      title: 'Nervous System Assignment',
      type: 'assignment',
      startTime: '00:00',
      endTime: '23:59',
      date: '2024-08-15',
      description: 'Research paper on neural pathways - Due by end of day',
      status: 'upcoming'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'ar-session': return <Target className="w-4 h-4" />;
      case 'quiz': return <Clock className="w-4 h-4" />;
      case 'assignment': return <Video className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ar-session': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'quiz': return 'bg-green-100 text-green-700 border-green-200';
      case 'assignment': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'missed': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const todayItems = scheduleItems.filter(item => item.date === selectedDate);
  const upcomingItems = scheduleItems
    .filter(item => new Date(item.date) >= new Date())
    .sort((a, b) => new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600">Manage your learning schedule and upcoming sessions</p>
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex space-x-2">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                viewMode === mode
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <input
                type="date"
                aria-label='schedule'
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {todayItems.length > 0 ? (
              <div className="space-y-4">
                {todayItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(item.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg border ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{item.startTime} - {item.endTime}</span>
                            </div>
                            {item.instructor && (
                              <span>by {item.instructor}</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          {item.location && (
                            <p className="text-xs text-gray-500">{item.location}</p>
                          )}
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No events scheduled for this day</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Courses</span>
                </div>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">AR Sessions</span>
                </div>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Quizzes</span>
                </div>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Assignments</span>
                </div>
                <span className="font-medium">2</span>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
            <div className="space-y-3">
              {upcomingItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1 rounded ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString()} at {item.startTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Streak */}
          <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8" />
              <div>
                <p className="text-2xl font-bold">15</p>
                <p className="text-green-100">Day Streak</p>
              </div>
            </div>
            <p className="text-sm text-green-100 mt-2">
              Keep it up! You're on a great learning streak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
