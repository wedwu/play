// NavBar.tsx

import { useLocation, useNavigate } from "react-router";

import { WaButton } from "@/WebAwesome";

import "./NavBar.css";

const LINKS = [
  { label: "Home", path: "/home" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Projects", path: "/projects" },
  { label: "Settings", path: "/settings" },
];

const NavBar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav slot="navigation" className="page-nav">
      {LINKS.map((link) => (
        <WaButton
          key={link.path}
          appearance={pathname === link.path ? "filled" : "plain"}
          onClick={() => navigate(link.path)}
        >
          {link.label}
        </WaButton>
      ))}
    </nav>
  );
};

export default NavBar;
