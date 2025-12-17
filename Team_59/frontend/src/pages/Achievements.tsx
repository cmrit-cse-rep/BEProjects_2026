import React, { useState } from 'react';
import { Award, Trophy, Star, Target, Calendar, BookOpen, Zap, Heart } from 'lucide-react';
import { useAuth } from '../store/auth';
import type { Achievement } from '../types';

export const AchievementsPage: React.FC = () => {
  const { } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'completion' | 'performance' | 'streak' | 'special'>('all');

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'Heart Expert',
      description: 'Complete all heart anatomy lessons with 90% or higher',
      icon: 'heart',
      category: 'completion',
      points: 100,
      rarity: 'epic',
      requirements: [{ type: 'course_completion', value: 1, courseId: 'heart-anatomy' }],
      unlockedAt: new Date('2024-08-10'),
      progress: 100
    },
    {
      id: '2',
      title: 'AR Pioneer',
      description: 'Complete 50 AR learning sessions',
      icon: 'target',
      category: 'performance',
      points: 150,
      rarity: 'legendary',
      requirements: [{ type: 'ar_sessions', value: 50 }],
      unlockedAt: new Date('2024-08-05'),
      progress: 100
    },
    {
      id: '3',
      title: 'Quiz Master',
      description: 'Score 95% or higher on 10 consecutive quizzes',
      icon: 'star',
      category: 'performance',
      points: 120,
      rarity: 'rare',
      requirements: [{ type: 'quiz_score', value: 95 }],
      unlockedAt: new Date('2024-07-28'),
      progress: 100
    },
    {
      id: '4',
      title: 'Study Streak',
      description: 'Study for 30 consecutive days',
      icon: 'calendar',
      category: 'streak',
      points: 80,
      rarity: 'rare',
      requirements: [{ type: 'streak_days', value: 30 }],
      unlockedAt: new Date('2024-07-15'),
      progress: 100
    },
    {
      id: '5',
      title: 'Knowledge Seeker',
      description: 'Complete your first course',
      icon: 'book',
      category: 'completion',
      points: 50,
      rarity: 'common',
      requirements: [{ type: 'course_completion', value: 1 }],
      unlockedAt: new Date('2024-06-20'),
      progress: 100
    },
    {
      id: '6',
      title: 'Speed Learner',
      description: 'Complete 5 lessons in under 2 hours',
      icon: 'zap',
      category: 'performance',
      points: 75,
      rarity: 'rare',
      requirements: [{ type: 'course_completion', value: 5 }],
      progress: 60
    }
  ];

  const categories = [
    { key: 'all' as const, label: 'All', icon: Award },
    { key: 'completion' as const, label: 'Completion', icon: BookOpen },
    { key: 'performance' as const, label: 'Performance', icon: Star },
    { key: 'streak' as const, label: 'Streak', icon: Calendar },
    { key: 'special' as const, label: 'Special', icon: Trophy }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? mockAchievements 
    : mockAchievements.filter(achievement => achievement.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart': return <Heart className="w-8 h-8" />;
      case 'target': return <Target className="w-8 h-8" />;
      case 'star': return <Star className="w-8 h-8" />;
      case 'calendar': return <Calendar className="w-8 h-8" />;
      case 'book': return <BookOpen className="w-8 h-8" />;
      case 'zap': return <Zap className="w-8 h-8" />;
      default: return <Award className="w-8 h-8" />;
    }
  };

  const totalPoints = mockAchievements
    .filter(a => (a.progress ?? 0) === 100) // Fix: Default progress to 0
    .reduce((sum, a) => sum + a.points, 0);

  const unlockedCount = mockAchievements.filter(a => (a.progress ?? 0) === 100).length; // Fix: Default progress to 0
  const totalCount = mockAchievements.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
        <p className="text-gray-600">Celebrate your learning milestones and accomplishments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{unlockedCount}</p>
              <p className="text-yellow-100">Achievements Unlocked</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <Star className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{totalPoints}</p>
              <p className="text-purple-100">Total Points</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</p>
              <p className="text-green-100">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                selectedCategory === category.key
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <category.icon className="w-4 h-4" />
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-6 rounded-lg border-2 transition-all duration-300 ${
              (achievement.progress ?? 0) === 100
                ? `${getRarityColor(achievement.rarity)} hover:shadow-lg`
                : 'border-gray-200 bg-gray-50 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                (achievement.progress ?? 0) === 100
                  ? getRarityTextColor(achievement.rarity)
                  : 'text-gray-400'
              }`}>
                {getIcon(achievement.icon)}
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  achievement.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                  achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                  achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-700' :
                  'bg-yellow-200 text-yellow-700'
                }`}>
                  {achievement.rarity}
                </span>
              </div>
            </div>

            <h3 className={`text-lg font-semibold mb-2 ${
              (achievement.progress ?? 0) === 100 ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {achievement.title}
            </h3>

            <p className={`text-sm mb-4 ${
              (achievement.progress ?? 0) === 100 ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {achievement.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className={`w-4 h-4 ${
                  (achievement.progress ?? 0) === 100 ? 'text-yellow-500' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  (achievement.progress ?? 0) === 100 ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {achievement.points} points
                </span>
              </div>

              {achievement.unlockedAt && (
                <span className="text-xs text-gray-500">
                  {achievement.unlockedAt.toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Progress Bar for Incomplete Achievements */}
            {/* Fix: Default progress to 0 to avoid undefined error */}
            {(achievement.progress ?? 0) < 100 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${achievement.progress ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
          <p className="text-gray-600">Start learning to unlock your first achievement!</p>
        </div>
      )}
    </div>
  );
};