import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Stethoscope,
  Activity,
  Brain,
  CheckCircle2,
  Users,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { Button } from '../components/shared/Button';
import type { LoginCredentials } from '../types';
import logoSrc from '../assets/augmented-reality.png';
import bgVideo from '../assets/bgvideo.mp4';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: {}
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    const success = await login(data);
    if (success) {
      toast.success('Welcome back to MedAR!');
      navigate('/dashboard');
    } else {
      toast.error(error || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = (email: string, role: string) => {
    setValue('email', email);
    setValue('password', 'demo123');
    setSelectedDemo(role);
    toast.success(`${role} credentials applied!`);
  };

  const demoAccounts = [
    {
      role: 'Student',
      email: 'demo@medar.com',
      icon: <GraduationCap className="w-5 h-5" />,
      description: 'AR modules & tracking',
    },
    {
      role: 'Instructor',
      email: 'instructor@medar.com',
      icon: <Users className="w-5 h-5" />,
      description: 'Analytics & oversight',
    },
    {
      role: 'Admin',
      email: 'admin@medar.com',
      icon: <ShieldCheck className="w-5 h-5" />,
      description: 'System control',
    }
  ];

  return (
    // Outer container: Full screen, hidden overflow to prevent scrollbars
    <div className="flex h-screen w-full overflow-hidden bg-white">
      
      {/* LEFT SIDE: Video Background & Branding */}
      {/* Hidden on mobile, takes up 50% width on large screens */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
        {/* Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-[#0f2e2b]/80 to-black/60 z-10" />
        
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
        />

        <div className="relative z-20 px-16 max-w-2xl">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md py-2 px-4 rounded-full border border-white/10 mb-6">
              <Stethoscope className="w-5 h-5 text-[#2BB5AB]" />
              <span className="text-sm font-semibold tracking-wide uppercase text-white">Next-Gen Medical Training</span>
            </div>
            
            <h1 className="text-5xl font-extrabold leading-tight mb-6 text-white">
              Master Medicine in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2BB5AB] to-emerald-400">
                Augmented Reality
              </span>
            </h1>
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Experience the future of healthcare education. Practice complex procedures and track proficiency in a risk-free environment.
            </p>

            <div className="space-y-4">
              {[
                { icon: Brain, text: "AI-Powered anatomical guidance" },
                { icon: Activity, text: "Real-time performance analytics" },
                { icon: CheckCircle2, text: "Accredited simulation modules" }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-gray-200">
                  <div className="p-1.5 bg-[#2BB5AB]/20 rounded-lg text-[#2BB5AB]">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      {/* Full width on mobile, 50% on desktop. Clean white background. */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-white overflow-y-auto h-full">
        <div className="w-full max-w-md mx-auto px-6 py-8 lg:px-12">
            
            {/* Logo area - Visible on Mobile and Desktop for branding continuity */}
            <div className="flex items-center gap-2 mb-8">
               <img src={logoSrc} alt="MedAR Logo" className="h-8 w-8" />
               <span className="text-xl font-bold text-gray-900">MedAR</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-2">Sign in to access your dashboard</p>
            </div>

            {/* Demo Section - Compacted */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Quick Access (Demo)
              </p>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoLogin(acc.email, acc.role)}
                    className={`flex items-center p-3 rounded-lg border transition-all duration-200 group text-left ${
                      selectedDemo === acc.role
                        ? 'border-[#2BB5AB] bg-[#2BB5AB]/5 ring-1 ring-[#2BB5AB]'
                        : 'border-gray-200 hover:border-[#2BB5AB]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-md mr-3 ${
                      selectedDemo === acc.role ? 'bg-[#2BB5AB] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {acc.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{acc.role}</p>
                      <p className="text-[10px] text-gray-500 leading-tight">{acc.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  {...register('email', { required: 'Email is required' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#2BB5AB] focus:ring-2 focus:ring-[#2BB5AB]/20 outline-none transition-all"
                  placeholder="name@hospital.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <Link to="#" className="text-xs font-medium text-[#2BB5AB] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required' })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#2BB5AB] focus:ring-2 focus:ring-[#2BB5AB]/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full py-3 bg-[#2BB5AB] hover:bg-[#259c93] text-white font-bold rounded-lg shadow-md transition-all mt-2"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                New to MedAR?{' '}
                <Link to="/register" className="font-bold text-[#2BB5AB] hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};