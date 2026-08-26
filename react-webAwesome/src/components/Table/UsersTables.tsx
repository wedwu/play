// UsersTable.tsx

import { useEffect, useState } from "react";

import { WaCard, WaBadge, WaSpinner, WaButton, WaCallout, WaRelativeTime } from "@/WebAwesome";
import { STATUS_VARIANT, type LoadState, type UsersTableProps, type User } from "@/types";
import { fetchUsers } from "@/api/users";

import "./UsersTable.css";

const UsersTable = ({ notState }: UsersTableProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [notificationState, setNotificationState] = useState<boolean>(false);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);

  const load = () => {
    setState("loading");
    setNotificationState(false);
    fetchUsers()
      .then((data) => {
        setUsers(data);
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

  return (
    <WaCard className="users-card">
      <div slot="header" className="users-card__header">
        <strong>Team members</strong>
        <WaButton size="small" appearance="outlined" onClick={load} disabled={state === "loading"}>
          Refresh
        </WaButton>
      </div>

      {state === "loading" && (
        <div className="users-card__center">
          <WaSpinner style={{ fontSize: "2rem" }}></WaSpinner>
        </div>
      )}

      {state === "error" && (
        <WaCallout variant="danger">
          Couldn’t load users.{" "}
          <WaButton size="small" appearance="plain" onClick={load}>
            Try again
          </WaButton>
        </WaCallout>
      )}

      {notificationState && <WaCallout variant="success">Users loaded successfully!</WaCallout>}

      {state === "ready" && loadedAt && (
        <p className="users-card__loaded">
          Loaded <WaRelativeTime date={new Date(loadedAt).toISOString()} sync />
        </p>
      )}

      {state === "ready" && (
        <div className="users-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="Name">{user.name}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role">{user.role}</td>
                  <td data-label="Status">
                    <WaBadge variant={STATUS_VARIANT[user.status]}>{user.status}</WaBadge>
                  </td>
                  <td data-label="Joined">{new Date(user.joined).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WaCard>
  );
};

export default UsersTable;
