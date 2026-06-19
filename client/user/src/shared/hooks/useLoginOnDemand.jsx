import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/**
 * useLoginOnDemand - Hook to gate interactions for unauthenticated users.
 * Returns a function that checks for login status before executing a callback.
 */
const useLoginOnDemand = () => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const gateInteraction = (callback) => {
    if (isLoggedIn) {
      if (typeof callback === "function") callback();
    } else {
      navigate("/login");
    }
  };

  return { gateInteraction, isLoggedIn };
};

export default useLoginOnDemand;
