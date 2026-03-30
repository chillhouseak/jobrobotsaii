import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
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
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  name: { type: String, required: [true, 'Name is required'], trim: true },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  loginHistory: [{ timestamp: { type: Date, default: Date.now }, ip: String, userAgent: String }]
}, { timestamps: true });

adminSchema.index({ role: 1 });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.password && this.password.startsWith('$2')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.updateLastLogin = async function(ip, userAgent) {
  this.lastLogin = new Date();
  this.loginHistory.push({ timestamp: new Date(), ip, userAgent });
  if (this.loginHistory.length > 10) this.loginHistory = this.loginHistory.slice(-10);
  return this.save();
};

adminSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
