// ThemeControls.tsx

import { WaSwitch } from "@/WebAwesome";
import { useTheme } from "@/context/ThemeContext";

import "./ThemeControls.css";

const ThemeControls = () => {
  const { dark, setDark } = useTheme();

  return (
    <div className="theme-controls">
      <WaSwitch checked={dark} onChange={(e) => setDark(e.currentTarget.checked)}>
        Dark
      </WaSwitch>
    </div>
  );
};

export default ThemeControls;
