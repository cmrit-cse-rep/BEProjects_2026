import mongoose, { Schema, Model } from 'mongoose';

export interface IActivity {
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  cost: string;
  category: string;
}

export interface IDay {
  day: number;
  date: string;
  activities: IActivity[];
  totalCost: string;
  notes: string;
}

export interface IItinerary {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  destination: string;
  totalDays: number;
  budget: string;
  interests: string[];
  days: IDay[];
  summary: {
    totalEstimatedCost: string;
    highlights: string[];
    tips: string[];
  };
  collaborators: mongoose.Types.ObjectId[];
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ActivitySchema = new Schema<IActivity>({
  time: String,
  title: String,
  description: String,
  location: String,
  duration: String,
  cost: String,
  category: String,
}, { _id: false });

const DaySchema = new Schema<IDay>({
  day: Number,
  date: String,
  activities: [ActivitySchema],
  totalCost: String,
  notes: String,
}, { _id: false });

const ItinerarySchema = new Schema<IItinerary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    budget: {
      type: String,
      required: true,
    },
    interests: [String],
    days: [DaySchema],
    summary: {
      totalEstimatedCost: String,
      highlights: [String],
      tips: [String],
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Itinerary: Model<IItinerary> = mongoose.models.Itinerary || mongoose.model<IItinerary>('Itinerary', ItinerarySchema);

export default Itinerary;

