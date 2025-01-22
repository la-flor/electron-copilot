import { useEffect } from "react";

const useTheme = () => {
  useEffect(() => {
    const htmlElement = document.querySelector("html");
    if (!htmlElement) return;

    const getDarkModePreference = () => {
      htmlElement.setAttribute(
        "data-bs-theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
      );
    };

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", getDarkModePreference);

    return () =>
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", getDarkModePreference);
  }, []);
};

export default useTheme;
