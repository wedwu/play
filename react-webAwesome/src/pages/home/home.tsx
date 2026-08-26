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

import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Header from "@/components/Header/Header";
import Aside from "@/components/Aside/Aside";
import { fetchUserById } from "@/api/users";
import type { User } from "@/types/UserTable";

import "./home.css";

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [notificationState, setNotificationState] = useState<boolean>(false);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [notState, setNotState] = useState<boolean | null>(null);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const load = () => {
    setState("loading");
    setNotificationState(false);
    fetchUserById(1)
      .then((data) => {
        setUser(data);
        setState("ready");
        setLoadedAt(Date.now());
        setNotificationState(true);
        notState?.(true);
        setTimeout(() => {
          setNotificationState(false);
          notState?.(false);
        }, 5000);
      })
      .catch(() => {
        setState("error");
        setNotificationState(false);
      });
  };

  useEffect(load, []);
  useEffect(() => {}, [usersLoaded]);

  return (
    <WaPage mobileBreakpoint="768px">
      {usersLoaded && <WaCallout variant="success">Users loaded successfully!</WaCallout>}
      <div slot="banner">Web Awesome</div>
      <Header />
      <NavBar />
      <main className="page-main">
        <Breadcrumb homeHref="/" pageHref="/home" />
        <h1>Home</h1>
        <p>page content</p>
        {state === "loading" && (
          <div className="users-card__center">
            <WaSpinner style={{ fontSize: "2rem" }}></WaSpinner>
          </div>
        )}
        {state === "ready" && user !== null && (
          <div className="user-details">
            <h2>User Details</h2>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </div>
        )}
      </main>
      <Aside usersLoaded={usersLoaded} showCallout={false} />
      <Footer />
    </WaPage>
  );
};

export default Home;
