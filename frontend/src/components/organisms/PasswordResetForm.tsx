'use client';

import type React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZodError, z } from 'zod';
import {
  Loader2,
  Mail,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '@/components/atoms/FormInput';
import { SixDigitCodeInput } from '@/components/molecules/SixDigitCodeInput';
import {
  requestPasswordResetCode,
  resetPassword,
  validateVerificationCode,
} from '@/services/passwordResetService';
import AxiosRequest from '@/services/axiosInspector';
import type { AxiosInstance } from 'axios';
import { getServerErrorMessage } from '@/lib/errorMsg';

// Keep the existing schemas
export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const verificationCodeSchema = z.object({
  code: z
    .string()
    .regex(
      /^[A-Za-z0-9]{6}$/,
      'Please enter a valid 6-digit verification code',
    ),
});

export const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type EmailFormData = z.infer<typeof emailSchema>;
export type VerificationCodeFormData = z.infer<typeof verificationCodeSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

type Step = 'email' | 'verification' | 'createPassword' | 'success' | 'error';

export function PasswordResetForm() {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordData, setPasswordData] = useState<NewPasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const { toast } = useToast();
  const navigate = useNavigate();
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;

  const validateEmail = (): boolean => {
    try {
      emailSchema.parse({ email });
      setEmailError('');
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        setEmailError(error.errors[0]?.message || 'Invalid email');
      }
      return false;
    }
  };

  const validateCode = (): boolean => {
    try {
      verificationCodeSchema.parse({ code: verificationCode });
      setCodeError('');
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        setCodeError(error.errors[0]?.message || 'Invalid verification code');
      }
      return false;
    }
  };

  const validatePasswords = (): boolean => {
    try {
      newPasswordSchema.parse(passwordData);
      setPasswordErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: { newPassword?: string; confirmPassword?: string } =
          {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof typeof newErrors] = err.message;
          }
        });
        setPasswordErrors(newErrors);
      }
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);

    requestPasswordResetCode(email, axiosInstance)
      .then(() => {
        setCurrentStep('verification');
        toast({
          variant: 'default',
          title: 'Verification Code Sent',
          description: `A verification code has been sent to ${email}. Please check your inbox.`,
        });
      })
      .catch((error) => {
        console.error('Error requesting password reset code:', error);
        setEmailError(getServerErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode()) return;

    setIsLoading(true);

    validateVerificationCode(email, verificationCode, axiosInstance)
      .then(() => {
        setCurrentStep('createPassword');
        toast({
          variant: 'default',
          title: 'Code Verified',
          description: 'You can now create a new password.',
        });
      })
      .catch((error) => {
        console.error('Error verifying code:', error);
        setCurrentStep('error');
        const errorMsg = getServerErrorMessage(error);
        setCodeError(errorMsg);
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: errorMsg,
        });
        setVerificationCode('');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setIsLoading(true);

    resetPassword(
      email,
      verificationCode,
      passwordData.newPassword,
      axiosInstance,
    )
      .then(() => {
        setCurrentStep('success');
        toast({
          variant: 'default',
          title: 'Password Reset Successful',
          description:
            'Your password has been reset successfully. You can now log in with your new password.',
        });
      })
      .catch((error) => {
        console.error('Error verifying code:', error);
        setCurrentStep('error');
        setCodeError('Invalid verification code. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description:
            'The verification code you entered is incorrect. Please try again.',
        });
        setVerificationCode('');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleTryAgain = () => {
    setVerificationCode('');
    setCodeError('');
    setCurrentStep('verification');
  };

  const handleStartOver = () => {
    setEmail('');
    setVerificationCode('');
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setEmailError('');
    setCodeError('');
    setPasswordErrors({});
    setCurrentStep('email');
  };

  const updatePasswordField =
    (field: keyof NewPasswordFormData) => (value: string) => {
      setPasswordData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (passwordErrors[field]) {
        setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'email':
        return <Mail className="h-6 w-6" />;
      case 'verification':
        return <Shield className="h-6 w-6" />;
      case 'createPassword':
        return <Lock className="h-6 w-6" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Mail className="h-6 w-6" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email':
        return 'Reset Your Password';
      case 'verification':
        return 'Verify Your Email';
      case 'createPassword':
        return 'Create New Password';
      case 'success':
        return 'Password Reset Complete';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Reset Your Password';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email':
        return "Enter your email address and we'll send you a verification code to reset your password.";
      case 'verification':
        return 'Please enter the 6-digit verification code sent to your email address.';
      case 'createPassword':
        return "Choose a strong password for your account. Make sure it's something you'll remember.";
      case 'success':
        return 'Your password has been successfully reset. You can now sign in with your new password.';
      case 'error':
        return 'The verification code you entered is incorrect. Please check your email and try again.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {getStepIcon()}
            Password Reset
            {isLoading && (
              <Badge className="bg-yellow-500 text-gray-900">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            Secure password recovery for your account
          </p>
        </div>

        {/* Progress Steps */}
        {!['success', 'error'].includes(currentStep) && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-2 ${currentStep === 'email' ? 'text-yellow-600' : currentStep === 'verification' || currentStep === 'createPassword' ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'email' ? 'bg-yellow-100 text-yellow-600' : currentStep === 'verification' || currentStep === 'createPassword' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    1
                  </div>
                  <span className="font-medium">Email</span>
                </div>
                <div
                  className={`flex-1 h-1 mx-4 rounded ${currentStep === 'verification' || currentStep === 'createPassword' ? 'bg-green-200' : 'bg-gray-200'}`}
                />
                <div
                  className={`flex items-center gap-2 ${currentStep === 'verification' ? 'text-yellow-600' : currentStep === 'createPassword' ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'verification' ? 'bg-yellow-100 text-yellow-600' : currentStep === 'createPassword' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    2
                  </div>
                  <span className="font-medium">Verify</span>
                </div>
                <div
                  className={`flex-1 h-1 mx-4 rounded ${currentStep === 'createPassword' ? 'bg-green-200' : 'bg-gray-200'}`}
                />
                <div
                  className={`flex items-center gap-2 ${currentStep === 'createPassword' ? 'text-yellow-600' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'createPassword' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    3
                  </div>
                  <span className="font-medium">Password</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getStepIcon()}
              {getStepTitle()}
            </CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {currentStep === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-500">
                        Email Verification
                      </h3>
                      <Separator className="my-4 border-gray-200 border-t-2" />
                    </div>
                    <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
                      <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <FormInput
                          label="Email Address"
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={setEmail}
                          error={emailError}
                          delay={0.2}
                          disabled={isLoading}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending Code...
                              </>
                            ) : (
                              'Send Verification Code'
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-500">
                        Code Verification
                      </h3>
                      <Separator className="my-4 border-gray-200 border-t-2" />
                    </div>
                    <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
                      <form onSubmit={handleCodeSubmit} className="space-y-6">
                        <SixDigitCodeInput
                          label="Verification Code"
                          value={verificationCode}
                          onChange={setVerificationCode}
                          error={codeError}
                          delay={0.2}
                          disabled={isLoading}
                        />
                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep('email')}
                            disabled={isLoading}
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                            disabled={
                              isLoading || verificationCode.length !== 6
                            }
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Verifying...
                              </>
                            ) : (
                              'Verify Code'
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'createPassword' && (
                <motion.div
                  key="createPassword"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-500">
                        New Password
                      </h3>
                      <Separator className="my-4 border-gray-200 border-t-2" />
                    </div>
                    <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
                      <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-6"
                      >
                        <FormInput
                          label="New Password"
                          id="newPassword"
                          type="password"
                          placeholder="Enter your new password"
                          value={passwordData.newPassword}
                          onChange={updatePasswordField('newPassword')}
                          error={passwordErrors.newPassword}
                          delay={0.2}
                          disabled={isLoading}
                        />
                        <FormInput
                          label="Confirm New Password"
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your new password"
                          value={passwordData.confirmPassword}
                          onChange={updatePasswordField('confirmPassword')}
                          error={passwordErrors.confirmPassword}
                          delay={0.4}
                          disabled={isLoading}
                        />
                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep('verification')}
                            disabled={isLoading}
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Resetting Password...
                              </>
                            ) : (
                              'Reset Password'
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="text-lg font-medium text-green-600">
                        Success
                      </h3>
                      <Separator className="my-4 border-gray-200 border-t-2" />
                    </div>
                    <div className="p-6 rounded-lg border-l-2 border-green-500 bg-green-50 text-center">
                      <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-green-800 mb-2">
                        Password Reset Complete!
                      </h3>
                      <p className="text-green-700 mb-6">
                        Your password has been successfully reset. You can now
                        sign in with your new password.
                      </p>
                      <Button
                        onClick={() => navigate('/login')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="text-lg font-medium text-red-600">
                        Error
                      </h3>
                      <Separator className="my-4 border-gray-200 border-t-2" />
                    </div>
                    <div className="p-6 rounded-lg border-l-2 border-red-500 bg-red-50 text-center">
                      <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-red-800 mb-2">
                        Verification Failed
                      </h3>
                      <p className="text-red-700 mb-6">
                        The verification code you entered is incorrect. Please
                        check your email and try again.
                      </p>
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={handleTryAgain}
                          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                        >
                          Try Again
                        </Button>
                        <Button onClick={handleStartOver} variant="outline">
                          Start Over
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
