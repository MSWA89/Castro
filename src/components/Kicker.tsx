import React from "react";
import { mono, c } from "../theme";

export const Kicker: React.FC<{ children: React.ReactNode; opacity?: number }> = ({
  children,
  opacity = 1,
}) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 26,
      letterSpacing: 8,
      textTransform: "uppercase",
      color: c.lilac,
      opacity,
    }}
  >
    {children}
  </div>
);
