const User = require('../models/User');
const MatchScore = require('../models/MatchScore');
const { streamUpload } = require('../utils/cloudinaryUpload');

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    
    // Prevent Mongoose CastError if age is empty string
    if (req.body.age !== undefined && req.body.age !== '') {
        user.age = req.body.age;
    }
    
    user.mobileNumber = req.body.mobileNumber || user.mobileNumber;
    user.address = req.body.address || user.address;
    user.aboutMe = req.body.aboutMe || user.aboutMe;
    
    if (req.body.preferences && req.body.preferences !== 'undefined') {
        try {
            const parsedPrefs = JSON.parse(req.body.preferences);
            // Safely extract existing preferences, stripping Mongoose bindings
            const currentPrefs = user.preferences && typeof user.preferences.toJSON === 'function' ? user.preferences.toJSON() : (user.preferences || {});
            user.preferences = { ...currentPrefs, ...parsedPrefs };
        } catch (err) {
            console.error('Error parsing preferences:', err);
        }
    }

    // Handle File Uploads securely with error boundaries
    if (req.file) {
      if (process.env.CLOUDINARY_API_KEY === 'dummy_key' || process.env.CLOUDINARY_API_KEY === 'dummy') {
         return res.status(400).json({ message: 'Cannot upload photo: Please configure real Cloudinary keys in server/.env' });
      }
      try {
        const result = await streamUpload(req.file.buffer);
        user.photoUrl = result.secure_url;
      } catch (uploadObjErr) {
        return res.status(500).json({ message: 'Cloudinary Upload Failed', error: uploadObjErr.message });
      }
    }

    const updatedUser = await user.save();

    // Invalidate cached match scores so stale data is not served
    await MatchScore.deleteMany({ $or: [{ user1: updatedUser._id }, { user2: updatedUser._id }] });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photoUrl: updatedUser.photoUrl,
      preferences: updatedUser.preferences,
      onboardingComplete: updatedUser.onboardingComplete
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const saveListing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const listingId = req.params.id;
    if (user.savedListings.includes(listingId)) {
      user.savedListings = user.savedListings.filter(id => id.toString() !== listingId);
    } else {
      user.savedListings.push(listingId);
    }
    
    await user.save();
    res.json(user.savedListings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getUserProfile, updateUserProfile, saveListing };
