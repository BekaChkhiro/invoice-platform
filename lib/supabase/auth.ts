import { createClient } from './client'
import type { AuthError, User, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface AuthResponse {
  success: boolean
  user?: User
  session?: Session
  error?: AuthError | Error
  message?: string
}

export interface RegisterData {
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ProfileData {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  phone?: string | null
}

export class AuthService {
  private supabase = createClient()

  /**
   * Register a new user without automatic sign-in
   * User must confirm email before they can sign in
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting registration for:', data.email)
      
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          // Important: Don't auto-confirm user
          data: {
            email_confirm: false
          }
        }
      })

      if (error) {
        console.error('❌ Registration error:', error)
        return {
          success: false,
          error,
          message: this.getErrorMessage(error)
        }
      }

      if (!authData.user) {
        console.error('❌ Registration failed: No user data returned')
        return {
          success: false,
          error: new Error('Registration failed: No user data returned'),
          message: 'რეგისტრაცია ვერ მოხერხდა'
        }
      }

      console.log('✅ Registration successful:', {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at,
        hasSession: !!authData.session
      })

      // Important: Even if session exists, we don't want to auto-login
      // The user must confirm their email first
      if (authData.session) {
        console.log('⚠️ Session exists but logging out to prevent auto-login')
        await this.supabase.auth.signOut()
      }

      return {
        success: true,
        user: authData.user,
        message: 'რეგისტრაცია წარმატებულია! შეამოწმეთ ელ.ფოსტა დასასტურებლად.'
      }

    } catch (error) {
      console.error('❌ Registration exception:', error)
      return {
        success: false,
        error: error as Error,
        message: 'რეგისტრაცია ვერ მოხერხდა'
      }
    }
  }

  /**
   * Sign in user with email and password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting login for:', data.email)

      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        console.error('❌ Login error:', error)
        return {
          success: false,
          error,
          message: this.getErrorMessage(error)
        }
      }

      if (!authData.user || !authData.session) {
        console.error('❌ Login failed: No user or session data')
        return {
          success: false,
          error: new Error('Login failed: No user or session data'),
          message: 'შესვლა ვერ მოხერხდა'
        }
      }

      console.log('✅ Login successful:', {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at
      })

      return {
        success: true,
        user: authData.user,
        session: authData.session,
        message: 'წარმატებით შეხვედით სისტემაში'
      }

    } catch (error) {
      console.error('❌ Login exception:', error)
      return {
        success: false,
        error: error as Error,
        message: 'შესვლა ვერ მოხერხდა'
      }
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting logout')

      const { error } = await this.supabase.auth.signOut()

      if (error) {
        console.error('❌ Logout error:', error)
        return {
          success: false,
          error,
          message: 'გასვლა ვერ მოხერხდა'
        }
      }

      console.log('✅ Logout successful')

      return {
        success: true,
        message: 'წარმატებით გახვედით სისტემიდან'
      }

    } catch (error) {
      console.error('❌ Logout exception:', error)
      return {
        success: false,
        error: error as Error,
        message: 'გასვლა ვერ მოხერხდა'
      }
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting password reset for:', email)

      const redirectUrl = `${window.location.origin}/auth/reset-password`

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) {
        console.error('❌ Password reset error:', error)
        return {
          success: false,
          error,
          message: this.getErrorMessage(error)
        }
      }

      console.log('✅ Password reset email sent')

      return {
        success: true,
        message: 'პაროლის აღდგენის ბმული გამოგზავნილია ელ.ფოსტაზე'
      }

    } catch (error) {
      console.error('❌ Password reset exception:', error)
      return {
        success: false,
        error: error as Error,
        message: 'პაროლის აღდგენა ვერ მოხერხდა'
      }
    }
  }

  /**
   * Verify reset password code
   */
  async verifyResetCode(code: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Verifying reset code using exchangeCodeForSession')

      // Exchange the code for a session (same as auth callback)
      const { data, error } = await this.supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('❌ Code exchange error:', error)
        return {
          success: false,
          error,
          message: this.getErrorMessage(error)
        }
      }

      if (!data.user || !data.session) {
        console.error('❌ No user or session after code exchange')
        return {
          success: false,
          error: new Error('No user or session after code exchange'),
          message: 'კოდის შემოწმება ვერ მოხერხდა'
        }
      }

      console.log('✅ Code verified and session established')

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: 'კოდი წარმატებით დადასტურდა'
      }

    } catch (error) {
      console.error('❌ Code verification exception:', error)
      return {
        success: false,
        error: error as Error,
        message: 'კოდის შემოწმება ვერ მოხერხდა'
      }
    }
  }

  /**
   * Update password with reset code
   */
  async updatePassword(code: string, newPassword: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting password update with code')

      // First verify the code and get session
      const verifyResult = await this.verifyResetCode(code)
      
      if (!verifyResult.success) {
        return verifyResult
      }

      // Now update the password
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ Password update error:', error)
        return {
          success: false,
          error,
          message: this.getErrorMessage(error)
        }
      }

      console.log('✅ Password updated successfully')

      return {
        success: true,
        user: data.user,
        message: 'პაროლი წარმატებით განახლდა'
      }

    } catch (error) {
      console.error('❌ Password update exception:', error)
      return {
        success: false,
        error: error as Error,
        message: 'პაროლის განახლება ვერ მოხერხდა'
      }
    }
  }

  /**
   * Update password for authenticated user
   */
  async updateUserPassword(newPassword: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting password update for authenticated user')

      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ Password update error:', error)
        return {
          success: false,
          error,
          message: this.getErrorMessage(error)
        }
      }

      console.log('✅ Password updated successfully')

      return {
        success: true,
        user: data.user,
        message: 'პაროლი წარმატებით განახლდა'
      }

    } catch (error) {
      console.error('❌ Password update exception:', error)
      return {
        success: false,
        error: error as Error,
        message: 'პაროლის განახლება ვერ მოხერხდა'
      }
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('❌ Get current user error:', error)
      return null
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('❌ Get current session error:', error)
      return null
    }
  }

  /**
   * Create user profile after email confirmation
   */
  async createUserProfile(user: User): Promise<boolean> {
    try {
      console.log('👤 Creating profile for user:', user.id)

      // Check if profile already exists
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        console.log('👤 Profile already exists, skipping creation')
        return true
      }

      // Create profile
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
        return false
      }

      // Create user credits (5 free credits)
      const { error: creditsError } = await this.supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          total_credits: 5,
          used_credits: 0,
          plan_type: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (creditsError) {
        console.error('❌ Error creating user credits:', creditsError)
        return false
      }

      console.log('✅ Profile and credits created successfully')
      return true

    } catch (error) {
      console.error('❌ Create profile exception:', error)
      return false
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, !!session)
      callback(event, session)
    })
  }

  /**
   * Convert Supabase auth errors to user-friendly Georgian messages
   */
  private getErrorMessage(error: AuthError): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'არასწორი ელ.ფოსტა ან პაროლი',
      'Email not confirmed': 'ელ.ფოსტა არ არის დადასტურებული',
      'User already registered': 'მომხმარებელი უკვე რეგისტრირებულია',
      'Password should be at least 6 characters': 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო',
      'Signup requires a valid password': 'საჭიროა ვალიდური პაროლი',
      'Only an email address is allowed': 'მხოლოდ ელ.ფოსტის მისამართი არის დაშვებული',
      'Unable to validate email address: empty email': 'ელ.ფოსტის მისამართი ცარიელია',
      'Signups not allowed for this instance': 'რეგისტრაცია არ არის დაშვებული',
      'User not found': 'მომხმარებელი ვერ მოიძებნა',
      'Email address is invalid': 'ელ.ფოსტის მისამართი არასწორია'
    }

    return errorMessages[error.message] || error.message || 'უცნობი შეცდომა'
  }
}

// Export singleton instance
export const authService = new AuthService()