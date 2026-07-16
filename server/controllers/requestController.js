const Request = require('../models/Request');
const Listing = require('../models/Listing');

const sendRequest = async (req, res) => {
  try {
    const { listingId } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const existingReq = await Request.findOne({ fromUser: req.user._id, listingId });
    if (existingReq) return res.status(400).json({ message: 'Request already sent' });

    const request = await Request.create({
      fromUser: req.user._id,
      toUser: listing.owner,
      listingId
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ toUser: req.user._id })
      .populate('fromUser', 'name photoUrl preferences')
      .populate('listingId', 'fullName address');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Only ONE getOutgoingRequests — duplicate removed
const getOutgoingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ fromUser: req.user._id })
      .populate('toUser', 'name photoUrl')
      .populate('listingId', 'fullName address')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch outgoing requests', error: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const request = await Request.findById(id);

    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.toUser.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendRequest, getIncomingRequests, getOutgoingRequests, updateRequestStatus };