// Card.tsx

import { useState } from "react";

import { WaButton, WaCallout, WaCard, WaInput, WaSpinner } from "@/WebAwesome";
import InputFieldV1 from "@/components/Input/InputV1";
import InputFieldV2 from "@/components/Input/InputV2";
import DoughnutChart from "@/components/Chart/DoughnutChart";
import type { LoadState, DoughnutChartProps, CardProps } from "@/types";

import "./Card.css";

const Card = ({ title, state, desc, button, type, projects = [] }: CardProps) => {
  const [value, setValue] = useState("");

  return (
    <WaCard>
      <h3>{title}</h3>
      {state === "loading" && (
        <div className="users-card__center">
          <WaSpinner style={{ fontSize: "2rem" }}></WaSpinner>
        </div>
      )}

      {state === "error" && (
        <WaCallout variant="danger">
          Couldn’t load {title}.{" "}
          <WaButton size="small" appearance="plain" onClick={() => {}}>
            Try again
          </WaButton>
        </WaCallout>
      )}

      {state === "ready" && type === "form" && (
        <>
          <p dangerouslySetInnerHTML={{ __html: desc }} />
          <InputFieldV1 />
          <InputFieldV2 />
          <WaInput
            label="Your name"
            placeholder="Type here"
            onInput={(e) => setValue(e.currentTarget.value ?? "")}
            onChange={(e) => console.log("committed", e)}
          />
          <p>Live value: {value}</p>
        </>
      )}

      {state === "ready" && type === "chart" && (
        <div style={{ width: "100%", height: "200px", alingnSelf: "center" }}>
          <DoughnutChart label="Project time distributed across activities" segments={projects} />
        </div>
      )}

      {state === "ready" && type === "generic" && (
        <>
          <p dangerouslySetInnerHTML={{ __html: desc }} />
          {button && (
            <WaButton slot="footer" variant={button.variant} appearance={button.appearance}>
              {button.text}
            </WaButton>
          )}
        </>
      )}
    </WaCard>
  );
};

export default Card;
