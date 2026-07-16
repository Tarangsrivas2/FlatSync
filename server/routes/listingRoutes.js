const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.post('/', protect, upload.array('photos', 5), listingController.createListing);
router.get('/', listingController.getListings);
router.get('/my-listings', protect, listingController.getMyListings);
router.post('/search-area', listingController.searchInArea);
router.get('/:id', protect, listingController.getListingById);
router.put('/:id', protect, upload.array('photos', 5), listingController.updateListing);
router.delete('/:id', protect, listingController.deleteListing);

module.exports = router;