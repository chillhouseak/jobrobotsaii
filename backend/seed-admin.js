require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobrobots';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  await connectDB();

  const adminEmail = 'admin@jobrobots.ai';
  const adminPassword = 'JobRobots@2024!';
  const adminName = 'Super Admin';
  const adminRole = 'superadmin';

  try {
    // Delete existing admin to recreate fresh
    await Admin.deleteOne({ email: adminEmail });
    console.log('Existing admin removed');

    // Create new admin (password will be hashed by pre-save hook)
    const admin = new Admin({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: adminRole,
      isActive: true
    });

    await admin.save();
    console.log('Admin created successfully!');

    console.log('\n========================================');
    console.log('       ADMIN CREDENTIALS');
    console.log('========================================');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role:     ${adminRole}`);
    console.log('========================================');
    console.log('\nYou can now login at http://localhost:3002/login');
    console.log('========================================\n');

  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the script
createAdmin();
