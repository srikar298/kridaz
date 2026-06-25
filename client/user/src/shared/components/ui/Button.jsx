import { cn } from "../../lib/utils.js";
import { Button } from "@kridaz/ui";


const Button = ({ children, loading, className, ...props }) => {
  return (
    <Button
      className={cn("btn relative", className)}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="loading loading-spinner loading-md"></span>
        </span>
      ) : null}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </Button>
  );
};

export default Button;
