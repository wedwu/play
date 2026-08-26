import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import { ThemeProvider } from "@/context/ThemeContext";

import Home from "@/pages/home/home";
import Settings from "@/pages/settings/settings";
import Projects from "@/pages/projects/projects";
import Dashboard from "@/pages/dashboard/dashboard";

import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
