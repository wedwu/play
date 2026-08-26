// InputV2.tsx
import { useState } from "react";
import { WaInput } from "@/WebAwesome";

import "./Input.css";

const NameFieldV2 = () => {
  const [value, setValue] = useState("");

  return (
    <>
      <WaInput
        className="form-field"
        label="Your name"
        placeholder="Type here"
        onInput={(e) => setValue(e.currentTarget.value ?? "")}
      />
      <p>Live value: {value}</p>
    </>
  );
};

export default NameFieldV2;
