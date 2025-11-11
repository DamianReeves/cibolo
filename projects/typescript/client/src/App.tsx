import { useEffect, useState } from "react";
import "./App.css";

interface HealthResponse {
  status: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("http://localhost:3000/health");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ndoctrinate Client</h1>
        <p>React + Vite + ElysiaJS + Effect</p>

        <div className="card">
          <h2>Backend Health Check</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="error">Error: {error}</p>}
          {health && (
            <div>
              <p>
                Status: <strong>{health.status}</strong>
              </p>
              <p>
                Timestamp: <code>{health.timestamp}</code>
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Getting Started</h3>
          <ul style={{ textAlign: "left" }}>
            <li>Backend API: http://localhost:3000</li>
            <li>Swagger Docs: http://localhost:3000/swagger</li>
            <li>Frontend Dev Server: http://localhost:5173</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;
