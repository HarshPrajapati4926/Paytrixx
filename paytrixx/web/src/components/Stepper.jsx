import { PiCheckBold } from "react-icons/pi";

export const STEPS = ["Account", "Business", "Owners", "Address", "Bank", "Documents", "Review"];

// current: index of the active step; done: Set of completed indexes; onSelect(i) for completed steps.
const Stepper = ({ current, done = new Set(), onSelect }) => (
  <ol className="progress" aria-label="Registration progress">
    {STEPS.map((label, i) => {
      const isDone = done.has(i);
      const isCurrent = i === current;
      const clickable = onSelect && (isDone || isCurrent);
      return (
        <li key={label} className={isCurrent ? "current" : isDone ? "done" : ""} aria-current={isCurrent ? "step" : undefined}>
          <span className="dot">{isDone && !isCurrent ? <PiCheckBold size={12} /> : i + 1}</span>
          {clickable ? (
            <button type="button" onClick={() => onSelect(i)} style={{ all: "unset", cursor: "pointer" }}>{label}</button>
          ) : (
            label
          )}
        </li>
      );
    })}
  </ol>
);

export default Stepper;
