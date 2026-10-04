import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const TABS = [
  'pending',
  'verified',
  'rejected',
  'unverified',
];

const TAB_LABELS = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  unverified: 'Unverified',
};

function Icon({
  name,
  size = 20,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (name === 'overview') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === 'pharmacy') {
    return (
      <svg {...common}>
        <path d="M4 9h16" />
        <path d="M5 9v11h14V9" />
        <path d="M6 4h12l2 5H4l2-5Z" />
        <path d="M9 14h6" />
        <path d="M12 11v6" />
      </svg>
    );
  }

  if (name === 'verify') {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.7 2.8 8.5 7 10 4.2-1.5 7-5.3 7-10V6l-7-3Z" />
        <path d="m9.3 12.2 1.7 1.7 3.8-4" />
      </svg>
    );
  }

  if (name === 'inventory') {
    return (
      <svg {...common}>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

  if (name === 'report') {
    return (
      <svg {...common}>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (name === 'refresh') {
    return (
      <svg {...common}>
        <path d="M20 6v5h-5" />
        <path d="M4 18v-5h5" />
        <path d="M18.5 9A7 7 0 0 0 6.3 6.3L4 8" />
        <path d="M5.5 15A7 7 0 0 0 17.7 17.7L20 16" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === 'close') {
    return (
      <svg {...common}>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </svg>
    );
  }

  if (name === 'warning') {
    return (
      <svg {...common}>
        <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  return null;
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN').format(number);
}

function percentage(part, total) {
  const safePart = Number(part) || 0;
  const safeTotal = Number(total) || 0;

  if (safeTotal <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (safePart / safeTotal) * 100
      )
    )
  );
}

function statusLabel(status) {
  return (
    TAB_LABELS[status] ||
    'Unverified'
  );
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

export default function AdminPharmacies() {
  const [tab, setTab] =
    useState('pending');

  const [items, setItems] =
    useState([]);

  const [
    pendingItems,
    setPendingItems,
  ] = useState([]);

  const [metrics, setMetrics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [busyId, setBusyId] =
    useState(null);

  const [
    activeView,
    setActiveView,
  ] = useState('overview');

  const [users, setUsers] =
    useState([]);

  const [
    userCounts,
    setUserCounts,
  ] = useState({
    total: 0,
    user: 0,
    pharmacy: 0,
    admin: 0,
  });

  const [
    userLoading,
    setUserLoading,
  ] = useState(false);

  const [
    usersLoaded,
    setUsersLoaded,
  ] = useState(false);

  const [
    userSearch,
    setUserSearch,
  ] = useState('');

  const [
    userRole,
    setUserRole,
  ] = useState('all');

  const [
    adminSettings,
    setAdminSettings,
  ] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          'dawaAdminSettings'
        );

      if (saved) {
        return {
          autoRefresh: false,
          refreshSeconds: 60,
          confirmDecisions: true,
          compactTables: false,
          ...JSON.parse(saved),
        };
      }
    } catch {
      // Ignore invalid local settings.
    }

    return {
      autoRefresh: false,
      refreshSeconds: 60,
      confirmDecisions: true,
      compactTables: false,
    };
  });

  const [
    settingsSaved,
    setSettingsSaved,
  ] = useState(false);

  useEffect(() => {
    document.body.classList.add(
      'df-admin-mode'
    );

    return () => {
      document.body.classList.remove(
        'df-admin-mode'
      );
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        listResponse,
        metricsResponse,
        pendingResponse,
      ] = await Promise.all([
        api.get(
          `/admin/pharmacies?status=${tab}`
        ),
        api.get('/admin/metrics'),
        api.get(
          '/admin/pharmacies?status=pending'
        ),
      ]);

      setItems(
        Array.isArray(
          listResponse.data?.items
        )
          ? listResponse.data.items
          : []
      );

      setMetrics(
        metricsResponse.data || null
      );

      setPendingItems(
        Array.isArray(
          pendingResponse.data?.items
        )
          ? pendingResponse.data.items
          : []
      );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          'Unable to load admin data.'
      );
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const loadUsers =
    useCallback(async () => {
      setUserLoading(true);
      setError('');

      try {
        const response =
          await api.get(
            '/admin/users'
          );

        setUsers(
          Array.isArray(
            response.data?.items
          )
            ? response.data.items
            : []
        );

        setUserCounts({
          total:
            Number(
              response.data
                ?.roleCounts
                ?.total
            ) || 0,
          user:
            Number(
              response.data
                ?.roleCounts
                ?.user
            ) || 0,
          pharmacy:
            Number(
              response.data
                ?.roleCounts
                ?.pharmacy
            ) || 0,
          admin:
            Number(
              response.data
                ?.roleCounts
                ?.admin
            ) || 0,
        });

        setUsersLoaded(true);
      } catch (e) {
        setError(
          e.response?.data?.message ||
            e.message ||
            'Unable to load users.'
        );
      } finally {
        setUserLoading(false);
      }
    }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (
      [
        'users',
        'reports',
      ].includes(
        activeView
      ) &&
      !usersLoaded
    ) {
      loadUsers();
    }
  }, [
    activeView,
    loadUsers,
    usersLoaded,
  ]);

  useEffect(() => {
    if (
      !adminSettings.autoRefresh
    ) {
      return undefined;
    }

    const seconds =
      Math.max(
        15,
        Number(
          adminSettings
            .refreshSeconds
        ) || 60
      );

    const interval =
      window.setInterval(() => {
        if (
          activeView === 'users'
        ) {
          loadUsers();
        } else {
          load();
        }
      }, seconds * 1000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    activeView,
    adminSettings.autoRefresh,
    adminSettings.refreshSeconds,
    load,
    loadUsers,
  ]);

  const decide = async (
    id,
    decision
  ) => {
    if (
      adminSettings
        .confirmDecisions
    ) {
      const approved =
        window.confirm(
          decision ===
            'verified'
            ? 'Approve this pharmacy?'
            : 'Reject this pharmacy?'
        );

      if (!approved) {
        return;
      }
    }

    let reason;

    if (decision === 'rejected') {
      reason =
        window.prompt(
          'Enter the reason for rejecting this pharmacy application:'
        ) || 'Not specified';
    }

    setBusyId(id);
    setError('');

    try {
      await api.patch(
        `/admin/pharmacies/${id}/verify`,
        {
          decision,
          reason,
        }
      );

      await load();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          'Unable to update pharmacy verification status.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const totalCount =
    metrics?.pharmacies?.total || 0;

  const pendingCount =
    metrics?.pharmacies?.pending || 0;

  const verifiedCount =
    metrics?.pharmacies?.verified || 0;

  const rejectedCount =
    metrics?.pharmacies?.rejected || 0;

  const unverifiedCount =
    metrics?.pharmacies?.unverified || 0;

  const inventoryRows =
    metrics?.freshness?.totalRows || 0;

  const updatedRows =
    metrics?.freshness
      ?.rowsUpdatedLast24h || 0;

  const activeShops =
    metrics?.freshness
      ?.shopsActiveLast24h || 0;

  const freshnessPercent =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          metrics?.freshness
            ?.percentFresh
        ) || 0
      )
    );

  const verificationRate =
    percentage(
      verifiedCount,
      totalCount
    );

  const recentPending =
    pendingItems.slice(0, 4);

  const breakdown = useMemo(
    () => [
      {
        key: 'verified',
        label: 'Verified',
        value: verifiedCount,
        percent: percentage(
          verifiedCount,
          totalCount
        ),
      },
      {
        key: 'pending',
        label: 'Pending',
        value: pendingCount,
        percent: percentage(
          pendingCount,
          totalCount
        ),
      },
      {
        key: 'unverified',
        label: 'Unverified',
        value: unverifiedCount,
        percent: percentage(
          unverifiedCount,
          totalCount
        ),
      },
      {
        key: 'rejected',
        label: 'Rejected',
        value: rejectedCount,
        percent: percentage(
          rejectedCount,
          totalCount
        ),
      },
    ],
    [
      pendingCount,
      rejectedCount,
      totalCount,
      unverifiedCount,
      verifiedCount,
    ]
  );

  const filteredUsers =
    useMemo(() => {
      const query =
        userSearch
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          if (
            userRole !== 'all' &&
            user.role !== userRole
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const haystack = [
            user.name,
            user.email,
            user.phone,
            user.role,
            user.pharmacy?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );
    }, [
      userRole,
      userSearch,
      users,
    ]);

  const exportReportCsv =
    () => {
      const rows = [
        [
          'Dawa-Find Admin Report',
          '',
        ],
        [
          'Generated',
          new Date().toLocaleString(
            'en-IN'
          ),
        ],
        [],
        [
          'Metric',
          'Value',
        ],
        [
          'Total Pharmacies',
          totalCount,
        ],
        [
          'Verified Pharmacies',
          verifiedCount,
        ],
        [
          'Pending Pharmacies',
          pendingCount,
        ],
        [
          'Unverified Pharmacies',
          unverifiedCount,
        ],
        [
          'Rejected Pharmacies',
          rejectedCount,
        ],
        [
          'Verification Rate',
          `${verificationRate}%`,
        ],
        [
          'Inventory Rows',
          inventoryRows,
        ],
        [
          'Fresh Inventory Rows',
          updatedRows,
        ],
        [
          'Inventory Freshness',
          `${freshnessPercent}%`,
        ],
        [
          'Active Shops (24h)',
          activeShops,
        ],
        [],
        [
          'User Accounts',
          userCounts.total,
        ],
        [
          'Customers',
          userCounts.user,
        ],
        [
          'Pharmacy Accounts',
          userCounts.pharmacy,
        ],
        [
          'Admin Accounts',
          userCounts.admin,
        ],
      ];

      const csv = rows
        .map((row) =>
          row
            .map((cell) =>
              `"${String(
                cell ?? ''
              ).replace(
                /"/g,
                '""'
              )}"`
            )
            .join(',')
        )
        .join('\n');

      const blob = new Blob(
        [csv],
        {
          type:
            'text/csv;charset=utf-8',
        }
      );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.href = url;
      link.download =
        `dawa-find-admin-report-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    };

  const saveAdminSettings =
    (nextSettings) => {
      const merged = {
        ...adminSettings,
        ...nextSettings,
      };

      setAdminSettings(merged);

      localStorage.setItem(
        'dawaAdminSettings',
        JSON.stringify(merged)
      );

      setSettingsSaved(true);

      window.setTimeout(
        () =>
          setSettingsSaved(false),
        1800
      );
    };

  const dateLabel =
    new Intl.DateTimeFormat(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    ).format(new Date());

  const scrollToSection =
    (id) => {
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    };

  return (
    <main className="df-admin-page">
      <aside className="df-admin-sidebar">
        <div className="df-admin-brand">
          <div className="df-admin-brand-mark">
            <span />
          </div>

          <div>
            <strong>
              Dawa-Find
            </strong>

            <span>
              Admin Panel
            </span>
          </div>
        </div>

        <nav className="df-admin-nav">
          <button
            type="button"
            className={
              activeView ===
              'overview'
                ? 'active'
                : ''
            }
            onClick={() => {
              setActiveView(
                'overview'
              );

              setTimeout(
                () =>
                  scrollToSection(
                    'admin-overview'
                  ),
                0
              );
            }}
          >
            <Icon name="overview" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView(
                'overview'
              );

              setTimeout(
                () =>
                  scrollToSection(
                    'admin-pharmacies'
                  ),
                0
              );
            }}
          >
            <Icon name="pharmacy" />
            <span>Pharmacies</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView(
                'overview'
              );
              setTab('pending');

              setTimeout(
                () =>
                  scrollToSection(
                    'admin-verifications'
                  ),
                0
              );
            }}
          >
            <Icon name="verify" />
            <span>
              Verification Requests
            </span>

            {pendingCount > 0 && (
              <b>
                {pendingCount}
              </b>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView(
                'overview'
              );

              setTimeout(
                () =>
                  scrollToSection(
                    'admin-inventory'
                  ),
                0
              );
            }}
          >
            <Icon name="inventory" />
            <span>
              Inventory Health
            </span>
          </button>

          <div className="df-admin-nav-divider" />

          <button
            type="button"
            className={
              activeView === 'users'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveView('users')
            }
          >
            <Icon name="users" />
            <span>Users</span>

            {userCounts.total >
              0 && (
              <b className="df-admin-user-count-badge">
                {userCounts.total}
              </b>
            )}
          </button>

          <button
            type="button"
            className={
              activeView ===
              'reports'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveView(
                'reports'
              )
            }
          >
            <Icon name="report" />
            <span>Reports</span>
          </button>

          <button
            type="button"
            className={
              activeView ===
              'settings'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveView(
                'settings'
              )
            }
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="df-admin-sidebar-bottom">
          <Link
            to="/"
            className="df-admin-back-link"
          >
            <Icon
              name="arrow"
              size={17}
            />

            <span>
              Back to Dawa-Find
            </span>
          </Link>
        </div>
      </aside>

      <section
        className={`df-admin-main ${
          adminSettings
            .compactTables
            ? 'compact'
            : ''
        }`}
      >
        <header className="df-admin-topbar">
          <div>
            <h1>
              {activeView === 'users'
                ? 'User Management'
                : activeView ===
                    'reports'
                  ? 'Reports & Analytics'
                  : activeView ===
                      'settings'
                    ? 'Admin Settings'
                    : 'Welcome, Admin'}
              <span className="df-admin-wave">
                ◌
              </span>
            </h1>

            <p>
              {activeView === 'users'
                ? 'Review registered Dawa-Find accounts, roles and linked pharmacy profiles.'
                : activeView ===
                    'reports'
                  ? 'Review platform performance and export a clean admin report.'
                  : activeView ===
                      'settings'
                    ? 'Control dashboard refresh, confirmations and table preferences.'
                    : 'Monitor, manage and grow the Dawa-Find network.'}
            </p>
          </div>

          <div className="df-admin-top-actions">
            <div className="df-admin-date">
              <Icon
                name="calendar"
                size={17}
              />

              <span>
                {dateLabel}
              </span>
            </div>

            <button
              type="button"
              className="df-admin-refresh"
              onClick={
                activeView === 'users'
                  ? loadUsers
                  : activeView ===
                      'reports'
                    ? () => {
                        load();
                        loadUsers();
                      }
                    : load
              }
              disabled={
                activeView === 'users'
                  ? userLoading
                  : activeView ===
                      'reports'
                    ? loading ||
                      userLoading
                    : loading
              }
              title={
                activeView === 'users'
                  ? 'Refresh users'
                  : activeView ===
                      'reports'
                    ? 'Refresh report'
                    : 'Refresh dashboard'
              }
            >
              <Icon
                name="refresh"
                size={18}
              />
            </button>
          </div>
        </header>

        {error && (
          <div className="df-admin-alert">
            <Icon
              name="warning"
              size={20}
            />

            <div>
              <strong>
                Unable to complete the
                admin request
              </strong>

              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              aria-label="Dismiss error"
            >
              <Icon
                name="close"
                size={17}
              />
            </button>
          </div>
        )}

        {activeView ===
        'overview' && (
          <>
        <section
          id="admin-overview"
          className="df-admin-overview"
        >
          <div className="df-admin-kpi-grid">
            <article className="df-admin-kpi">
              <div className="df-admin-kpi-icon pharmacy">
                <Icon name="pharmacy" />
              </div>

              <div>
                <strong>
                  {formatNumber(
                    totalCount
                  )}
                </strong>

                <span>
                  Pharmacies
                </span>
              </div>
            </article>

            <article className="df-admin-kpi">
              <div className="df-admin-kpi-icon inventory">
                <Icon name="inventory" />
              </div>

              <div>
                <strong>
                  {formatNumber(
                    inventoryRows
                  )}
                </strong>

                <span>
                  Inventory Rows
                </span>
              </div>
            </article>

            <article className="df-admin-kpi">
              <div className="df-admin-kpi-icon active">
                <Icon name="users" />
              </div>

              <div>
                <strong>
                  {formatNumber(
                    activeShops
                  )}
                </strong>

                <span>
                  Active Shops
                </span>
              </div>
            </article>

            <article className="df-admin-kpi">
              <div className="df-admin-kpi-icon pending">
                <Icon name="clock" />
              </div>

              <div>
                <strong>
                  {formatNumber(
                    pendingCount
                  )}
                </strong>

                <span>
                  Pending Verifications
                </span>
              </div>
            </article>
          </div>

          <div className="df-admin-analytics-grid">
            <article className="df-admin-card df-admin-verification-chart">
              <div className="df-admin-card-head">
                <div>
                  <h2>
                    Pharmacy Verification
                  </h2>

                  <p>
                    Current network
                    verification mix
                  </p>
                </div>

                <span className="df-admin-card-chip">
                  {verificationRate}%
                  verified
                </span>
              </div>

              <div className="df-admin-bars">
                {breakdown.map(
                  (entry) => (
                    <div
                      className="df-admin-bar-row"
                      key={entry.key}
                    >
                      <div className="df-admin-bar-label">
                        <span>
                          {entry.label}
                        </span>

                        <strong>
                          {formatNumber(
                            entry.value
                          )}
                        </strong>
                      </div>

                      <div className="df-admin-bar-track">
                        <span
                          className={entry.key}
                          style={{
                            width: `${entry.percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </article>

            <article
              id="admin-inventory"
              className="df-admin-card df-admin-stock-card"
            >
              <div className="df-admin-card-head">
                <div>
                  <h2>
                    Inventory Freshness
                  </h2>

                  <p>
                    Rows updated within
                    the last 24 hours
                  </p>
                </div>
              </div>

              <div className="df-admin-donut-area">
                <div
                  className="df-admin-donut"
                  style={{
                    background:
                      `conic-gradient(#16b88a 0 ${freshnessPercent}%, #e8f2ef ${freshnessPercent}% 100%)`,
                  }}
                >
                  <div>
                    <strong>
                      {freshnessPercent}%
                    </strong>

                    <span>
                      fresh
                    </span>
                  </div>
                </div>

                <div className="df-admin-freshness-legend">
                  <div>
                    <i className="fresh" />

                    <span>
                      Updated
                    </span>

                    <strong>
                      {formatNumber(
                        updatedRows
                      )}
                    </strong>
                  </div>

                  <div>
                    <i className="other" />

                    <span>
                      Other rows
                    </span>

                    <strong>
                      {formatNumber(
                        Math.max(
                          0,
                          inventoryRows -
                            updatedRows
                        )
                      )}
                    </strong>
                  </div>

                  <div>
                    <i className="shops" />

                    <span>
                      Active shops
                    </span>

                    <strong>
                      {formatNumber(
                        activeShops
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="df-admin-lower-grid">
            <article
              id="admin-verifications"
              className="df-admin-card df-admin-recent"
            >
              <div className="df-admin-card-head">
                <div>
                  <h2>
                    Recent Verification
                    Requests
                  </h2>

                  <p>
                    Latest pharmacy
                    applications awaiting
                    review
                  </p>
                </div>

                <button
                  type="button"
                  className="df-admin-text-btn"
                  onClick={() => {
                    setTab('pending');
                    setTimeout(
                      () =>
                        scrollToSection(
                          'admin-pharmacies'
                        ),
                      0
                    );
                  }}
                >
                  View all
                </button>
              </div>

              {recentPending.length ===
              0 ? (
                <div className="df-admin-mini-empty">
                  <div>
                    <Icon
                      name="check"
                      size={21}
                    />
                  </div>

                  <p>
                    No pending pharmacy
                    applications right
                    now.
                  </p>
                </div>
              ) : (
                <div className="df-admin-recent-table-wrap">
                  <table className="df-admin-recent-table">
                    <thead>
                      <tr>
                        <th>
                          Pharmacy Name
                        </th>
                        <th>
                          Location
                        </th>
                        <th>
                          Submitted
                        </th>
                        <th>
                          Status
                        </th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {recentPending.map(
                        (pharmacy) => (
                          <tr
                            key={
                              pharmacy._id
                            }
                          >
                            <td>
                              <Link
                                to={`/pharmacy/${pharmacy._id}`}
                              >
                                {pharmacy.name ||
                                  'Unnamed pharmacy'}
                              </Link>
                            </td>

                            <td>
                              {pharmacy.address ||
                                pharmacy.landmark ||
                                'Not provided'}
                            </td>

                            <td>
                              {pharmacy.createdAt
                                ? new Intl.DateTimeFormat(
                                    'en-IN',
                                    {
                                      day: '2-digit',
                                      month:
                                        'short',
                                      year:
                                        'numeric',
                                    }
                                  ).format(
                                    new Date(
                                      pharmacy.createdAt
                                    )
                                  )
                                : '—'}
                            </td>

                            <td>
                              <span className="df-admin-status pending">
                                Pending
                              </span>
                            </td>

                            <td>
                              <div className="df-admin-quick-actions">
                                <button
                                  type="button"
                                  className="approve"
                                  disabled={
                                    busyId ===
                                    pharmacy._id
                                  }
                                  onClick={() =>
                                    decide(
                                      pharmacy._id,
                                      'verified'
                                    )
                                  }
                                  title="Approve pharmacy"
                                >
                                  <Icon
                                    name="check"
                                    size={15}
                                  />
                                </button>

                                <button
                                  type="button"
                                  className="reject"
                                  disabled={
                                    busyId ===
                                    pharmacy._id
                                  }
                                  onClick={() =>
                                    decide(
                                      pharmacy._id,
                                      'rejected'
                                    )
                                  }
                                  title="Reject pharmacy"
                                >
                                  <Icon
                                    name="close"
                                    size={15}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="df-admin-card df-admin-breakdown">
              <div className="df-admin-card-head">
                <div>
                  <h2>
                    Verification
                    Breakdown
                  </h2>

                  <p>
                    Current pharmacy
                    status totals
                  </p>
                </div>
              </div>

              <div className="df-admin-ranking-list">
                {breakdown.map(
                  (
                    entry,
                    index
                  ) => (
                    <div
                      className="df-admin-ranking-row"
                      key={entry.key}
                    >
                      <span className="df-admin-rank">
                        {index + 1}
                      </span>

                      <div>
                        <strong>
                          {entry.label}
                        </strong>

                        <span>
                          {entry.percent}% of
                          pharmacies
                        </span>
                      </div>

                      <b>
                        {formatNumber(
                          entry.value
                        )}
                      </b>
                    </div>
                  )
                )}
              </div>
            </article>
          </div>
        </section>

        <section
          id="admin-pharmacies"
          className="df-admin-management"
        >
          <div className="df-admin-management-head">
            <div>
              <span className="df-admin-eyebrow">
                PHARMACY MANAGEMENT
              </span>

              <h2>
                Pharmacy Verification
              </h2>

              <p>
                Review licence
                information and approve
                or reject pharmacy
                partner applications.
              </p>
            </div>

            <div className="df-admin-management-count">
              <strong>
                {formatNumber(
                  items.length
                )}
              </strong>

              <span>
                {statusLabel(tab)}
                {' '}records
              </span>
            </div>
          </div>

          <div className="df-admin-tabs">
            {TABS.map((status) => (
              <button
                type="button"
                key={status}
                className={
                  tab === status
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setTab(status)
                }
              >
                <span
                  className={`df-admin-tab-dot ${status}`}
                />

                <span>
                  {TAB_LABELS[status]}
                </span>

                <b>
                  {formatNumber(
                    metrics
                      ?.pharmacies?.[
                      status
                    ] || 0
                  )}
                </b>
              </button>
            ))}
          </div>

          <div className="df-admin-table-card">
            {loading ? (
              <div className="df-admin-loading">
                <div className="df-admin-loader" />

                <strong>
                  Loading admin data
                </strong>

                <span>
                  Fetching pharmacy
                  records and metrics...
                </span>
              </div>
            ) : items.length === 0 ? (
              <div className="df-admin-empty">
                <div>
                  <Icon
                    name="check"
                    size={26}
                  />
                </div>

                <h3>
                  No{' '}
                  {TAB_LABELS[
                    tab
                  ].toLowerCase()}{' '}
                  pharmacies
                </h3>

                <p>
                  There are currently no
                  pharmacy records in
                  this category.
                </p>
              </div>
            ) : (
              <div className="df-admin-table-scroll">
                <table className="df-admin-table-new">
                  <thead>
                    <tr>
                      <th>
                        Pharmacy
                      </th>
                      <th>Owner</th>
                      <th>Licence</th>
                      <th>Source</th>
                      <th>Status</th>

                      {tab ===
                        'rejected' && (
                        <th>
                          Rejection
                          Reason
                        </th>
                      )}

                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map(
                      (pharmacy) => (
                        <tr
                          key={
                            pharmacy._id
                          }
                        >
                          <td>
                            <div className="df-admin-pharmacy-cell">
                              <div className="df-admin-pharmacy-avatar">
                                <Icon
                                  name="pharmacy"
                                  size={19}
                                />
                              </div>

                              <div>
                                <Link
                                  to={`/pharmacy/${pharmacy._id}`}
                                >
                                  {pharmacy.name ||
                                    'Unnamed pharmacy'}
                                </Link>

                                <span>
                                  {pharmacy.address ||
                                    'Address not available'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {pharmacy.owner ? (
                              <div className="df-admin-owner-cell">
                                <strong>
                                  {pharmacy
                                    .owner
                                    .name ||
                                    'Unknown'}
                                </strong>

                                <span>
                                  {pharmacy
                                    .owner
                                    .email ||
                                    'No email'}
                                </span>
                              </div>
                            ) : (
                              <span className="df-admin-muted">
                                —
                              </span>
                            )}
                          </td>

                          <td>
                            <span className="df-admin-license-new">
                              {pharmacy.licenceNo ||
                                'Not provided'}
                            </span>
                          </td>

                          <td>
                            <span className="df-admin-source-new">
                              {pharmacy.source ||
                                'Unknown'}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`df-admin-status ${
                                pharmacy.verificationStatus ||
                                'unverified'
                              }`}
                            >
                              {statusLabel(
                                pharmacy.verificationStatus
                              )}
                            </span>
                          </td>

                          {tab ===
                            'rejected' && (
                            <td>
                              <div className="df-admin-rejection">
                                {pharmacy.rejectionReason ||
                                  'No reason provided'}
                              </div>
                            </td>
                          )}

                          <td>
                            <div className="df-admin-row-actions">
                              {pharmacy.verificationStatus !==
                                'verified' && (
                                <button
                                  type="button"
                                  className="approve"
                                  disabled={
                                    busyId ===
                                    pharmacy._id
                                  }
                                  onClick={() =>
                                    decide(
                                      pharmacy._id,
                                      'verified'
                                    )
                                  }
                                >
                                  <Icon
                                    name="check"
                                    size={14}
                                  />
                                  Approve
                                </button>
                              )}

                              {pharmacy.verificationStatus !==
                                'rejected' && (
                                <button
                                  type="button"
                                  className="reject"
                                  disabled={
                                    busyId ===
                                    pharmacy._id
                                  }
                                  onClick={() =>
                                    decide(
                                      pharmacy._id,
                                      'rejected'
                                    )
                                  }
                                >
                                  <Icon
                                    name="close"
                                    size={14}
                                  />
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
          </>
        )}

        {activeView ===
          'users' && (
          <section className="df-admin-users-page">
            <div className="df-admin-users-hero">
              <div>
                <span className="df-admin-eyebrow">
                  ACCOUNT MANAGEMENT
                </span>

                <h2>
                  Dawa-Find Users
                </h2>

                <p>
                  Search registered
                  accounts, review roles
                  and see pharmacy
                  account links. Passwords
                  are never returned to
                  this dashboard.
                </p>
              </div>

              <div className="df-admin-users-result-count">
                <strong>
                  {formatNumber(
                    filteredUsers.length
                  )}
                </strong>

                <span>
                  visible accounts
                </span>
              </div>
            </div>

            <div className="df-admin-user-kpi-grid">
              <article>
                <div className="df-admin-user-kpi-icon total">
                  <Icon name="users" />
                </div>

                <div>
                  <strong>
                    {formatNumber(
                      userCounts.total
                    )}
                  </strong>

                  <span>
                    Total accounts
                  </span>
                </div>
              </article>

              <article>
                <div className="df-admin-user-kpi-icon customer">
                  <Icon name="users" />
                </div>

                <div>
                  <strong>
                    {formatNumber(
                      userCounts.user
                    )}
                  </strong>

                  <span>
                    Customers
                  </span>
                </div>
              </article>

              <article>
                <div className="df-admin-user-kpi-icon partner">
                  <Icon name="pharmacy" />
                </div>

                <div>
                  <strong>
                    {formatNumber(
                      userCounts.pharmacy
                    )}
                  </strong>

                  <span>
                    Pharmacy partners
                  </span>
                </div>
              </article>

              <article>
                <div className="df-admin-user-kpi-icon admin">
                  <Icon name="verify" />
                </div>

                <div>
                  <strong>
                    {formatNumber(
                      userCounts.admin
                    )}
                  </strong>

                  <span>
                    Admin accounts
                  </span>
                </div>
              </article>
            </div>

            <div className="df-admin-users-toolbar">
              <div className="df-admin-user-search">
                <span>
                  ⌕
                </span>

                <input
                  type="search"
                  value={userSearch}
                  onChange={(event) =>
                    setUserSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search by name, email, phone or pharmacy..."
                />
              </div>

              <div className="df-admin-user-role-filters">
                {[
                  ['all', 'All'],
                  ['user', 'Customers'],
                  [
                    'pharmacy',
                    'Pharmacies',
                  ],
                  ['admin', 'Admins'],
                ].map(
                  ([
                    value,
                    label,
                  ]) => (
                    <button
                      type="button"
                      key={value}
                      className={
                        userRole ===
                        value
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setUserRole(
                          value
                        )
                      }
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="df-admin-users-table-card">
              {userLoading ? (
                <div className="df-admin-loading">
                  <div className="df-admin-loader" />

                  <strong>
                    Loading users
                  </strong>

                  <span>
                    Fetching account
                    details...
                  </span>
                </div>
              ) : filteredUsers.length ===
                0 ? (
                <div className="df-admin-empty">
                  <div>
                    <Icon
                      name="users"
                      size={25}
                    />
                  </div>

                  <h3>
                    No matching users
                  </h3>

                  <p>
                    Try another search
                    term or role filter.
                  </p>
                </div>
              ) : (
                <div className="df-admin-table-scroll">
                  <table className="df-admin-users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>
                          Contact
                        </th>
                        <th>Role</th>
                        <th>
                          Linked Pharmacy
                        </th>
                        <th>
                          Joined
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map(
                        (user) => (
                          <tr
                            key={
                              user._id
                            }
                          >
                            <td>
                              <div className="df-admin-user-cell">
                                <div
                                  className={`df-admin-user-avatar ${
                                    user.role ||
                                    'user'
                                  }`}
                                >
                                  {String(
                                    user.name ||
                                      user.email ||
                                      'U'
                                  )
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <strong>
                                    {user.name ||
                                      'Unnamed user'}
                                  </strong>

                                  <span>
                                    ID:{' '}
                                    {String(
                                      user._id
                                    ).slice(
                                      -8
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="df-admin-user-contact">
                                <strong>
                                  {user.email ||
                                    'No email'}
                                </strong>

                                <span>
                                  {user.phone ||
                                    'Phone not provided'}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`df-admin-role-badge ${
                                  user.role ||
                                  'user'
                                }`}
                              >
                                {user.role ===
                                'pharmacy'
                                  ? 'Pharmacy'
                                  : user.role ===
                                      'admin'
                                    ? 'Admin'
                                    : 'Customer'}
                              </span>
                            </td>

                            <td>
                              {user.pharmacy ? (
                                <div className="df-admin-linked-pharmacy">
                                  <Link
                                    to={`/pharmacy/${user.pharmacy._id}`}
                                  >
                                    {user
                                      .pharmacy
                                      .name ||
                                      'Pharmacy profile'}
                                  </Link>

                                  <span
                                    className={`df-admin-status ${
                                      user
                                        .pharmacy
                                        .verificationStatus ||
                                      'unverified'
                                    }`}
                                  >
                                    {statusLabel(
                                      user
                                        .pharmacy
                                        .verificationStatus
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <span className="df-admin-muted">
                                  —
                                </span>
                              )}
                            </td>

                            <td>
                              <span className="df-admin-user-date">
                                {formatDate(
                                  user.createdAt
                                )}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="df-admin-users-note">
              <Icon
                name="warning"
                size={16}
              />

              <span>
                This first version is
                read-only. Account
                disabling, role changes
                and deletion are not
                enabled yet.
              </span>
            </div>
          </section>
        )}

        {activeView ===
          'reports' && (
          <section className="df-admin-reports-page">
            <div className="df-admin-report-actions">
              <div>
                <span className="df-admin-eyebrow">
                  PLATFORM REPORTING
                </span>

                <h2>
                  Dawa-Find Admin Report
                </h2>

                <p>
                  A live summary built
                  from the same pharmacy,
                  inventory and account
                  data used by this
                  dashboard.
                </p>
              </div>

              <div className="df-admin-report-buttons">
                <button
                  type="button"
                  className="df-admin-report-btn secondary"
                  onClick={() =>
                    window.print()
                  }
                >
                  Print / Save PDF
                </button>

                <button
                  type="button"
                  className="df-admin-report-btn primary"
                  onClick={
                    exportReportCsv
                  }
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="df-admin-report-kpis">
              <article>
                <span>
                  Pharmacy Network
                </span>

                <strong>
                  {formatNumber(
                    totalCount
                  )}
                </strong>

                <small>
                  {verificationRate}%
                  verified
                </small>
              </article>

              <article>
                <span>
                  Inventory Freshness
                </span>

                <strong>
                  {freshnessPercent}%
                </strong>

                <small>
                  {formatNumber(
                    updatedRows
                  )}{' '}
                  fresh rows
                </small>
              </article>

              <article>
                <span>
                  Active Shops
                </span>

                <strong>
                  {formatNumber(
                    activeShops
                  )}
                </strong>

                <small>
                  Updated within 24h
                </small>
              </article>

              <article>
                <span>
                  User Accounts
                </span>

                <strong>
                  {formatNumber(
                    userCounts.total
                  )}
                </strong>

                <small>
                  Across all roles
                </small>
              </article>
            </div>

            <div className="df-admin-report-grid">
              <article className="df-admin-card df-admin-report-card">
                <div className="df-admin-card-head">
                  <div>
                    <h2>
                      Pharmacy Status
                    </h2>

                    <p>
                      Verification
                      distribution
                    </p>
                  </div>
                </div>

                <div className="df-admin-report-status-list">
                  {breakdown.map(
                    (entry) => (
                      <div
                        key={
                          entry.key
                        }
                      >
                        <span
                          className={`df-admin-report-dot ${entry.key}`}
                        />

                        <strong>
                          {entry.label}
                        </strong>

                        <b>
                          {formatNumber(
                            entry.value
                          )}
                        </b>

                        <small>
                          {entry.percent}%
                        </small>
                      </div>
                    )
                  )}
                </div>
              </article>

              <article className="df-admin-card df-admin-report-card">
                <div className="df-admin-card-head">
                  <div>
                    <h2>
                      Account Mix
                    </h2>

                    <p>
                      Registered account
                      roles
                    </p>
                  </div>
                </div>

                <div className="df-admin-report-account-list">
                  <div>
                    <span>
                      Customers
                    </span>

                    <strong>
                      {formatNumber(
                        userCounts.user
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pharmacy Partners
                    </span>

                    <strong>
                      {formatNumber(
                        userCounts.pharmacy
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Admins
                    </span>

                    <strong>
                      {formatNumber(
                        userCounts.admin
                      )}
                    </strong>
                  </div>
                </div>
              </article>

              <article className="df-admin-card df-admin-report-card df-admin-report-wide">
                <div className="df-admin-card-head">
                  <div>
                    <h2>
                      Inventory Activity
                    </h2>

                    <p>
                      Freshness and recent
                      pharmacy activity
                    </p>
                  </div>
                </div>

                <div className="df-admin-report-progress">
                  <div className="df-admin-report-progress-head">
                    <span>
                      Fresh rows
                    </span>

                    <strong>
                      {freshnessPercent}%
                    </strong>
                  </div>

                  <div className="df-admin-report-progress-track">
                    <span
                      style={{
                        width:
                          `${freshnessPercent}%`,
                      }}
                    />
                  </div>

                  <div className="df-admin-report-progress-meta">
                    <span>
                      {formatNumber(
                        updatedRows
                      )}{' '}
                      updated
                    </span>

                    <span>
                      {formatNumber(
                        inventoryRows
                      )}{' '}
                      total rows
                    </span>

                    <span>
                      {formatNumber(
                        activeShops
                      )}{' '}
                      active shops
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}

        {activeView ===
          'settings' && (
          <section className="df-admin-settings-page">
            <div className="df-admin-settings-intro">
              <span className="df-admin-eyebrow">
                DASHBOARD PREFERENCES
              </span>

              <h2>
                Admin Settings
              </h2>

              <p>
                These preferences are
                saved in this browser
                only. They do not change
                user accounts or backend
                permissions.
              </p>
            </div>

            <div className="df-admin-settings-grid">
              <article className="df-admin-setting-card">
                <div>
                  <strong>
                    Auto refresh
                  </strong>

                  <span>
                    Refresh admin data
                    automatically while
                    the dashboard is
                    open.
                  </span>
                </div>

                <button
                  type="button"
                  className={`df-admin-switch ${
                    adminSettings
                      .autoRefresh
                      ? 'on'
                      : ''
                  }`}
                  onClick={() =>
                    saveAdminSettings({
                      autoRefresh:
                        !adminSettings
                          .autoRefresh,
                    })
                  }
                  aria-pressed={
                    adminSettings
                      .autoRefresh
                  }
                >
                  <span />
                </button>
              </article>

              <article className="df-admin-setting-card stacked">
                <div>
                  <strong>
                    Refresh interval
                  </strong>

                  <span>
                    Used only when auto
                    refresh is enabled.
                  </span>
                </div>

                <select
                  value={
                    adminSettings
                      .refreshSeconds
                  }
                  onChange={(event) =>
                    saveAdminSettings({
                      refreshSeconds:
                        Number(
                          event.target
                            .value
                        ),
                    })
                  }
                >
                  <option value={30}>
                    Every 30 seconds
                  </option>

                  <option value={60}>
                    Every 1 minute
                  </option>

                  <option value={120}>
                    Every 2 minutes
                  </option>

                  <option value={300}>
                    Every 5 minutes
                  </option>
                </select>
              </article>

              <article className="df-admin-setting-card">
                <div>
                  <strong>
                    Confirm verification
                    actions
                  </strong>

                  <span>
                    Ask before approving
                    or rejecting a
                    pharmacy.
                  </span>
                </div>

                <button
                  type="button"
                  className={`df-admin-switch ${
                    adminSettings
                      .confirmDecisions
                      ? 'on'
                      : ''
                  }`}
                  onClick={() =>
                    saveAdminSettings({
                      confirmDecisions:
                        !adminSettings
                          .confirmDecisions,
                    })
                  }
                  aria-pressed={
                    adminSettings
                      .confirmDecisions
                  }
                >
                  <span />
                </button>
              </article>

              <article className="df-admin-setting-card">
                <div>
                  <strong>
                    Compact tables
                  </strong>

                  <span>
                    Reduce table spacing
                    when reviewing many
                    records.
                  </span>
                </div>

                <button
                  type="button"
                  className={`df-admin-switch ${
                    adminSettings
                      .compactTables
                      ? 'on'
                      : ''
                  }`}
                  onClick={() =>
                    saveAdminSettings({
                      compactTables:
                        !adminSettings
                          .compactTables,
                    })
                  }
                  aria-pressed={
                    adminSettings
                      .compactTables
                  }
                >
                  <span />
                </button>
              </article>
            </div>

            <div className="df-admin-settings-footer">
              <div>
                <Icon
                  name="settings"
                  size={18}
                />

                <span>
                  Preferences are stored
                  locally on this device.
                </span>
              </div>

              {settingsSaved && (
                <strong>
                  Settings saved
                </strong>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
