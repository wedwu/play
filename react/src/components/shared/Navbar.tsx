import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Playground", href: "/playground" },
  { label: "Cheatsheet", href: "/cheatsheet" },
  { label: "ES6", href: "/cheatsheet-es6" },
  { label: "TypeScript", href: "/cheatsheet-ts" },
  { label: "Playoffs", href: "/RadialChartBuilder" },
  { label: "TS Interview Widget", href: "/TypescriptInterviewWidget" },
];

interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const Navbar = ({ theme, onToggleTheme }: NavbarProps) => {
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">MyApp</div>
      <ul className="navbar-links">
        {navItems.map((item) => (
          <li key={item.label}>
            <Link to={item.href} className={pathname === item.href ? "active" : ""}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
        <span className="material-icons">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
      </button>
    </nav>
  );
};

export default Navbar;
