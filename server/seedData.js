require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Request = require('./models/Request');
const connectDB = require('./config/db');

const seedDB = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Listing.deleteMany();
    await Request.deleteMany();

    const usersData = [];
    for (let i = 1; i <= 5; i++) {
      usersData.push({
        name: `Sample User ${i}`,
        email: `user${i}@example.com`,
        password: 'password123',
        age: 20 + i,
        mobileNumber: `987654321${i}`,
        photoUrl: `https://i.pravatar.cc/150?u=${i}`,
        address: 'Noida, UP',
        aboutMe: `Hi, I am user ${i}. Looking for a great flatmate.`,
        preferences: {
          gender: i % 2 === 0 ? 'Female' : 'Male',
          organizedRoom: i % 2 === 0 ? 'Yes' : 'No',
          smokeOrDrink: 'No',
          foodPreference: i % 2 === 0 ? 'Non-Veg' : 'Veg',
          profession: 'Working',
          sleepSchedule: i % 2 === 0 ? 'Early Night' : 'Late Night'
        },
        onboardingComplete: true
      });
    }
    const createdUsers = await User.insertMany(usersData);

    const listingsData = [
      {
        owner: createdUsers[0]._id,
        photoUrl: 'https://images.unsplash.com/photo-15df579076f84-fc12592d3b2c?auto=format&fit=crop&q=80&w=800',
        fullName: createdUsers[0].name,
        email: createdUsers[0].email,
        mobileNumber: createdUsers[0].mobileNumber,
        address: 'Sector 62, Noida, Uttar Pradesh',
        age: createdUsers[0].age,
        aboutYourself: 'Looking for a clean flatmate.',
        vacancyCount: 1,
        location: { type: 'Point', coordinates: [77.35, 28.62] } // lng, lat
      },
      {
        owner: createdUsers[1]._id,
        photoUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
        fullName: createdUsers[1].name,
        email: createdUsers[1].email,
        mobileNumber: createdUsers[1].mobileNumber,
        address: 'Indirapuram, Ghaziabad, Uttar Pradesh',
        age: createdUsers[1].age,
        aboutYourself: 'I have a spare room in my 2BHK.',
        vacancyCount: 2,
        location: { type: 'Point', coordinates: [77.37, 28.63] }
      },
      {
        owner: createdUsers[2]._id,
        photoUrl: 'https://images.unsplash.com/photo-1502672260266-1c1f2d9368ce?auto=format&fit=crop&q=80&w=800',
        fullName: createdUsers[2].name,
        email: createdUsers[2].email,
        mobileNumber: createdUsers[2].mobileNumber,
        address: 'Sector 15, Noida, Uttar Pradesh',
        age: createdUsers[2].age,
        aboutYourself: 'Searching for a replacement.',
        vacancyCount: 1,
        location: { type: 'Point', coordinates: [77.31, 28.58] }
      },
      {
        owner: createdUsers[3]._id,
        photoUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800',
        fullName: createdUsers[3].name,
        email: createdUsers[3].email,
        mobileNumber: createdUsers[3].mobileNumber,
        address: 'Mayur Vihar Ph 1, Delhi',
        age: createdUsers[3].age,
        aboutYourself: 'Close to metro station.',
        vacancyCount: 3,
        location: { type: 'Point', coordinates: [77.29, 28.60] }
      },
      {
        owner: createdUsers[0]._id,
        photoUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=800',
        fullName: createdUsers[0].name,
        email: createdUsers[0].email,
        mobileNumber: createdUsers[0].mobileNumber,
        address: 'Sector 50, Noida, UP',
        age: createdUsers[0].age,
        aboutYourself: 'Premium flat in sector 50.',
        vacancyCount: 1,
        location: { type: 'Point', coordinates: [77.36, 28.57] }
      }
    ];

    const createdListings = await Listing.insertMany(listingsData);

    const requestsData = [
      {
        fromUser: createdUsers[1]._id,
        toUser: createdUsers[0]._id,
        listingId: createdListings[0]._id,
        status: 'pending'
      },
      {
        fromUser: createdUsers[4]._id,
        toUser: createdUsers[1]._id,
        listingId: createdListings[1]._id,
        status: 'accepted'
      }
    ];

    await Request.insertMany(requestsData);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding model:', error);
    process.exit(1);
  }
};

seedDB();
