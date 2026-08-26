// Header.tsx

import ThemeControls from "@/components/Theme/ThemeControls";
import { WaAvatar, WaIcon } from "@/WebAwesome";

import "./Header.css";

const Header = () => {
  return (
    <header slot="header" className="page-header">
      <WaIcon name="bars" label="Menu" data-toggle-nav></WaIcon>
      <strong>My App</strong>
      <div slot="end" className="page-header__end">
        <ThemeControls />
        <WaAvatar label="User" image="/avatar.png" loading="lazy"></WaAvatar>
      </div>
    </header>
  );
};

export default Header;
