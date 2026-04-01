import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters'],
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
  },
  location: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Location cannot exceed 200 characters'],
  },
  url: {
    type: String,
    trim: true,
    default: '',
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  salary: {
    type: String,
    trim: true,
    default: '',
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    default: 'full-time',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  source: {
    type: String,
    trim: true,
    default: '',
  },
  saved: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for efficient user queries
jobSchema.index({ userId: 1, createdAt: -1 });
// Index for search functionality
jobSchema.index({ userId: 1, title: 'text', company: 'text', location: 'text' });

const Job = mongoose.model('Job', jobSchema);
export default Job;
