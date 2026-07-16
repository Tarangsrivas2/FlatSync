import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, ArrowLeft, X, Send, Camera, MapPin, Upload, Calendar, DollarSign, Home, Settings } from 'lucide-react';
import { MapContainer, TileLayer, Marker as LeafletMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RecenterMap, MapClickHandler } from '../components/LeafletMapHelpers';

const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi default

const questions = [
  { id: 'foodPreference', title: 'What is your food preference?', description: 'Important in India—can be a dealbreaker.', options: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'No Preference'] },
  { id: 'smokingHabit', title: 'Do you smoke?', description: 'Be honest about your smoking habits.', options: ['Regularly', 'Occasionally', 'No', 'Comfortable with smokers'] },
  { id: 'alcoholConsumption', title: 'Do you drink alcohol?', description: 'Let your potential flatmates know.', options: ['Regularly', 'Occasionally', 'No', 'Okay with others drinking'] },
  { id: 'cleanlinessLevel', title: 'How would you describe your cleanliness habits?', description: 'A clean house is a happy house.', options: ['Very Clean', 'Moderately Clean', 'Okay with some mess', 'Messy'] },
  { id: 'sleepSchedule', title: 'What is your usual sleep schedule?', description: 'Matching sleep schedules helps avoid disturbances.', options: ['Early sleeper (before 11 PM)', 'Moderate (11 PM – 1 AM)', 'Night owl (after 1 AM)'] },
  { id: 'workStudyRoutine', title: 'What is your daily routine?', description: 'This helps in understanding daily presence in the flat.', options: ['Work from home', 'Office/College (daytime)', 'Hybrid', 'Night shifts'] },
  { id: 'guestFrequency', title: 'How often do you have guests over?', description: 'Some like it quiet, some like it lively.', options: ['Frequently', 'Occasionally', 'Rarely', 'Never'] },
  { id: 'noiseTolerance', title: 'What is your noise preference?', description: 'From pin-drop silence to house parties.', options: ['Prefer quiet environment', 'Moderate noise is fine', 'Comfortable with loud environment'] },
  { id: 'sharingExpenses', title: 'How do you prefer handling shared responsibilities (rent, chores, bills)?', description: 'Money and chores are top reasons for conflicts.', options: ['Strictly divided', 'Flexible sharing', 'I prefer someone else to manage', 'Discuss and decide'] },
  { id: 'lifestylePersonality', title: 'Which best describes your lifestyle?', description: 'Finding the right vibe is key.', options: ['Social & outgoing', 'Balanced', 'Private & reserved'] }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Read selected userType (1: I have flat, 2: I need flat)
  const userType = localStorage.getItem('onboardingUserType') || (user?.userType ? String(user.userType) : '2');

  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Type 1 Flat Details State
  const [flatData, setFlatData] = useState({
    rentAmount: '',
    vacancyCount: 1,
    facilities: '',
    restrictions: '',
    photos: [],
    moveInDate: ''
  });
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Map Pinning State
  const [pinnedLocation, setPinnedLocation] = useState(defaultCenter);
  const [pinnedAddress, setPinnedAddress] = useState('');

  // Location search (Nominatim / OpenStreetMap - free, no API key needed)
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  const containerRef = useRef(null);

  // Steps Configuration
  const totalLifestyleSteps = questions.length;
  const isType1 = userType === '1';

  // If Type 1: 10 lifestyle + 1 flat info form + 1 map pinning = 12 steps (indices 0-11)
  // If Type 2: 10 lifestyle + 1 map pinning = 11 steps (indices 0-10)
  const mapStepIndex = isType1 ? totalLifestyleSteps + 1 : totalLifestyleSteps;
  const totalSteps = isType1 ? totalLifestyleSteps + 2 : totalLifestyleSteps + 1;

  useGSAP(() => {
    gsap.fromTo('.question-container',
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, { scope: containerRef, dependencies: [currentStep] });

  // Get current browser location to default map center
  useEffect(() => {
    if (currentStep === mapStepIndex && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPinnedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          console.log('Location access denied or unavailable. Using default Delhi coordinates.');
        }
      );
    }
  }, [currentStep, mapStepIndex]);

  // Debounced address search against Nominatim (OpenStreetMap's free geocoding API)
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (e) {
        console.error('Location search failed', e);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSelect = (option) => {
    setFormData({ ...formData, [questions[currentStep].id]: option });
    if (currentStep < totalSteps - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 400);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentStep === totalLifestyleSteps && isType1) {
      // Validate flat info step
      if (!flatData.rentAmount) {
        toast.error('Please enter the rent amount');
        return;
      }
      if (flatData.photos.length === 0) {
        toast.error('Please upload at least 1 photo of the flat');
        return;
      }
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleAmenityToggle = (amenity) => {
    let updated;
    if (selectedAmenities.includes(amenity)) {
      updated = selectedAmenities.filter(a => a !== amenity);
    } else {
      updated = [...selectedAmenities, amenity];
    }
    setSelectedAmenities(updated);
    setFlatData({ ...flatData, facilities: updated.join(', ') });
  };

  // Fired when the user picks a suggestion from the search dropdown
  const handleSuggestionSelect = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setPinnedLocation({ lat, lng });
    setPinnedAddress(place.display_name);
    setSearchQuery(place.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Fired on map click or marker drag — sets the pin and reverse-geocodes the address
  const handlePositionChange = useCallback(async (lat, lng) => {
    setPinnedLocation({ lat, lng });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setPinnedAddress(data.display_name);
        setSearchQuery(data.display_name);
      }
    } catch (e) {
      console.error('Reverse geocoding failed', e);
    }
  }, []);

  const handleMapClick = useCallback((latlng) => {
    handlePositionChange(latlng.lat, latlng.lng);
  }, [handlePositionChange]);

  const handleMarkerDragEnd = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng();
    handlePositionChange(lat, lng);
  }, [handlePositionChange]);

  const handleSubmit = async () => {
    if (!pinnedAddress) {
      toast.error('Please specify or search your location/address on the map.');
      return;
    }

    setLoading(true);
    try {
      // 1. Submit Onboarding Preferences to Backend
      const onboardingPayload = {
        ...formData,
        userType: Number(userType),
        address: pinnedAddress,
        lat: pinnedLocation.lat,
        lng: pinnedLocation.lng
      };

      const { data: updatedUser } = await api.post('/auth/onboarding', onboardingPayload);

      // 2. If Type 1, Create the Flat Listing
      if (isType1) {
        const listingPayload = new FormData();
        listingPayload.append('fullName', updatedUser.name || 'My Flat');
        listingPayload.append('email', updatedUser.email || '');
        listingPayload.append('mobileNumber', updatedUser.mobileNumber || flatData.mobileNumber || 'Not specified');
        listingPayload.append('address', pinnedAddress);
        listingPayload.append('age', updatedUser.age || 21);
        listingPayload.append('aboutYourself', updatedUser.aboutMe || '');
        listingPayload.append('vacancyCount', flatData.vacancyCount);
        listingPayload.append('facilities', flatData.facilities);
        listingPayload.append('restrictions', flatData.restrictions);
        listingPayload.append('rentAmount', flatData.rentAmount);
        listingPayload.append('moveInDate', flatData.moveInDate);
        listingPayload.append('lat', pinnedLocation.lat);
        listingPayload.append('lng', pinnedLocation.lng);

        flatData.photos.forEach(photo => {
          listingPayload.append('photos', photo);
        });

        await api.post('/listings', listingPayload);
        toast.success('Preferences saved and Flat vacancy listed!');
      } else {
        toast.success('Onboarding complete! Preferences saved.');
      }

      // Sync user profile state in Auth Context
      setUser(updatedUser);
      localStorage.removeItem('onboardingUserType'); // Clean up choice

      // Navigate straight to Matches view
      navigate('/matches');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Rendering Helper for Questionnaire step
  const renderQuestionnaire = () => {
    const currentQuestion = questions[currentStep];
    return (
      <div className="w-full max-w-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-8 md:p-12 min-h-[500px] flex flex-col question-container z-10 transition-colors">
        {currentStep > 0 && (
          <button onClick={handleBack} className="self-start text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition flex items-center gap-1 mb-8 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-zinc-100 mb-3 leading-tight">{currentQuestion.title}</h2>
          {currentQuestion.description && <p className="text-lg text-gray-500 dark:text-zinc-400 mb-10 font-medium">{currentQuestion.description}</p>}

          <div className="flex flex-col gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = formData[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-300 transform active:scale-[0.98] group ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-md shadow-primary-500/10'
                      : 'border-gray-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-semibold transition-colors ${isSelected ? 'text-primary-800 dark:text-primary-400' : 'text-gray-700 dark:text-zinc-300 group-hover:text-primary-800 dark:group-hover:text-primary-400'}`}>{option}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-zinc-650 group-hover:border-primary-400'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Rendering Helper for Extra Flat Info (Type 1 only)
  const renderFlatInfoForm = () => {
    const amenities = ['WiFi', 'AC', 'Washing Machine', 'Gym', 'Parking', 'Kitchen', 'Gated Security', 'TV'];
    return (
      <div className="w-full max-w-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-8 md:p-10 min-h-[500px] flex flex-col question-container z-10 transition-colors">
        <button onClick={handleBack} className="self-start text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition flex items-center gap-1 mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100 mb-2 leading-tight">Tell us about your Flat</h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6 font-medium">Provide rent details and list amenities to help potential matches find your space.</p>

        <div className="flex-1 flex flex-col gap-5 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary-500"/> Monthly Rent Amount (₹)
              </label>
              <input
                required
                type="number"
                placeholder="e.g. 12000"
                value={flatData.rentAmount}
                onChange={e => setFlatData({...flatData, rentAmount: e.target.value})}
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 rounded-xl p-3 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary-500"/> Estimated Move-in Date
              </label>
              <input
                type="date"
                value={flatData.moveInDate}
                onChange={e => setFlatData({...flatData, moveInDate: e.target.value})}
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 rounded-xl p-3 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                <Home className="w-4 h-4 text-primary-500"/> Vacant Spots Available
              </label>
              <select
                value={flatData.vacancyCount}
                onChange={e => setFlatData({...flatData, vacancyCount: parseInt(e.target.value)})}
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 rounded-xl p-3 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500 outline-none transition"
              >
                <option value={1}>1 Room / Spot</option>
                <option value={2}>2 Rooms / Spots</option>
                <option value={3}>3 Rooms / Spots</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                <Camera className="w-4 h-4 text-primary-500"/> Flat Restrictions
              </label>
              <input
                type="text"
                placeholder="e.g. No smoking, Veg only, No pets"
                value={flatData.restrictions}
                onChange={e => setFlatData({...flatData, restrictions: e.target.value})}
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 rounded-xl p-3 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
              <Settings className="w-4 h-4 text-primary-500"/> Flat Amenities / Facilities
            </label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, i) => {
                const isActive = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      isActive
                        ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-850 border-gray-200 dark:border-zinc-700 text-gray-755 text-gray-600 dark:text-zinc-400 hover:border-primary-400'
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
              <Upload className="w-4 h-4 text-primary-500"/> Upload Flat Photos (Up to 5)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  const filesArray = Array.from(e.target.files).slice(0, 5);
                  setFlatData({ ...flatData, photos: filesArray });
                  setPhotoPreviews(filesArray.map(file => URL.createObjectURL(file)));
                }
              }}
              className="w-full border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-3 bg-gray-50/50 dark:bg-zinc-850/50 cursor-pointer text-gray-550 dark:text-zinc-400"
            />
            {photoPreviews.length > 0 && (
              <div className="flex overflow-x-auto gap-3 mt-3 pb-1 custom-scrollbar">
                {photoPreviews.map((preview, i) => (
                  <img key={i} src={preview} alt="flat preview" className="w-24 h-24 min-w-[6rem] object-cover rounded-xl border border-gray-250 dark:border-zinc-700 shadow-sm" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex items-center gap-2 group"
          >
            Next: Location Map <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  };

  // Rendering Helper for Leaflet Location Pinning
  const renderLocationPinning = () => {
    return (
      <div className="w-full max-w-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-8 md:p-10 min-h-[500px] flex flex-col question-container z-10 transition-colors">
        <button onClick={handleBack} className="self-start text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition flex items-center gap-1 mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100 mb-2 leading-tight">
          {isType1 ? "Where is your Flat?" : "Set your Preferred Area"}
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6 font-medium">
          {isType1
            ? "Pin the exact location of your flat vacancy on the map."
            : "Pin your preferred search area to match with flats nearby."}
        </p>

        <div className="flex-1 flex flex-col gap-4 text-left">
          {/* Address Search input (Nominatim / OpenStreetMap) */}
          <div className="w-full bg-white dark:bg-zinc-850 rounded-xl shadow-sm border border-gray-250 dark:border-zinc-700 overflow-hidden flex items-center px-4 py-2.5 relative">
            <MapPin className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder={isType1 ? "Search address of your flat..." : "Search preferred location or suburb..."}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPinnedAddress(e.target.value); }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full bg-transparent outline-none text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-500 font-semibold text-sm border-0 focus:ring-0"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-850 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-56 overflow-y-auto z-20">
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    onMouseDown={() => handleSuggestionSelect(s)}
                    className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-primary-50 dark:hover:bg-primary-950/30 cursor-pointer"
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-gray-200 dark:border-zinc-700 rounded-[1.5rem] overflow-hidden relative shadow-inner" style={{ height: '350px' }}>
            <MapContainer center={[pinnedLocation.lat, pinnedLocation.lng]} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={true}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <RecenterMap lat={pinnedLocation.lat} lng={pinnedLocation.lng} />
              <MapClickHandler onMapClick={handleMapClick} />
              <LeafletMarker
                position={[pinnedLocation.lat, pinnedLocation.lng]}
                draggable={true}
                eventHandlers={{ dragend: handleMarkerDragEnd }}
              />
            </MapContainer>
          </div>

          <p className="text-xs text-gray-450 dark:text-zinc-500 italic mt-1">
            * You can drag the red map marker or click directly on the map to fine-tune your pinned spot.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2 group"
          >
            {loading ? 'Processing...' : (isType1 ? 'Finish & List Flat' : 'Finish & Match Me')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  };

  // Decide current step rendering view
  const renderCurrentStep = () => {
    if (currentStep < totalLifestyleSteps) {
      return renderQuestionnaire();
    } else if (currentStep === totalLifestyleSteps && isType1) {
      return renderFlatInfoForm();
    } else {
      return renderLocationPinning();
    }
  };

  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gray-50 dark:bg-zinc-950 transition-colors duration-200" ref={containerRef}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50/30 dark:from-primary-950/10 via-gray-50 dark:via-zinc-950 to-gray-50 dark:to-zinc-950 z-0"></div>

      {/* Progress Header */}
      <div className="w-full max-w-3xl absolute top-8 px-6 z-10">
        <div className="h-2 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-right text-sm text-gray-550 dark:text-zinc-405 mt-2 font-semibold">Step {currentStep + 1} of {totalSteps}</p>
      </div>

      {renderCurrentStep()}
    </div>
  );
};

export default Onboarding;