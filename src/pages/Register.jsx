import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { homeFor, setSession } from '../auth.js';

function Icon({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.7 19c.8-3.3 3-5.1 6.3-5.1s5.5 1.8 6.3 5.1" />
      </svg>
    );
  }

  if (name === 'shop') {
    return (
      <svg {...common}>
        <path d="M4 9h16" />
        <path d="M5.2 9 6.4 4h11.2L19 9" />
        <path d="M5 9v10h14V9" />
        <path d="M9 19v-5h6v5" />
        <path d="M4 9c0 1.3.9 2.3 2.1 2.3S8.3 10.3 8.3 9c0 1.3.9 2.3 2.1 2.3s2.2-1 2.2-2.3c0 1.3.9 2.3 2.2 2.3s2.1-1 2.1-2.3c0 1.3.9 2.3 2.1 2.3S20 10.3 20 9" />
      </svg>
    );
  }

  if (name === 'eye') {
    return (
      <svg {...common}>
        <path d="M2.8 12s3.2-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.2 5.2-9.2 5.2S2.8 12 2.8 12Z" />
        <circle cx="12" cy="12" r="2.2" />
      </svg>
    );
  }

  if (name === 'eyeOff') {
    return (
      <svg {...common}>
        <path d="m3 3 18 18" />
        <path d="M10.7 6.9A10.3 10.3 0 0 1 12 6.8c6 0 9.2 5.2 9.2 5.2a14.7 14.7 0 0 1-2.2 2.8" />
        <path d="M6.3 6.4A14.6 14.6 0 0 0 2.8 12s3.2 5.2 9.2 5.2c1.1 0 2.1-.2 3-.5" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.2 12 2.5 2.5 5.1-5.2" />
      </svg>
    );
  }

  if (name === 'heart') {
    return (
      <svg {...common}>
        <path d="M20.2 8.7c0 5.1-8.2 10-8.2 10s-8.2-4.9-8.2-10A4.4 4.4 0 0 1 12 6.5a4.4 4.4 0 0 1 8.2 2.2Z" />
        <path d="M12 9.1v4.4" />
        <path d="M9.8 11.3h4.4" />
      </svg>
    );
  }

  return null;
}

const BENEFITS = [
  'Real-time stock availability',
  'Verified medical shops',
  'Save time and money',
  'Safe & reliable',
];

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleCopy = useMemo(
    () =>
      role === 'pharmacy'
        ? {
            button: 'Create partner account',
            namePlaceholder: 'Enter owner / account name',
          }
        : {
            button: 'Create Account',
            namePlaceholder: 'Enter your full name',
          },
    [role]
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
      });

      setSession(data.token, data.user);
      navigate(homeFor(data.user));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to create your account.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="df-register-page">
      <section className="df-register-shell">
        <aside className="df-register-story">
          <div className="df-register-story-copy">
            <span className="df-register-kicker">WELCOME TO DAWA-FIND</span>

            <h1>
              Join
              <br />
              <span>DAWA FIND</span>
            </h1>

            <p className="df-register-lead">
              Find medicines nearby without visiting multiple pharmacies.
            </p>

            <div className="df-register-benefits">
              {BENEFITS.map((item) => (
                <div key={item}>
                  <span className="df-register-benefit-icon">
                    <Icon name="check" size={16} />
                  </span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="df-register-illustration" aria-hidden="true">
            <div className="df-register-health-bubble">
              Better
              <br />
              Healthcare
              <br />
              Closer to You
            </div>

            <div className="df-register-health-orbit">
              <Icon name="heart" size={30} />
            </div>

            <div className="df-register-doctor">
              <div className="df-register-doctor-head" />
              <div className="df-register-doctor-body">
                <span className="df-register-stethoscope" />
                <span className="df-register-tablet" />
              </div>
            </div>

            <div className="df-register-quote">
              “Access to medicines for a healthier tomorrow.”
            </div>
          </div>
        </aside>

        <section className="df-register-card">
          <header>
            <span className="df-register-card-kicker">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Choose how you want to join</p>
          </header>

          <div className="df-register-role-grid">
            <button
              type="button"
              className={`df-register-role ${role === 'user' ? 'active' : ''}`}
              onClick={() => setRole('user')}
              aria-pressed={role === 'user'}
            >
              <span className="df-register-role-icon">
                <Icon name="user" size={31} />
              </span>

              <strong>I&apos;m looking for medicine</strong>
              <span>Patient / Customer</span>
            </button>

            <button
              type="button"
              className={`df-register-role ${
                role === 'pharmacy' ? 'active' : ''
              }`}
              onClick={() => setRole('pharmacy')}
              aria-pressed={role === 'pharmacy'}
            >
              <span className="df-register-role-icon">
                <Icon name="shop" size={31} />
              </span>

              <strong>I run a medical shop</strong>
              <span>Pharmacy Partner</span>
            </button>
          </div>

          <form className="df-register-form" onSubmit={submit}>
            <label>
              <span>Full Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={roleCopy.namePlaceholder}
                autoComplete="name"
                required
              />
            </label>

            <label>
              <span>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Mobile Number <small>Optional</small></span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Enter mobile number"
                autoComplete="tel"
              />
            </label>

            <label>
              <span>Password</span>

              <div className="df-register-password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon
                    name={showPassword ? 'eyeOff' : 'eye'}
                    size={18}
                  />
                </button>
              </div>

              <small className="df-register-helper">
                Minimum 6 characters
              </small>
            </label>

            {error && (
              <div className="df-register-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="df-register-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : roleCopy.button}
            </button>
          </form>

          <p className="df-register-login">
            Already have an account? <Link to="/login">Login</Link>
          </p>

          {role === 'pharmacy' && (
            <div className="df-register-partner-note">
              After registration, we&apos;ll guide you through pharmacy
              onboarding and licence verification.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
