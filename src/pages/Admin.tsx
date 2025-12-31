import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mongodb } from '@/integrations/mongodb/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Heart, ArrowLeft, Users, Stethoscope, Calendar, 
  Plus, Edit, Trash2, CheckCircle, XCircle, Clock,
  Search, Shield, LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface Doctor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specialty: string;
  bio: string | null;
  years_experience: number;
  consultation_fee: number;
  is_active: boolean;
  user_id: string | null;
  _id?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  notes: string | null;
  patient: { full_name: string | null; email: string };
  doctor: { full_name: string; specialty: string };
  _id?: string;
}

interface Patient {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  _id?: string;
}

const SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'General Practice', 'Neurology', 'Oncology', 'Ophthalmology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology'
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Doctor form state
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    bio: '',
    years_experience: 0,
    consultation_fee: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access the admin panel.',
      });
      navigate('/dashboard');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch doctors
    const doctorsData = await mongodb.find<{
      _id: string;
      full_name: string;
      email: string;
      phone: string | null;
      specialty: string;
      bio: string | null;
      years_experience: number;
      consultation_fee: number;
      is_active: boolean;
      user_id: string | null;
    }>('doctors', {});
    
    const formattedDoctors = doctorsData
      .map(doc => ({
        id: doc._id,
        full_name: doc.full_name,
        email: doc.email,
        phone: doc.phone,
        specialty: doc.specialty,
        bio: doc.bio,
        years_experience: doc.years_experience || 0,
        consultation_fee: doc.consultation_fee || 0,
        is_active: doc.is_active,
        user_id: doc.user_id,
      }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    
    setDoctors(formattedDoctors);

    // Fetch appointments
    const appointmentsData = await mongodb.find<{
      _id: string;
      appointment_date: string;
      appointment_time: string;
      reason: string;
      status: string;
      notes: string | null;
      patient_id: string;
      doctor_id: string;
    }>('appointments', {});

    // Sort by date descending and limit to 100
    const sortedAppointments = appointmentsData
      .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
      .slice(0, 100);

    // Fetch doctor and patient info for each appointment
    const appointmentsWithRelations = await Promise.all(
      sortedAppointments.map(async (apt) => {
        const [doctor, patient] = await Promise.all([
          mongodb.findOne<{ full_name: string; specialty: string }>('doctors', { _id: apt.doctor_id }),
          mongodb.findOne<{ full_name: string | null; email: string }>('profiles', { _id: apt.patient_id }),
        ]);

        return {
          id: apt._id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          reason: apt.reason,
          status: apt.status,
          notes: apt.notes,
          patient: patient || { full_name: null, email: 'Unknown' },
          doctor: doctor || { full_name: 'Unknown Doctor', specialty: 'Unknown' },
        };
      })
    );
    
    setAppointments(appointmentsWithRelations);

    // Fetch patients (profiles)
    const patientsData = await mongodb.find<{
      _id: string;
      full_name: string | null;
      email: string;
      phone: string | null;
      created_at: string;
    }>('profiles', {});

    const formattedPatients = patientsData
      .map(p => ({
        id: p._id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        created_at: p.created_at,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    
    setPatients(formattedPatients);
    
    setIsLoading(false);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDoctor) {
      // Update existing doctor
      const { password, ...updateData } = doctorForm;
      const success = await mongodb.updateOne(
        'doctors',
        { _id: editingDoctor.id },
        updateData
      );
      
      if (!success) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update doctor.' });
      } else {
        toast({ title: 'Success', description: 'Doctor updated successfully.' });
        setDoctorDialogOpen(false);
        fetchData();
      }
    } else {
      // Create new doctor
      if (doctorForm.password.length < 6) {
        toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters.' });
        return;
      }

      toast({ title: 'Creating...', description: 'Setting up doctor account...' });

      try {
        // Create user account
        const userId = crypto.randomUUID();
        await mongodb.insertOne('users', {
          _id: userId,
          email: doctorForm.email,
          password: doctorForm.password, // In production, hash this
          full_name: doctorForm.full_name,
          role: 'doctor',
          created_at: new Date().toISOString(),
        });

        // Create doctor record
        await mongodb.insertOne('doctors', {
          _id: crypto.randomUUID(),
          email: doctorForm.email,
          full_name: doctorForm.full_name,
          phone: doctorForm.phone,
          specialty: doctorForm.specialty,
          bio: doctorForm.bio,
          years_experience: doctorForm.years_experience,
          consultation_fee: doctorForm.consultation_fee,
          is_active: true,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Create user role
        await mongodb.insertOne('user_roles', {
          _id: crypto.randomUUID(),
          user_id: userId,
          role: 'doctor',
          created_at: new Date().toISOString(),
        });

        toast({ title: 'Success', description: 'Doctor account created successfully. They can now log in.' });
        setDoctorDialogOpen(false);
        fetchData();
      } catch (error) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: error instanceof Error ? error.message : 'Failed to create doctor account.' 
        });
      }
    }
    
    resetDoctorForm();
  };

  const resetDoctorForm = () => {
    setEditingDoctor(null);
    setDoctorForm({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      specialty: '',
      bio: '',
      years_experience: 0,
      consultation_fee: 0,
    });
  };

  const editDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      full_name: doctor.full_name,
      email: doctor.email,
      password: '',
      phone: doctor.phone || '',
      specialty: doctor.specialty,
      bio: doctor.bio || '',
      years_experience: doctor.years_experience,
      consultation_fee: doctor.consultation_fee,
    });
    setDoctorDialogOpen(true);
  };

  const toggleDoctorStatus = async (doctor: Doctor) => {
    const success = await mongodb.updateOne(
      'doctors',
      { _id: doctor.id },
      { is_active: !doctor.is_active }
    );
    
    if (!success) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update doctor status.' });
    } else {
      fetchData();
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const success = await mongodb.updateOne(
      'appointments',
      { _id: id },
      { status }
    );
    
    if (!success) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update appointment status.' });
    } else {
      toast({ title: 'Success', description: 'Appointment status updated.' });
      fetchData();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
      navigate('/');
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to logout. Please try again.' 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
      scheduled: { variant: 'secondary', icon: Clock },
      confirmed: { variant: 'default', icon: CheckCircle },
      completed: { variant: 'outline', icon: CheckCircle },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    const config = configs[status] || configs.scheduled;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary shadow-md">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Admin Panel</span>
          </div>
          
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="doctors" className="animate-fade-up">
          <TabsList className="mb-6">
            <TabsTrigger value="doctors" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Doctors ({doctors.length})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="h-4 w-4" />
              Appointments ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              Patients ({patients.length})
            </TabsTrigger>
          </TabsList>

          {/* Doctors Tab */}
          <TabsContent value="doctors">
            <div className="flex justify-between items-center mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={doctorDialogOpen} onOpenChange={(open) => {
                setDoctorDialogOpen(open);
                if (!open) resetDoctorForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doctor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to {editingDoctor ? 'update' : 'add'} a doctor.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDoctorSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={doctorForm.full_name}
                        onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={doctorForm.email}
                        onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                        required
                      />
                    </div>
                    {!editingDoctor && (
                      <div className="space-y-2">
                        <Label>Password (for doctor login)</Label>
                        <Input
                          type="password"
                          value={doctorForm.password}
                          onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                          required={!editingDoctor}
                          placeholder="Min 6 characters"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={doctorForm.phone}
                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Select
                        value={doctorForm.specialty}
                        onValueChange={(value) => setDoctorForm({ ...doctorForm, specialty: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALTIES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Experience (years)</Label>
                        <Input
                          type="number"
                          value={doctorForm.years_experience}
                          onChange={(e) => setDoctorForm({ ...doctorForm, years_experience: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Consultation Fee</Label>
                        <Input
                          type="number"
                          value={doctorForm.consultation_fee}
                          onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        value={doctorForm.bio}
                        onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button type="submit" variant="hero" className="w-full">
                      {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {doctors
                .filter(d => 
                  d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((doctor) => (
                <Card key={doctor.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${doctor.is_active ? 'gradient-primary' : 'bg-muted'}`}>
                          <Stethoscope className={`h-6 w-6 ${doctor.is_active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                          <p className="text-muted-foreground">{doctor.specialty}</p>
                          <p className="text-sm text-muted-foreground">
                            {doctor.email} • {doctor.years_experience} years • ${doctor.consultation_fee}/visit
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doctor.user_id && (
                          <Badge variant="outline" className="text-xs">
                            Has Login
                          </Badge>
                        )}
                        <Badge variant={doctor.is_active ? 'default' : 'secondary'}>
                          {doctor.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => editDoctor(doctor)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleDoctorStatus(doctor)}
                        >
                          {doctor.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <div className="grid gap-4">
              {appointments.map((apt) => (
                <Card key={apt.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {apt.patient.full_name || apt.patient.email}
                          </h3>
                          <p className="text-muted-foreground">
                            with Dr. {apt.doctor.full_name} ({apt.doctor.specialty})
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(parseISO(apt.appointment_date), 'MMM dd, yyyy')} at {apt.appointment_time.slice(0, 5)}
                          </p>
                          <p className="text-sm mt-1">{apt.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(apt.status)}
                        <Select
                          value={apt.status}
                          onValueChange={(value) => updateAppointmentStatus(apt.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients">
            <div className="relative max-w-sm mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid gap-4">
              {patients
                .filter(p => 
                  (p.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                  p.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((patient) => (
                <Card key={patient.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{patient.full_name || 'No name'}</h3>
                        <p className="text-muted-foreground">{patient.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {format(parseISO(patient.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
