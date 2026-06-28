import { toast as hotToast } from "react-hot-toast";

const isDev = import.meta.env.DEV;

export const appToast = {
  success: (message, options) => {
    return hotToast.success(message, options);
  },
  error: (message, options) => {
    if (isDev) {
      return hotToast.error(message, options);
    }
    // Block error toasts in production (we handle errors inline instead)
    return null; 
  },
  loading: (message, options) => hotToast.loading(message, options),
  dismiss: (toastId) => hotToast.dismiss(toastId),
  remove: (toastId) => hotToast.remove(toastId),
};

export default appToast;
