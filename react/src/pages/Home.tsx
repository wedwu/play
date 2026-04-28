import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";

const Home = () => {
  return (
    <main style={{ flex: 1, padding: "40px 32px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "32px" }}>Welcome to MyApp</h1>

      <section
        style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          marginBottom: "48px",
        }}
      >
        <Button label="Primary" variant="primary" onClick={() => alert("Primary clicked!")} />
        <Button label="Secondary" variant="secondary" onClick={() => alert("Secondary clicked!")} />
        <Button label="Danger" variant="danger" onClick={() => alert("Danger clicked!")} />
      </section>

      <section
        style={{
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Card
          title="Card One"
          description="This is the first card. It shows a title and a short description."
        />
        <Card
          title="Card Two"
          description="This is the second card. You can pass an image prop too."
        />
        <Card
          title="Card Three"
          description="This is the third card. All cards are reusable components."
        />
      </section>
    </main>
  );
};

export default Home;
