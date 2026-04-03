import { createContext, useContext } from "react";

const GuestConnectionContext = createContext(null);

const useImsToken = () => {
  const guestConnection = useContext(GuestConnectionContext);
  return guestConnection?.sharedContext.get("imsToken");
};

export { GuestConnectionContext, useImsToken };
