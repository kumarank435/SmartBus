import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API = "https://smartbus-backend-1ase.onrender.com";

const routeCoordinates = [
  [13.0827, 80.2707],
  [13.0855, 80.2685],
  [13.0890, 80.2660],
  [13.0925, 80.2635],
  [13.0960, 80.2610],
];

const stops = [
  { name: "Stop 1", position: routeCoordinates[0] },
  { name: "Stop 2", position: routeCoordinates[1] },
  { name: "Stop 3", position: routeCoordinates[2] },
  { name: "Stop 4", position: routeCoordinates[3] },
  { name: "Stop 5", position: routeCoordinates[4] },
];

const busIcon = new L.DivIcon({
  html: `<div style="
    font-size: 30px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  ">🚌</div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapFollower({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), {
        animate: true,
      });
    }
  }, [position, map]);

  return null;
}

function trafficColor(level) {
  if (level === 0) return "#22c55e";
  if (level === 1) return "#eab308";
  return "#ef4444";
}

function trafficText(level) {
  if (level === 0) return "Low";
  if (level === 1) return "Moderate";
  return "Heavy";
}

function BusMap({ bus }) {
  if (!bus) return null;

  const busPosition = [bus.latitude, bus.longitude];

  const segmentTraffic = bus.segment_traffic || [0, 0, 0, 0];

  return (
    <MapContainer
      center={busPosition}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFollower position={busPosition} />

      {routeCoordinates.slice(0, -1).map((point, index) => (
        <Polyline
          key={index}
          positions={[
            routeCoordinates[index],
            routeCoordinates[index + 1],
          ]}
          pathOptions={{
            color: trafficColor(segmentTraffic[index] ?? 0),
            weight: 7,
          }}
        />
      ))}

      {stops.map((stop) => (
        <Circle
          key={stop.name}
          center={stop.position}
          radius={80}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
          }}
        >
          <Popup>
            <strong>{stop.name}</strong>
          </Popup>
        </Circle>
      ))}

      <Marker position={busPosition} icon={busIcon}>
        <Popup>
          <strong>{bus.bus_id}</strong>
          <br />
          Speed: {bus.speed_kmh} km/h
          <br />
          Traffic: {bus.traffic}
          <br />
          ETA: {bus.eta_minutes} min
        </Popup>
      </Marker>
    </MapContainer>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.detail || data.message || "Invalid login");
        return;
      }

      localStorage.setItem("smartbus_user", JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError("Unable to connect to SmartBus server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🚌</div>

        <h1>SmartBus</h1>
        <p className="login-subtitle">
          AI-Powered Public Transport System
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-info">
          <div>
            <strong>Passenger</strong>
            <span>Track bus & ETA</span>
          </div>

          <div>
            <strong>Admin</strong>
            <span>Monitor fleet & traffic</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-logo">🚌</span>
        <div>
          <h2>SmartBus</h2>
          <span>AI Transport Intelligence</span>
        </div>
      </div>

      <div className="header-right">
        <span className="role-badge">
          {user.role === "admin" ? "ADMIN" : "PASSENGER"}
        </span>

        <span className="live-badge">
          <span className="live-dot"></span>
          LIVE
        </span>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </header>
  );
}

function PassengerDashboard() {
  const [bus, setBus] = useState(null);
  const [destination, setDestination] = useState("Stop 5");
  const [destinationEta, setDestinationEta] = useState(null);

  async function fetchBus() {
    try {
      const response = await fetch(`${API}/api/bus/live`);
      const data = await response.json();
      setBus(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function calculateETA() {
    if (!bus) return;

    try {
      const stopIndex = stops.findIndex(
        (stop) => stop.name === destination
      );

      const stopsRemaining = Math.max(
        1,
        stopIndex - (bus.current_segment || 0)
      );

      const response = await fetch(`${API}/api/eta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          distance_km: bus.distance_to_destination_km,
          speed_kmh: bus.speed_kmh,
          traffic_level: bus.traffic_level,
          stops_remaining: stopsRemaining,
          time_of_day: new Date().getHours(),
        }),
      });

      const data = await response.json();
      setDestinationEta(data.eta_minutes);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchBus();

    const interval = setInterval(fetchBus, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bus) {
      calculateETA();
    }
  }, [destination, bus]);

  return (
    <div className="dashboard passenger-dashboard">
      <div className="dashboard-title">
        <div>
          <h1>Passenger Dashboard</h1>
          <p>Track your bus in real time</p>
        </div>

        <div className="route-status">
          <span className="status-dot"></span>
          Route Active
        </div>
      </div>

      <div className="passenger-grid">
        <div className="map-card">
          <div className="card-header">
            <div>
              <h3>🗺️ Live Bus Tracking</h3>
              <p>Real-time GPS location</p>
            </div>

            {bus && (
              <span className="bus-id-badge">
                {bus.bus_id}
              </span>
            )}
          </div>

          <div className="map-container">
            <BusMap bus={bus} />
          </div>

          <div className="traffic-legend">
            <span>
              <i style={{ background: "#22c55e" }}></i>
              Low Traffic
            </span>

            <span>
              <i style={{ background: "#eab308" }}></i>
              Moderate
            </span>

            <span>
              <i style={{ background: "#ef4444" }}></i>
              Heavy Traffic
            </span>
          </div>
        </div>

        <div className="passenger-side">
          <div className="destination-card">
            <h3>📍 Select Destination</h3>

            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {stops.map((stop) => (
                <option key={stop.name}>{stop.name}</option>
              ))}
            </select>

            <div className="destination-eta">
              <span>Estimated Arrival</span>
              <strong>
                {destinationEta !== null
                  ? `${destinationEta} min`
                  : "--"}
              </strong>
            </div>
          </div>

          {bus && (
            <>
              <div className="info-card">
                <span>🚌 Current Bus</span>
                <strong>{bus.bus_id}</strong>
              </div>

              <div className="info-card">
                <span>⚡ Speed</span>
                <strong>{bus.speed_kmh} km/h</strong>
              </div>

              <div className="info-card">
                <span>📏 Distance</span>
                <strong>
                  {bus.distance_to_destination_km} km
                </strong>
              </div>

              <div className="info-card">
                <span>🚏 Next Stop</span>
                <strong>{bus.next_stop}</strong>
              </div>

              <div className="info-card">
                <span>🚦 Traffic</span>
                <strong
                  style={{
                    color: trafficColor(bus.traffic_level),
                  }}
                >
                  {bus.traffic}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsCharts({ history }) {
  if (history.length < 2) {
    return (
      <div className="charts-card">
        <div className="card-header">
          <div>
            <h3>📊 Live Analytics</h3>
            <p>Collecting real-time data...</p>
          </div>
        </div>

        <div className="chart-loading">
          Waiting for more live readings...
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-section">
      <div className="analytics-title">
        <div>
          <h2>📊 Live Analytics</h2>
          <p>Real-time ML and traffic performance monitoring</p>
        </div>

        <span className="analytics-live">
          <span className="live-dot"></span>
          Updating every 3 seconds
        </span>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>🤖 ETA Trend</h3>
              <p>ML predicted arrival time</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="eta"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>🚦 Traffic Level</h3>
              <p>Live traffic conditions</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis
                domain={[0, 2]}
                ticks={[0, 1, 2]}
                tickFormatter={(value) =>
                  value === 0
                    ? "Low"
                    : value === 1
                    ? "Moderate"
                    : "Heavy"
                }
              />
              <Tooltip
                formatter={(value) =>
                  trafficText(Number(value))
                }
              />

              <Bar
                dataKey="traffic"
                fill="#f59e0b"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>⚡ Speed Trend</h3>
              <p>Bus speed over time</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="speed"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  async function fetchDashboard() {
    try {
      const response = await fetch(
        `${API}/api/admin/dashboard`
      );

      const result = await response.json();

      setData(result);

      const bus = result.bus;

      if (bus) {
        const now = new Date();

        const reading = {
          time: now.toLocaleTimeString([], {
            minute: "2-digit",
            second: "2-digit",
          }),
          eta: Number(bus.eta_minutes),
          traffic: Number(bus.traffic_level),
          speed: Number(bus.speed_kmh),
        };

        setHistory((previous) => {
          const updated = [...previous, reading];

          return updated.slice(-20);
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(fetchDashboard, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  const bus = data.bus;
  const dashboard = data.dashboard;

  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-title">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Fleet monitoring & AI analytics</p>
        </div>

        <div className="route-status">
          <span className="status-dot"></span>
          System Operational
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🚌</div>
          <div>
            <span>Total Buses</span>
            <strong>{dashboard.total_buses}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">●</div>
          <div>
            <span>Active Buses</span>
            <strong>{dashboard.active_buses}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">🚦</div>
          <div>
            <span>Traffic</span>
            <strong>{dashboard.traffic_status}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">✓</div>
          <div>
            <span>System</span>
            <strong>{dashboard.system_status}</strong>
          </div>
        </div>
      </div>

      <div className="admin-main-grid">
        <div className="map-card admin-map-card">
          <div className="card-header">
            <div>
              <h3>🗺️ Live Fleet Map</h3>
              <p>Real-time vehicle tracking</p>
            </div>

            <span className="bus-id-badge">
              {bus.bus_id}
            </span>
          </div>

          <div className="admin-map">
            <BusMap bus={bus} />
          </div>
        </div>

        <div className="bus-details-card">
          <div className="card-header">
            <div>
              <h3>🚌 Bus Details</h3>
              <p>Live vehicle information</p>
            </div>
          </div>

          <div className="detail-list">
            <div>
              <span>Bus ID</span>
              <strong>{bus.bus_id}</strong>
            </div>

            <div>
              <span>Speed</span>
              <strong>{bus.speed_kmh} km/h</strong>
            </div>

            <div>
              <span>Distance</span>
              <strong>
                {bus.distance_to_destination_km} km
              </strong>
            </div>

            <div>
              <span>Next Stop</span>
              <strong>{bus.next_stop}</strong>
            </div>

            <div>
              <span>Stops Remaining</span>
              <strong>{bus.stops_remaining}</strong>
            </div>

            <div>
              <span>Traffic</span>
              <strong
                style={{
                  color: trafficColor(bus.traffic_level),
                }}
              >
                {bus.traffic}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-header">
          <div>
            <div className="ml-title">
              <span>🤖</span>
              <div>
                <h3>ML ETA Prediction</h3>
                <p>AI-powered arrival prediction</p>
              </div>
            </div>
          </div>

          <span className="ml-model-badge">
            Random Forest
          </span>
        </div>

        <div className="ml-content">
          <div className="ml-features">
            <div className="ml-feature">
              <span>Distance</span>
              <strong>
                {bus.distance_to_destination_km} km
              </strong>
            </div>

            <div className="ml-feature">
              <span>Speed</span>
              <strong>{bus.speed_kmh} km/h</strong>
            </div>

            <div className="ml-feature">
              <span>Traffic</span>
              <strong>{bus.traffic}</strong>
            </div>

            <div className="ml-feature">
              <span>Stops</span>
              <strong>{bus.stops_remaining}</strong>
            </div>
          </div>

          <div className="ml-prediction">
            <span>Predicted ETA</span>
            <strong>{bus.eta_minutes} min</strong>
          </div>
        </div>

        <div className="ml-footer">
          <span>Random Forest Regressor</span>
          <span>MAE: 1.70 minutes</span>
          <span className="ml-active">
            ● Active
          </span>
        </div>
      </div>

      <AnalyticsCharts history={history} />

      <div className="traffic-monitor-card">
        <div className="card-header">
          <div>
            <h3>🚦 Route Traffic Monitoring</h3>
            <p>Traffic conditions across route segments</p>
          </div>
        </div>

        <div className="traffic-segments">
          {(bus.segment_traffic || []).map(
            (level, index) => (
              <div
                className="traffic-segment"
                key={index}
              >
                <div className="segment-number">
                  Segment {index + 1}
                </div>

                <div
                  className="traffic-bar"
                  style={{
                    background: trafficColor(level),
                    width: `${Math.max(
                      20,
                      (level + 1) * 33
                    )}%`,
                  }}
                ></div>

                <span
                  style={{
                    color: trafficColor(level),
                  }}
                >
                  {trafficText(level)}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("smartbus_user");

    return saved ? JSON.parse(saved) : null;
  });

  function handleLogout() {
    localStorage.removeItem("smartbus_user");
    setUser(null);
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />

      {user.role === "admin" ? (
        <AdminDashboard />
      ) : (
        <PassengerDashboard />
      )}
    </div>
  );
}

export default App;