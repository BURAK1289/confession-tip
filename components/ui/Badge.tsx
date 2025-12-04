import { ReactNode } from "react";
import { ConfessionCategory } from "@/types";
import styles from "./Badge.module.css";

export interface BadgeProps {
  category: ConfessionCategory;
  children?: ReactNode;
}

export function Badge({ category, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[category]}`}>
      {children || category}
    </span>
  );
}
