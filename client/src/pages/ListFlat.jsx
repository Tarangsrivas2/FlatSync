import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';

const ListFlat = () => {
  const [listings, setListings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    address: user?.address || '',
    age: user?.age || '',
    aboutYourself: user?.aboutMe || '',
    nearbyPlaces: '',
    facilities: '',
    restrictions: '',
    flatmatePreferences: '',
    vacancyCount: 1,
    photos: []
  });
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      const { data } = await api.get('/listings/my-listings');
      setListings(data);
    } catch {
      toast.error('Failed to load listings');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
      mobileNumber: user?.mobileNumber || '',
      address: user?.address || '',
      age: user?.age || '',
      aboutYourself: user?.aboutMe || '',
      nearbyPlaces: '',
      facilities: '',
      restrictions: '',
      flatmatePreferences: '',
      vacancyCount: 1,
      photos: []
    });
    setPhotoPreviews([]);
    setEditId(null);
    setShowModal(false);
  };

  const handleEdit = (listing) => {
    setFormData({
      fullName: listing.fullName,
      email: listing.email,
      mobileNumber: listing.mobileNumber,
      address: listing.address,
      age: listing.age,
      aboutYourself: listing.aboutYourself,
      nearbyPlaces: listing.nearbyPlaces || '',
      facilities: listing.facilities || '',
      restrictions: listing.restrictions || '',
      flatmatePreferences: listing.flatmatePreferences || '',
      vacancyCount: listing.vacancyCount,
      photos: []
    });
    setPhotoPreviews(listing.photoUrls || []);
    setEditId(listing._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/listings/${id}`);
        toast.success('Listing deleted');
        setListings(listings.filter(l => l._id !== id));
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const formDataPayload = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'photos') {
            Array.from(formData.photos).forEach(file => {
              formDataPayload.append('photos', file);
            });
          } else if (formData[key] !== null) {
            formDataPayload.append(key, formData[key]);
          }
        });
        formDataPayload.append('lat', pos.coords.latitude);
        formDataPayload.append('lng', pos.coords.longitude);

        if (editId) {
          const { data } = await api.put(`/listings/${editId}`, formDataPayload);
          setListings(listings.map(l => l._id === editId ? data : l));
          toast.success('Listing updated');
        } else {
          const { data } = await api.post('/listings', formDataPayload);
          setListings([...listings, data]);
          toast.success('Listing created');
        }
        resetForm();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error saving listing');
      } finally {
        setLoading(false);
      }
    }, () => {
      toast.error('Location is required to post a listing');
      setLoading(false);
    });
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Flat Listings</h1>
          <p className="text-gray-500 mt-1">Manage all your currently active flats.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition active:scale-[0.98]">
          <PlusCircle className="w-5 h-5"/> Create Listing
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">You haven't posted any listings yet.</p>
            <button onClick={() => setShowModal(true)} className="text-primary-600 font-semibold hover:underline">Create your first listing</button>
          </div>
        ) :
          listings.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
              <img src={(item.photoUrls && item.photoUrls.length > 0) ? item.photoUrls[0] : 'https://via.placeholder.com/400x200'} className="w-full h-48 object-cover bg-gray-50"/>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg truncate pr-2">{item.fullName}</h3>
                  <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md border border-primary-100 whitespace-nowrap">
                    {item.vacancyCount} Vacanc{item.vacancyCount>1?'ies':'y'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.address}</p>
                
                <div className="mt-auto flex gap-3 pt-4 border-t border-gray-50">
                  <button onClick={() => handleEdit(item)} className="flex flex-1 items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition">
                    <Edit className="w-4 h-4"/> Edit
                  </button>
                  <button onClick={() => handleDelete(item._id)} className="flex flex-1 items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-sm font-semibold transition">
                    <Trash2 className="w-4 h-4"/> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in justify-center items-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative my-8 flex flex-col zoom-in-95 duration-200">
            <button onClick={resetForm} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-1.5 rounded-full z-10 transition">
              <X className="w-5 h-5"/>
            </button>
            <div className="p-8 overflow-y-auto custom-scrollbar max-h-[85vh]">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{editId ? 'Edit Listing' : 'Post a New Listing'}</h2>
              <p className="text-sm text-gray-500 mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex items-start gap-2">
                 <span className="text-blue-500 mt-0.5">ℹ️</span> 
                 <span>Your current GPS location will be attached to this listing automatically to help others find it on the map. Please ensure location services are enabled.</span>
              </p>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
                    <input required type="text" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                    <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Address</label>
                    <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">About the place & yourself</label>
                    <textarea required rows="3" value={formData.aboutYourself} onChange={e => setFormData({...formData, aboutYourself: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Vacancy Count</label>
                    <select value={formData.vacancyCount} onChange={e => setFormData({...formData, vacancyCount: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white transition">
                      <option value={1}>1 Room / Spot</option>
                      <option value={2}>2 Rooms / Spots</option>
                      <option value={3}>3 Rooms / Spots</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nearby Places</label>
                    <textarea placeholder="e.g. 5 mins walk to metro, near City Mall" rows="2" value={formData.nearbyPlaces} onChange={e => setFormData({...formData, nearbyPlaces: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition"></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Facilities in Flat</label>
                    <textarea placeholder="e.g. WiFi, Washing Machine, AC, Gym" rows="2" value={formData.facilities} onChange={e => setFormData({...formData, facilities: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition"></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Restrictions in Flat</label>
                    <textarea placeholder="e.g. No smoking, No pets, Veg only" rows="2" value={formData.restrictions} onChange={e => setFormData({...formData, restrictions: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition"></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Specific Flatmate Preferences</label>
                    <textarea placeholder="e.g. Must be a working professional, should be clean and organized" rows="2" value={formData.flatmatePreferences} onChange={e => setFormData({...formData, flatmatePreferences: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition"></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Photos (Up to 5)</label>
                    <input type="file" multiple accept="image/*" onChange={e => {
                      if(e.target.files && e.target.files.length > 0) {
                        const filesArray = Array.from(e.target.files).slice(0, 5);
                        setFormData({...formData, photos: filesArray});
                        setPhotoPreviews(filesArray.map(file => URL.createObjectURL(file)));
                      }
                    }} className="w-full border border-gray-300 border-dashed rounded-lg p-2 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition cursor-pointer bg-gray-50/50" />
                  </div>
                </div>
                {photoPreviews.length > 0 && (
                  <div className="flex overflow-x-auto gap-3 mt-2 custom-scrollbar pb-2">
                    {photoPreviews.map((preview, i) => (
                      <img key={i} src={preview} alt="preview" className="w-32 h-32 min-w-[8rem] object-cover rounded-xl border shadow-sm" />
                    ))}
                  </div>
                )}
                
                <button disabled={loading} type="submit" className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]">
                  {loading ? 'Processing...' : 'Save & Post Listing'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListFlat;
