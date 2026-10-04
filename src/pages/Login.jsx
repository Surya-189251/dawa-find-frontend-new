import { useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import api from '../api/client.js';
import { homeFor, setSession } from '../auth.js';

function safeNext(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /^\/(login|register)\b/i.test(value)
  ) {
    return null;
  }

  return value;
}

function Icon({ name, size = 20 }) {
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

  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 3 5.5 5.7v5.7c0 4.2 2.7 7.5 6.5 9.6 3.8-2.1 6.5-5.4 6.5-9.6V5.7L12 3Z" />
        <path d="m9.2 12 1.8 1.8 3.8-4" />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4 4" />
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
  'Find nearby medicines faster',
  'Access verified pharmacy listings',
  'Scan prescriptions with AI assistance',
  'Manage pharmacy stock as a partner',
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const next =
    safeNext(params.get('next')) ||
    safeNext(location.state?.from);

  const expired =
    params.get('expired') === '1';

  const [email, setEmail] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);
  const [error, setError] =
    useState('');
  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } =
        await api.post(
          '/auth/login',
          {
            email:
              email.trim(),
            password,
          }
        );

      setSession(
        data.token,
        data.user
      );

      navigate(
        next ||
          homeFor(
            data.user
          ),
        {
          replace: true,
        }
      );
    } catch (requestError) {
      setError(
        requestError.response
          ?.data?.message ||
          requestError.message ||
          'Unable to sign in.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="df-login-page">
      <section className="df-login-shell">
        <aside className="df-login-story">
          <div className="df-login-story-copy">
            <span className="df-login-kicker">
              WELCOME BACK
            </span>

            <h1>
              Your health,
              <br />
              <span>closer to you.</span>
            </h1>

            <p className="df-login-lead">
              Sign in to continue finding medicines,
              managing pharmacy stock, and using
              Dawa-Find&apos;s prescription tools.
            </p>

            <div className="df-login-benefits">
              {BENEFITS.map(
                (item) => (
                  <div key={item}>
                    <span>
                      <Icon
                        name="check"
                        size={15}
                      />
                    </span>

                    <strong>
                      {item}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>

          <div
            className="df-login-visual"
            aria-hidden="true"
          >
            <div className="df-login-orbit df-login-orbit-one">
              <Icon
                name="search"
                size={27}
              />
            </div>

            <div className="df-login-orbit df-login-orbit-two">
              <Icon
                name="heart"
                size={28}
              />
            </div>

            <div className="df-login-health-card">
              <div className="df-login-health-cross">
                +
              </div>

              <strong>
                DAWA FIND
              </strong>

              <span>
                Medicines nearby.
                <br />
                When you need them.
              </span>
            </div>

            <div className="df-login-visual-caption">
              Secure access for customers,
              pharmacy partners and admins.
            </div>
          </div>
        </aside>

        <section className="df-login-card">
          <div className="df-login-card-inner">
            <header>
              <span className="df-login-card-kicker">
                SIGN IN
              </span>

              <h2>
                Welcome back
              </h2>

              <p>
                Enter your account details to continue.
              </p>
            </header>

            {expired && (
              <div className="df-login-session-note">
                <Icon
                  name="shield"
                  size={17}
                />

                <span>
                  Your session expired. Sign in again to
                  continue where you left off.
                </span>
              </div>
            )}

            <form
              className="df-login-form"
              onSubmit={submit}
            >
              <label>
                <span>
                  Email Address
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>
                  Password
                </span>

                <div className="df-login-password">
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event.target
                          .value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    <Icon
                      name={
                        showPassword
                          ? 'eyeOff'
                          : 'eye'
                      }
                      size={18}
                    />
                  </button>
                </div>
              </label>

              {error && (
                <div
                  className="df-login-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                className="df-login-submit"
                type="submit"
                disabled={
                  submitting
                }
              >
                {submitting
                  ? 'Signing in…'
                  : 'Login'}
              </button>
            </form>

            <div className="df-login-secure">
              <Icon
                name="shield"
                size={16}
              />

              <span>
                Secure sign-in for your Dawa-Find account
              </span>
            </div>

            <div className="df-login-divider">
              <span>
                New to Dawa-Find?
              </span>
            </div>

            <Link
              className="df-login-register"
              to="/register"
            >
              Create an account
            </Link>

            <p className="df-login-home-link">
              <Link to="/">
                Back to medicine search
              </Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
