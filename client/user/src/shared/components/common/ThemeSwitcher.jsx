import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Moon, Sun } from "lucide-react";
import { setTheme } from "@redux/slices/themeSlice";
import { Button } from "@kridaz/ui";

const ThemeSwitcher = () => {
  const theme = useSelector((state) => state.theme.current);
  const dispatch = useDispatch();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    dispatch(setTheme(newTheme));
  };

  return (
    <Button className="btn btn-ghost btn-circle me-1" onClick={toggleTheme}>
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
};

export default ThemeSwitcher;
