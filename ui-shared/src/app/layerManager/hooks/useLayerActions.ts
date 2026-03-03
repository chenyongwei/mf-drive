import { useAppStore } from '../../store';
import { suggestProcessType } from '../utils/mappingPatterns';
import { getProcessTypeColor, getProcessTypeText } from '../utils/processTypeDisplay';

export function useLayerActions() {
  const { setLayerMapping, setBatchLayerMapping, exportLayerMappings, importLayerMappings } = useAppStore();

  // Apply all smart suggestions
  const applyAllSuggestions = (layers: any[]) => {
    layers.forEach((layer) => {
      const suggested = suggestProcessType(layer.name);
      setLayerMapping(layer.name, suggested);
    });
  };

  // Export layer mappings to JSON file
  const handleExport = () => {
    const json = exportLayerMappings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `layer-mappings-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import layer mappings from JSON file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      importLayerMappings(json);
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  const handleBatchSet = (group: any, processType: 'CUT' | 'MARK' | 'NONE') => {
    const layerNames = group.layers.map((l: any) => l.name);
    setBatchLayerMapping(layerNames, processType);
  };

  return {
    applyAllSuggestions,
    handleExport,
    handleImport,
    handleBatchSet,
    getProcessTypeColor,
    getProcessTypeText,
  };
}
