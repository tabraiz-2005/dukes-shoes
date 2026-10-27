"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_KEY = "dukes-theme";
type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

/** Switches the storefront between the black and the white theme. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={`Switch to ${next === "light" ? "white" : "black"} theme`}
      title={next === "light" ? "White theme" : "Black theme"}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute("content", next === "light" ? "#ffffff" : "#000000");
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          /* private mode: the choice lasts for this visit */
        }
      }}
    >
      {theme === "dark" ? <Sun size={19} strokeWidth={1.4} /> : <Moon size={19} strokeWidth={1.4} />}
    </button>
  );
}
