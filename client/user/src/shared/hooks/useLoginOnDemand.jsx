import { useSelector, useDispatch } from "react-redux";
import { openLoginModal } from "@redux/slices/uiSlice";

/**
 * useLoginOnDemand - Hook to gate interactions for unauthenticated users.
 * Returns a function that checks for login status before executing a callback.
 */
const useLoginOnDemand = () => {
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const gateInteraction = (callback, modalOptions = {}) => {
    if (isLoggedIn) {
      if (typeof callback === "function") callback();
    } else {
      dispatch(openLoginModal(modalOptions));
    }
  };

  return { gateInteraction, isLoggedIn };
};

export default useLoginOnDemand;
