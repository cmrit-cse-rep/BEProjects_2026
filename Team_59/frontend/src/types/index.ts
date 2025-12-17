import * as THREE from 'three';

// =============================================
// Core User Types
// =============================================
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  enrolledCourses: string[];
  progress: Record<string, number>; // courseId -> progress percentage
  achievements: Achievement[];
  createdAt: Date;
  lastLogin?: Date;
}

// =============================================
// Authentication Types
// =============================================
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}

// =============================================
// Course Management Types
// =============================================
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  instructor: string;
  instructorId: string;
  thumbnail: string;
  duration: number; // in minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  lessons: Lesson[];
  enrollmentCount: number;
  rating: number;
  totalRatings: number;
  tags: string[];
  hasAR: boolean;
  arModels: ARModel[];
  price: number;
  isEnrolled?: boolean;
  progress?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: 'video' | 'ar' | 'quiz' | 'reading' | 'interactive';
  duration: number; // in minutes
  content: string;
  videoUrl?: string;
  arModelId?: string;
  quizQuestions?: QuizQuestion[];
  completed?: boolean;
  order: number;
  prerequisites?: string[]; // lesson IDs
  resources?: LessonResource[];
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video' | 'image';
  url: string;
  description?: string;
}

// =============================================
// AR/WebXR Types
// =============================================
export interface ARModel {
  id: string;
  name: string;
  filePath: string;
  description: string;
  annotations: Annotation[];
  category: 'anatomy' | 'pathology' | 'equipment' | 'procedure';
  scale: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  metadata: ARModelMetadata;
}

export interface ARModelMetadata {
  fileSize: number;
  polygonCount: number;
  textureCount: number;
  animationCount: number;
  materials: string[];
  tags: string[];
}

export interface Annotation {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
  type: 'info' | 'quiz' | 'interaction' | 'warning';
  content?: string;
  mediaUrl?: string;
  quizQuestion?: QuizQuestion;
  interactionType?: 'click' | 'hover' | 'voice';
}

// =============================================
// Assessment Types
// =============================================
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  timeLimit?: number; // in seconds
  mediaUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'performance' | 'streak' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
  unlockedAt?: Date;
  progress?: number;
}

export interface AchievementRequirement {
  type: 'course_completion' | 'quiz_score' | 'ar_sessions' | 'streak_days';
  value: number;
  courseId?: string;
  category?: string;
}

// =============================================
// AI Assistant Types
// =============================================
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'image' | 'code' | 'quiz_suggestion';
  metadata?: Record<string, any>;
}

// =============================================
// Component Props Types
// =============================================
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// =============================================
// API Response Types
// =============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =============================================
// Global Declarations
// =============================================
declare global {
  namespace THREE {
    const REVISION: string;
  }
}

// =============================================
// Enhanced Annotation Types
// =============================================
export interface HeartAnnotation {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
  detailedInfo?: string;
  type: 'chamber' | 'valve' | 'vessel' | 'muscle';
  color: string;
  medicalTerms?: string[];            // optional if not all annotations have it
  functions?: string[];               // optional if not all annotations have it
  clinicalSignificance?: string;      // add this
  relatedStructures?: string[];       // add this if you use it in data/UI
}


export interface AnnotationState {
  selectedId: string | null;
  hoveredId: string | null;
  showAllLabels: boolean;
  annotationLevel: 'basic' | 'intermediate' | 'advanced';
}

// =============================================
// Additional Utility Types
// =============================================
export type AnnotationLevel = 'basic' | 'intermediate' | 'advanced';

// Progress tracking
export interface AnnotationProgress {
  userId: string;
  annotationId: string;
  visited: boolean;
  timeSpent: number;
  lastVisited: Date;
  quizScore?: number;
}

// Model information for Three.js
export interface ModelInfo {
  boundingBox: THREE.Box3;
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  materialCount: number;
  hasAnimations: boolean;
  animationNames: string[];
  fileSize?: number;
}

// Module interfaces
export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

