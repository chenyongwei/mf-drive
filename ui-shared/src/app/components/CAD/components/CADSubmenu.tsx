import React from "react";
import type { CADToolType } from "../CADToolPanel.config";

interface SubmenuItem {
  id: CADToolType;
  label: string;
  icon?: React.ReactNode;
}

interface CADSubmenuProps {
  items: SubmenuItem[];
  onSelect: (tool: CADToolType) => void;
  onClose: () => void;
  theme?: "dark" | "light";
}

const getStyles = (theme: "dark" | "light") => ({
  container: {
    position: "absolute" as const,
    top: 0,
    left: "100%",
    marginLeft: "4px",
    backgroundColor: theme === "dark" ? "#1E1E21" : "#ffffff",
    border:
      theme === "dark"
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid #ccc",
    borderRadius: "4px",
    padding: "4px",
    boxShadow:
      theme === "dark"
        ? "0 4px 12px rgba(0, 0, 0, 0.4)"
        : "0 4px 12px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    color: theme === "dark" ? "#ffffff" : "#333333",
    fontSize: "12px",
    cursor: "pointer",
    borderRadius: "3px",
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left" as const,
    width: "100%",
    whiteSpace: "nowrap" as const,
  },
  itemHover: {
    backgroundColor:
      theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
  },
});

export const CADSubmenu: React.FC<CADSubmenuProps> = ({
  items,
  onSelect,
  onClose,
  theme = "dark",
}) => {
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [hoveredId, setHoveredId] = React.useState<CADToolType | null>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-submenu]")) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div style={styles.container} data-submenu>
      {items.map((item) => (
        <button
          key={item.id}
          style={{
            ...styles.item,
            ...(hoveredId === item.id ? styles.itemHover : {}),
          }}
          onClick={() => {
            onSelect(item.id);
            onClose();
          }}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {item.icon && (
            <span style={{ display: "flex", alignItems: "center" }}>
              {item.icon}
            </span>
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
};
