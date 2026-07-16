const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  photoUrls: [{ type: String }],
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  address: { type: String, required: true },
  age: { type: Number, required: true },
  aboutYourself: { type: String },
  nearbyPlaces: { type: String },
  facilities: { type: String },
  restrictions: { type: String },
  flatmatePreferences: { type: String },
  vacancyCount: { type: Number, enum: [1, 2, 3], required: true },
  rentAmount: { type: Number },
  moveInDate: { type: Date },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
}, { timestamps: true });

listingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Listing', listingSchema);
