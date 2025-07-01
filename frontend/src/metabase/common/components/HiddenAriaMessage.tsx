import type React from "react";

interface HiddenAriaMessageProps {
  children: React.ReactNode;
  ariaLive?: "polite" | "assertive";
  ariaAtomic?: boolean;
}

export const HiddenAriaMessage = ({
  children,
  ariaLive = "polite",
  ariaAtomic = true,
}: HiddenAriaMessageProps) => (
  <div
    className="visually-hidden"
    aria-live={ariaLive}
    aria-atomic={ariaAtomic}
    style={{
      position: "absolute",
      left: "-9999px",
      width: "1px",
      height: "1px",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);
