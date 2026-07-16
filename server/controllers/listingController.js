const Listing = require('../models/Listing');
const { streamUpload } = require('../utils/cloudinaryUpload');

const createListing = async (req, res) => {
  try {
    const {
      fullName, email, mobileNumber, address, age, aboutYourself, vacancyCount,
      nearbyPlaces, facilities, restrictions, flatmatePreferences, lat, lng,
      rentAmount, moveInDate
    } = req.body;
    let photoUrls = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => streamUpload(file.buffer));
      const results = await Promise.all(uploadPromises);
      photoUrls = results.map(result => result.secure_url);
    }

    const listing = await Listing.create({
      owner: req.user._id,
      photoUrls,
      fullName,
      email,
      mobileNumber,
      address,
      age,
      aboutYourself,
      nearbyPlaces,
      facilities,
      restrictions,
      flatmatePreferences,
      vacancyCount,
      rentAmount: rentAmount ? Number(rentAmount) : undefined,
      moveInDate: moveInDate || undefined,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    });

    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getListings = async (req, res) => {
  try {
    const { lat, lng, radiusKm: requestedRadiusKm } = req.query;
    const hasLocationQuery = lat !== undefined || lng !== undefined;

    if (!hasLocationQuery) {
      const listings = await Listing.find().populate('owner', 'name photoUrl preferences');
      return res.json(listings);
    }

    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'A valid latitude and longitude are required to search nearby flats.' });
    }

    let radiusKm;
    if (requestedRadiusKm !== undefined) {
      radiusKm = Number.parseFloat(requestedRadiusKm);
      if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 50) {
        return res.status(400).json({ message: 'Search radius must be between 0 and 50 kilometres.' });
      }
    }

    const listings = await Listing.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distanceMeters',
          spherical: true,
          ...(radiusKm ? { maxDistance: radiusKm * 1000 } : {})
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner'
        }
      },
      {
        $unwind: '$owner'
      },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] }
        }
      }
    ]);

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', '-password');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const {
      fullName, email, mobileNumber, address, age, aboutYourself, vacancyCount,
      nearbyPlaces, facilities, restrictions, flatmatePreferences, lat, lng,
      rentAmount, moveInDate
    } = req.body;
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => streamUpload(file.buffer));
      const results = await Promise.all(uploadPromises);
      listing.photoUrls = results.map(result => result.secure_url);
    }

    listing.fullName = fullName || listing.fullName;
    listing.email = email || listing.email;
    listing.mobileNumber = mobileNumber || listing.mobileNumber;
    listing.address = address || listing.address;
    listing.age = age || listing.age;
    listing.aboutYourself = aboutYourself || listing.aboutYourself;
    listing.nearbyPlaces = nearbyPlaces || listing.nearbyPlaces;
    listing.facilities = facilities || listing.facilities;
    listing.restrictions = restrictions || listing.restrictions;
    listing.flatmatePreferences = flatmatePreferences || listing.flatmatePreferences;
    listing.vacancyCount = vacancyCount || listing.vacancyCount;
    if (rentAmount !== undefined) listing.rentAmount = Number(rentAmount);
    if (moveInDate !== undefined) listing.moveInDate = moveInDate;
    if (lat && lng) {
      listing.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }

    const updatedListing = await listing.save();
    res.json(updatedListing);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const searchInArea = async (req, res) => {
  try {
    const { boundary } = req.body; // GeoJSON Polygon coordinates: [[[lng,lat],[lng,lat],...]]

    if (!boundary || !Array.isArray(boundary)) {
      return res.status(400).json({ message: 'A valid boundary polygon is required.' });
    }

    const listings = await Listing.find({
      location: {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: boundary
          }
        }
      }
    }).populate('owner', 'name photoUrl preferences');

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createListing, getListings, getListingById, updateListing, deleteListing, getMyListings, searchInArea };