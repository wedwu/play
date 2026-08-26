import React from "react";

import { Link, Outlet } from "react-router-dom";
import { AuthStatus } from "../../providers/AuthContext";

const Layout = () => {
  const [count, setCount] = React.useState<number>(0);

  React.useEffect(() => {
    console.log("one:" + count);
  }, []);

  React.useEffect(() => {
    if (count > 0) {
      setCount(count + 1);
      console.log("count great: " + count);
    } else {
      console.log("Count " + count);
    }
  }, [count]);

  return (
    <div>
      <AuthStatus />

      <ul>
        <li>
          <Link to="/">Public Page</Link>
        </li>
        <li>
          <Link to="/protected">Protected Page</Link>
        </li>
        <li>
          <Link to="/publicProtected">Public Protected Page</Link>
        </li>
      </ul>

      <Outlet />
    </div>
  );
};

export default Layout;
