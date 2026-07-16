import { ArrowRight, Key, Search, User, Mail, Phone, MapPin, Sparkles, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import api from '../utils/axiosInstance';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import fsLogo from '../assets/FS Logo.png';

gsap.registerPlugin(ScrollTrigger);

const Home = ({ onRegisterClick }) => {
  const navigate = useNavigate();
  const container = useRef(null);
  const { isAuthenticated } = useAuth();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/listings');
        // Get 5-6 listings for featured
        setFeaturedListings(data.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch featured listings:', error);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchFeatured();
  }, []);

  const developers = [
    { initials: 'YV', name: 'Yash Verma', role: 'Core Platform & Matching', color: 'bg-green-500', bio: 'Architect of matching algorithms and core layout.' },
    { initials: 'TS', name: 'Tarang Kumar Srivastava', role: 'Engagement and Location', color: 'bg-amber-500', bio: 'Engineered location-based search and maps integration.' }
  ];

  useGSAP(() => {
    // Hero Animations
    const tl = gsap.timeline();
    tl.fromTo('.hero-element', {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 0.2
    });

    // About Section Animations
    gsap.utils.toArray('.dev-card').forEach((card, i) => {
      gsap.fromTo(card, {
        y: 50,
        opacity: 0
      }, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%'
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out(1.5)',
        delay: i * 0.1
      });
    });

    // Contact Section Animations
    gsap.utils.toArray('.contact-card').forEach((card, i) => {
      gsap.fromTo(card, {
        y: 40,
        opacity: 0
      }, {
        scrollTrigger: {
          trigger: card,
          start: 'top 90%'
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        delay: i * 0.15
      });
    });
  }, { scope: container });

  const handleIHaveFlat = () => {
    localStorage.setItem('onboardingUserType', '1');
    if (isAuthenticated) {
      navigate('/onboarding');
    } else {
      onRegisterClick();
    }
  };

  const handleIDontHaveFlat = () => {
    localStorage.setItem('onboardingUserType', '2');
    if (isAuthenticated) {
      navigate('/onboarding');
    } else {
      onRegisterClick();
    }
  };

  return (
    <div ref={container} className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex items-center justify-center overflow-hidden bg-white dark:bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100/50 dark:from-primary-950/20 via-white dark:via-zinc-950 to-white dark:to-zinc-950"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl pt-4">
          <div className="hero-element flex justify-center mb-6">
            <img 
              src={fsLogo} 
              alt="FlatSync Logo" 
              className="w-32 h-32 md:w-36 md:h-36 object-contain rounded-2xl animate-logo-float cursor-pointer" 
            />
          </div>
          <h1 className="hero-element text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight leading-tight mb-6 drop-shadow-sm">
            Find Your <span className="text-primary-600 dark:text-primary-400">Perfect Flatmate</span>
          </h1>
          <p className="hero-element text-xl text-gray-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            FlatSync helps you connect with compatible flatmates and find the perfect place to live, tailored specifically to your lifestyle and preferences.
          </p>

          <div className="hero-element flex flex-col md:flex-row items-stretch justify-center gap-6 max-w-3xl mx-auto">
            {/* Card 1: I have a flat */}
            <div
              onClick={handleIHaveFlat}
              className="flex-1 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 hover:border-primary-500 dark:hover:border-primary-500 p-8 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-950/30 text-primary-500 dark:text-primary-500 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <Key className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 mb-2">1. I have a flat</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  List your available flat vacancy, outline lifestyle preferences, and match with the ideal flatmate.
                </p>
              </div>
              <span className="text-primary-600 dark:text-primary-400 font-bold text-lg flex items-center gap-2 mt-auto">
                Find a flatmate <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </div>

            {/* Card 2: I dont have a flat */}
            <div
              onClick={handleIDontHaveFlat}
              className="flex-1 bg-white dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 hover:border-primary-500 dark:hover:border-primary-500 p-8 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-950/30 text-primary-500 dark:text-primary-500 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 mb-2">2. I don't have a flat</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  Browse flat vacancies, discover AI compatibility scores, and pinpoint rooms on our location map.
                </p>
              </div>
              <span className="text-primary-600 dark:text-primary-400 font-bold text-lg flex items-center gap-2 mt-auto">
                Find flat + flatmate <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How FlatSync Works Section */}
      <section className="py-24 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900 relative transition-colors duration-200">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-zinc-100 mb-4 tracking-tight">How FlatSync Works</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-primary-400 mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600 dark:text-zinc-400 text-lg">Your perfect flatmate match in four simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-primary-50 dark:bg-zinc-900 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-100 dark:group-hover:bg-zinc-800 transition-colors shadow-sm">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-3">1. Create Account</h3>
              <p className="text-gray-605 text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">Register or log in first. Every user needs a verified profile to ensure a secure matching experience.</p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-primary-50 dark:bg-zinc-900 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-100 dark:group-hover:bg-zinc-800 transition-colors shadow-sm">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-3">2. Share Habits</h3>
              <p className="text-gray-605 text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">Answer lifestyle questions. If you own a flat, easily attach flat rent details, photos, and amenities.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-primary-50 dark:bg-zinc-900 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-100 dark:group-hover:bg-zinc-800 transition-colors shadow-sm">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-3">3. Pin Your Area</h3>
              <p className="text-gray-605 text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">Pin your actual flat or search boundaries directly on our interactive map page before viewing list suggestions.</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-primary-50 dark:bg-zinc-900 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-100 dark:group-hover:bg-zinc-800 transition-colors shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-3">4. Match & Connect</h3>
              <p className="text-gray-605 text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">Land on your custom Matches feed first. Instantly check AI compatibility percentages and chat safely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-24 bg-gray-50 dark:bg-zinc-900/40 border-t border-gray-100 dark:border-zinc-900 relative overflow-hidden transition-colors duration-200">
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-zinc-100 mb-4 tracking-tight">Featured Listings</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"></div>
            </div>
          </div>

          {loadingListings ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : featuredListings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-850 shadow-sm flex flex-col items-center justify-center">
              <Building className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">No listings available</h3>
              <p className="text-gray-500 dark:text-zinc-400 mb-6">Be the first to list a flat in your area!</p>
              <button
                onClick={handleIHaveFlat}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full font-semibold transition-all shadow-md"
              >
                List a Flat
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex overflow-x-auto gap-6 pb-8 custom-scrollbar snap-x">
                {featuredListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="min-w-[300px] md:min-w-[350px] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-zinc-800 flex flex-col snap-start group cursor-pointer"
                    onClick={handleIDontHaveFlat}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={(listing.photoUrls && listing.photoUrls.length > 0) ? listing.photoUrls[0] : 'https://via.placeholder.com/400x300'}
                        alt="flat"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-primary-700 dark:text-primary-400 shadow-sm">
                        {listing.vacancyCount} Spot{listing.vacancyCount > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xl mb-2 line-clamp-1">{listing.owner?.name || listing.fullName}'s Place</h3>
                      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4 line-clamp-2 flex-1">{listing.address}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-zinc-800/50">
                        <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Explore Details</span>
                        <span className="text-primary-600 dark:text-primary-400 text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                          View <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show More Card */}
                <div
                  onClick={handleIDontHaveFlat}
                  className="min-w-[200px] bg-primary-50 dark:bg-zinc-900/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary-100 dark:hover:bg-zinc-800 transition-colors border border-primary-100 dark:border-zinc-800 snap-start group"
                >
                  <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-8 h-8 text-primary-600 dark:text-primary-500" />
                  </div>
                  <span className="font-bold text-primary-800 dark:text-primary-400 text-lg">Show More</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gray-50 dark:bg-zinc-900/40 border-t border-gray-100 dark:border-zinc-900 relative overflow-hidden transition-colors duration-200">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-50/80 via-transparent to-transparent"></div>
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-zinc-100 mb-4 tracking-tight">Meet the Team</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-primary-400 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {developers.map((dev, i) => (
              <div key={i} className="dev-card bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-2 transition-all border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center animate-all">
                <div className={`w-20 h-20 rounded-full ${dev.color} text-white flex items-center justify-center text-2xl font-bold mb-5 shadow-inner shadow-black/20 ring-4 ring-white/50 dark:ring-zinc-800/50`}>
                  {dev.initials}
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-zinc-100 text-lg mb-1">{dev.name}</h3>
                <p className="text-primary-600 dark:text-primary-400 font-semibold text-sm mb-3">{dev.role}</p>
                <p className="text-gray-505 text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">{dev.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900 mt-auto relative transition-colors duration-200">
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-zinc-100 mb-12 tracking-tight">Get in Touch</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
            <div className="contact-card p-8 bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-850 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 mb-2 text-lg">Email</h3>
              <p className="text-gray-600 dark:text-zinc-400 font-medium">support@example.com</p>
            </div>
            <div className="contact-card p-8 bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-850 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 mb-2 text-lg">Phone</h3>
              <p className="text-gray-600 dark:text-zinc-400 font-medium">+91 XXXXX XXXXX</p>
            </div>
            <div className="contact-card p-8 bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-850 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 mb-2 text-lg">Office</h3>
              <p className="text-gray-600 dark:text-zinc-400 font-medium">XYZ Street, City, State, Country</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
