import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Calendar, Users, Shield, Clock, Star, ArrowRight, Stethoscope, Activity, Hexagon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Book appointments with just a few clicks. Choose your preferred doctor, date, and time.',
    },
    {
      icon: Users,
      title: 'Expert Doctors',
      description: 'Access our network of qualified healthcare professionals across multiple specialties.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is protected with enterprise-grade security and encryption.',
    },
    {
      icon: Clock,
      title: '24/7 Access',
      description: 'Manage your appointments anytime, anywhere from any device.',
    },
  ];

  const stats = [
    { value: '50+', label: 'Expert Doctors' },
    { value: '10k+', label: 'Happy Patients' },
    { value: '15+', label: 'Specialties' },
    { value: '98%', label: 'Satisfaction' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Geometric Background Pattern */}
      <div className="fixed inset-0 geometric-dots pointer-events-none opacity-30 animate-pulse-soft" />
      <div className="fixed inset-0 geometric-grid pointer-events-none opacity-10" />
      
      {/* Animated gradient orbs */}
      <div className="fixed top-0 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="fixed bottom-0 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '1s' }} />
      
      {/* Navigation */}
      <nav className="relative z-50 container mx-auto px-6 py-5 flex items-center justify-between border-b-2 border-border/50 glass backdrop-blur-md">
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="p-3 gradient-primary shadow-glow rounded-xl hover-scale transition-smooth animate-bounce-subtle">
            <Hexagon className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight gradient-text">MediCare</span>
        </div>
        
        <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <ThemeToggle />
          {user ? (
            <Button onClick={() => navigate('/dashboard')} variant="hero" className="group">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/auth')} className="font-semibold">
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')} variant="hero" className="group">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 backdrop-blur-sm text-primary text-sm font-bold mb-8 border-l-4 border-primary rounded-r-lg hover-lift transition-smooth animate-fade-in">
              <Star className="h-4 w-4 animate-pulse-soft" />
              Trusted by 10,000+ patients
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Your Health,
              <br />
              <span className="gradient-text animate-gradient-shift">Our Priority</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Experience healthcare the modern way. Book appointments with top doctors, 
              manage your health records, and take control of your wellness journey.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Button 
                onClick={() => navigate('/auth')} 
                variant="hero" 
                size="xl"
                className="shadow-glow group"
              >
                Book Appointment
                <Calendar className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={() => navigate('/doctors')}
                className="border-2 group"
              >
                View Doctors
                <Stethoscope className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-zoom-in" style={{ animationDelay: '0.4s' }}>
            {/* Enhanced Geometric decorative elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 border-4 border-primary/20 rounded-lg animate-geometric-rotate hover-glow transition-smooth" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-accent/10 border-2 border-accent/30 rounded-full animate-bounce-subtle" style={{ animationDelay: '0.5s' }} />
            
            <div className="relative group">
              {/* Main Card */}
              <Card className="shadow-xl border-2 border-border overflow-hidden hover-lift transition-smooth glass-strong">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm font-medium animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                      <div className="w-3 h-3 bg-success rounded-full animate-pulse-glow" />
                      <span>Expert Doctors Available</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                      <Clock className="h-4 w-4 animate-spin-slow" />
                      <span>Book appointments 24/7</span>
                    </div>
                    <div className="flex items-center gap-2 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                      {[1, 2, 3, 4, 5].map((star, i) => (
                        <Star 
                          key={star} 
                          className="h-4 w-4 fill-warning text-warning hover:scale-125 transition-transform" 
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2 font-medium">(10,000+ reviews)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Activity Card */}
              <Card className="absolute -bottom-8 -left-8 shadow-xl border-2 border-border animate-float hover-lift glass">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-success/10 border-2 border-success/30 rounded-lg hover-glow transition-smooth">
                    <Activity className="h-5 w-5 text-success animate-pulse-soft" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Appointments Today</p>
                    <p className="font-bold text-2xl gradient-text">24</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center p-6 border-2 border-border bg-card/50 backdrop-blur-sm rounded-xl hover-lift hover-glow transition-smooth animate-slide-up glass"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="text-4xl md:text-5xl font-bold gradient-text mb-2 animate-zoom-in" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                {stat.value}
              </p>
              <p className="text-muted-foreground font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Why Choose MediCare?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're committed to making healthcare accessible, convenient, and stress-free for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="border-2 border-border hover:border-primary transition-all duration-300 animate-slide-up group hover-lift glass hover-glow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="p-4 gradient-primary w-fit mb-4 rounded-xl group-hover:shadow-glow transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <feature.icon className="h-6 w-6 text-primary-foreground group-hover:animate-bounce-subtle" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative container mx-auto px-6 py-20 md:py-28">
        <Card className="gradient-primary border-0 overflow-hidden relative hover-lift transition-smooth animate-zoom-in shadow-xl">
          {/* Enhanced Geometric overlay */}
          <div className="absolute inset-0 geometric-grid opacity-10 animate-gradient-shift" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse-soft" />
          
          <CardContent className="relative p-10 md:p-16 text-center z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6 animate-fade-up">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Join thousands of patients who trust MediCare for their healthcare needs. 
              Sign up today and book your first appointment.
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              variant="secondary" 
              size="xl"
              className="shadow-lg font-bold group hover-scale"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border/50 bg-card/50 backdrop-blur-md glass">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
            <div className="flex items-center gap-4 hover-scale transition-smooth">
              <div className="p-3 gradient-primary rounded-lg shadow-glow">
                <Hexagon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">MediCare</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              © 2024 MediCare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}