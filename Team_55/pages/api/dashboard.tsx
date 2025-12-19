import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ItineraryCard from '@/components/ItineraryCard';
import { IItinerary } from '@/models/Itinerary';
import { FiPlus, FiSearch } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<IItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchItineraries();
    }
  }, [status]);

  const fetchItineraries = async () => {
    try {
      const res = await fetch('/api/itineraries');
      const data = await res.json();

      if (res.ok) {
        setItineraries(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch itineraries');
      }
    } catch (error: any) {
      toast.error('Failed to fetch itineraries');
    } finally {
      setLoading(false);
    }
  };

  const filteredItineraries = itineraries.filter((itinerary) =>
    itinerary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    itinerary.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Travel Itineraries
              </h1>
              <p className="text-gray-600">Manage and plan your trips</p>
            </div>

            {itineraries.length > 0 && (
              <div className="mb-6">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search itineraries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItineraries.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                {searchQuery ? (
                  <>
                    <p className="text-gray-600 mb-4">No itineraries found matching your search.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <p className="text-gray-600 mb-6 text-lg">You haven't created any itineraries yet.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItineraries.map((itinerary) => (
                  <ItineraryCard key={itinerary._id} itinerary={itinerary} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

