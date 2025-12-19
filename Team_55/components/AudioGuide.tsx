import { useState, useEffect, useRef } from 'react';
import { FiVolume2, FiPause, FiPlay } from 'react-icons/fi';
import { IItinerary, IDay, IActivity } from '@/models/Itinerary';
import { formatCostToINR } from '@/lib/currencyUtils';

interface AudioGuideProps {
  itinerary: IItinerary;
}

export default function AudioGuide({ itinerary }: AudioGuideProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;
    } else {
      setIsSupported(false);
    }

    // Cleanup on unmount
    return () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const generateAudioText = (): string => {
    let text = `Welcome to your travel itinerary for ${itinerary.destination}. `;
    text += `This is a ${itinerary.totalDays} day trip with a budget of ${formatCostToINR(itinerary.budget)}. `;
    
    if (itinerary.interests && itinerary.interests.length > 0) {
      text += `Your interests include: ${itinerary.interests.join(', ')}. `;
    }

    if (itinerary.summary && itinerary.summary.highlights && itinerary.summary.highlights.length > 0) {
      text += `Trip highlights: ${itinerary.summary.highlights.join('. ')}. `;
    }

    text += `Let's begin your journey. `;

    if (itinerary.days && itinerary.days.length > 0) {
      itinerary.days.forEach((day: IDay, dayIndex: number) => {
        text += `Day ${day.day || dayIndex + 1}. `;
        
        if (day.activities && day.activities.length > 0) {
          day.activities.forEach((activity: IActivity, activityIndex: number) => {
            text += `At ${activity.time}, ${activity.title}. `;
            if (activity.location) {
              text += `Location: ${activity.location}. `;
            }
            if (activity.description) {
              text += `${activity.description}. `;
            }
            if (activity.duration) {
              text += `Duration: ${activity.duration}. `;
            }
            if (activity.cost) {
              text += `Cost: ${formatCostToINR(activity.cost)}. `;
            }
          });
        }
        
        if (day.totalCost) {
          text += `Total cost for the day: ${formatCostToINR(day.totalCost)}. `;
        }
        
        if (day.notes) {
          text += `Notes: ${day.notes}. `;
        }
      });
    }

    if (itinerary.summary && itinerary.summary.tips && itinerary.summary.tips.length > 0) {
      text += `Important tips for your trip: ${itinerary.summary.tips.join('. ')}. `;
    }

    text += `Thank you for using our travel planner. Have a wonderful trip!`;
    
    return text;
  };

  const handlePlay = () => {
    if (!isSupported) {
      alert('Your browser does not support text-to-speech. Please use a modern browser like Chrome, Edge, or Safari.');
      return;
    }

    if (!synthRef.current) return;

    setIsLoading(true);

    if (isPaused && utteranceRef.current) {
      // Resume playback
      synthRef.current.resume();
      setIsPlaying(true);
      setIsPaused(false);
      setIsLoading(false);
      return;
    }

    // Generate text from itinerary
    const textToSpeak = generateAudioText();

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsLoading(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentIndex(0);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      alert('Error playing audio guide. Please try again.');
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handlePause = () => {
    if (!synthRef.current) return;

    if (synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Audio guide is not supported in your browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 rounded-full p-3">
            <FiVolume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Audio Guide</h3>
            <p className="text-sm text-gray-600">Listen to your itinerary</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isPlaying && !isPaused && (
            <button
              onClick={handlePlay}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <FiPlay className="w-5 h-5" />
                  <span>Play Guide</span>
                </>
              )}
            </button>
          )}

          {isPlaying && (
            <button
              onClick={handlePause}
              className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-all shadow-lg"
            >
              <FiPause className="w-5 h-5" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <>
              <button
                onClick={handlePlay}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-lg"
              >
                <FiPlay className="w-5 h-5" />
                <span>Resume</span>
              </button>
              <button
                onClick={handleStop}
                className="flex items-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg"
              >
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isPlaying && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-gray-600">Playing audio guide...</span>
          </div>
        </div>
      )}

      {isPaused && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-gray-600">Audio guide paused</p>
        </div>
      )}
    </div>
  );
}

