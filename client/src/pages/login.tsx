import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";
import { useLogin, useRegister, useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import kuznexLogo from "@assets/image_1770554564085.png";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-[bgFloat1_15s_ease-in-out_infinite]"
        style={{ background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(199 89% 48%))" }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] animate-[bgFloat2_18s_ease-in-out_infinite]"
        style={{ background: "linear-gradient(135deg, hsl(250 80% 60%), hsl(217 91% 60%))" }} />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[90px] animate-[bgFloat3_20s_ease-in-out_infinite]"
        style={{ background: "linear-gradient(135deg, hsl(199 89% 48%), hsl(172 66% 50%))" }} />
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative backdrop-blur-xl bg-card/70 border border-border/40 rounded-2xl shadow-2xl shadow-primary/5 ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const childFade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useAuth();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const fireConfetti = useCallback(() => {
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    confetti({ ...defaults, particleCount: 50, origin: { x: 0.3, y: 0.6 } });
    confetti({ ...defaults, particleCount: 50, origin: { x: 0.7, y: 0.6 } });
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 30, origin: { x: 0.5, y: 0.4 } });
    }, 200);
  }, []);

  if (user) {
    return null;
  }

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setSuccess(true);
        fireConfetti();
        setTimeout(() => setLocation("/dashboard"), 1200);
      },
      onError: (err: any) => {
        toast({ title: "Login failed", description: err.message, variant: "destructive" });
      },
    });
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setSuccess(true);
        fireConfetti();
        setTimeout(() => setLocation("/dashboard"), 1200);
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err.message, variant: "destructive" });
      },
    });
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setShowPassword(false);
    loginForm.reset();
    registerForm.reset();
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col relative">
      <style>{`
        @keyframes bgFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes bgFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(25px, -40px) scale(0.92); }
        }
        @keyframes bgFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          33% { transform: translate(-45%, -55%) scale(1.1); }
          66% { transform: translate(-55%, -45%) scale(0.9); }
        }
      `}</style>
      <AnimatedBackground />

      <nav className="relative z-10 border-b border-border/30 bg-background/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
              <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative flex-1 flex items-center justify-center p-4 py-12">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <GlassCard className="overflow-hidden">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  {...fadeSlide}
                  className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-foreground mb-2" data-testid="text-success-heading">
                    {isRegister ? "Account Created" : "Welcome Back"}
                  </h2>
                  <p className="text-sm text-muted-foreground" data-testid="text-success-message">
                    Redirecting to your dashboard...
                  </p>
                </motion.div>
              ) : (
                <motion.div key={isRegister ? "register" : "login"} {...fadeSlide}>
                  <div className="p-8 pb-0">
                    <motion.div
                      className="flex items-center gap-3 mb-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <img src={kuznexLogo} alt="" className="h-5 w-auto" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Kuznex Exchange</span>
                    </motion.div>
                    <motion.h1
                      className="text-2xl font-bold text-foreground mt-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      data-testid="text-login-heading"
                    >
                      {isRegister ? "Create your account" : "Welcome back"}
                    </motion.h1>
                    <motion.p
                      className="text-sm text-muted-foreground mt-1 mb-6"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isRegister
                        ? "Start trading crypto in minutes"
                        : "Sign in to access your portfolio"
                      }
                    </motion.p>
                  </div>

                  <div className="px-8 pb-8">
                    <AnimatePresence mode="wait">
                      {!isRegister ? (
                        <motion.div key="login-form" variants={stagger} initial="initial" animate="animate" exit="exit">
                          <Form {...loginForm}>
                            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                              <motion.div variants={childFade}>
                                <FormField
                                  control={loginForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</FormLabel>
                                      <FormControl>
                                        <div className="relative group">
                                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                          <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                                            data-testid="input-email"
                                            {...field}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>

                              <motion.div variants={childFade}>
                                <FormField
                                  control={loginForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</FormLabel>
                                      <FormControl>
                                        <div className="relative group">
                                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                          <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                                            data-testid="input-password"
                                            {...field}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            data-testid="button-toggle-password"
                                          >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </button>
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>

                              <motion.div variants={childFade} className="pt-2">
                                <Button
                                  type="submit"
                                  className="w-full h-11 text-sm font-semibold relative overflow-visible"
                                  disabled={isPending}
                                  data-testid="button-sign-in"
                                >
                                  {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <span className="flex items-center gap-2">
                                      Sign In
                                      <ArrowRight className="w-4 h-4" />
                                    </span>
                                  )}
                                </Button>
                              </motion.div>
                            </form>
                          </Form>
                        </motion.div>
                      ) : (
                        <motion.div key="register-form" variants={stagger} initial="initial" animate="animate" exit="exit">
                          <Form {...registerForm}>
                            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                              <motion.div variants={childFade}>
                                <FormField
                                  control={registerForm.control}
                                  name="username"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</FormLabel>
                                      <FormControl>
                                        <div className="relative group">
                                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                          <Input
                                            placeholder="Choose a username"
                                            className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                                            data-testid="input-username"
                                            {...field}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>

                              <motion.div variants={childFade}>
                                <FormField
                                  control={registerForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</FormLabel>
                                      <FormControl>
                                        <div className="relative group">
                                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                          <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                                            data-testid="input-reg-email"
                                            {...field}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>

                              <motion.div variants={childFade}>
                                <FormField
                                  control={registerForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</FormLabel>
                                      <FormControl>
                                        <div className="relative group">
                                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                          <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                                            data-testid="input-reg-password"
                                            {...field}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            data-testid="button-toggle-reg-password"
                                          >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </button>
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>

                              <motion.div variants={childFade} className="pt-2">
                                <Button
                                  type="submit"
                                  className="w-full h-11 text-sm font-semibold relative overflow-visible"
                                  disabled={isPending}
                                  data-testid="button-register"
                                >
                                  {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <span className="flex items-center gap-2">
                                      Create Account
                                      <ArrowRight className="w-4 h-4" />
                                    </span>
                                  )}
                                </Button>
                              </motion.div>
                            </form>
                          </Form>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <motion.p
                      className="text-center text-sm text-muted-foreground mt-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                      <button
                        onClick={toggleMode}
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                        data-testid="button-toggle-auth"
                      >
                        {isRegister ? "Sign in" : "Sign up"}
                      </button>
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          <motion.p
            className="text-center text-xs text-muted-foreground/60 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Protected by bank-grade encryption
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
