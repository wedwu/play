interface CardProps {
  title: string;
  description: string;
  image?: string;
}

const Card = ({ title, description, image }: CardProps) => {
  return (
    <div
      style={{
        border: "1px solid #2e2e3e",
        borderRadius: "12px",
        overflow: "hidden",
        width: "280px",
        backgroundColor: "#1e1e2e",
        color: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {image && (
        <img
          src={image}
          alt={title}
          style={{ width: "100%", height: "160px", objectFit: "cover" }}
        />
      )}
      <div style={{ padding: "16px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#646cff" }}>{title}</h3>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#aaa",
            lineHeight: "1.5",
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

export default Card;
