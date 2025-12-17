import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { useAuth } from './store/auth';

// Import pages
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CoursesPage } from './pages/Courses';
import { ProfilePage } from './pages/Profile';
import { SettingsPage } from './pages/Settings';
import { ARLearningPage } from './pages/ARLearning';
import { ProgressPage } from './pages/Progress';
import { AchievementsPage } from './pages/Achievements';
import { SchedulePage } from './pages/Schedule';
import { MyCoursesPage } from './pages/MyCourses';
import { MLPredictionPage } from './pages/MLPredictionPage';
import { CourseDetail } from './pages/CourseDetail';
import { CreateCoursePage } from './pages/CreateCoursePage';
import { CreateLessonPage } from './pages/CreateLessonPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCoursesPage } from './pages/AdminCoursesPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminModelsPage } from './pages/AdminModelsPage';
import { StudentsPage } from './pages/Students';
import { AnalyticsPage } from './pages/Analytics';

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, hasHydrated } = useAuth();

  if (!hasHydrated || isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasHydrated } = useAuth();

  if (!hasHydrated) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const InstructorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'instructor' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};


function App() {
  const { hasHydrated, setHasHydrated } = useAuth();

  useEffect(() => {
    if (!hasHydrated) {
      const timer = setTimeout(() => {
        setHasHydrated(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated, setHasHydrated]);

  if (!hasHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Layout showSidebar={false}>
                  <LoginPage />
                </Layout>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Layout showSidebar={false}>
                  <RegisterPage />
                </Layout>
              </PublicRoute>
            }
          />

          {/* Protected Routes - Base Navigation */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Layout>
                  <CoursesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ar-learning"
            element={
              <ProtectedRoute>
                <Layout>
                  <ARLearningPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ml-predict"
            element={
              <ProtectedRoute>
                <Layout>
                  <MLPredictionPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProgressPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <Layout>
                  <AchievementsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <Layout>
                  <SchedulePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Instructor Routes */}
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyCoursesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateCoursePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses/:courseId/lessons/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateLessonPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Account Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Course Detail (protected, needs layout) */}
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CourseDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminUsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminCoursesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminAnalyticsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-models"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminModelsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
  path="/my-courses"
  element={
    <ProtectedRoute>
      <InstructorRoute>
        <Layout>
          <MyCoursesPage />
        </Layout>
      </InstructorRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/students"
  element={
    <ProtectedRoute>
      <InstructorRoute>
        <Layout>
          <StudentsPage />
        </Layout>
      </InstructorRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <InstructorRoute>
        <Layout>
          <AnalyticsPage />
        </Layout>
      </InstructorRoute>
    </ProtectedRoute>
  }
/>


          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <Layout showSidebar={false}>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      404
                    </h1>
                    <p className="text-gray-600 mb-8">Page not found</p>
                    <button
                      onClick={() => window.history.back()}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </Layout>
            }
          />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
