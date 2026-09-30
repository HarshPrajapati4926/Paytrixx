import { PiSunDuotone, PiDesktopDuotone, PiMoonDuotone } from "react-icons/pi";
import { useTheme } from "../lib/theme.jsx";

const OPTIONS = [
  ["light", "Light", PiSunDuotone],
  ["system", "System", PiDesktopDuotone],
  ["dark", "Dark", PiMoonDuotone],
];

const ThemeToggle = () => {
  const { pref, setPref } = useTheme();
  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      {OPTIONS.map(([value, label, Icon]) => (
        <button key={value} type="button" title={label} aria-label={`${label} theme`} aria-pressed={pref === value} onClick={() => setPref(value)}>
          <Icon size={17} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
