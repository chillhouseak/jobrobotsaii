import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    maxlength: [200, 'Role cannot exceed 200 characters'],
  },
  location: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Location cannot exceed 200 characters'],
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'hr', 'interview', 'final', 'offer', 'rejected'],
    default: 'applied',
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    trim: true,
    default: '',
  },
  url: {
    type: String,
    trim: true,
    default: '',
  },
  salary: {
    type: String,
    trim: true,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  contactName: {
    type: String,
    trim: true,
    default: '',
  },
  contactEmail: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Compound index for efficient user queries
applicationSchema.index({ userId: 1, createdAt: -1 });
// Index for search functionality
applicationSchema.index({ userId: 1, role: 'text', company: 'text', location: 'text' });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
