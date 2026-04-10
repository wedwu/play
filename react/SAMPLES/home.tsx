//////////////////////////////////////////////////
// components/home/home.tsx
// System map Client Home Page Component
//
// Copyright (c) 2026 The Walt Disney Company.
// All rights reserved.

import { useEffect, useState } from "react";
import {
  UIButton,
  UIFooter,
  UIJSONViewer,
  UILoadingSpinner,
  UIToast,
  UITopBar,
} from "@disney/aot-ui/index-react";
import { process } from "@disney/aot-ui/src/utilities/api";
import { Get, Set } from "@disney/aot-ui/src/utilities/localstorage-utilities";

import { getServerEnvironment } from "@/config-utilities";
import project from "@/version";

import InActivityTimerCountdown from "@/components/InactivityTimer/InActivityTimerCountdown";
import DiagramLayout from "@/components/DiagramLayout/DiagramLayout";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "@/providers/WebSocketContext";
import {
  DeviceDetailsProvider,
  useDeviceDetails,
} from "@/providers/DeviceDetailsContext";
import {
  SHOW_JSON,
  SHOW_LOGIN_BUTTON,
  SHOW_TOP_BAR,
  SHOW_WEBSOCKET,
  SHOW_SIDEDRAWER,
} from "@/const";
import { safeParse } from "@/utilities/helpers-utilities";
import { useAuth } from "@/authentication-context";
import { apiRoutes, localStorageKeys } from "@/directions";
import { HomePageDefinition } from "./home.definition";
// DEBUGGING
import { debug } from "@/utilities/deguggerHelpers/debugger-helper";

import DebuggerWebSocket from "@/components/Debugger/DebuggerWebSocket";
import DebuggerLogin from "@/components/Debugger/DebuggerLogin";

import "./home.scss";

