import Link from 'next/link';
import { IItinerary } from '@/models/Itinerary';
import { FiMapPin, FiCalendar, FiDollarSign, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import { formatCostToINR } from '@/lib/currencyUtils';

interface ItineraryCardProps {
  itinerary: IItinerary;
}

export default function ItineraryCard({ itinerary }: ItineraryCardProps) {
  return (
    <Link href={`/itineraries/${itinerary._id}`}>
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{itinerary.title}</h3>
            {itinerary.isPublic && (
              <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                Public
              </span>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center text-gray-600">
              <FiMapPin className="w-5 h-5 mr-2 text-blue-600" />
              <span className="text-sm">{itinerary.destination}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <FiCalendar className="w-5 h-5 mr-2 text-purple-600" />
              <span className="text-sm">{itinerary.totalDays} day{itinerary.totalDays > 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <FiDollarSign className="w-5 h-5 mr-2 text-green-600" />
              <span className="text-sm">Budget: {formatCostToINR(itinerary.budget)}</span>
            </div>

            {itinerary.collaborators && itinerary.collaborators.length > 0 && (
              <div className="flex items-center text-gray-600">
                <FiUsers className="w-5 h-5 mr-2 text-orange-600" />
                <span className="text-sm">
                  {itinerary.collaborators.length} collaborator{itinerary.collaborators.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {itinerary.interests && itinerary.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {itinerary.interests.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                >
                  {interest}
                </span>
              ))}
              {itinerary.interests.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium text-gray-500">
                  +{itinerary.interests.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {itinerary.createdAt && format(new Date(itinerary.createdAt), 'MMM dd, yyyy')}
              </span>
              <span className="text-blue-600 font-medium">View Details →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

