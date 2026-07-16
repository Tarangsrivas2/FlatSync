import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { Camera, Edit, Settings, Home } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name,
    age: user?.age || '',
    mobileNumber: user?.mobileNumber || '',
    address: user?.address || '',
    aboutMe: user?.aboutMe || '',
    photo: null,
    preferences: user?.preferences ? JSON.stringify(user.preferences) : ''
  });
  const [photoPreview, setPhotoPreview] = useState(user?.photoUrl);
  const [myListings, setMyListings] = useState([]);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      const { data } = await api.get('/listings/my-listings');
      setMyListings(data);
    } catch {
      toast.error('Failed to load listings');
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData({
        name: user?.name,
        age: user?.age || '',
        mobileNumber: user?.mobileNumber || '',
        address: user?.address || '',
        aboutMe: user?.aboutMe || '',
        photo: null,
        preferences: user?.preferences ? JSON.stringify(user.preferences) : ''
      });
      setPhotoPreview(user?.photoUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) payload.append(key, formData[key]);
    });

    try {
      const { data } = await api.put('/users/profile', payload);
      setUser({ ...user, ...data });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        <div className="w-full md:w-[35%] flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-all">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-500 to-primary-600 z-0"></div>
            
            <div className="relative mt-8 mb-6 z-10 w-32 h-32">
               <img src={photoPreview || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-900 bg-gray-100 dark:bg-zinc-800 shadow-md" />
               {isEditing && (
                 <label className="absolute bottom-0 right-0 bg-primary-600 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition shadow-lg text-white border-2 border-white dark:border-zinc-900">
                    <Camera className="w-5 h-5"/>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                       if (e.target.files[0]) {
                         setFormData({...formData, photo: e.target.files[0]});
                         setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                       }
                    }} />
                 </label>
               )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-1 z-10">{user?.name}</h2>
            <p className="text-gray-500 dark:text-zinc-400 mb-6 z-10 font-medium">{user?.email}</p>
            
            <button onClick={handleEditToggle} className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition shadow-sm ${isEditing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-950/30 dark:text-primary-400 dark:hover:bg-primary-900/50 dark:hover:shadow-none'}`}>
              <Edit className="w-4 h-4"/> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
          
          {!isEditing && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-900 dark:text-zinc-100"><Settings className="w-5 h-5 text-primary-500" /> My Preferences</h3>
              {user?.preferences && Object.keys(user.preferences).filter(k => k !== '_id').length > 0 ? (
                <div className="flex flex-col gap-3">
                  {Object.entries(user.preferences)
                    .filter(([key]) => key !== '_id')
                    .map(([key, value], i) => {
                      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={i} className="flex flex-col border-b border-gray-50 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                          <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{formattedKey}</span>
                          <span className="font-semibold text-gray-800 dark:text-zinc-200">{value}</span>
                        </div>
                      );
                  })}
                </div>
              ) : <p className="text-gray-500 dark:text-zinc-400 text-sm italic">No preferences set.</p>}
            </div>
          )}
        </div>

        <div className="w-full md:w-[65%] flex flex-col gap-6">
          {isEditing ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm mb-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-zinc-100">Edit Information</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Display Name</label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Age</label>
                    <input type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Mobile</label>
                    <input type="text" value={formData.mobileNumber || ''} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Full Address</label>
                    <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none transition" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">About Me</label>
                    <textarea rows="4" value={formData.aboutMe || ''} onChange={e => setFormData({...formData, aboutMe: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none transition resize-none"></textarea>
                  </div>
                </div>
                <button disabled={loading} type="submit" className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Processing...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col gap-8 mb-6">
              <div>
                <h3 className="font-bold text-xl mb-4 border-b border-gray-100 dark:border-zinc-800 pb-3 text-gray-800 dark:text-zinc-100">About Me</h3>
                <p className="text-gray-600 dark:text-zinc-300 leading-relaxed">{user?.aboutMe || <span className="italic text-gray-400 dark:text-zinc-500">No details provided yet. Add an about me section to help flatmates know you better.</span>}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1 font-bold uppercase tracking-wider">Age</p>
                  <p className="font-semibold text-gray-900 dark:text-zinc-100 text-lg">{user?.age || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1 font-bold uppercase tracking-wider">Mobile Number</p>
                  <p className="font-semibold text-gray-900 dark:text-zinc-100 text-lg">{user?.mobileNumber || 'Not specified'}</p>
                </div>
                <div className="col-span-1 sm:col-span-2 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1 font-bold uppercase tracking-wider">Located At</p>
                  <p className="font-semibold text-gray-900 dark:text-zinc-100 text-lg">{user?.address || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-2xl font-bold mb-5 flex items-center gap-2 text-gray-900 dark:text-zinc-100"><Home className="w-6 h-6 text-primary-500"/> My Posted Flats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {myListings.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-zinc-900 border border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl p-8 text-center text-gray-500 dark:text-zinc-400">
                  No active listings posted by you yet.
                </div>
              ) :
                myListings.map(item => (
                  <div key={item._id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex items-center gap-4 pr-4 hover:shadow-md transition">
                     <img src={item.photoUrl || 'https://via.placeholder.com/100'} className="w-28 h-28 object-cover bg-gray-50 dark:bg-zinc-800" />
                     <div className="py-3 flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-zinc-100 truncate text-lg">{item.fullName}</p>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 truncate mb-2">{item.address}</p>
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/50 px-2.5 py-1 rounded-md">
                          {item.vacancyCount} Spot{item.vacancyCount>1?'s':''}
                        </span>
                     </div>
                  </div>
                ))
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
