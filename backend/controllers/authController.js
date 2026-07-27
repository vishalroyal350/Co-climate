const User = require('../models/User');
const { isDbConnected, memoryDb } = require('../config/db');

async function registerUser(req, res) {
  try {
    const { name, email, password, role, department, designation, phone, assignedManager, projectId } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isDbConnected()) {
      const existingUser = memoryDb.users.find(u => u.email === normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }

      const normalizedRole = String(role || 'user').toLowerCase();
      const allowedRoles = ['admin', 'manager', 'field_officer', 'user'];
      const safeRole = allowedRoles.includes(normalizedRole) ? normalizedRole : 'user';

      const newUser = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        _id: `mock-uid-${Date.now()}`,
        name: String(name).trim(),
        email: normalizedEmail,
        password: String(password),
        role: safeRole,
        department: department ? String(department).trim() : 'Operations',
        designation: designation ? String(designation).trim() : 'Field Lead',
        assignedManager: assignedManager ? String(assignedManager).trim() : '',
        projectId: projectId ? String(projectId).trim() : '',
        avatar: safeRole === 'manager' ? 'M' : safeRole === 'field_officer' ? 'F' : (safeRole === 'admin' ? 'A' : 'U'),
        phone: phone ? String(phone).trim() : '',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      memoryDb.users.push(newUser);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully (Demo Mode)',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          avatar: newUser.avatar,
          projectId: newUser.projectId
        }
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const normalizedRole = String(role || 'user').toLowerCase();
    const allowedRoles = ['admin', 'manager', 'field_officer', 'user'];
    const safeRole = allowedRoles.includes(normalizedRole) ? normalizedRole : 'user';

    const newUser = await User.create({
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
      role: safeRole,
      department: department ? String(department).trim() : 'Operations',
      designation: designation ? String(designation).trim() : 'Field Lead',
      assignedManager: assignedManager ? String(assignedManager).trim() : '',
      projectId: projectId ? String(projectId).trim() : '',
      avatar: safeRole === 'manager' ? 'M' : safeRole === 'field_officer' ? 'F' : (safeRole === 'admin' ? 'A' : 'U'),
      phone: phone ? String(phone).trim() : '',
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id || newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        avatar: newUser.avatar,
        projectId: newUser.projectId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    const message = error.code === 11000 ? 'Email address is already registered' : 'Unable to create account';
    return res.status(error.code === 11000 ? 409 : 500).json({ success: false, message, error: error.message });
  }
}

async function authenticateUser(req, res) {
  try {
    const { email, password, role, projectId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isDbConnected()) {
      const user = memoryDb.users.find(u => u.email === normalizedEmail);

      if (!user || user.password !== String(password)) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Account is inactive' });
      }

      const requestedRole = String(role || '').toLowerCase();
      if (requestedRole) {
        if (requestedRole === 'admin' && user.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Admin access is restricted to admin accounts' });
        }
        if (requestedRole === 'staff' && !['manager', 'field_officer', 'user'].includes(user.role)) {
          return res.status(403).json({ success: false, message: 'Staff access is restricted to staff accounts' });
        }
        if (requestedRole !== 'admin' && requestedRole !== 'staff' && user.role !== requestedRole) {
          return res.status(403).json({ success: false, message: 'Role mismatch' });
        }
      }

      // Check project restriction for non-admins (only if projectId is provided)
      if (user.role !== 'admin' && projectId) {
        const reqProjId = String(projectId).trim();
        const userProjId = String(user.projectId || '').trim();
        if (reqProjId !== userProjId) {
          return res.status(403).json({ success: false, message: 'Access Denied: You do not have permission to access this Project ID' });
        }
      }

      return res.json({
        success: true,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
          projectId: user.projectId
        },
        token: `demo-token-${user.email}`
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.password !== String(password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const requestedRole = String(role || '').toLowerCase();
    if (requestedRole) {
      if (requestedRole === 'admin' && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access is restricted to admin accounts' });
      }
      if (requestedRole === 'staff' && !['manager', 'field_officer', 'user'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Staff access is restricted to staff accounts' });
      }
      if (requestedRole !== 'admin' && requestedRole !== 'staff' && user.role !== requestedRole) {
        return res.status(403).json({ success: false, message: 'Role mismatch' });
      }
    }

    // Check project restriction for non-admins (only if projectId is provided)
    if (user.role !== 'admin' && projectId) {
      const reqProjId = String(projectId).trim();
      const userProjId = String(user.projectId || '').trim();
      if (reqProjId !== userProjId) {
        return res.status(403).json({ success: false, message: 'Access Denied: You do not have permission to access this Project ID' });
      }
    }

    return res.json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        projectId: user.projectId
      },
      token: `demo-token-${user.email}`
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getUsers(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.users.map(({ password, ...u }) => u));
    }
    const users = await User.find({}, '-password').lean();
    return res.json(users);
  } catch (error) {
    console.error('User fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch users' });
  }
}

async function getUserById(req, res) {
  try {
    const queryId = req.params.id;
    if (!isDbConnected()) {
      const user = memoryDb.users.find(u => u.id === queryId || u._id === queryId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password, ...safeUser } = user;
      return res.json(safeUser);
    }

    const query = mongoose.Types.ObjectId.isValid(queryId) ? { _id: queryId } : { id: queryId };
    const user = await User.findOne(query, '-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
}

async function updateUser(req, res) {
  try {
    const queryId = req.params.id;
    if (!isDbConnected()) {
      const idx = memoryDb.users.findIndex(u => u.id === queryId || u._id === queryId);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      memoryDb.users[idx] = { ...memoryDb.users[idx], ...req.body };
      return res.json({ success: true, user: memoryDb.users[idx] });
    }

    const query = mongoose.Types.ObjectId.isValid(queryId) ? { _id: queryId } : { id: queryId };
    const updatedUser = await User.findOneAndUpdate(query, req.body, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const queryId = req.params.id;
    if (!isDbConnected()) {
      memoryDb.users = memoryDb.users.filter(u => u.id !== queryId && u._id !== queryId);
      return res.json({ success: true, message: 'User deleted successfully' });
    }

    const query = mongoose.Types.ObjectId.isValid(queryId) ? { _id: queryId } : { id: queryId };
    const deletedUser = await User.findOneAndDelete(query);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete user' });
  }
}

module.exports = {
  registerUser,
  authenticateUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
