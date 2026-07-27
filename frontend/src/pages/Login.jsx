import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [activeView, setActiveView] = useState('user-login'); // 'user-login', 'admin-login', 'create-account', 'forgot-password'
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('danger');

  // Input states (Login)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginProjectId, setLoginProjectId] = useState('');

  // Input states (Register)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('manager');
  const [regDesignation, setRegDesignation] = useState('Field Officer');
  const [regPhone, setRegPhone] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regProjectId, setRegProjectId] = useState('');

  // Input states (Forgot Password)
  const [forgotEmail, setForgotEmail] = useState('');

  // Demo user data presets (using secure, unique passwords to prevent browser compromised warnings)
  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setAlertMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlertMessage('');

    // Client-side validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setAlertType('danger');
      setAlertMessage('Email address is required.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setAlertType('danger');
      setAlertMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setAlertType('danger');
      setAlertMessage('Password is required.');
      return;
    }

    if (password.length < 6) {
      setAlertType('danger');
      setAlertMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      await login(email.trim(), password);
      window.location.href = 'index.html';
    } catch (err) {
      setAlertType('danger');
      setAlertMessage(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAlertMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail.trim()) {
      setAlertType('danger');
      setAlertMessage('Email address is required.');
      return;
    }
    if (!emailRegex.test(regEmail.trim())) {
      setAlertType('danger');
      setAlertMessage('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 6) {
      setAlertType('danger');
      setAlertMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      const response = await api.auth.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        department: 'Operations',
        designation: regDesignation.trim(),
        phone: regPhone.trim(),
        projectId: regRole === 'admin' ? 'all' : 'project-1'
      });

      if (response.success) {
        setAlertType('success');
        setAlertMessage('Account created successfully! You can now log in.');
        setEmail(regEmail.trim());
        setPassword(regPassword);
        setActiveView('user-login');
      } else {
        setAlertType('danger');
        setAlertMessage(response.message || 'Registration failed.');
      }
    } catch (err) {
      setAlertType('danger');
      setAlertMessage(err.message || 'Registration failed.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setAlertMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setAlertType('danger');
      setAlertMessage('Please enter a valid email address.');
      return;
    }

    setAlertType('success');
    setAlertMessage(`A password reset link has been simulated and sent to: ${forgotEmail}`);
    setForgotEmail('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo d-flex align-items-center justify-content-center gap-2 mb-0">
            <img src="/icons/logo.jpg" alt="Co-Climate Logo" style={{ height: '40px', width: '40px', objectFit: 'contain', borderRadius: '50%' }} /> 
            Co-Climate
          </h1>
        </div>

        <div className="auth-body">
          {/* Tabs switch user/admin */}
          {(activeView === 'user-login' || activeView === 'admin-login') && (
            <div className="row g-2 mb-4" id="login-tabs">
              <div className="col-6">
                <button 
                  className={`w-100 role-switcher-btn ${activeView === 'user-login' ? 'active' : ''}`} 
                  type="button"
                  onClick={() => {
                    setActiveView('user-login');
                    setAlertMessage('');
                  }}
                >
                  <i className="bi bi-person-fill me-1"></i> User Login
                </button>
              </div>
              <div className="col-6">
                <button 
                  className={`w-100 role-switcher-btn ${activeView === 'admin-login' ? 'active' : ''}`} 
                  type="button"
                  onClick={() => {
                    setActiveView('admin-login');
                    setAlertMessage('');
                  }}
                >
                  <i className="bi bi-shield-lock-fill me-1"></i> Admin Login
                </button>
              </div>
            </div>
          )}

          {/* Validation alert banner */}
          {alertMessage && (
            <div className={`alert alert-${alertType} d-block text-center`} role="alert" style={{ fontSize: '13px' }}>
              {alertMessage}
            </div>
          )}

          {/* VIEW: LOGIN */}
          {(activeView === 'user-login' || activeView === 'admin-login') && (
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3">
                <label htmlFor="auth-email" className="form-label">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="auth-email" 
                    required 
                    placeholder="name@coclimate.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label htmlFor="auth-password" className="form-label mb-1">Password</label>
                  <button 
                    type="button" 
                    className="btn btn-link p-0 text-success fw-bold small text-decoration-none"
                    style={{ fontSize: '12px' }}
                    onClick={() => {
                      setActiveView('forgot-password');
                      setAlertMessage('');
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock"></i></span>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="form-control" 
                    id="auth-password" 
                    required 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary d-flex align-items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Quick Demo Pre-fill Shortcuts using non-compromised secure passwords */}
              <div className="mb-4">
                <label className="form-label d-block text-muted" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Quick Demo Accounts (Click to Fill)
                </label>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fillDemoCredentials('manager@coclimate.org', 'ManagerSecure2026!')}>
                    Project Manager
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fillDemoCredentials('field@coclimate.org', 'FieldSecure2026!')}>
                    Field Officer
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fillDemoCredentials('admin@coclimate.org', 'AdminSecure2026!')}>
                    Standard User
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary-green w-100 justify-content-center py-2.5 mb-3">
                Sign In <i className="bi bi-arrow-right-short ms-1"></i>
              </button>

              <div className="text-center mt-3">
                <span className="text-muted small">Don't have an account? </span>
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-success fw-bold small text-decoration-none"
                  onClick={() => {
                    setActiveView('create-account');
                    setAlertMessage('');
                  }}
                >
                  Create new account
                </button>
              </div>
            </form>
          )}

          {/* VIEW: CREATE ACCOUNT */}
          {activeView === 'create-account' && (
            <form onSubmit={handleRegisterSubmit}>
              <h5 className="fw-bold mb-3 text-success">Create New Account</h5>
              
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control form-control-sm" required placeholder="e.g. Liam Johnson" value={regName} onChange={(e) => setRegName(e.target.value)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control form-control-sm" required placeholder="name@coclimate.org" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group input-group-sm">
                  <input type={regShowPassword ? 'text' : 'password'} className="form-control" required placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setRegShowPassword(!regShowPassword)}>
                    <i className={`bi ${regShowPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label">Account Role</label>
                  <select className="form-select form-select-sm" value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                    <option value="manager">Project Manager</option>
                    <option value="field_officer">Field Officer</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control form-control-sm" placeholder="+91 99999 88888" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Designation</label>
                <input type="text" className="form-control form-control-sm" placeholder="Supervisor" value={regDesignation} onChange={(e) => setRegDesignation(e.target.value)} />
              </div>



              <button type="submit" className="btn btn-primary-green w-100 justify-content-center py-2 mb-3">
                Sign Up <i className="bi bi-person-plus-fill ms-1"></i>
              </button>

              <div className="text-center">
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-success fw-bold small text-decoration-none"
                  onClick={() => {
                    setActiveView('user-login');
                    setAlertMessage('');
                  }}
                >
                  <i className="bi bi-arrow-left-short"></i> Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {activeView === 'forgot-password' && (
            <form onSubmit={handleForgotSubmit}>
              <h5 className="fw-bold mb-2 text-success">Recover Password</h5>
              <p className="text-muted small mb-3">Enter your registered email address and we'll send you a password recovery link.</p>

              <div className="mb-4">
                <label className="form-label">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                  <input type="email" className="form-control" required placeholder="name@coclimate.org" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary-green w-100 justify-content-center py-2 mb-3">
                Send Recovery Instructions <i className="bi bi-envelope-check ms-1"></i>
              </button>

              <div className="text-center">
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-success fw-bold small text-decoration-none"
                  onClick={() => {
                    setActiveView('user-login');
                    setAlertMessage('');
                  }}
                >
                  <i className="bi bi-arrow-left-short"></i> Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
