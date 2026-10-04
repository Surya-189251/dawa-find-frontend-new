import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import api from '../api/client.js';
import {
  getToken,
  getUser,
  setSession,
} from '../auth.js';

const DEFAULT_LOCATION = [16.5062, 80.648];

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Pharmacy Details' },
  { id: 3, label: 'Location' },
  { id: 4, label: 'Operating Hours' },
  { id: 5, label: 'Review' },
];

const BADGE = {
  pending: {
    cls: 'amber',
    label: 'Awaiting admin verification',
  },
  verified: {
    cls: 'green',
    label: 'Verified partner',
  },
  rejected: {
    cls: 'red',
    label: 'Rejected',
  },
  unverified: {
    cls: '',
    label: 'Unverified',
  },
};

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

  if (name === 'check') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.2 12 2.5 2.5 5.1-5.2" />
      </svg>
    );
  }

  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m15 8 4 4-4 4" />
      </svg>
    );
  }

  if (name === 'back') {
    return (
      <svg {...common}>
        <path d="M19 12H5" />
        <path d="m9 8-4 4 4 4" />
      </svg>
    );
  }

  if (name === 'location') {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.4" />
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
      </svg>
    );
  }

  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

  if (name === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.8 19c.7-3.2 2.4-5 5.2-5s4.5 1.8 5.2 5" />
        <path d="M15 6.1a3 3 0 0 1 0 5.8" />
        <path d="M16.4 14.3c2 .5 3.2 2.1 3.8 4.7" />
      </svg>
    );
  }

  return null;
}

function LocationPicker({ position, onPick }) {
  useMapEvents({
    click: (event) => {
      onPick([
        event.latlng.lat,
        event.latlng.lng,
      ]);
    },
  });

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const { lat, lng } =
            event.target.getLatLng();

          onPick([lat, lng]);
        },
      }}
    />
  );
}

function MapRecenter({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position);
  }, [map, position]);

  return null;
}

function Stepper({ currentStep, onStep }) {
  return (
    <div className="df-onboard-stepper">
      {STEPS.map((step, index) => {
        const complete = currentStep > step.id;
        const active = currentStep === step.id;

        return (
          <div
            className={`df-onboard-step-wrap ${
              active ? 'active' : ''
            } ${complete ? 'complete' : ''}`}
            key={step.id}
          >
            <button
              type="button"
              className="df-onboard-step"
              onClick={() => onStep(step.id)}
              aria-current={active ? 'step' : undefined}
            >
              <span>
                {complete ? (
                  <Icon name="check" size={14} />
                ) : (
                  step.id
                )}
              </span>

              <strong>{step.label}</strong>
            </button>

            {index < STEPS.length - 1 && (
              <i className="df-onboard-step-line" />
            )}
          </div>
        );
      })}
    </div>
  );
}

const BENEFITS = [
  'Get more customers',
  'List your inventory',
  'Build trust with verification',
  'Help your community',
];

