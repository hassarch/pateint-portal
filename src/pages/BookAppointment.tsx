import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mongodb } from '@/integrations/mongodb/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Heart, ArrowLeft, Stethoscope, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isBefore, startOfDay } from 'date-fns';

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  consultation_fee: number;
  _id?: string;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const doctorId = searchParams.get('doctor');
    if (doctorId) {
      setSelectedDoctor(doctorId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    const doctorsData = await mongodb.find<{
      _id: string;
      full_name: string;
      specialty: string;
      consultation_fee: number;
      is_active: boolean;
    }>('doctors', { is_active: true });

    const formattedDoctors = doctorsData
      .map(doc => ({
        id: doc._id,
        full_name: doc.full_name,
        specialty: doc.specialty,
        consultation_fee: doc.consultation_fee || 0,
      }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    
    setDoctors(formattedDoctors);
  };

  const fetchBookedSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;
    
    const allAppointments = await mongodb.find<{ appointment_time: string; status: string }>(
      'appointments',
      {
        doctor_id: selectedDoctor,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      }
    );
    
    const appointments = allAppointments.filter(a => a.status !== 'cancelled');
    
    setBookedSlots(appointments.map(a => a.appointment_time.slice(0, 5)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setIsSubmitting(true);

    // Check if slot is already taken
    const allAppointments = await mongodb.find('appointments', {
      doctor_id: selectedDoctor,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      appointment_time: selectedTime + ':00',
    });
    
    const existingAppointment = allAppointments.find(a => a.status !== 'cancelled');

    if (existingAppointment) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'Time Slot Taken',
        description: 'This time slot has already been booked. Please choose another time.',
      });
      fetchBookedSlots();
      return;
    }

    const result = await mongodb.insertOne('appointments', {
      patient_id: user!.id,
      doctor_id: selectedDoctor,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      appointment_time: selectedTime + ':00',
      reason: reason.trim(),
      status: 'scheduled',
    });

    setIsSubmitting(false);

    if (result) {
      setIsSuccess(true);
      toast({
        title: 'Appointment Booked!',
        description: 'Your appointment has been successfully scheduled.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: 'Failed to book appointment. Please try again.',
      });
    }
  };

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Heart className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-xl animate-scale-in">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-success/10 inline-block mb-4">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Appointment Booked!</h2>
            <p className="text-muted-foreground mb-6">
              Your appointment with {selectedDoctorData?.full_name} on{' '}
              {selectedDate && format(selectedDate, 'MMMM dd, yyyy')} at {selectedTime} has been confirmed.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                View Dashboard
              </Button>
              <Button variant="hero" onClick={() => {
                setIsSuccess(false);
                setSelectedDoctor('');
                setSelectedDate(undefined);
                setSelectedTime('');
                setReason('');
              }}>
                Book Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary shadow-md">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">MediCare</span>
          </div>
          
          <div className="w-20" />
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">
            Select a doctor, date, and time to schedule your visit.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {/* Doctor Selection */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Select Doctor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex flex-col">
                            <span>{doctor.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {doctor.specialty} - ${doctor.consultation_fee}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDoctorData && (
                    <div className="mt-4 p-4 rounded-lg bg-muted/50">
                      <p className="font-medium">{selectedDoctorData.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedDoctorData.specialty}</p>
                      <p className="text-sm text-primary mt-1">
                        Consultation: ${selectedDoctorData.consultation_fee}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => 
                      isBefore(date, startOfDay(new Date())) || 
                      date.getDay() === 0 ||
                      isBefore(addDays(new Date(), 60), date)
                    }
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {/* Time Slots */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Select Time</CardTitle>
                  <CardDescription>
                    {selectedDate 
                      ? `Available slots for ${format(selectedDate, 'MMMM dd, yyyy')}`
                      : 'Please select a date first'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(time => {
                      const isBooked = bookedSlots.includes(time);
                      const isSelected = selectedTime === time;
                      
                      return (
                        <Button
                          key={time}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          disabled={!selectedDate || !selectedDoctor || isBooked}
                          onClick={() => setSelectedTime(time)}
                          className={isBooked ? 'opacity-50 line-through' : ''}
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Reason */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Reason for Visit</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Describe your symptoms or reason for visit..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    required
                  />
                </CardContent>
              </Card>

              {/* Submit */}
              <Button 
                type="submit" 
                variant="hero" 
                size="xl" 
                className="w-full"
                disabled={isSubmitting || !selectedDoctor || !selectedDate || !selectedTime || !reason.trim()}
              >
                {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
