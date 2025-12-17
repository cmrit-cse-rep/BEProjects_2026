import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Box,
  User,
  Trophy,
  BarChart3,
  Settings,
  Users,
  FileText,
  Brain,
  Calendar,
  ActivitySquare
} from 'lucide-react';
import { cn } from '../../utils';
import { useAuth, useIsStudent, useIsInstructor, useIsAdmin } from '../../store/auth';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student', 'instructor', 'admin'] },
  { name: 'Courses', href: '/courses', icon: BookOpen, roles: ['student', 'instructor', 'admin'] },
  { name: 'AR Learning', href: '/ar-learning', icon: Box, roles: ['student'] },
  { name: 'ML Prediction', href: '/ml-predict', icon: ActivitySquare, roles: ['student', 'instructor', 'admin'] },
];

const studentNavigation = [
  { name: 'My Progress', href: '/progress', icon: BarChart3 },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
];

const instructorNavigation = [
  { name: 'My Courses', href: '/my-courses', icon: FileText },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Course Management', href: '/admin/courses', icon: BookOpen },
  { name: 'System Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'AI Models', href: '/admin/ai-models', icon: Brain },
];

const commonNavigation = [
  { name: 'Profile', href: '/profile', icon: User, roles: ['student', 'instructor', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['student', 'instructor', 'admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isStudent = useIsStudent();
  const isInstructor = useIsInstructor();
  const isAdmin = useIsAdmin();

  if (!user) return null;

  const filteredBaseNavigation = baseNavigation.filter(item => 
    item.roles.includes(user.role)
  );

  const getRoleSpecificNavigation = () => {
    if (isStudent) return studentNavigation;
    if (isInstructor) return instructorNavigation;
    if (isAdmin) return adminNavigation;
    return [];
  };

  const roleSpecificNav = getRoleSpecificNavigation();

  return (
    <div className={className}>
      <div className="flex flex-col h-full pt-16">
        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-medical-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Progress Bar for Students */}
          {isStudent && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Overall Progress</span>
                <span>75%</span> {/* Ideally dynamic */}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-medical-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '75%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Base Navigation */}
          <div>
            <ul className="space-y-1">
              {filteredBaseNavigation.map(item => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-primary-50 to-medical-50 text-primary-700 border-r-2 border-primary-600 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 mr-3 transition-colors',
                          isActive ? 'text-primary-600' : 'text-gray-400'
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Role-Specific Navigation */}
          {roleSpecificNav.length > 0 && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {isStudent && 'Learning'}
                {isInstructor && 'Teaching'}
                {isAdmin && 'Administration'}
              </h3>
              <ul className="space-y-1">
                {roleSpecificNav.map(item => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-primary-50 to-medical-50 text-primary-700 border-r-2 border-primary-600 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-5 w-5 mr-3 transition-colors',
                            isActive ? 'text-primary-600' : 'text-gray-400'
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Common Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Account
            </h3>
            <ul className="space-y-1">
              {commonNavigation.map(item => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-primary-50 to-medical-50 text-primary-700 border-r-2 border-primary-600 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 mr-3 transition-colors',
                          isActive ? 'text-primary-600' : 'text-gray-400'
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <p className="text-xs text-gray-500">MedAR Learn v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};
