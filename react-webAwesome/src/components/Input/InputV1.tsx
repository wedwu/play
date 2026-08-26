// InputV1.tsx

import { useState } from "react";
import { WaInput } from "@/WebAwesome";

import "./Input.css";

const InputFieldV1 = () => {
  const [value, setValue] = useState("");

  return (
    <div>
      <WaInput
        label="Your name"
        placeholder="Type here"
        onInput={(e) => setValue(e.currentTarget.value ?? "")}
        onChange={(e) => console.log("committed:", e.currentTarget.value)}
      />
      <p>Live value: {value}</p>
    </div>
  );
};

export default InputFieldV1;