export default function PartnerShop() {
  const user = getUser();

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [duplicates, setDuplicates] = useState([]);
  const [pos, setPos] = useState(DEFAULT_LOCATION);

  const [form, setForm] = useState({
    name: '',
    address: '',
    landmark: '',
    phone: '',
    hours: '',
    licenceNo: '',
  });

  const set = (key) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  useEffect(() => {
    api
      .get('/partner/shop')
      .then(({ data }) => {
        setShop(data);

        setForm({
          name: data.name || '',
          address: data.address || '',
          landmark: data.landmark || '',
          phone: data.phone || '',
          hours: data.hours || '',
          licenceNo: data.licenceNo || '',
        });

        const [lon, lat] =
          data.location?.coordinates || [];

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon)
        ) {
          setPos([lat, lon]);
        }
      })
      .catch((requestError) => {
        if (
          requestError.response?.data?.code !==
          'NO_SHOP'
        ) {
          setError(
            requestError.response?.data?.message ||
              requestError.message
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const badge =
    BADGE[shop?.verificationStatus] ||
    BADGE.unverified;

  const validationMessage = useMemo(() => {
    if (step === 1) {
      if (!form.name.trim()) {
        return 'Enter the shop name before continuing.';
      }

      if (!form.phone.trim()) {
        return 'Enter the pharmacy phone number before continuing.';
      }
    }

    if (step === 2 && !form.licenceNo.trim()) {
      return 'Enter the drug licence number before continuing.';
    }

    if (step === 3 && !form.address.trim()) {
      return 'Enter the pharmacy address before continuing.';
    }

    return '';
  }, [form, step]);

  const goNext = () => {
    setError('');

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setStep((current) =>
      Math.min(5, current + 1)
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const goBack = () => {
    setError('');

    setStep((current) =>
      Math.max(1, current - 1)
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const jumpToStep = (nextStep) => {
    if (nextStep <= step) {
      setStep(nextStep);
      setError('');
      return;
    }

    if (!validationMessage) {
      setStep(nextStep);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(
        'Location access is not supported by this browser.'
      );
      return;
    }

    setNotice(
      'Trying to detect your current location…'
    );
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPos([
          position.coords.latitude,
          position.coords.longitude,
        ]);

        setNotice(
          'Location updated. Drag the pin if you need to correct it.'
        );
      },
      (locationError) => {
        setNotice('');

        setError(
          locationError.code === 1
            ? 'Location permission was denied. You can still place the pin manually on the map.'
            : 'Could not detect your current location. You can still place the pin manually on the map.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const submit = async (event) => {
    event?.preventDefault?.();

    setError('');
    setNotice('');
    setDuplicates([]);
    setSaving(true);

    const body = {
      ...form,
      lat: pos[0],
      lon: pos[1],
    };

    try {
      if (shop) {
        const { data } = await api.patch(
          '/partner/shop',
          body
        );

        setShop(data);
        setNotice(
          'Shop profile updated successfully.'
        );
      } else {
        const { data } = await api.post(
          '/partner/shop',
          body
        );

        setShop(data.pharmacy);
        setDuplicates(
          data.possibleDuplicates || []
        );

        setNotice(
          'Shop registered. An admin must verify your licence before you can publish stock.'
        );

        const me = await api.get('/auth/me');

        setSession(
          getToken(),
          me.data.user
        );
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to save your pharmacy.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="df-onboard-page">
        <div className="df-onboard-loading">
          <span />
          <strong>Loading pharmacy setup…</strong>
        </div>
      </main>
    );
  }

  return (
    <main className="df-onboard-page">
      <section className="df-onboard-shell">
        <header className="df-onboard-header">
          <div>
            <span className="df-onboard-kicker">
              DAWA-FIND PARTNER
            </span>

            <h1>
              {shop
                ? 'Pharmacy Profile'
                : 'Pharmacy Onboarding'}
            </h1>

            <p>
              {shop
                ? 'Keep your pharmacy details accurate and up to date.'
                : 'Join DAWA FIND and connect with more customers.'}
            </p>
          </div>

          {shop && (
            <span
              className={`df-onboard-status ${badge.cls}`}
            >
              <Icon name="shield" size={16} />
              {badge.label}
            </span>
          )}
        </header>

        <Stepper
          currentStep={step}
          onStep={jumpToStep}
        />

        {shop?.verificationStatus ===
          'pending' && (
          <div className="df-onboard-alert amber">
            <strong>Verification pending.</strong>
            <span>
              You can review your stock board, but
              publishing availability stays locked until
              an admin approves your licence.
            </span>
          </div>
        )}

        {shop?.verificationStatus ===
          'rejected' && (
          <div className="df-onboard-alert error">
            <strong>Licence rejected.</strong>
            <span>
              {shop.rejectionReason ||
                'No rejection reason was provided.'}{' '}
              Update your licence information and save
              again to resubmit.
            </span>
          </div>
        )}

        {shop?.verificationStatus ===
          'verified' && (
          <div className="df-onboard-alert success">
            <strong>Your pharmacy is live.</strong>
            <span>
              Continue to the{' '}
              <Link to="/partner/inventory">
                stock board
              </Link>{' '}
              to publish medicine availability.
            </span>
          </div>
        )}

        {notice && (
          <div className="df-onboard-alert info">
            {notice}
          </div>
        )}

        {error && (
          <div
            className="df-onboard-alert error"
            role="alert"
          >
            {error}
          </div>
        )}

        {duplicates.length > 0 && (
          <div className="df-onboard-alert amber df-onboard-duplicates">
            <strong>
              {duplicates.length} similar pharmacy
              {duplicates.length === 1 ? '' : 's'} found
              nearby.
            </strong>

            <ul>
              {duplicates.map((duplicate) => (
                <li key={duplicate._id}>
                  <strong>{duplicate.name}</strong>
                  <span>
                    {duplicate.address || 'Address unavailable'}
                    {duplicate.source
                      ? ` · ${duplicate.source}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>

            <small>
              Your registration still went through. If one
              of these is the same pharmacy, let an admin
              know.
            </small>
          </div>
        )}

        <div className="df-onboard-layout">
          <form
            className="df-onboard-form-card"
            onSubmit={submit}
          >
            {step === 1 && (
              <section className="df-onboard-panel">
                <div className="df-onboard-panel-heading">
                  <span>
                    <Icon name="shop" size={20} />
                  </span>

                  <div>
                    <h2>Basic Information</h2>
                    <p>
                      Tell us who you are and how customers
                      can contact your pharmacy.
                    </p>
                  </div>
                </div>

                <div className="df-onboard-field-grid">
                  <label className="full">
                    <span>Shop Name</span>
                    <input
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Enter shop name"
                      required
                    />
                  </label>

                  <label className="full">
                    <span>Owner Name</span>
                    <input
                      value={
                        user?.name || ''
                      }
                      placeholder="Owner name"
                      readOnly
                    />
                    <small>
                      This comes from your Dawa-Find
                      account.
                    </small>
                  </label>

                  <label>
                    <span>Phone Number</span>
                    <input
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="+91 9000000001"
                      autoComplete="tel"
                      required
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      value={
                        user?.email || ''
                      }
                      placeholder="Email address"
                      readOnly
                    />
                  </label>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="df-onboard-panel">
                <div className="df-onboard-panel-heading">
                  <span>
                    <Icon name="shield" size={20} />
                  </span>

                  <div>
                    <h2>Pharmacy Details</h2>
                    <p>
                      Licence information helps Dawa-Find
                      verify legitimate pharmacy partners.
                    </p>
                  </div>
                </div>

                <div className="df-onboard-field-grid">
                  <label className="full">
                    <span>Drug Licence Number</span>

                    <input
                      value={form.licenceNo}
                      onChange={set('licenceNo')}
                      placeholder="AP/20B/1234"
                      required
                    />

                    {shop && (
                      <small>
                        Changing the licence number may
                        require verification again.
                      </small>
                    )}
                  </label>

                  <label className="full">
                    <span>Nearby Landmark</span>
                    <input
                      value={form.landmark}
                      onChange={set('landmark')}
                      placeholder="e.g. Opp. Benz Circle"
                    />
                    <small>
                      Optional, but useful for customers
                      trying to find the shop.
                    </small>
                  </label>

                  <div className="df-onboard-info-box full">
                    <Icon name="shield" size={19} />

                    <div>
                      <strong>
                        Admin verification
                      </strong>
                      <span>
                        Your pharmacy can be registered
                        immediately, but stock publishing
                        is enabled after licence approval.
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="df-onboard-panel">
                <div className="df-onboard-panel-heading">
                  <span>
                    <Icon name="location" size={20} />
                  </span>

                  <div>
                    <h2>Location</h2>
                    <p>
                      Enter the address and place the pin
                      exactly where customers should find
                      your pharmacy.
                    </p>
                  </div>
                </div>

                <div className="df-onboard-field-grid">
                  <label className="full">
                    <span>Full Address</span>
                    <input
                      value={form.address}
                      onChange={set('address')}
                      placeholder="Enter pharmacy address"
                      required
                    />
                  </label>
                </div>

                <div className="df-onboard-map-toolbar">
                  <div>
                    <strong>Shop pin</strong>
                    <span>
                      {pos[0].toFixed(5)},{' '}
                      {pos[1].toFixed(5)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                  >
                    <Icon name="location" size={15} />
                    Use current location
                  </button>
                </div>

                <div className="df-onboard-map">
                  <MapContainer
                    center={pos}
                    zoom={15}
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />

                    <MapRecenter
                      position={pos}
                    />

                    <LocationPicker
                      position={pos}
                      onPick={setPos}
                    />
                  </MapContainer>
                </div>

                <p className="df-onboard-map-help">
                  Click anywhere on the map or drag the pin
                  for manual correction.
                </p>
              </section>
            )}

            {step === 4 && (
              <section className="df-onboard-panel">
                <div className="df-onboard-panel-heading">
                  <span>
                    <Icon name="clock" size={20} />
                  </span>

                  <div>
                    <h2>Operating Hours</h2>
                    <p>
                      Tell customers when your pharmacy is
                      normally available.
                    </p>
                  </div>
                </div>

                <div className="df-onboard-field-grid">
                  <label className="full">
                    <span>Opening Hours</span>
                    <input
                      value={form.hours}
                      onChange={set('hours')}
                      placeholder="Mon - Sun · 8:00 am - 11:00 pm"
                    />
                    <small>
                      Example: Mon - Sat · 8:00 am - 10:00
                      pm, Sun · 9:00 am - 2:00 pm
                    </small>
                  </label>

                  <div className="df-onboard-hours-preview full">
                    <Icon name="clock" size={22} />

                    <div>
                      <strong>
                        Customer-facing hours
                      </strong>

                      <span>
                        {form.hours.trim() ||
                          'Hours not added yet'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 5 && (
              <section className="df-onboard-panel">
                <div className="df-onboard-panel-heading">
                  <span>
                    <Icon name="check" size={20} />
                  </span>

                  <div>
                    <h2>Review & Submit</h2>
                    <p>
                      Check the details below before sending
                      them for verification.
                    </p>
                  </div>
                </div>

                <div className="df-onboard-review">
                  <article>
                    <span>Pharmacy</span>
                    <strong>
                      {form.name || '—'}
                    </strong>
                    <small>
                      Owner: {user?.name || '—'}
                    </small>
                  </article>

                  <article>
                    <span>Contact</span>
                    <strong>
                      {form.phone || '—'}
                    </strong>
                    <small>
                      {user?.email || '—'}
                    </small>
                  </article>

                  <article>
                    <span>Drug Licence</span>
                    <strong>
                      {form.licenceNo || '—'}
                    </strong>
                    <small>
                      Admin verification required
                    </small>
                  </article>

                  <article>
                    <span>Location</span>
                    <strong>
                      {form.address || '—'}
                    </strong>
                    <small>
                      {form.landmark ||
                        `${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}`}
                    </small>
                  </article>

                  <article>
                    <span>Operating Hours</span>
                    <strong>
                      {form.hours ||
                        'Not provided'}
                    </strong>
                    <small>
                      Can be updated later
                    </small>
                  </article>
                </div>

                <div className="df-onboard-review-note">
                  <Icon name="shield" size={20} />

                  <div>
                    <strong>
                      What happens next?
                    </strong>

                    <span>
                      Your profile is saved first. An admin
                      then reviews the licence before live
                      stock publishing is enabled.
                    </span>
                  </div>
                </div>
              </section>
            )}

            <div className="df-onboard-actions">
              {step > 1 ? (
                <button
                  type="button"
                  className="df-onboard-back"
                  onClick={goBack}
                  disabled={saving}
                >
                  <Icon name="back" size={17} />
                  Back
                </button>
              ) : (
                <span />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  className="df-onboard-next"
                  onClick={goNext}
                >
                  Next
                  <Icon name="arrow" size={17} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="df-onboard-next"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : shop
                      ? 'Save Changes'
                      : 'Register Pharmacy'}

                  {!saving && (
                    <Icon
                      name="check"
                      size={17}
                    />
                  )}
                </button>
              )}
            </div>
          </form>

          <aside className="df-onboard-side-card">
            <div className="df-onboard-shop-visual">
              <div className="df-onboard-shop-cross">
                +
              </div>

              <div className="df-onboard-shop-sign">
                PHARMACY
              </div>

              <div className="df-onboard-shop-building">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="df-onboard-side-benefits">
              {BENEFITS.map((item) => (
                <div key={item}>
                  <span>
                    <Icon name="check" size={15} />
                  </span>

                  <strong>{item}</strong>
                </div>
              ))}
            </div>

            <blockquote>
              “Partner with us for a healthier society.”
            </blockquote>

            {shop && (
              <div className="df-onboard-side-links">
                <Link to="/partner/inventory">
                  Open stock board
                </Link>

                {shop._id && (
                  <Link
                    to={`/pharmacy/${shop._id}`}
                  >
                    View public page
                  </Link>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
