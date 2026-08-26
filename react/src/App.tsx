import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Home from "@/pages/Home";
import Playground from "@/pages/Playground";
import Cheatsheet from "@/pages/Cheatsheet";
import CheatsheetES6 from "@/pages/CheatsheetES6";
import CheatsheetTS from "@/pages/CheatsheetTS";
import CheatsheetTanStack from "@/pages/CheatsheetTanStack";
import TanStackQueryDemo from "@/pages/TanStackQueryDemo";
import RadialChartBuilder from "@/pages/RadialChartBuilder";
import TypescriptInterviewWidget from "@/pages/TypescriptInterviewWidget";
import InterviewChallenges from "@/pages/InterviewChallenges";

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
          <Route path="/cheatsheet" element={<Cheatsheet />} />
          <Route path="/cheatsheet-es6" element={<CheatsheetES6 />} />
          <Route path="/cheatsheet-ts" element={<CheatsheetTS />} />
          <Route path="/cheatsheet-tanstack" element={<CheatsheetTanStack />} />
          <Route path="/tanstack-query-demo" element={<TanStackQueryDemo />} />
          <Route path="/RadialChartBuilder" element={<RadialChartBuilder />} />
          <Route path="/TypescriptInterviewWidget" element={<TypescriptInterviewWidget />} />
          <Route path="/interview-challenges" element={<InterviewChallenges />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
