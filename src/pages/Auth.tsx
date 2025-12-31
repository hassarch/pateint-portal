import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Mail, Lock, User, ArrowLeft, Stethoscope, Shield, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

type PortalType = 'patient' | 'doctor';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [portalType, setPortalType] = useState<PortalType>('patient');
  
  const { signIn, signUp, user, role, isDoctor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role) {
      if (isAdmin) {
        navigate('/admin');
      } else if (isDoctor) {
        navigate('/doctor-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, isAdmin, isDoctor, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (portalType !== 'patient') {
      toast({
        variant: 'destructive',
        title: 'Signup Not Allowed',
        description: 'Doctor and Admin accounts are created by administrators only.',
      });
      return;
    }
    
    const validation = signupSchema.safeParse({ 
      email: signupEmail, 
      password: signupPassword, 
      fullName: signupFullName 
    });
    if (!validation.success) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          variant: 'destructive',
          title: 'Account Exists',
          description: 'An account with this email already exists. Please log in instead.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: error.message,
        });
      }
    } else {
      toast({
        title: 'Account Created!',
        description: 'Welcome to MediCare. You can now access your dashboard.',
      });
    }
  };

  const portalConfig = {
    patient: {
      icon: Users,
      title: 'Patient Portal',
      description: 'Book appointments and manage your health',
      color: 'bg-primary',
    },
    doctor: {
      icon: Stethoscope,
      title: 'Doctor Portal',
      description: 'View and manage your appointments',
      color: 'bg-accent',
    },
  };

  const CurrentIcon = portalConfig[portalType].icon;

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-xl gradient-primary shadow-lg">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold text-foreground">MediCare</span>
          </div>

          {/* Portal Type Selection */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(Object.keys(portalConfig) as PortalType[]).map((type) => {
              const config = portalConfig[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setPortalType(type)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    portalType === type 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${portalType === type ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-xs font-medium ${portalType === type ? 'text-primary' : 'text-muted-foreground'}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </p>
                </button>
              );
            })}
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="pb-4 text-center">
              <div className={`p-3 rounded-xl ${portalConfig[portalType].color} inline-block mx-auto mb-2`}>
                <CurrentIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>{portalConfig[portalType].title}</CardTitle>
              <CardDescription>{portalConfig[portalType].description}</CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" disabled={portalType !== 'patient'}>
                    Create Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      variant="hero"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  {portalType === 'patient' ? (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            value={signupFullName}
                            onChange={(e) => setSignupFullName(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        variant="hero"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Doctor and Admin accounts can only be created by system administrators.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>
    </div>
  );
}
