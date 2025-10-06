'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoginButton } from './login-button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Bus, Shield, Users, Clock } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Test bypass for Playwright/E2E tests
  if (typeof window !== 'undefined') {
    const isTestEnv = window.location.hostname === 'localhost' && (
      localStorage.getItem('test-auth-bypass') === 'true' ||
      sessionStorage.getItem('test-auth-bypass') === 'true' ||
      window.location.search.includes('test=true')
    )

    if (isTestEnv) {
      return <>{children}</>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 dark:from-blue-50 dark:via-white dark:to-indigo-50">
        <div className="w-full max-w-4xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding & Features */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <Bus className="h-12 w-12 text-blue-600 dark:text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-900">MovieFlix</h1>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-600">
                Find and book movie tickets at theaters near you
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center lg:items-start space-y-2">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-50 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-900">Secure Booking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-600 text-center lg:text-left">
                  Safe and encrypted transactions
                </p>
              </div>

              <div className="flex flex-col items-center lg:items-start space-y-2">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-900">Real-time Updates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-600 text-center lg:text-left">
                  Live seat availability and schedules
                </p>
              </div>

              <div className="flex flex-col items-center lg:items-start space-y-2">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-900">Trusted by Thousands</h3>
                <p className="text-sm text-gray-600 dark:text-gray-600 text-center lg:text-left">
                  Join our community of movie enthusiasts
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Sign in Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-900">Welcome Back</h2>
                <p className="text-gray-600 dark:text-gray-600">
                  Sign in to access your booking dashboard and manage your movie plans
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-600 mb-4">
                      Continue with your Google account for a seamless experience
                    </p>
                    <LoginButton />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-200">
                  <div className="text-center text-xs text-gray-500 dark:text-gray-500 space-y-1">
                    <p>By signing in, you agree to our Terms of Service</p>
                    <p>and Privacy Policy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}