import React, { useState } from 'react';
import { X, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { AuthService } from '../services/AuthService';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const AuthModal = ({ onClose, onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const authService = AuthService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (mode === 'signup' && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      let user;
      if (mode === 'signin') {
        user = await authService.signIn(email, password);
        setSuccess('Successfully signed in!');
      } else {
        user = await authService.signUp(email, password);
        setSuccess('Account created successfully! Please check your email for verification.');
      }

      setTimeout(() => {
        onSuccess(user);
        onClose();
      }, 1500);

    } catch (err: any) {
      let errorMessage = err.message || 'An error occurred';
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
        if (mode === 'signin') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again, or create a new account if you don\'t have one yet.';
        }
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead or use a different email address.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate__animated animate__slideInDown">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {mode === 'signin' ? (
              <LogIn size={24} className="text-purple-600" />
            ) : (
              <UserPlus size={24} className="text-purple-600" />
            )}
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'signin' ? 'Admin Sign In' : 'Create Admin Account'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate__animated animate__fadeIn">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate__animated animate__fadeIn">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Info Message for Sign In */}
          {mode === 'signin' && !error && !success && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-700 text-sm">
                <p className="font-medium mb-1">First time here?</p>
                <p>If you don't have an admin account yet, click "Create one" below to get started.</p>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              placeholder="admin@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
            )}
          </div>

          {/* Confirm Password Field (Sign Up only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Confirm your password"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              </div>
            ) : (
              <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          {/* Mode Toggle */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              {mode === 'signin' ? "Don't have an admin account?" : "Already have an account?"}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-1 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                disabled={isLoading}
              >
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Info */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-xs">
              <strong>Note:</strong> Admin access is required to add, edit, or delete books. 
              Regular users can still read and interact with existing books without signing in.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;