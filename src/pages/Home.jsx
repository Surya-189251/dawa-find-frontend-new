import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import api from '../api/client.js';
import Footer from '../components/Footer.jsx';

// ============================================================
// WHATSAPP LINK
// ============================================================

function waLink(phone, medicine) {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, '');

  if (!digits) return null;

  const withCc =
    digits.length === 10
      ? `91${digits}`
      : digits;

  const msg = medicine?.trim()
    ? `Hi, do you have *${medicine.trim()}* in stock? — via Dawa-Find`
    : `Hi, I'm checking medicine availability — via Dawa-Find`;

  return `https://wa.me/${withCc}?text=${encodeURIComponent(msg)}`;
}

// ============================================================
// LEAFLET ICON FIX
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Dawa-Find map markers
const userIcon = L.divIcon({
  className: 'df-user-marker-wrapper',
  html: `
    <div class="df-user-marker">
      <span class="df-user-marker-core"></span>
      <span class="df-user-marker-label">YOU</span>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -28],
});

function createPharmacyIcon(stockLevel = 'unknown') {
  const safeLevel = [
    'good',
    'medium',
    'low',
    'unknown',
  ].includes(stockLevel)
    ? stockLevel
    : 'unknown';

  return L.divIcon({
    className:
      'df-pharmacy-marker-wrapper',
    html: `
      <div class="df-pharmacy-marker ${safeLevel}">
        <span class="df-pharmacy-marker-cross">+</span>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 39],
    popupAnchor: [0, -36],
  });
}

// ============================================================
// DEFAULT LOCATIONS
// ============================================================

const VIJAYAWADA = [16.5062, 80.6480];

// ============================================================
// SAFE API RESPONSE HELPERS
// ============================================================

// Backend responses may be:
//
// [
//   { pharmacy }
// ]
//
// or:
//
// {
//   data: [...]
// }
//
// or:
//
// {
//   items: [...]
// }
//
// or:
//
// {
//   results: [...]
// }
//
// This prevents:
// TypeError: e.map is not a function
function getArrayFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.pharmacies)) {
    return data.pharmacies;
  }

  return [];
}

// ============================================================
// STOCK LEVEL HELPERS
// ============================================================

// Map marker stock colours:
// good   = green
// medium = orange
// low    = red
// unknown = neutral grey
//
// Numeric fallback thresholds:
// 0-5   -> low
// 6-15  -> medium
// 16+   -> good
//
// If the backend already provides a stock/status string,
// that value is preferred over the numeric fallback.

function readStockQuantity(source) {
  if (
    !source ||
    typeof source !== 'object'
  ) {
    return null;
  }

  const candidates = [
    source.quantity,
    source.qty,
    source.stock,
    source.stockCount,
    source.stockQuantity,
    source.availableQuantity,
    source.unitsAvailable,
    source.inventory?.quantity,
    source.inventory?.stock,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);

    if (
      Number.isFinite(value) &&
      value >= 0
    ) {
      return value;
    }
  }

  return null;
}

function readStockStatus(source) {
  if (
    !source ||
    typeof source !== 'object'
  ) {
    return '';
  }

  const candidates = [
    source.stockLevel,
    source.stockStatus,
    source.availability,
    source.status,
    source.inventoryStatus,
    source.inventory?.status,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === 'string' &&
      candidate.trim()
    ) {
      return candidate
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ');
    }
  }

  return '';
}

function deriveStockInfo(source) {
  const status =
    readStockStatus(source);

  const quantity =
    readStockQuantity(source);

  if (
    status.includes('out of stock') ||
    status.includes('out of stock') ||
    status === 'out' ||
    status.includes('low') ||
    status.includes('critical')
  ) {
    return {
      level: 'low',
      quantity,
      label: 'Low stock',
    };
  }

  if (
    status.includes('limited') ||
    status.includes('medium') ||
    status.includes('moderate')
  ) {
    return {
      level: 'medium',
      quantity,
      label: 'Medium stock',
    };
  }

  if (
    status.includes('in stock') ||
    status.includes('available') ||
    status.includes('good') ||
    status.includes('high')
  ) {
    return {
      level: 'good',
      quantity,
      label: 'Good stock',
    };
  }

  if (
    Number.isFinite(quantity)
  ) {
    if (quantity <= 5) {
      return {
        level: 'low',
        quantity,
        label: 'Low stock',
      };
    }

    if (quantity <= 15) {
      return {
        level: 'medium',
        quantity,
        label: 'Medium stock',
      };
    }

    return {
      level: 'good',
      quantity,
      label: 'Good stock',
    };
  }

  return {
    level: 'unknown',
    quantity: null,
    label: 'Stock not available',
  };
}

function getPharmacyStockInfo(pharmacy) {
  if (
    pharmacy?.__stockInfo &&
    typeof pharmacy.__stockInfo ===
      'object'
  ) {
    return pharmacy.__stockInfo;
  }

  return deriveStockInfo(
    pharmacy
  );
}

