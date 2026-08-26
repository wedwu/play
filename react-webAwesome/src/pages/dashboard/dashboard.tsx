import { useEffect, useState } from "react";

import {
  WaPage,
  WaButton,
  WaCard,
  WaProgressBar,
  WaCallout,
  WaInput,
  WaSpinner,
} from "@/WebAwesome";

import InputFieldV1 from "@/components/Input/InputV1";
import InputFieldV2 from "@/components/Input/InputV2";
import UsersTable from "@/components/Table/UsersTables";
import DoughnutChart from "@/components/Chart/DoughnutChart";
import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Header from "@/components/Header/Header";
import Aside from "@/components/Aside/Aside";
import Card from "@/components/Card/Card";
import { fetchProjects } from "@/api/projects";

import "./dashboard.css";

const Dashboard = () => {
  const [usersLoaded, setUsersLoaded] = useState(false);

  const [state, setState] = useState<LoadState>("loading");
  const [notificationState, setNotificationState] = useState<boolean>(false);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [notState, setNotState] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  useEffect(() => {}, [usersLoaded]);

  const load = () => {
    setState("loading");
    setProjectsLoaded(false);
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setState("ready");
        setLoadedAt(Date.now());
        setProjectsLoaded(true);
        notState?.(true);
        setTimeout(() => {
          notState?.(false);
        }, 5000);
      })
      .catch(() => {
        setState("error");
        setProjectsLoaded(false);
      });
  };

  useEffect(load, []);

  return (
    <WaPage mobileBreakpoint="768px">
      {usersLoaded && <WaCallout variant="success">Users loaded successfully!</WaCallout>}
      <div slot="banner">Web Awesome</div>
      <Header />
      <NavBar />
      <main className="page-main">
        <Breadcrumb homeHref="/" pageHref="/dashboard" />
        <h1>Dashboard</h1>
        <p>This is the dashboard page.</p>
        {usersLoaded && (
          <WaProgressBar value={70} label="Page load progress" indeterminate></WaProgressBar>
        )}
        <div className="card-grid">
          <Card
            title="Project Time Allocation"
            state={state}
            desc=""
            button={null}
            type="chart"
            projects={projects}
          />
          <Card
            title="Input"
            state={state}
            desc="Use the <code>wa-input</code> component for user input."
            button={{ text: "View docs", variant: "outlined" }}
            type="form"
          />
          <Card
            title="Getting Started"
            state={state}
            desc="Edit <code>src/pages/home/home.tsx</code> to change this content."
            button={{ text: "Learn more", variant: "brand" }}
            type="generic"
          />
          <Card
            title="Components"
            state={state}
            desc="Mix any <code>wa-*</code> elements inside the page slots."
            button={{ text: "View docs", variant: "outlined" }}
            type="generic"
          />
        </div>
        <UsersTable notState={setUsersLoaded} />
      </main>
      <Aside usersLoaded={usersLoaded} showCallout={false} />
      <Footer />
    </WaPage>
  );
};

export default Dashboard;
