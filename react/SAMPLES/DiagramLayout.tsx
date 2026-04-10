//////////////////////////////////////////////////
// components/DiagramLayout/DiagramLayout.tsx
// System map Diagram Layout Component
//
// Copyright (c) 2026 The Walt Disney Company.
// All rights reserved.

import { useEffect, useState } from "react";
import Debugger from "@/components/Debugger/Debugger";
import CardController from "@/components/DeviceBoxes/CardController";
import LeaderLines from "@/components/LeaderLines/LeaderLines";
import computeLayers from "@/utilities/graph-layers-utilities";
import { useDeviceDetails } from "@/providers/DeviceDetailsContext";

import {
  alocal,
  DEBUGGING,
  SHOW_COLUMN,
  SHOW_DEVICE,
  STOP_WEB_SOCKET,
} from "@/const";

import type { DeviceNode, RawDevice } from "@/types";
import { debug } from "@/utilities/deguggerHelpers/debugger-helper";
import WebSocketTestPanel from "@/services/WebSocketService.test";

import "./DiagramLayout.scss";

import { diagramConfig } from "@/config/diagramConfigv3";

const DiagramLayout = (data: { data: { devices: DeviceNode[] } } | any) => {
  const devicesStore = data.data;
  if (!devicesStore || devicesStore.length === 0) return;
  const devices: DeviceNode[] = alocal ? diagramConfig.devices : devicesStore; //  = devicesStore;

  if (DEBUGGING && SHOW_COLUMN) Debugger(devices);

  // Compute the column layout
  if (!devices) return;

  const { openStatusInfoDetails } = useDeviceDetails();

  const layerMap = computeLayers(devices);

  // Group devices by column
  const columnGroups = new Map<number, RawDevice[]>();
  for (const device of devices) {
    const column = layerMap.get(device.id) ?? 0;
    if (!columnGroups.has(column)) {
      columnGroups.set(column, []);
    }
    columnGroups.get(column)!.push(device);
  }

  // Sort columns
  const sortedColumns = Array.from(columnGroups.keys()).sort((a, b) => a - b);

  if (DEBUGGING && SHOW_DEVICE) {
    debug(sortedColumns, { label: "sortedColumns", type: "table" });
  }

  return (
    <>
      <div className="diagramWrapper">
        {sortedColumns.map((columnIndex) => (
          <div key={columnIndex} className="diagramColumn">
            {DEBUGGING && alocal ? <h3>Column {columnIndex}</h3> : null}
            {(columnGroups.get(columnIndex) ?? []).map((device) => {
              DEBUGGING &&
                SHOW_DEVICE &&
                debug(device, {
                  label: "device",
                  type: "table",
                });
              return (
                <div id={`node-${device.id}`} key={device.id}>
                  <CardController
                    cardType={device?.deviceType}
                    device={device}
                    openDetails={openStatusInfoDetails}
                  />
                </div>
              );
            })}
          </div>
        ))}
        <LeaderLines devices={devices} containerId="diagram-canvas" />
      </div>
      <WebSocketTestPanel debug={STOP_WEB_SOCKET || false} />
    </>
  );
};

export default DiagramLayout;
