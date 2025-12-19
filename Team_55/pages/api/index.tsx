import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Home() {
  const { status } = useSession();

  // Automatically sign out when page loads
  useEffect(() => {
    if (status === 'authenticated') {
      signOut({ redirect: false });
    }
  }, [status]);

  // Always show landing page
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ✈️ Plan Your Perfect Trip
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create detailed travel itineraries powered by AI
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/auth/signin"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg border-2 border-blue-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
