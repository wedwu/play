import React from "react";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
}

const Button = ({ label, onClick, variant = "primary" }: ButtonProps) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "#646cff", color: "#fff" },
    secondary: { backgroundColor: "#e2e8f0", color: "#333" },
    danger: { backgroundColor: "#ef4444", color: "#fff" },
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        ...styles[variant],
      }}
    >
      {label}
    </button>
  );
};

export default Button;
