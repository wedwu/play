const Footer = () => {
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "24px",
        backgroundColor: "#1e1e2e",
        color: "#aaa",
        fontSize: "14px",
        marginTop: "auto",
      }}
    >
      <p style={{ margin: 0 }}>
        © {new Date().getFullYear()} MyApp. All rights reserved.
      </p>
      <div
        style={{
          marginTop: "8px",
          display: "flex",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <a href="#" style={{ color: "#646cff", textDecoration: "none" }}>
          Privacy Policy
        </a>
        <a href="#" style={{ color: "#646cff", textDecoration: "none" }}>
          Terms of Service
        </a>
        <a href="#" style={{ color: "#646cff", textDecoration: "none" }}>
          Contact
        </a>
      </div>
    </footer>
  );
};

export default Footer;
