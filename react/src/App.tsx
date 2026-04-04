import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Home from "@/pages/Home";
import Playground from "@/pages/Playground";
import { useTheme } from "@/hooks/useTheme";
import "@/App.css";

const App = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Playground />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
