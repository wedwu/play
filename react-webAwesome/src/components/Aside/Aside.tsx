// Aside.tsx

import { WaCallout } from "@/WebAwesome";

interface AsideProps {
  usersLoaded: boolean;
  showCallout: boolean;
}

const Aside = ({ usersLoaded, showCallout }: AsideProps) => {
  return (
    showCallout && (
      <aside slot="aside" className="page-aside">
        <h4>Activity</h4>
        {!usersLoaded && <p>Nothing new right now.</p>}
        {usersLoaded && <WaCallout variant="success">Users loaded successfully!</WaCallout>}
      </aside>
    )
  );
};

export default Aside;
