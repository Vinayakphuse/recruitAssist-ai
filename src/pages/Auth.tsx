import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  
  const { user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        }
      } else {
        const { error } = await signUpWithEmail(email, password, name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! You can now sign in.");
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error("Failed to sign in with Google");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] relative overflow-hidden flex-col justify-between p-12">
        {/* Logo */}
        <div className="relative z-10">
          <Logo size="lg" />
        </div>

        {/* Center Illustration Area */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md">
            {/* Main Monitor/Dashboard Mockup */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="bg-white/90 rounded-xl p-4 space-y-3">
                {/* Video call header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded w-24"></div>
                    <div className="h-2 bg-muted/60 rounded w-16 mt-1"></div>
                  </div>
                </div>
                {/* Chat bubbles */}
                <div className="space-y-2">
                  <div className="bg-primary/10 rounded-lg p-2 w-3/4">
                    <div className="h-2 bg-primary/30 rounded w-full"></div>
                  </div>
                  <div className="bg-muted rounded-lg p-2 w-2/3 ml-auto">
                    <div className="h-2 bg-muted-foreground/30 rounded w-full"></div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-2 w-1/2">
                    <div className="h-2 bg-primary/30 rounded w-full"></div>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex justify-center gap-2 pt-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/40"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-destructive/60"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/40"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chat bubbles */}
            <div className="absolute -top-4 -right-4 bg-white/90 rounded-xl p-3 shadow-lg border border-white/50 animate-float">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20"></div>
                <div className="h-2 bg-muted rounded w-16"></div>
              </div>
            </div>
            <div className="absolute -bottom-2 -left-4 bg-white/90 rounded-xl p-3 shadow-lg border border-white/50" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20"></div>
                <div className="h-2 bg-muted rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-3">
            AI-Powered Interviews
          </h1>
          <p className="text-white/80 text-base max-w-md leading-relaxed">
            Automate your hiring process with intelligent voice interviews. 
            Save time, reduce bias, and find the best candidates faster.
          </p>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-40 left-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="lg:hidden flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {isLogin 
                ? "Sign in to access your dashboard" 
                : "Start your free trial with 3 interviews"}
            </p>
          </div>

          {/* Google Sign In */}
          <Button 
            variant="outline" 
            className="w-full h-12 gap-3 border-border hover:bg-muted/50 font-medium"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 border-border focus:border-primary"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-border focus:border-primary"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-border focus:border-primary"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-medium rounded-lg shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;