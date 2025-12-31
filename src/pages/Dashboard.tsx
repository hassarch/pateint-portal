import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mongodb } from '@/integrations/mongodb/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, Calendar, Clock, User, LogOut, Plus, 
  Stethoscope, Activity, CheckCircle, XCircle, AlertCircle,
  Settings
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  doctor: {
    full_name: string;
    specialty: string;
  };
}

interface Profile {
  full_name: string | null;
  email: string;
}

export default function Dashboard() {
  const { user, signOut, isAdmin, isDoctor, loading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && isDoctor) {
      navigate('/doctor-dashboard');
    } else if (!loading && isAdmin) {
      navigate('/admin');
    }
  }, [user, loading, isDoctor, isAdmin, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch profile
    const profileData = await mongodb.findOne<{ full_name: string | null; email: string }>(
      'profiles',
      { _id: user!.id }
    );
    
    if (profileData) {
      setProfile({
        full_name: profileData.full_name,
        email: profileData.email,
      });
    }

    // Fetch appointments
    const appointmentsData = await mongodb.find<{
      _id: string;
      appointment_date: string;
      appointment_time: string;
      reason: string;
      status: string;
      doctor_id: string;
    }>('appointments', { patient_id: user!.id });

    // Fetch doctor info for each appointment
    const appointmentsWithDoctors = await Promise.all(
      appointmentsData.map(async (apt) => {
        const doctor = await mongodb.findOne<{ full_name: string; specialty: string }>(
          'doctors',
          { _id: apt.doctor_id }
        );
        return {
          id: apt._id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          reason: apt.reason,
          status: apt.status,
          doctor: doctor || { full_name: 'Unknown Doctor', specialty: 'Unknown' },
        };
      })
    );

    // Sort by date
    appointmentsWithDoctors.sort((a, b) => 
      a.appointment_date.localeCompare(b.appointment_date)
    );
    
    setAppointments(appointmentsWithDoctors);
    
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
      scheduled: { variant: 'secondary', icon: Clock },
      confirmed: { variant: 'default', icon: CheckCircle },
      completed: { variant: 'outline', icon: CheckCircle },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const upcomingAppointments = appointments.filter(
    apt => apt.status !== 'cancelled' && apt.status !== 'completed' && 
    isAfter(parseISO(apt.appointment_date), new Date())
  );

  const pastAppointments = appointments.filter(
    apt => apt.status === 'completed' || !isAfter(parseISO(apt.appointment_date), new Date())
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen gradient-hero">
        <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </nav>
        <main className="container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero animate-fade-in">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 glass animate-slide-down">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 hover-lift transition-smooth">
            <div className="p-2 rounded-xl gradient-primary shadow-glow hover-glow animate-float">
              <Heart className="h-6 w-6 text-primary-foreground animate-pulse-soft" />
            </div>
            <span className="text-2xl font-bold gradient-text">MediCare</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate('/admin')} className="group">
                <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" onClick={handleSignOut} className="group">
              <LogOut className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name || 'Patient'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your appointments and health records in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover-lift hover-glow transition-smooth animate-slide-up glass" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 hover-scale transition-smooth">
                <Calendar className="h-6 w-6 text-primary animate-pulse-soft" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold gradient-text">{upcomingAppointments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover-lift hover-glow transition-smooth animate-slide-up glass" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10 hover-scale transition-smooth">
                <CheckCircle className="h-6 w-6 text-success animate-pulse-soft" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold gradient-text">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover-lift hover-glow transition-smooth animate-slide-up glass" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 hover-scale transition-smooth">
                <Activity className="h-6 w-6 text-accent animate-pulse-soft" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold gradient-text">{appointments.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Button onClick={() => navigate('/book')} variant="hero" size="lg" className="group">
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
            Book Appointment
          </Button>
          <Button onClick={() => navigate('/doctors')} variant="outline" size="lg" className="group">
            <Stethoscope className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            View Doctors
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-2xl font-bold text-foreground mb-4">Upcoming Appointments</h2>
          
          {upcomingAppointments.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="p-4 rounded-full bg-muted inline-block mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-4">
                  Schedule your next visit with one of our doctors.
                </p>
                <Button onClick={() => navigate('/book')} variant="hero">
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingAppointments.map((apt, index) => (
                <Card 
                  key={apt.id} 
                  className="border-0 shadow-lg hover-lift hover-glow transition-smooth animate-slide-up glass group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl gradient-primary hover-scale transition-smooth group-hover:shadow-glow">
                          <Stethoscope className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{apt.doctor.full_name}</h3>
                          <p className="text-muted-foreground">{apt.doctor.specialty}</p>
                          <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(apt.appointment_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {apt.appointment_time.slice(0, 5)}
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-2xl font-bold text-foreground mb-4">Past Appointments</h2>
            <div className="grid gap-4">
              {pastAppointments.slice(0, 5).map((apt) => (
                <Card key={apt.id} className="border-0 shadow-md opacity-80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{apt.doctor.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(apt.appointment_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
