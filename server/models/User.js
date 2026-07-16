const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  mobileNumber: { type: String },
  photoUrl: { type: String },
  address: { type: String },
  aboutMe: { type: String },
  preferences: {
    foodPreference: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'No Preference'] },
    smokingHabit: { type: String, enum: ['Regularly', 'Occasionally', 'No', 'Comfortable with smokers'] },
    alcoholConsumption: { type: String, enum: ['Regularly', 'Occasionally', 'No', 'Okay with others drinking'] },
    cleanlinessLevel: { type: String, enum: ['Very Clean', 'Moderately Clean', 'Okay with some mess', 'Messy'] },
    sleepSchedule: { type: String, enum: ['Early sleeper (before 11 PM)', 'Moderate (11 PM – 1 AM)', 'Night owl (after 1 AM)'] },
    workStudyRoutine: { type: String, enum: ['Work from home', 'Office/College (daytime)', 'Hybrid', 'Night shifts'] },
    guestFrequency: { type: String, enum: ['Frequently', 'Occasionally', 'Rarely', 'Never'] },
    noiseTolerance: { type: String, enum: ['Prefer quiet environment', 'Moderate noise is fine', 'Comfortable with loud environment'] },
    sharingExpenses: { type: String, enum: ['Strictly divided', 'Flexible sharing', 'I prefer someone else to manage', 'Discuss and decide'] },
    lifestylePersonality: { type: String, enum: ['Social & outgoing', 'Balanced', 'Private & reserved'] }
  },
  userType: { type: Number, enum: [1, 2] },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [77.2090, 28.6139] }
  },
  onboardingComplete: { type: Boolean, default: false },
  savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }]
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
