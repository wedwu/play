type WaButtonVariant = "neutral" | "brand" | "success" | "warning" | "danger";
type WaButtonAppearance = "accent" | "filled" | "outlined" | "plain";

interface CardButton {
  text: string;
  variant?: WaButtonVariant;
  appearance?: WaButtonAppearance;
}

export interface CardProps {
  title: string;
  state: LoadState;
  desc: string;
  button: CardButton | null;
  type: "form" | "chart" | "generic";
  projects?: DoughnutChartProps["segments"];
}
