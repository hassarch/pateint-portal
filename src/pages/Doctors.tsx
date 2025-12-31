import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mongodb } from '@/integrations/mongodb/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, ArrowLeft, Search, Star, Clock, DollarSign, Stethoscope, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  bio: string | null;
  years_experience: number;
  consultation_fee: number;
  avatar_url: string | null;
  _id?: string;
}

export default function Doctors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = doctors.filter(
        doc => 
          doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [searchQuery, doctors]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    const doctorsData = await mongodb.find<{
      _id: string;
      full_name: string;
      specialty: string;
      bio: string | null;
      years_experience: number;
      consultation_fee: number;
      avatar_url: string | null;
      is_active: boolean;
    }>('doctors', { is_active: true });

    const formattedDoctors = doctorsData
      .map(doc => ({
        id: doc._id,
        full_name: doc.full_name,
        specialty: doc.specialty,
        bio: doc.bio,
        years_experience: doc.years_experience || 0,
        consultation_fee: doc.consultation_fee || 0,
        avatar_url: doc.avatar_url,
      }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    
    setDoctors(formattedDoctors);
    setFilteredDoctors(formattedDoctors);
    setIsLoading(false);
  };

  const specialties = [...new Set(doctors.map(d => d.specialty))];

  return (
    <div className="min-h-screen gradient-hero animate-fade-in">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center gap-3 hover-scale transition-smooth">
            <div className="p-2 rounded-xl gradient-primary shadow-glow hover-glow transition-smooth">
              <Heart className="h-6 w-6 text-primary-foreground animate-pulse-soft" />
            </div>
            <span className="text-2xl font-bold gradient-text">MediCare</span>
          </div>
          
          <div className="w-20" />
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Our Doctors</h1>
          <p className="text-muted-foreground">
            Find and book appointments with our qualified healthcare professionals.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge 
                variant={searchQuery === '' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setSearchQuery('')}
              >
                All
              </Badge>
              {specialties.map(specialty => (
                <Badge 
                  key={specialty}
                  variant={searchQuery === specialty ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSearchQuery(specialty)}
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Doctors Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="border-0 shadow-lg animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="p-4 rounded-full bg-muted inline-block mb-4">
                <Stethoscope className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try a different search term.' 
                  : 'Check back later for available doctors.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <Card 
                key={doctor.id} 
                className="border-0 shadow-lg hover-lift hover-glow transition-smooth animate-slide-up group glass"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl gradient-primary group-hover:shadow-glow transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Stethoscope className="h-8 w-8 text-primary-foreground group-hover:animate-bounce-subtle" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{doctor.full_name}</CardTitle>
                      <CardDescription className="text-primary font-medium">
                        {doctor.specialty}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {doctor.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {doctor.bio}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{doctor.years_experience} years experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${doctor.consultation_fee} per visit</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {[1, 2, 3, 4, 5].map((star, i) => (
                        <Star 
                          key={star} 
                          className="h-3 w-3 fill-warning text-warning hover:scale-125 transition-transform" 
                          style={{ animationDelay: `${i * 0.05}s` }}
                        />
                      ))}
                      <span className="text-muted-foreground">(4.9)</span>
                    </div>
                  </div>

                  <Button 
                    variant="hero" 
                    className="w-full group"
                    onClick={() => user ? navigate(`/book?doctor=${doctor.id}`) : navigate('/auth')}
                  >
                    <Calendar className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
