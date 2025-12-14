import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Game } from "./components/Game";
import { ModelViewer } from "./components/ModelViewer";
import "./App.css";

function App() {
  const location = useLocation();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1a1a2e" }}>
      {/* Навигация */}
      <nav
        style={{
          padding: "15px 20px",
          backgroundColor: "#16213e",
          borderBottom: "2px solid #0f3460",
          display: "flex",
          gap: "15px",
          alignItems: "center",
        }}
      >
        <Link
          to="/"
          style={{
            padding: "10px 20px",
            backgroundColor:
              location.pathname === "/" ? "#0f3460" : "transparent",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "4px",
            border: `2px solid ${location.pathname === "/" ? "#00ff00" : "#0f3460"}`,
            fontSize: "16px",
            fontWeight: location.pathname === "/" ? "bold" : "normal",
            transition: "all 0.2s",
          }}
        >
          🎮 Игра
        </Link>
        <Link
          to="/models"
          style={{
            padding: "10px 20px",
            backgroundColor:
              location.pathname === "/models" ? "#0f3460" : "transparent",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "4px",
            border: `2px solid ${location.pathname === "/models" ? "#00ff00" : "#0f3460"}`,
            fontSize: "16px",
            fontWeight: location.pathname === "/models" ? "bold" : "normal",
            transition: "all 0.2s",
          }}
        >
          📦 Просмотр моделей
        </Link>
      </nav>

      {/* Роуты */}
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/models" element={<ModelViewer />} />
      </Routes>
    </div>
  );
}

export default App;
