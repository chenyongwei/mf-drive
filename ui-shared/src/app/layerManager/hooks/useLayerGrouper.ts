import { useMemo } from "react";
import type { LayerInfo, LayerGroup } from "../../store";
import { getAutocadColor } from "../utils/mappingPatterns";

type GroupType = "none" | "color" | "name";

interface UseLayerGrouperProps {
  layers: LayerInfo[];
  groupType: GroupType;
}

export function useLayerGrouper({ layers, groupType }: UseLayerGrouperProps) {
  return useMemo<LayerGroup[]>(() => {
    if (groupType === "none") {
      return [{ key: "all", type: "name" as const, label: "所有图层", layers }];
    }

    if (groupType === "color") {
      const colorMap = new Map<number, LayerInfo[]>();
      layers.forEach((layer) => {
        const color = layer.color;
        if (!colorMap.has(color)) {
          colorMap.set(color, []);
        }
        colorMap.get(color)!.push(layer);
      });

      return Array.from(colorMap.entries())
        .map(([color, layers]) => ({
          key: `color-${color}`,
          type: "color" as const,
          label: `颜色 ${color}`,
          layers,
        }))
        .sort((a, b) => a.layers[0].color - b.layers[0].color);
    }

    if (groupType === "name") {
      const nameMap = new Map<string, LayerInfo[]>();
      layers.forEach((layer) => {
        const name = layer.name;
        if (!nameMap.has(name)) {
          nameMap.set(name, []);
        }
        nameMap.get(name)!.push(layer);
      });

      return Array.from(nameMap.entries())
        .map(([name, layers]) => ({
          key: `name-${name}`,
          type: "name" as const,
          label: name,
          layers,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return [{ key: "all", type: "name" as const, label: "所有图层", layers }];
  }, [groupType, layers]);
}
