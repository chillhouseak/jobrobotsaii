const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
    default: '',
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  // IPN / Subscription Fields
  plan: {
    type: String,
    enum: ['free', 'standard', 'unlimited', 'agency'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'pending'],
    default: 'active'
  },
  suspensionReason: {
    type: String,
    default: null
  },
  createdVia: {
    type: String,
    enum: ['direct', 'webhook', 'admin', 'import'],
    default: 'direct'
  },

  // Profile Fields
  skills: {
    type: String,
    default: ''
  },
  experienceLevel: {
    type: String,
    enum: ['junior', 'mid', 'senior', 'lead'],
    default: 'mid'
  },
  targetRole: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },

  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  launchpadCustomerId: {
    type: String,
    default: null
  },

  // Plan Limits
  aiCredits: {
    type: Number,
    default: 10
  },
  resumeGenerations: {
    type: Number,
    default: 0
  },
  interviewSessions: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for subscription lookups (email already has unique index from schema)
userSchema.index({ plan: 1 });
userSchema.index({ status: 1 });
userSchema.index({ subscriptionEndDate: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to suspend user
userSchema.methods.suspend = async function(reason) {
  this.status = 'suspended';
  this.suspensionReason = reason;
  return this.save();
};

// Method to reactivate user
userSchema.methods.reactivate = async function() {
  this.status = 'active';
  this.suspensionReason = null;
  return this.save();
};

// Method to upgrade plan
userSchema.methods.upgradePlan = async function(plan, subscriptionEndDate = null) {
  this.plan = plan;
  this.status = 'active';
  this.subscriptionEndDate = subscriptionEndDate;

  // Set plan limits
  const planLimits = {
    free: { aiCredits: 10 },
    standard: { aiCredits: 50 },
    unlimited: { aiCredits: 999999 },
    agency: { aiCredits: 999999 }
  };

  if (planLimits[plan]) {
    this.aiCredits = planLimits[plan].aiCredits;
  }

  return this.save();
};

// Method to downgrade to free
userSchema.methods.downgradeToFree = async function() {
  this.plan = 'free';
  this.subscriptionEndDate = null;
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
