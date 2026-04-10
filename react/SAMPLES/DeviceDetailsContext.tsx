//////////////////////////////////////////////////
// providers/DeviceDetailsContext.tsx
// System map Device Details Context Provider
//
// Copyright (c) 2026 The Walt Disney Company.
// All rights reserved.

import React, { createContext, useContext, useState } from "react";
import type { DeviceNode } from "@/types";

interface DeviceDetailsContextType {
  deviceDetails: DeviceNode | null;
  extendedDetails: boolean;
  setDeviceDetails: (device: DeviceNode | null) => void;
  setExtendedDetails: (extended: boolean) => void;
  openStatusInfoDetails: (device: DeviceNode) => void;
}

const DeviceDetailsContext = createContext<DeviceDetailsContextType | undefined>(
  undefined,
);

export const DeviceDetailsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [deviceDetails, setDeviceDetails] = useState<DeviceNode | null>(null);
  const [extendedDetails, setExtendedDetails] = useState(false);

  const openStatusInfoDetails = (device: DeviceNode) => {
    setDeviceDetails(device);
    setExtendedDetails(true);
  };

  return (
    <DeviceDetailsContext.Provider
      value={{
        deviceDetails,
        extendedDetails,
        setDeviceDetails,
        setExtendedDetails,
        openStatusInfoDetails,
      }}
    >
      {children}
    </DeviceDetailsContext.Provider>
  );
};

export const useDeviceDetails = () => {
  const context = useContext(DeviceDetailsContext);
  if (!context) {
    throw new Error(
      "useDeviceDetails must be used within DeviceDetailsProvider",
    );
  }
  return context;
};
