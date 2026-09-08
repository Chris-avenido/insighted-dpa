import React, { useState, useEffect } from 'react';
import { Shield, BarChart3, Lock, CheckCircle2 } from 'lucide-react';
import styles from './LoginRegistrationScreen.module.css';

/**
 * Reusable Login and Registration Split Screen Component
 *
 * Provides a responsive 50/50 split authentication layout featuring a customizable
 * visual hero panel on the left and interactive login/registration forms on the right.
 */
export const LoginRegistrationScreen = ({
  heroConfig = {},
  authConfig = {},
  regions = [],
  divisions = [],
  initialIsRegistering = false,
  onLogin,
  onRegister,
  onLoginSuccess,
  onRegisterSuccess,
  onFetchRegionsDivisions,
  validateLogin,
  validateRegister,
  className = ''
}) => {
  const {
    backgroundImage = null,
    logos = [],
    title = 'Welcome to',
    titleAccent = 'Personnel Portal',
    subtitle = 'Division-level unfilled plantilla item monitoring & personnel auditing platform.',
    features = [
      {
        icon: <BarChart3 size={20} />,
        title: 'Personnel Auditing',
        description: 'Efficient division-level unfilled item tracking and status reporting.'
      },
      {
        icon: <Shield size={20} />,
        title: 'Secure Validation',
        description: 'Passcode-protected audit revisions and secure personnel profiles.'
      }
    ],
    footerNotice = {
      icon: <Lock size={20} />,
      title: 'Official Education Platform',
      subtitle: '© 2026 Bureau of Human Resource and Organizational Development'
    }
  } = heroConfig;

  const {
    loginTitle = 'Welcome Back',
    loginSubtitle = 'Sign in with your registered account credentials or emergency passcode.',
    registerTitle = 'Create Account',
    registerSubtitle = 'Register your HRMO personnel credentials to request portal access.',
    emailLabel = 'DepEd Email',
    emailPlaceholder = 'user@deped.gov.ph',
    allowPasscodeLogin = true,
    passcodeLength = 6
  } = authConfig;

  const [isRegistering, setIsRegistering] = useState(initialIsRegistering);

  // Form states
  const [isPasscodeMode, setIsPasscodeMode] = useState(false);
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError] = useState('');
  const [signinLoading, setSigninLoading] = useState(false);

  const [regForm, setRegForm] = useState({
    first_name: '',
    last_name: '',
    position: '',
    region_id: '',
    division_id: '',
    deped_email: '',
    password: '',
    confirmPassword: '',
    passcode: ''
  });
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Region/Division options
  const [loadedRegions, setLoadedRegions] = useState(regions);
  const [loadedDivisions, setLoadedDivisions] = useState(divisions);
  const [filteredDivisions, setFilteredDivisions] = useState([]);

  useEffect(() => {
    if (regions.length > 0) setLoadedRegions(regions);
    if (divisions.length > 0) setLoadedDivisions(divisions);
  }, [regions, divisions]);

  useEffect(() => {
    if (typeof onFetchRegionsDivisions === 'function' && loadedRegions.length === 0) {
      Promise.resolve(onFetchRegionsDivisions())
        .then(data => {
          if (data?.regions) setLoadedRegions(data.regions);
          if (data?.divisions) setLoadedDivisions(data.divisions);
        })
        .catch(err => {
          console.warn('Failed to load regions/divisions dropdown options:', err.message);
        });
    }
  }, [onFetchRegionsDivisions, loadedRegions.length]);

  const handleRegionChange = (e) => {
    const regionVal = e.target.value;
    setRegForm(prev => ({ ...prev, region_id: regionVal, division_id: '' }));
    if (!regionVal) {
      setFilteredDivisions([]);
      return;
    }
    const filtered = loadedDivisions.filter(d => {
      if (!d.region_id) return true;
      return d.region_id === regionVal || String(regionVal).includes(String(d.region_id)) || String(d.region_id).includes(String(regionVal));
    });
    setFilteredDivisions(filtered);
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = name === 'passcode' ? value.replace(/\D/g, '').slice(0, passcodeLength) : value;
    setRegForm(prev => ({ ...prev, [name]: cleanValue }));
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setSigninError('');

    if (!signinEmail || !signinEmail.trim()) {
      setSigninError(`Please enter your ${emailLabel.toLowerCase()}.`);
      return;
    }

    if (typeof validateLogin === 'function') {
      const customErr = validateLogin({ email: signinEmail, password: signinPassword, isPasscodeMode });
      if (customErr) {
        setSigninError(customErr);
        return;
      }
    } else {
      if (isPasscodeMode) {
        const regex = new RegExp(`^\\d{${passcodeLength}}$`);
        if (!regex.test(signinPassword.trim())) {
          setSigninError(`Passcode must be exactly ${passcodeLength} numeric digits.`);
          return;
        }
      } else if (!signinPassword) {
        setSigninError('Please enter your password.');
        return;
      }
    }

    setSigninLoading(true);
    try {
      const payload = {
        email: signinEmail.trim(),
        password: isPasscodeMode ? undefined : signinPassword,
        passcode: isPasscodeMode ? signinPassword.trim() : undefined,
        isPasscodeMode
      };
      let res;
      if (typeof onLogin === 'function') {
        res = await onLogin(payload);
      }
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(res);
      }
    } catch (err) {
      setSigninError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSigninLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (regForm.password !== regForm.confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    const passcodeRegex = new RegExp(`^\\d{${passcodeLength}}$`);
    if (!passcodeRegex.test(regForm.passcode.trim())) {
      setSignupError(`Passcode must be exactly ${passcodeLength} numeric digits.`);
      return;
    }

    if (typeof validateRegister === 'function') {
      const customErr = validateRegister(regForm);
      if (customErr) {
        setSignupError(customErr);
        return;
      }
    }

    setSignupLoading(true);
    try {
      let res;
      if (typeof onRegister === 'function') {
        res = await onRegister(regForm);
      }
      if (typeof onRegisterSuccess === 'function') {
        onRegisterSuccess(res);
      }
    } catch (err) {
      setSignupError(err.message || 'Registration failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className={`split-auth-container login-split-container bg-slate-50 text-slate-900 ${className}`}>
      {/* Left Hero Panel (50% Split Desktop, Hidden Mobile) */}
      <div
        className="auth-hero-panel photo-panel text-white p-8 lg:p-12 flex flex-col justify-between relative bg-cover bg-center overflow-hidden min-h-screen"
        style={{
          backgroundImage: backgroundImage
            ? `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.68) 50%, rgba(15, 23, 42, 0.92) 100%), url('${backgroundImage}')`
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
        }}
      >
        {/* Logos Header */}
        {logos.length > 0 && (
          <div className="relative z-10 flex items-center space-x-3 mb-4 flex-wrap gap-y-2">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="bg-white/95 p-2 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.45)] border border-white/60 w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden"
              >
                <img src={logo.src} alt={logo.alt || `Logo ${index + 1}`} className="h-10 w-auto object-contain" />
              </div>
            ))}
          </div>
        )}

        {/* Main Hero Title & Subtitle */}
        <div className="relative z-10 my-auto py-6">
          <h1
            className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-2xl leading-tight"
            style={{ WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.4)', textShadow: '0 6px 18px rgba(0, 0, 0, 0.7)' }}
          >
            {title}
            {titleAccent && (
              <>
                <br />
                <span className="text-amber-400">{titleAccent}</span>
              </>
            )}
          </h1>
          <div className="w-16 h-1.5 bg-amber-400 rounded-full my-4 shadow-lg"></div>
          {subtitle && (
            <p className="text-slate-200 text-sm max-w-md font-medium leading-relaxed drop-shadow">
              {subtitle}
            </p>
          )}
        </div>

        {/* Hero Features & Bottom Banner Box */}
        <div className="relative z-10 mt-auto space-y-4">
          {features.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {features.map((feat, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-700/60 shadow-lg">
                  {feat.icon && (
                    <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center mb-2 shadow-inner font-bold text-lg">
                      {feat.icon}
                    </div>
                  )}
                  <h4 className="font-bold text-sm text-white tracking-wide">{feat.title}</h4>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">{feat.description}</p>
                </div>
              ))}
            </div>
          )}

          {footerNotice && (
            <div className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-slate-700/60 flex items-center gap-3.5 shadow-xl">
              {footerNotice.icon && (
                <div className="p-2.5 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-400 flex-shrink-0">
                  {footerNotice.icon}
                </div>
              )}
              <div>
                <h5 className="font-bold text-xs text-white">{footerNotice.title}</h5>
                <p className="text-slate-300 text-[11px] mt-0.5">{footerNotice.subtitle}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel login-form-container w-full flex items-center justify-center p-6 md:p-12 min-h-screen relative bg-gradient-to-br from-slate-50 via-slate-100/70 to-teal-50/40 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        {!isRegistering ? (
          /* Sign-in View */
          <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl p-8 lg:p-10 rounded-3xl border border-slate-200/80 shadow-2xl space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{loginTitle}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">{loginSubtitle}</p>
            </div>

            {signinError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                {signinError}
              </div>
            )}

            <form onSubmit={handleSignin} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {emailLabel}
                </label>
                <input
                  type="email"
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all font-medium"
                  placeholder={emailPlaceholder}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isPasscodeMode ? `${passcodeLength}-Digit Passcode` : 'Password'}
                  </label>
                  {allowPasscodeLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPasscodeMode(!isPasscodeMode);
                        setSigninError('');
                        setSigninPassword('');
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 hover:underline font-semibold cursor-pointer"
                    >
                      {isPasscodeMode ? 'Use password instead' : 'Use passcode instead'}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="password"
                    value={signinPassword}
                    onChange={(e) => {
                      const val = isPasscodeMode ? e.target.value.replace(/\D/g, '').slice(0, passcodeLength) : e.target.value;
                      setSigninPassword(val);
                    }}
                    inputMode={isPasscodeMode ? 'numeric' : 'text'}
                    pattern={isPasscodeMode ? '[0-9]*' : undefined}
                    maxLength={isPasscodeMode ? passcodeLength : undefined}
                    autoComplete={isPasscodeMode ? 'off' : 'current-password'}
                    required
                    className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all font-medium ${
                      isPasscodeMode ? 'font-mono tracking-widest' : ''
                    }`}
                    placeholder={isPasscodeMode ? '•'.repeat(passcodeLength) : '••••••••'}
                  />
                  {isPasscodeMode && new RegExp(`^\\d{${passcodeLength}}$`).test(signinPassword) && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center justify-center pointer-events-none">
                      <CheckCircle2 size={18} className="stroke-[2.5]" />
                    </span>
                  )}
                </div>
                {isPasscodeMode && (
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Enter your assigned {passcodeLength}-digit access passcode.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={signinLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {signinLoading ? 'Signing in…' : 'Sign In to Dashboard'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-sm rounded-xl border border-slate-200/80 shadow-sm transition-all duration-200 text-center cursor-pointer mt-4"
            >
              Create an Account
            </button>
          </div>
        ) : (
          /* Sign-up View */
          <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl p-8 lg:p-10 rounded-3xl border border-slate-200/80 shadow-2xl space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{registerTitle}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">{registerSubtitle}</p>
            </div>

            {signupError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                {signupError}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={regForm.first_name}
                    onChange={handleRegChange}
                    required
                    className={styles.signupInput}
                    placeholder="First"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={regForm.last_name}
                    onChange={handleRegChange}
                    required
                    className={styles.signupInput}
                    placeholder="Last"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Position / Title</label>
                <input
                  type="text"
                  name="position"
                  value={regForm.position}
                  onChange={handleRegChange}
                  required
                  className={styles.signupInput}
                  placeholder="HRMO II / Auditor"
                />
              </div>

              {(loadedRegions.length > 0 || loadedDivisions.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Region</label>
                    <select
                      name="region_id"
                      value={regForm.region_id}
                      onChange={handleRegionChange}
                      required
                      className={styles.signupSelect}
                    >
                      <option value="">Select Region</option>
                      {loadedRegions.map(r => {
                        const val = r.name || r.id;
                        return <option key={val} value={val}>{val}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Division</label>
                    <select
                      name="division_id"
                      value={regForm.division_id}
                      onChange={handleRegChange}
                      required
                      disabled={!regForm.region_id}
                      className={styles.signupSelect}
                    >
                      <option value="">Select Division</option>
                      {filteredDivisions.map(d => {
                        const val = d.office_name || d.name || d.id;
                        return <option key={val} value={val}>{val}</option>;
                      })}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{emailLabel}</label>
                <input
                  type="email"
                  name="deped_email"
                  value={regForm.deped_email}
                  onChange={handleRegChange}
                  autoComplete="username"
                  required
                  className={styles.signupInput}
                  placeholder={emailPlaceholder}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  autoComplete="new-password"
                  required
                  className={styles.signupInput}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={regForm.confirmPassword}
                  onChange={handleRegChange}
                  autoComplete="new-password"
                  required
                  className={styles.signupInput}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Passcode <span className="text-slate-400 font-normal text-[9px]">({passcodeLength}-digit Emergency Credential)</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="passcode"
                    value={regForm.passcode}
                    onChange={handleRegChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={passcodeLength}
                    required
                    autoComplete="off"
                    className={`${styles.signupInput} pr-9 font-mono tracking-widest transition-all ${
                      new RegExp(`^\\d{${passcodeLength}}$`).test(regForm.passcode)
                        ? '!border-emerald-500 !bg-emerald-50/40 !text-emerald-950 ring-2 ring-emerald-500/20'
                        : ''
                    }`}
                    placeholder="123456"
                  />
                  {new RegExp(`^\\d{${passcodeLength}}$`).test(regForm.passcode) && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center justify-center pointer-events-none transition-transform scale-110">
                      <CheckCircle2 size={16} className="stroke-[2.5]" />
                    </span>
                  )}
                </div>
                {regForm.passcode.length > 0 && regForm.passcode.length < passcodeLength && (
                  <span className="text-[10px] text-amber-600 font-medium block mt-1">
                    {regForm.passcode.length}/{passcodeLength} digits entered
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full p-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded shadow transition-all cursor-pointer"
              >
                {signupLoading ? 'Registering…' : 'Register Account'}
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-teal-600 font-semibold hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
