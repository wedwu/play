import { useEffect, useState } from "react";

import { WaPage, WaCard } from "@/WebAwesome";

import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Header from "@/components/Header/Header";
import Aside from "@/components/Aside/Aside";
import Card from "@/components/Card/Card";
import type { LoadState } from "@/types/UserTable";

import "./settings.css";

const Settings = () => {
  const [value, setValue] = useState("");
  const [state, setState] = useState<LoadState>("loading");
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const load = () => {
    setTimeout(() => setState("ready"), 5000);
  };

  useEffect(load, []);
  useEffect(() => {}, [usersLoaded]);

  return (
    <WaPage mobileBreakpoint="768px">
      <div slot="banner">Web Awesome</div>
      <Header slot="header" />
      <NavBar />
      <main className="page-main">
        <Breadcrumb homeHref="/" pageHref="/settings" />
        <h1>Settings</h1>
        <p>page content</p>
        <div className="card-grid">
          <Card title="Getting started" state={state} desc="" button={null} type="generic" />
          <Card title="Components" state={state} desc="" button={null} type="generic" />
          <Card title="Input" state={state} desc="" button={null} type="generic" />
          <Card title="Project Time" state={state} desc="" button={null} type="generic" />
        </div>
      </main>
      <Aside usersLoaded={usersLoaded} showCallout={usersLoaded} />
      <Footer />
    </WaPage>
  );
};

export default Settings;