// Pharmacy-list endpoints should return pharmacies.
// This normalizes the production response safely.
function normalizePharmacies(data) {
  const rows = getArrayFromResponse(data);

  return rows.filter(
    (item) =>
      item &&
      typeof item === 'object'
  );
}

// Medicine search returns inventory rows containing:
//
// {
//   pharmacy: {...}
// }
//
// This extracts unique pharmacies safely.
function extractPharmaciesFromMedicineResponse(data) {
  const rows = getArrayFromResponse(data);

  const pharmacyMap = new Map();

  rows.forEach((row) => {
    let pharmacy = null;

    if (row?.pharmacy) {
      pharmacy = row.pharmacy;
    } else if (
      row?._id &&
      row?.location
    ) {
      pharmacy = row;
    }

    if (!pharmacy) {
      return;
    }

    const id =
      pharmacy?._id ||
      pharmacy?.id;

    if (!id) {
      return;
    }

    const key = String(id);

    const rowStock =
      deriveStockInfo(row);

    const pharmacyStock =
      deriveStockInfo(pharmacy);

    const stockInfo =
      rowStock.level !== 'unknown'
        ? rowStock
        : pharmacyStock;

    const existing =
      pharmacyMap.get(key);

    if (!existing) {
      pharmacyMap.set(
        key,
        {
          ...pharmacy,
          __stockInfo:
            stockInfo,
        }
      );

      return;
    }

    const rank = {
      unknown: 0,
      low: 1,
      medium: 2,
      good: 3,
    };

    const existingStock =
      getPharmacyStockInfo(
        existing
      );

    if (
      rank[stockInfo.level] >
      rank[existingStock.level]
    ) {
      pharmacyMap.set(
        key,
        {
          ...existing,
          ...pharmacy,
          __stockInfo:
            stockInfo,
        }
      );
    }
  });

  return Array.from(
    pharmacyMap.values()
  );
}

// ============================================================
// RECENTER MAP
// ============================================================

function Recenter({
  center,
  radius,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !Array.isArray(center) ||
      center.length < 2
    ) {
      return;
    }

    const lat = Number(center[0]);
    const lon = Number(center[1]);
    const safeRadius =
      Number(radius) || 5000;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      return;
    }

    const bounds = L.latLng(
      lat,
      lon
    ).toBounds(
      safeRadius * 2
    );

    map.fitBounds(bounds, {
      padding: [30, 30],
    });
  }, [
    center,
    radius,
    map,
  ]);

  return null;
}

// ============================================================
// USER LOCATION PICKER
// ============================================================

function LocationPicker({
  enabled,
  position,
  onPick,
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;

      onPick(
        [
          event.latlng.lat,
          event.latlng.lng,
        ],
        'map'
      );
    },
  });

  if (
    !enabled ||
    !Array.isArray(position) ||
    position.length < 2
  ) {
    return null;
  }

  return (
    <Marker
      position={position}
      icon={userIcon}
      draggable
      eventHandlers={{
        dragend(event) {
          const point =
            event.target.getLatLng();

          onPick(
            [
              point.lat,
              point.lng,
            ],
            'drag'
          );
        },
      }}
    >
      <Popup>
        <strong>
          Your selected location
        </strong>

        <br />

        Drag this blue pin or click
        another point on the map to
        correct it.
      </Popup>
    </Marker>
  );
}

// ============================================================
// DISTANCE HELPERS
// ============================================================

function distanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const values = [
    lat1,
    lon1,
    lat2,
    lon2,
  ].map(Number);

  if (
    values.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {
    return null;
  }

  const [
    safeLat1,
    safeLon1,
    safeLat2,
    safeLon2,
  ] = values;

  const toRad =
    (degrees) =>
      (degrees * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const dLat =
    toRad(
      safeLat2 - safeLat1
    );

  const dLon =
    toRad(
      safeLon2 - safeLon1
    );

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      toRad(safeLat1)
    ) *
      Math.cos(
        toRad(safeLat2)
      ) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    earthRadiusKm *
    Math.asin(
      Math.sqrt(a)
    )
  );
}

function pharmacyDistanceKm(
  pharmacy,
  center
) {
  if (
    !pharmacy ||
    !Array.isArray(center) ||
    center.length < 2
  ) {
    return null;
  }

  const coords =
    pharmacy?.location
      ?.coordinates;

  if (
    !Array.isArray(coords) ||
    coords.length < 2
  ) {
    return null;
  }

  const [
    lon,
    lat,
  ] = coords;

  return distanceKm(
    center[0],
    center[1],
    lat,
    lon
  );
}

// ============================================================
// HOME MAP SUMMARY ICONS
// ============================================================

function HomeMapStatIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (name === 'pharmacy') {
    return (
      <svg {...common}>
        <path d="M4 9h16" />
        <path d="M5 9v10h14V9" />
        <path d="M6 5h12l2 4H4l2-4Z" />
        <path d="M9 13h6" />
        <path d="M12 10v6" />
      </svg>
    );
  }

  if (name === 'radius') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
      </svg>
    );
  }

  if (name === 'nearest') {
    return (
      <svg {...common}>
        <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

// ============================================================
// HOME PAGE
// ============================================================

export default function Home() {
  const [
    pharmacies,
    setPharmacies,
  ] = useState([]);

  const [
    medicine,
    setMedicine,
  ] = useState('');

  const [
    center,
    setCenter,
  ] = useState(VIJAYAWADA);

  const [
    locationReady,
    setLocationReady,
  ] = useState(false);

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    locationAccuracy,
    setLocationAccuracy,
  ] = useState(null);

  const [
    locationSource,
    setLocationSource,
  ] = useState(null);

  const [
    locationMessage,
    setLocationMessage,
  ] = useState(
    'Search your address or area, use device location, or click the map to set your location.'
  );

  const [
    manualLat,
    setManualLat,
  ] = useState('');

  const [
    manualLon,
    setManualLon,
  ] = useState('');

  const [
    addressQuery,
    setAddressQuery,
  ] = useState('');

  const [
    addressResults,
    setAddressResults,
  ] = useState([]);

  const [
    addressSearching,
    setAddressSearching,
  ] = useState(false);

  const [
    selectedAddress,
    setSelectedAddress,
  ] = useState('');

  const [
    radius,
    setRadius,
  ] = useState(5000);

  const [
    error,
    setError,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ==========================================================
  // LOAD ALL PHARMACIES
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadPharmacies = async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await api.get(
            '/pharmacies'
          );

        console.log(
          'Pharmacies API response:',
          response.data
        );

        const list =
          normalizePharmacies(
            response.data
          );

        if (mounted) {
          setPharmacies(list);
        }
      } catch (err) {
        console.error(
          'Failed to load pharmacies:',
          err.response?.data ||
            err
        );

        if (mounted) {
          setPharmacies([]);

          setError(
            err.response?.data
              ?.message ||
              err.message ||
              'Unable to load pharmacies.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPharmacies();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // USER LOCATION
  // ==========================================================

  const applyLocation = (
    nextCenter,
    source = 'manual',
    accuracy = null
  ) => {
    if (
      !Array.isArray(nextCenter) ||
      nextCenter.length < 2
    ) {
      return;
    }

    const lat =
      Number(nextCenter[0]);

    const lon =
      Number(nextCenter[1]);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      setError(
        'Please choose valid coordinates.'
      );
      return;
    }

    setCenter([lat, lon]);
    setLocationReady(true);
    setLocationSource(source);
    setLocationAccuracy(
      Number.isFinite(Number(accuracy))
        ? Math.round(Number(accuracy))
        : null
    );
    setManualLat(lat.toFixed(6));
    setManualLon(lon.toFixed(6));
    setError('');

    if (source === 'browser') {
      setLocationMessage(
        'Device location detected. If the blue pin is not exact, drag it or click the correct point on the map.'
      );
    } else if (source === 'address') {
      setLocationMessage(
        'Address or area selected. Nearby searches will use this map position.'
      );
    } else if (source === 'coordinates') {
      setLocationMessage(
        'Exact coordinates applied. Nearby searches will use this position.'
      );
    } else {
      setLocationMessage(
        'Location corrected manually. Nearby searches will use the blue pin.'
      );
    }
  };

  const searchAddress =
    async (event) => {
      event?.preventDefault?.();

      const query =
        addressQuery.trim();

      if (!query) {
        setError(
          'Type an address, area, landmark, or locality first.'
        );
        return;
      }

      try {
        setAddressSearching(true);
        setError('');
        setAddressResults([]);

        const params =
          new URLSearchParams({
            q: query,
            format: 'jsonv2',
            addressdetails: '1',
            limit: '5',
            countrycodes: 'in',
          });

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
              headers: {
                Accept:
                  'application/json',
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            'Location search service is temporarily unavailable.'
          );
        }

        const data =
          await response.json();

        const safeResults =
          Array.isArray(data)
            ? data
                .map((item) => ({
                  id:
                    item.place_id ||
                    `${item.lat}-${item.lon}`,
                  label:
                    item.display_name ||
                    query,
                  lat:
                    Number(item.lat),
                  lon:
                    Number(item.lon),
                }))
                .filter(
                  (item) =>
                    Number.isFinite(
                      item.lat
                    ) &&
                    Number.isFinite(
                      item.lon
                    )
                )
            : [];

        setAddressResults(
          safeResults
        );

        if (
          safeResults.length === 0
        ) {
          setError(
            `No matching place found for "${query}". Try adding a locality, city, landmark, or PIN code.`
          );
        }
      } catch (err) {
        setError(
          err.message ||
            'Unable to search this address right now.'
        );
      } finally {
        setAddressSearching(false);
      }
    };

  const chooseAddressResult =
    (result) => {
      setSelectedAddress(
        result.label
      );

      setAddressQuery(
        result.label
      );

      setAddressResults([]);

      applyLocation(
        [
          result.lat,
          result.lon,
        ],
        'address'
      );
    };

  const applyManualCoordinates =
    () => {
      const lat =
        Number(manualLat);

      const lon =
        Number(manualLon);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        setError(
          'Enter a valid latitude (-90 to 90) and longitude (-180 to 180).'
        );
        return;
      }

      setSelectedAddress('');

      applyLocation(
        [lat, lon],
        'coordinates'
      );
    };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(
        'This browser does not support location access. Enter coordinates or click the map instead.'
      );
      return;
    }

    setLocating(true);
    setSelectedAddress('');
    setAddressResults([]);
    setError('');
    setLocationMessage(
      'Getting the best location available from this device...'
    );

    let bestPosition = null;
    let watchId = null;
    let timeoutId = null;
    let finished = false;

    const finish = (
      position,
      message
    ) => {
      if (
        finished ||
        !position
      ) {
        return;
      }

      finished = true;

      if (watchId != null) {
        navigator.geolocation.clearWatch(
          watchId
        );
      }

      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }

      const accuracy =
        Number(
          position.coords.accuracy
        );

      applyLocation(
        [
          position.coords.latitude,
          position.coords.longitude,
        ],
        'browser',
        accuracy
      );

      if (message) {
        setLocationMessage(message);
      }

      setLocating(false);
    };

    watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          const accuracy =
            Number(
              position.coords.accuracy
            );

          if (
            !bestPosition ||
            (Number.isFinite(accuracy) &&
              accuracy <
                Number(
                  bestPosition.coords
                    .accuracy
                ))
          ) {
            bestPosition = position;
          }

          if (
            Number.isFinite(accuracy) &&
            accuracy <= 50
          ) {
            finish(
              position,
              'High-accuracy device location detected. Drag the blue pin if you still need to correct it.'
            );
          } else if (
            Number.isFinite(accuracy)
          ) {
            setLocationMessage(
              `Improving location accuracy... currently about ${Math.round(
                accuracy
              )} m.`
            );
          }
        },
        (locationError) => {
          if (finished) {
            return;
          }

          if (bestPosition) {
            finish(
              bestPosition,
              'Using the best device location available. You can correct it by dragging the pin or clicking the map.'
            );
            return;
          }

          finished = true;

          if (watchId != null) {
            navigator.geolocation.clearWatch(
              watchId
            );
          }

          if (timeoutId != null) {
            clearTimeout(timeoutId);
          }

          setLocating(false);

          if (
            locationError.code === 1
          ) {
            setError(
              'Location permission was denied. Allow location access, enter coordinates, or click the map.'
            );
          } else if (
            locationError.code === 2
          ) {
            setError(
              'Device location is unavailable. Enter coordinates or click the map instead.'
            );
          } else {
            setError(
              'Location detection timed out. Enter coordinates or click the map instead.'
            );
          }

          setLocationMessage(
            'Location has not been set yet.'
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );

    timeoutId = setTimeout(
      () => {
        if (finished) {
          return;
        }

        if (bestPosition) {
          finish(
            bestPosition,
            'Using the best device location available. You can correct it by dragging the pin or clicking the map.'
          );
          return;
        }

        finished = true;

        if (watchId != null) {
          navigator.geolocation.clearWatch(
            watchId
          );
        }

        setLocating(false);
        setLocationMessage(
          'Location has not been set yet.'
        );

        setError(
          'Could not get a reliable device location. Enter coordinates or click the map instead.'
        );
      },
      15000
    );
  };

  // ==========================================================
  // FIND NEARBY PHARMACIES
  // ==========================================================

  const findNearby =
    async () => {
      if (!locationReady) {
        setError(
          'Set your location first using device location, coordinates, or the map.'
        );
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [
          lat,
          lon,
        ] = center;

        const response =
          await api.get(
            '/pharmacies/nearby',
            {
              params: {
                lat,
                lon,
                radius,
              },
            }
          );

        console.log(
          'Nearby pharmacies response:',
          response.data
        );

        const list =
          normalizePharmacies(
            response.data
          );

        setPharmacies(list);

        if (
          list.length === 0
        ) {
          setError(
            'No pharmacies found in this radius.'
          );
        }
      } catch (err) {
        console.error(
          'Nearby pharmacy search failed:',
          err.response?.data ||
            err
        );

        setPharmacies([]);

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            'Unable to find nearby pharmacies.'
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // WHATSAPP NEAREST PHARMACY
  // ==========================================================

  const askNearestOnWhatsApp =
    () => {
      if (!locationReady) {
        setError(
          'Set your location first before asking the nearest pharmacy.'
        );
        return;
      }

      if (
        !Array.isArray(
          pharmacies
        )
      ) {
        setError(
          'Pharmacy data is unavailable.'
        );

        return;
      }

      const [
        lat,
        lon,
      ] = center;

      const toRad =
        (degrees) =>
          (degrees *
            Math.PI) /
          180;

      const distKm = (
        lat1,
        lon1,
        lat2,
        lon2
      ) => {
        const R = 6371;

        const dLat =
          toRad(
            lat2 - lat1
          );

        const dLon =
          toRad(
            lon2 - lon1
          );

        const s =
          Math.sin(
            dLat / 2
          ) **
            2 +
          Math.cos(
            toRad(lat1)
          ) *
            Math.cos(
              toRad(lat2)
            ) *
            Math.sin(
              dLon / 2
            ) **
              2;

        return (
          2 *
          R *
          Math.asin(
            Math.sqrt(s)
          )
        );
      };

      const withPhone =
        pharmacies
          .filter(
            (pharmacy) =>
              pharmacy?.phone &&
              Array.isArray(
                pharmacy
                  ?.location
                  ?.coordinates
              ) &&
              pharmacy.location
                .coordinates
                .length >= 2
          )
          .map(
            (pharmacy) => {
              const [
                pharmacyLon,
                pharmacyLat,
              ] =
                pharmacy.location
                  .coordinates;

              return {
                pharmacy,
                km: distKm(
                  lat,
                  lon,
                  pharmacyLat,
                  pharmacyLon
                ),
              };
            }
          )
          .sort(
            (a, b) =>
              a.km - b.km
          );

      if (
        withPhone.length ===
        0
      ) {
        setError(
          'No pharmacies with a phone number in the current results.'
        );

        return;
      }

      const nearest =
        withPhone[0]
          .pharmacy;

      const link = waLink(
        nearest.phone,
        medicine
      );

      if (!link) {
        setError(
          'This pharmacy does not have a valid WhatsApp number.'
        );

        return;
      }

      setError('');

      window.open(
        link,
        '_blank',
        'noopener,noreferrer'
      );
    };

  // ==========================================================
  // FIND MEDICINE
  // ==========================================================

  const findMedicine =
    async (event) => {
      event?.preventDefault?.();

      const query =
        medicine.trim();

      if (!query) {
        return;
      }

      if (!locationReady) {
        setError(
          'Set your location first so medicine results are searched near you.'
        );
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [
          lat,
          lon,
        ] = center;

        const response =
          await api.get(
            '/pharmacies/medicines/nearby',
            {
              params: {
                name: query,
                lat,
                lon,
                radius,
              },
            }
          );

        console.log(
          'Medicine API response:',
          response.data
        );

        const uniquePharmacies =
          extractPharmaciesFromMedicineResponse(
            response.data
          );

        setPharmacies(
          uniquePharmacies
        );

        if (
          uniquePharmacies.length ===
          0
        ) {
          setError(
            `No pharmacies found stocking "${query}".`
          );
        }
      } catch (err) {
        console.error(
          'Medicine search failed:',
          err.response?.data ||
            err
        );

        setPharmacies([]);

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            'Unable to search for this medicine.'
        );
      } finally {
        setLoading(false);
      }
    };

  // Always keep rendering safe
  const safePharmacies =
    Array.isArray(
      pharmacies
    )
      ? pharmacies
      : [];

  const pharmaciesWithDistance =
    safePharmacies
      .map((pharmacy) => ({
        pharmacy,
        distance:
          locationReady
            ? pharmacyDistanceKm(
                pharmacy,
                center
              )
            : null,
      }))
      .sort((a, b) => {
        if (!locationReady) {
          return 0;
        }

        const aDistance =
          Number.isFinite(
            a.distance
          )
            ? a.distance
            : Infinity;

        const bDistance =
          Number.isFinite(
            b.distance
          )
            ? b.distance
            : Infinity;

        return (
          aDistance -
          bDistance
        );
      });

  const sortedPharmacies =
    pharmaciesWithDistance.map(
      (item) => item.pharmacy
    );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main>
      {/* ================= HOME / MAP ================= */}

      <section className="df-home">
        <div className="df-home-intro">
          <div className="df-home-copy">
            <span className="pill">
              🩺 Dawa-Find · Live pharmacy directory
            </span>

            <h1>
              Find the right{' '}
              <span className="accent">
                medicine
              </span>
              , near you.
            </h1>

            <p className="lead">
              Search across nearby medical shops in seconds.
              See what is available, compare pharmacies, and
              get directions — all from one map.
            </p>
          </div>

          <div className="df-health-note">
            <div className="df-health-note-icon">
              🌿
            </div>

            <div>
              <strong>
                Your health
              </strong>

              <span>
                Our priority
              </span>
            </div>
          </div>
        </div>

        {/* MEDICINE SEARCH */}

        <form
          className="df-search-bar"
          onSubmit={findMedicine}
        >
          <span className="df-search-icon">
            🔎
          </span>

          <input
            type="text"
            placeholder="Search medicine, brand, salt or health product..."
            value={medicine}
            onChange={(event) =>
              setMedicine(
                event.target.value
              )
            }
          />

          <button
            className="btn primary df-search-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Searching...'
              : 'Search'}
          </button>
        </form>

        {/* LOCATION + RADIUS */}

        <div className="df-location-row">
          <div className="df-address-picker">
            <form
              className="df-address-form"
              onSubmit={searchAddress}
            >
              <span className="df-control-icon">
                📍
              </span>

              <input
                type="text"
                value={addressQuery}
                onChange={(event) => {
                  setAddressQuery(
                    event.target.value
                  );

                  if (
                    addressResults.length
                  ) {
                    setAddressResults(
                      []
                    );
                  }
                }}
                placeholder="Search address, area, landmark or PIN code"
                autoComplete="street-address"
              />

              <button
                type="submit"
                className="df-inline-action"
                disabled={addressSearching}
              >
                {addressSearching
                  ? 'Finding...'
                  : 'Set area'}
              </button>
            </form>

            {addressResults.length >
              0 && (
              <div className="df-address-results">
                <div className="df-address-results-title">
                  Choose the correct place
                </div>

                {addressResults.map(
                  (result) => (
                    <button
                      type="button"
                      key={result.id}
                      className="df-address-result"
                      onClick={() =>
                        chooseAddressResult(
                          result
                        )
                      }
                    >
                      <span>
                        📍
                      </span>

                      <strong>
                        {result.label}
                      </strong>
                    </button>
                  )
                )}

                <div className="df-address-credit">
                  Address search data © OpenStreetMap contributors
                </div>
              </div>
            )}
          </div>

          <label className="df-radius-control">
            <span className="df-control-icon">
              ◎
            </span>

            <span className="df-radius-label">
              Within
            </span>

            <select
              value={radius}
              onChange={(event) =>
                setRadius(
                  Number(
                    event.target.value
                  )
                )
              }
            >
              <option value={1000}>
                1 km
              </option>

              <option value={2000}>
                2 km
              </option>

              <option value={5000}>
                5 km
              </option>

              <option value={10000}>
                10 km
              </option>

              <option value={20000}>
                20 km
              </option>

              <option value={50000}>
                50 km
              </option>
            </select>
          </label>

          <button
            type="button"
            className="btn primary df-nearby-button"
            onClick={findNearby}
          >
            ⌖ Find Nearby
          </button>

          <button
            type="button"
            className={`df-device-button ${
              locationSource ===
              'browser'
                ? 'active'
                : ''
            }`}
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating
              ? '📍 Detecting...'
              : '📍 Use my location'}
          </button>
        </div>

        <div className="df-location-status-row">
          <div className="df-location-summary">
            <span
              className={`df-location-dot ${
                locationReady
                  ? 'ready'
                  : ''
              }`}
            />

            <div>
              <strong>
                {locationReady
                  ? selectedAddress ||
                    `${center[0].toFixed(
                      6
                    )}, ${center[1].toFixed(
                      6
                    )}`
                  : 'Set your search location'}
              </strong>

              <span>
                {locationMessage}
              </span>
            </div>
          </div>

          <details className="df-location-more">
            <summary>
              More location options
            </summary>

            <div className="df-location-more-panel">
              <div className="df-coordinate-grid">
                <label>
                  <span>
                    Latitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(event) =>
                      setManualLat(
                        event.target.value
                      )
                    }
                    placeholder="16.537639"
                  />
                </label>

                <label>
                  <span>
                    Longitude
                  </span>

                  <input
                    type="number"
                    step="any"
                    value={manualLon}
                    onChange={(event) =>
                      setManualLon(
                        event.target.value
                      )
                    }
                    placeholder="80.593833"
                  />
                </label>

                <button
                  type="button"
                  className="btn ghost"
                  onClick={
                    applyManualCoordinates
                  }
                >
                  Set coordinates
                </button>
              </div>

              <p>
                You can also click the map or drag the blue pin
                to fine-tune your selected location.
              </p>

              {locationAccuracy != null &&
                locationSource ===
                  'browser' && (
                  <p>
                    Device accuracy:
                    {' '}
                    about
                    {' '}
                    <strong>
                      {locationAccuracy} m
                    </strong>
                  </p>
                )}
            </div>
          </details>
        </div>

        {/* MAP */}

        <div className="df-map-shell">
          {loading && (
            <div className="map-loading">
              Loading…
            </div>
          )}

          <div className="df-map-key">
            <div className="df-map-key-title">
              Map key
            </div>

            <div className="df-map-key-row">
              <i className="df-map-key-dot user" />

              <span>
                Your location
              </span>
            </div>

            <div className="df-map-key-row">
              <i className="df-map-key-dot good" />

              <span>
                Good stock
              </span>
            </div>

            <div className="df-map-key-row">
              <i className="df-map-key-dot medium" />

              <span>
                Medium stock
              </span>
            </div>

            <div className="df-map-key-row">
              <i className="df-map-key-dot low" />

              <span>
                Low stock
              </span>
            </div>

            <div className="df-map-key-row">
              <i className="df-map-key-dot unknown" />

              <span>
                Stock unknown
              </span>
            </div>
          </div>

          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={false}
          >
            <Recenter
              center={center}
              radius={radius}
            />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <LocationPicker
              enabled
              position={
                locationReady
                  ? center
                  : null
              }
              onPick={(
                position,
                source
              ) => {
                setSelectedAddress(
                  ''
                );

                applyLocation(
                  position,
                  source
                );
              }}
            />

            {locationReady && (
              <Circle
                center={center}
                radius={radius}
                pathOptions={{
                  color:
                    '#0f766e',
                  weight: 2,
                  opacity: 0.75,
                  fillColor:
                    '#14b8a6',
                  fillOpacity:
                    0.025,
                  dashArray:
                    '6 7',
                }}
              />
            )}

            {sortedPharmacies.map(
              (pharmacy) => {
                const coords =
                  pharmacy
                    ?.location
                    ?.coordinates;

                if (
                  !Array.isArray(
                    coords
                  ) ||
                  coords.length < 2
                ) {
                  return null;
                }

                const [
                  lon,
                  lat,
                ] = coords;

                if (
                  !Number.isFinite(
                    Number(lat)
                  ) ||
                  !Number.isFinite(
                    Number(lon)
                  )
                ) {
                  return null;
                }

                const id =
                  pharmacy._id ||
                  pharmacy.id;

                return (
                  <Marker
                    key={
                      id ||
                      `${lat}-${lon}`
                    }
                    position={[
                      Number(lat),
                      Number(lon),
                    ]}
                    icon={createPharmacyIcon(
                      getPharmacyStockInfo(
                        pharmacy
                      ).level
                    )}
                  >
                    <Popup>
                      <strong>
                        {pharmacy.name ||
                          'Pharmacy'}
                      </strong>

                      <br />

                      {pharmacy.address && (
                        <>
                          {
                            pharmacy.address
                          }

                          <br />
                        </>
                      )}

                      {locationReady &&
                        Number.isFinite(
                          pharmacyDistanceKm(
                            pharmacy,
                            center
                          )
                        ) && (
                          <>
                            <span>
                              📏{' '}
                              {pharmacyDistanceKm(
                                pharmacy,
                                center
                              ).toFixed(2)}{' '}
                              km away
                            </span>

                            <br />
                          </>
                        )}

                      {(() => {
                        const stockInfo =
                          getPharmacyStockInfo(
                            pharmacy
                          );

                        return (
                          <span
                            className={`df-popup-stock ${stockInfo.level}`}
                          >
                            ●{' '}
                            {stockInfo.label}
                            {Number.isFinite(
                              stockInfo.quantity
                            )
                              ? ` (${stockInfo.quantity})`
                              : ''}
                            <br />
                          </span>
                        );
                      })()}

                      {pharmacy.phone && (
                        <span>
                          📞{' '}
                          {
                            pharmacy.phone
                          }

                          <br />
                        </span>
                      )}

                      {pharmacy.rating && (
                        <span>
                          ⭐{' '}
                          {
                            pharmacy.rating
                          }{' '}
                          (
                          {pharmacy.ratingCount ||
                            0}
                          )
                        </span>
                      )}

                      <br />

                      {id && (
                        <Link
                          to={`/pharmacy/${id}`}
                        >
                          View shop &amp;
                          inventory →
                        </Link>
                      )}

                      {waLink(
                        pharmacy.phone,
                        medicine
                      ) && (
                        <>
                          <br />

                          <a
                            href={waLink(
                              pharmacy.phone,
                              medicine
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            💬 Ask on WhatsApp
                          </a>
                        </>
                      )}

                      {pharmacy.mapsLink && (
                        <>
                          <br />

                          <a
                            href={
                              pharmacy.mapsLink
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Directions ↗
                          </a>
                        </>
                      )}
                    </Popup>
                  </Marker>
                );
              }
            )}
          </MapContainer>
        </div>

        {/* STATS */}

        <div className="df-map-stats">
          <div className="df-map-stat">
            <span className="df-map-stat-icon">
              <HomeMapStatIcon
                name="pharmacy"
              />
            </span>

            <div>
              <strong>
                {
                  safePharmacies.length
                }
              </strong>

              <span>
                Pharmacies
              </span>
            </div>
          </div>

          <div className="df-map-stat">
            <span className="df-map-stat-icon">
              <HomeMapStatIcon
                name="radius"
              />
            </span>

            <div>
              <strong>
                {radius / 1000} km
              </strong>

              <span>
                Search radius
              </span>
            </div>
          </div>

          <div className="df-map-stat">
            <span className="df-map-stat-icon">
              <HomeMapStatIcon
                name="nearest"
              />
            </span>

            <div>
              <strong>
                Nearest
              </strong>

              <span>
                Result sorting
              </span>
            </div>
          </div>

          <div className="df-map-stat">
            <span className="df-map-stat-icon">
              <HomeMapStatIcon
                name="health"
              />
            </span>

            <div>
              <strong>
                24/7
              </strong>

              <span>
                Search access
              </span>
            </div>
          </div>
        </div>

        <div className="df-home-secondary-actions">
          <button
            type="button"
            className="df-whatsapp-nearest"
            onClick={
              askNearestOnWhatsApp
            }
          >
            💬 Ask nearest pharmacy on WhatsApp
          </button>
        </div>
      </section>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="error banner">
          {error}
        </div>
      )}

      {/* ================= RESULTS ================= */}

      <section className="shops">
        <div className="shops-head">
          <h2>
            {medicine.trim()
              ? `Shops stocking "${medicine}"`
              : 'All medical shops'}
          </h2>

          <div className="shops-head-meta">
            {locationReady && (
              <span className="nearest-first-badge">
                Nearest first
              </span>
            )}

            <span className="count-badge">
              {
                safePharmacies.length
              }{' '}
              result
              {safePharmacies.length ===
              1
                ? ''
                : 's'}
            </span>
          </div>
        </div>

        {safePharmacies.length ===
        0 ? (
          <div className="empty-state">
            <p>
              No pharmacies match
              your search. Try a
              different medicine or
              widen the radius.
            </p>
          </div>
        ) : (
          <div className="shop-grid">
            {sortedPharmacies
              .slice(0, 30)
              .map(
                (
                  pharmacy
                ) => {
                  const id =
                    pharmacy._id ||
                    pharmacy.id;

                  return (
                    <article
                      key={
                        id ||
                        pharmacy.name
                      }
                      className="shop-card"
                    >
                      {id ? (
                        <Link
                          to={`/pharmacy/${id}`}
                          className="shop-link"
                        >
                          {pharmacy.imageLink ? (
                            <div
                              className="shop-img"
                              style={{
                                backgroundImage: `url(${pharmacy.imageLink})`,
                              }}
                            />
                          ) : (
                            <div className="shop-img placeholder">
                              💊
                            </div>
                          )}
                        </Link>
                      ) : pharmacy.imageLink ? (
                        <div
                          className="shop-img"
                          style={{
                            backgroundImage: `url(${pharmacy.imageLink})`,
                          }}
                        />
                      ) : (
                        <div className="shop-img placeholder">
                          💊
                        </div>
                      )}

                      <div className="shop-body">
                        {locationReady &&
                          Number.isFinite(
                            pharmacyDistanceKm(
                              pharmacy,
                              center
                            )
                          ) && (
                            <div className="shop-distance-row">
                              <span className="shop-distance-badge">
                                📍{' '}
                                {pharmacyDistanceKm(
                                  pharmacy,
                                  center
                                ).toFixed(2)}{' '}
                                km away
                              </span>
                            </div>
                          )}

                        <div className="shop-top">
                          <h3>
                            {id ? (
                              <Link
                                to={`/pharmacy/${id}`}
                                className="shop-link"
                              >
                                {pharmacy.name ||
                                  'Pharmacy'}
                              </Link>
                            ) : (
                              pharmacy.name ||
                              'Pharmacy'
                            )}
                          </h3>

                          {pharmacy.rating && (
                            <span className="rating-badge">
                              ⭐{' '}
                              {
                                pharmacy.rating
                              }
                            </span>
                          )}
                        </div>

                        {pharmacy.address && (
                          <p className="shop-addr">
                            {
                              pharmacy.address
                            }
                          </p>
                        )}

                        {pharmacy.hours && (
                          <p className="shop-hours">
                            🕒{' '}
                            {
                              pharmacy.hours
                            }
                          </p>
                        )}

                        <div className="shop-actions">
                          {id && (
                            <Link
                              className="btn primary small"
                              to={`/pharmacy/${id}`}
                            >
                              Explore →
                            </Link>
                          )}

                          {waLink(
                            pharmacy.phone,
                            medicine
                          ) && (
                            <a
                              className="btn primary small"
                              style={{
                                background:
                                  '#25D366',
                                borderColor:
                                  '#25D366',
                              }}
                              href={waLink(
                                pharmacy.phone,
                                medicine
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              💬
                              WhatsApp
                            </a>
                          )}

                          {pharmacy.phone && (
                            <a
                              className="btn ghost"
                              href={`tel:${String(
                                pharmacy.phone
                              ).replace(
                                /[^+\d]/g,
                                ''
                              )}`}
                            >
                              📞 Call
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
          </div>
        )}

        {safePharmacies.length >
          30 && (
          <p
            className="muted"
            style={{
              textAlign:
                'center',
              marginTop: 16,
            }}
          >
            Showing the nearest
            30 of{' '}
            {
              safePharmacies.length
            }
            . Refine your search
            to narrow.
          </p>
        )}
      </section>

      {/* ================= FEATURES ================= */}

      <section className="features">
        <h2>
          Why Dawa-Find?
        </h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon">
              📍
            </div>

            <h3>
              Nearby, always
            </h3>

            <p>
              Detect your location,
              correct the map pin if
              needed, and search within
              your chosen radius.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">
              💊
            </div>

            <h3>
              Real-time SKU search
            </h3>

            <p>
              Search by medicine
              name or brand — we
              show which shops
              actually stock it.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">
              🗺️
            </div>

            <h3>
              One-tap directions
            </h3>

            <p>
              Every pin opens
              directly in Google
              Maps for turn-by-turn
              navigation.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">
              ⭐
            </div>

            <h3>
              Ratings &amp; hours
            </h3>

            <p>
              Compare open hours
              and ratings before
              you head out.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <Footer />
    </main>
  );
}