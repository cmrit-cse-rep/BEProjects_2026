import { ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHome, FiUser, FiLogOut, FiPlus, FiDollarSign } from 'react-icons/fi';
import CurrencyConverterModal from '@/components/CurrencyConverterModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  // Check if we're on an itinerary page
  const isItineraryPage = router.pathname.startsWith('/itineraries/');

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ✈️ Smart Tourism Planner
              </span>
            </Link>

            {status === 'loading' ? (
              <div className="animate-pulse text-gray-600">Loading...</div>
            ) : session ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg transition-colors text-gray-700 ${
                    router.pathname === '/dashboard' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <FiHome className="w-5 h-5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  href="/create"
                  className="flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-md font-medium"
                >
                  <FiPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Create Plan</span>
                  <span className="sm:hidden">Create</span>
                </Link>
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg transition-all font-semibold shadow-sm ${
                    router.pathname === '/profile' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-blue-400 shadow-md' 
                      : 'bg-blue-500 text-white hover:bg-blue-600 border border-blue-400 hover:shadow-md'
                  }`}
                  title={session.user?.name ? `View Profile - ${session.user.name}` : "View Profile"}
                >
                  <FiUser className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden md:inline max-w-[120px] truncate">{session.user?.name || 'Profile'}</span>
                  <span className="md:hidden">Profile</span>
                </Link>
                {isItineraryPage && (
                  <button
                    onClick={() => setIsCurrencyModalOpen(true)}
                    className="flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-medium"
                    title="Currency Converter"
                  >
                    <FiDollarSign className="w-5 h-5" />
                    <span className="hidden sm:inline">Currency</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200 hover:border-red-300"
                  title="Sign Out"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main>{children}</main>
      
      {/* Currency Converter Modal - Only shown on itinerary pages */}
      {isItineraryPage && (
        <CurrencyConverterModal
          isOpen={isCurrencyModalOpen}
          onClose={() => setIsCurrencyModalOpen(false)}
          baseCurrency="INR"
        />
      )}
    </div>
  );
}

