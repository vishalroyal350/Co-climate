const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'field_officer', 'user'], default: 'user' },
    department: { type: String, default: 'Operations' },
    avatar: { type: String, default: 'U' },
    phone: { type: String, default: '' },
    designation: { type: String, default: '' },
    assignedManager: { type: String, default: '' },
    projectId: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