const HomePageContent = (props: HomePageDefinition) => {
  const navigate = useNavigate();
  const { logoutUser, isAuthenticated } = useAuth();

  const [serverVersion, setServerVersion] = useState<string>("");
  // state management for device list,  loading, errors and error messages
  const [devices, setDevices] = useState<any[]>([]); // Initialize as empty array

  const [errorMessage, setErrorMessage] = useState("");
  const [showDevices, setShowDevices] = useState(false);
  const [error, setError] = useState(false);
  const [showJSON, setJSON] = useState(null);

  // initiate websocket
  const { isConnected, hasError, wsManager } = useWebSocket();
  const { deviceDetails, extendedDetails } = useDeviceDetails();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);

  // Version number from the getServerEnvironment() function.
  useEffect(() => {
    if (isAuthenticated) updateStamps();
  }, [isAuthenticated]);

  // Load initial data from localStorage
  useEffect(() => {
    let isMounted = true;
    let storedDevices: string = "";

    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Get data from localStorage
        storedDevices = await Get(localStorageKeys.devices);
      } catch (error) {
        debug(error, {
          label: "Error loading from localStorage:",
          type: "error",
        });
        debug(hasError, {
          label: "hasError",
          type: "error",
        });
        setErrorMessage(JSON.stringify(error));

        setError(true);
        setLoading(false);
      } finally {
        if (isMounted) {
          setLoading(false);
          setError(false);
        }
        if (storedDevices) {
          setDevices(safeParse(storedDevices));
          if (SHOW_JSON) JSONDebugging();
          setShowDevices(true);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for WebSocket updates
  useEffect(() => {
    const unsubscribe = wsManager.addMessageHandler(async (data) => {
      debug(data, { label: "Received WebSocket data:", type: "info" });
      setLoading(true);

      if (data?.id) {
        // Update state
        setDevices((prev) => {
          let currentDevices =
            typeof prev === "string" ? JSON.parse(prev) : prev;
          currentDevices =
            typeof currentDevices === "string"
              ? JSON.parse(currentDevices)
              : currentDevices;

          debug(currentDevices, { label: "Current Devices: ", type: "table" });
          const existingIndex =
            currentDevices &&
            currentDevices?.findIndex((d: { id: string }) => d.id === data.id);
          let updated;

          if (existingIndex >= 0) {
            // Update existing device
            updated = [...currentDevices];
            updated[existingIndex] = { ...updated[existingIndex], ...data };
          } else {
            // Add new device
            updated = [...currentDevices, data];
          }

          // Save updated data to localStorage
          awaitDevices(JSON.stringify(updated));
          if (SHOW_JSON) JSONDebugging();
          setLoading(false);

          return updated;
        });
      } else {
        setLoading(false);
        setShowDevices(true);
        setError(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [wsManager]);

  const updateStamps = async () => {
    const serverEnvironment = await getServerEnvironment();
    setServerVersion(serverEnvironment?.version ?? "");
  };

  const dismissError = (e: Event): void => {
    // dismissing the toast component
    setErrorMessage("");
    setError(false);
  };

  const awaitDevices = async (updated: string) => {
    await Set(localStorageKeys.devices, updated);
    localStorage.setItem(localStorageKeys.devices, updated);
  };

  const JSONDebugging = async () => {
    const showJSONDevices = await Get(localStorageKeys.devices);
    setJSON(JSON.parse(JSON.parse(showJSONDevices)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    // testing the auth
    event.preventDefault();
    navigate(loggedIn ? "/logout" : "/login", { replace: true });
  };

  const handleLogOut = () => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to login
      navigate("/login", { replace: true });
      return;
    }
    if (isAuthenticated) {
      setLoggedIn(false);
      doLogout();
      return;
    }
  };

  // Handles the logout call, the logout function that
  // removes the localStorage when testing locally
  const doLogout = async () => {
    try {
      await process(apiRoutes.signOut);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      logoutUser();
    }
  };

  return (
    <>
      {SHOW_TOP_BAR && (
        <>
          <UITopBar
            title=""
            subtitleLeft=""
            subtitleRight=""
            logoUrl="/src/assets/apex-6-logo-light.svg"
          >
            <div className="main-actions" slot="right-actions">
              <UIButton
                onClick={handleLogOut}
                variant="minimal"
                text={
                  loggedIn && isAuthenticated && location.pathname !== "/login"
                    ? "Sign Out"
                    : "Sign In"
                }
              ></UIButton>
            </div>
          </UITopBar>
        </>
      )}
      <div className="home homeWrapper">
        {loading && (
          <>
            <div className="loader">
              <UILoadingSpinner />
            </div>
          </>
        )}

        {error && (
          <>
            <UIToast
              active={true}
              status="error"
              text={errorMessage}
              ondismiss={dismissError}
            />
          </>
        )}

        {showDevices ? (
          <>
            {showDevices && <DiagramLayout data={devices} />}
            {SHOW_JSON && showJSON && (
              <div className="JsonViewContainer">
                <UIJSONViewer data={JSON.stringify(showJSON)} />
              </div>
            )}
            {SHOW_SIDEDRAWER && extendedDetails && (
              <SideDrawer statusInfo={deviceDetails!} />
            )}
          </>
        ) : null}

        {SHOW_WEBSOCKET && <DebuggerWebSocket isWSConnected={isConnected} />}
        {SHOW_LOGIN_BUTTON && (
          <DebuggerLogin handleLSubmit={handleSubmit} loggedLIn={loggedIn} />
        )}
      </div>

      <UIFooter>
        <div className="expiration-wrapper" slot="first-slot">
          {isAuthenticated && (
            <InActivityTimerCountdown logOut={() => handleLogOut()} />
          )}
        </div>
        <div className="version-stamp" slot="second-slot">
          {serverVersion && <span>{serverVersion}</span>}
          -U {project.version}
        </div>
      </UIFooter>
    </>
  );
};

const ClientHomePage = (props: HomePageDefinition) => {
  return (
    <DeviceDetailsProvider>
      <HomePageContent {...props} />
    </DeviceDetailsProvider>
  );
};

export default ClientHomePage;
