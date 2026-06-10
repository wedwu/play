import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";
import { Component, useState } from "react";


const reverse = (s) => {
    return [...s].reverse().join("");
}

console.log(reverse("Hello, World!")); // Output: !dlroW ,olleH
console.log(reverse("JavaScript")); // Output: tpircSavaJ

// .backwards {
//   transform: scaleX(-1);
// }

class Parent extends Component {
  render () {
    return [
      <h1>Parent Component</h1>,
      <Child name="Aragon Esetar" locations={["Chicago", "London", "Cairo"]} />
    ];
  }
}
class Child extends Component {
  render() {
    return [
      <h2>{this.name}</h2>,
      <h3> Location: {this.locations.map(location => location)}</h3>
    ];
  }
}

const Example = () => {
  const [name, setName] = useState("Tutankhamun")
  return (
    <div>
      <h1>{name}</h1>
      <button onClick={() => setName("Hatshepsut")} />
    </div>
  )
}

const Home = () => {
  const [counter, setCounter] = useState(0);
  const handleIncrement = () => {
    setCounter(counter + 1);
    setCounter(counter + 1);
    console.log("Counter after increment:", counter);
  };

  return (
    <main style={{ flex: 1, padding: "40px 32px" }}>
      <div style={{transform: 'scaleX(-1)'}}>{reverse("JavaScript")}</div>
      <Example />
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
        <Button label="Increment Counter" variant="primary" onClick={handleIncrement} />
        <p>Counter: {counter}</p> 
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
