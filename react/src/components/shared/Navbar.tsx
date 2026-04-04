import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Playground", href: "/playground" },
];

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        backgroundColor: "#1e1e2e",
        color: "#fff",
      }}
    >
      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#646cff" }}>
        MyApp
      </div>
      <ul
        style={{
          display: "flex",
          gap: "24px",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {navItems.map((item) => (
          <li key={item.label}>
            <Link
              to={item.href}
              style={{
                color: pathname === item.href ? "#646cff" : "#fff",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: pathname === item.href ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
