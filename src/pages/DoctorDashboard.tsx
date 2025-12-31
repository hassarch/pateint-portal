import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mongodb } from '@/integrations/mongodb/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, Calendar, Clock, LogOut, 
  Stethoscope, CheckCircle, XCircle, User,
  CalendarDays, Users, AlertCircle
} from 'lucide-react';
import { format, parseISO, isToday, isAfter, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  notes: string | null;
  patient: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
}

interface DoctorProfile {
  id: string;
  full_name: string;
  specialty: string;
  email: string;
}

export default function DoctorDashboard() {
  const { user, signOut, isDoctor, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && !isDoctor) {
      navigate('/dashboard');
    }
  }, [user, loading, isDoctor, navigate]);

  useEffect(() => {
    if (user && isDoctor) {
      fetchData();
    }
  }, [user, isDoctor]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch doctor profile
    const doctorData = await mongodb.findOne<{
      _id: string;
      full_name: string;
      specialty: string;
      email: string;
    }>('doctors', { user_id: user!.id });
    
    if (doctorData) {
      setDoctorProfile({
        id: doctorData._id,
        full_name: doctorData.full_name,
        specialty: doctorData.specialty,
        email: doctorData.email,
      });
      
      // Fetch appointments for this doctor
      const todayStr = format(startOfToday(), 'yyyy-MM-dd');
      const allAppointments = await mongodb.find<{
        _id: string;
        appointment_date: string;
        appointment_time: string;
        reason: string;
        status: string;
        notes: string | null;
        patient_id: string;
      }>('appointments', { doctor_id: doctorData._id });

      // Filter by date and fetch patient info
      const appointmentsWithPatients = await Promise.all(
        allAppointments
          .filter(apt => apt.appointment_date >= todayStr)
          .sort((a, b) => {
            const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
            if (dateCompare !== 0) return dateCompare;
            return a.appointment_time.localeCompare(b.appointment_time);
          })
          .map(async (apt) => {
            const patient = await mongodb.findOne<{
              full_name: string | null;
              email: string;
              phone: string | null;
            }>('profiles', { _id: apt.patient_id });

            return {
              id: apt._id,
              appointment_date: apt.appointment_date,
              appointment_time: apt.appointment_time,
              reason: apt.reason,
              status: apt.status,
              notes: apt.notes,
              patient: patient || { full_name: null, email: 'Unknown', phone: null },
            };
          })
      );
      
      setAppointments(appointmentsWithPatients);
    }
    
    setIsLoading(false);
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    const success = await mongodb.updateOne(
      'appointments',
      { _id: appointmentId },
      { status }
    );
    
    if (!success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update appointment status',
      });
    } else {
      toast({
        title: 'Success',
        description: `Appointment marked as ${status}`,
      });
      fetchData();
    }
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

  const todayAppointments = appointments.filter(apt => isToday(parseISO(apt.appointment_date)));
  const upcomingAppointments = appointments.filter(apt => 
    !isToday(parseISO(apt.appointment_date)) && isAfter(parseISO(apt.appointment_date), startOfToday())
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Heart className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary shadow-md">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">MediCare</span>
            <Badge variant="secondary">Doctor Portal</Badge>
          </div>
          
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, Dr. {doctorProfile?.full_name?.split(' ').slice(-1)[0] || 'Doctor'}!
          </h1>
          <p className="text-muted-foreground">
            {doctorProfile?.specialty} | {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total This Week</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments */}
        <section className="mb-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Today's Schedule
          </h2>
          
          {todayAppointments.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="p-4 rounded-full bg-muted inline-block mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No appointments today</h3>
                <p className="text-muted-foreground">
                  Enjoy your free day!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {todayAppointments.map((apt) => (
                <Card key={apt.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{apt.patient?.full_name || 'Patient'}</h3>
                          <p className="text-muted-foreground">{apt.patient?.email}</p>
                          <p className="text-sm mt-1"><strong>Reason:</strong> {apt.reason}</p>
                          {apt.notes && <p className="text-sm text-muted-foreground mt-1">Notes: {apt.notes}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                          <Clock className="h-5 w-5" />
                          {apt.appointment_time.slice(0, 5)}
                        </div>
                        {getStatusBadge(apt.status)}
                        {apt.status === 'scheduled' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                        {apt.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-accent" />
              Upcoming Appointments
            </h2>
            <div className="grid gap-4">
              {upcomingAppointments.map((apt) => (
                <Card key={apt.id} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{apt.patient?.full_name || 'Patient'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(apt.appointment_date), 'EEE, MMM dd')} at {apt.appointment_time.slice(0, 5)}
                          </p>
                          <p className="text-sm text-muted-foreground">{apt.reason}</p>
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
