const mongoose = require('mongoose');

const ipnMappingSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: true,
    unique: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['standard', 'unlimited', 'agency']
  },
  planName: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookups
ipnMappingSchema.index({ isActive: 1 });

module.exports = mongoose.model('IPNMapping', ipnMappingSchema);
