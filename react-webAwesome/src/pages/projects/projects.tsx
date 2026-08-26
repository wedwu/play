import { useEffect, useState } from "react";

import { WaPage, WaCard, WaCallout } from "@/WebAwesome";

import UsersTable from "@/components/Table/UsersTables";
import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Header from "@/components/Header/Header";
import Aside from "@/components/Aside/Aside";

import "./projects.css";

const Projects = () => {
  const [value, setValue] = useState("");
  const [usersLoaded, setUsersLoaded] = useState(false);
  useEffect(() => {}, [usersLoaded]);

  return (
    <WaPage mobileBreakpoint="768px">
      <div slot="banner">Web Awesome</div>
      <Header slot="header" />
      <NavBar />
      <main className="page-main">
        <Breadcrumb homeHref="" pageHref="projects" />
        <h1>Projects</h1>
        <p>page content</p>
        <UsersTable notState={setUsersLoaded} />
      </main>
      <Aside usersLoaded={usersLoaded} showCallout={false} />
      <Footer />
    </WaPage>
  );
};

export default Projects;
