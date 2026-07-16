const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }
    
    if (await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const submitOnboarding = async (req, res) => {
  try {
    const { 
      foodPreference, 
      smokingHabit, 
      alcoholConsumption, 
      cleanlinessLevel, 
      sleepSchedule, 
      workStudyRoutine, 
      guestFrequency, 
      noiseTolerance, 
      sharingExpenses, 
      lifestylePersonality,
      userType,
      address,
      lat,
      lng
    } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.preferences = {
      foodPreference,
      smokingHabit,
      alcoholConsumption,
      cleanlinessLevel,
      sleepSchedule,
      workStudyRoutine,
      guestFrequency,
      noiseTolerance,
      sharingExpenses,
      lifestylePersonality
    };
    if (userType) user.userType = Number(userType);
    if (address) user.address = address;
    if (lat && lng) {
      user.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }
    user.onboardingComplete = true;
    const updatedUser = await user.save();
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser, submitOnboarding, getMe };
