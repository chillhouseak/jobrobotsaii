import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, default: '', trim: true },
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
  plan: { type: String, enum: ['free', 'standard', 'unlimited', 'agency'], default: 'free' },
  status: { type: String, enum: ['active', 'suspended', 'cancelled', 'pending'], default: 'active' },
  suspensionReason: { type: String, default: null },
  createdVia: { type: String, enum: ['direct', 'webhook', 'admin', 'import'], default: 'direct' },
  skills: { type: String, default: '' },
  experienceLevel: { type: String, enum: ['junior', 'mid', 'senior', 'lead'], default: 'mid' },
  targetRole: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  bio: { type: String, default: '' },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
  subscriptionEndDate: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  launchpadCustomerId: { type: String, default: null },
  aiCredits: { type: Number, default: 10 },
  resumeGenerations: { type: Number, default: 0 },
  interviewSessions: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.index({ plan: 1 });
userSchema.index({ status: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.suspend = async function(reason) {
  this.status = 'suspended';
  this.suspensionReason = reason;
  return this.save();
};

userSchema.methods.reactivate = async function() {
  this.status = 'active';
  this.suspensionReason = null;
  return this.save();
};

const planLimits = {
  free: { aiCredits: 10 },
  standard: { aiCredits: 50 },
  unlimited: { aiCredits: 999999 },
  agency: { aiCredits: 999999 }
};

userSchema.methods.upgradePlan = async function(plan, subscriptionEndDate = null) {
  this.plan = plan;
  this.status = 'active';
  this.subscriptionEndDate = subscriptionEndDate;
  if (planLimits[plan]) this.aiCredits = planLimits[plan].aiCredits;
  return this.save();
};

userSchema.methods.downgradeToFree = async function() {
  this.plan = 'free';
  this.subscriptionEndDate = null;
  return this.save();
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
