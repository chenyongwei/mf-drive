import { useCallback, useState } from 'react';
import { uploadFile, getParts } from '../../../services/api';
import type { Part as SharedPart } from '@dxf-fix/shared';
import { Part, MaterialGroup, SortBy, DisplayMode } from '../types';

/**
 * Custom hook for handling part list operations
 * (import, delete, filter, sort, etc.)
 */
export const usePartList = (
  activeMaterialGroupId: string | undefined,
  materialGroups: MaterialGroup[],
  setMaterialGroups: React.Dispatch<React.SetStateAction<MaterialGroup[]>>
) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMinArea, setFilterMinArea] = useState<number | undefined>();
  const [filterMaxArea, setFilterMaxArea] = useState<number | undefined>();
  const [filterMinQuantity, setFilterMinQuantity] = useState<number | undefined>();
  const [filterMaxQuantity, setFilterMaxQuantity] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<'all' | 'nested' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleImportParts = useCallback(
    async (files: FileList | File[]) => {
      const newParts: Part[] = [];
      const now = new Date().toISOString();

      for (let i = 0; i < files.length; i++) {
        const file = files[i] as File;
        const fileName = file.name.replace(/\.[^/.]+$/, '');

        try {
          // 上传文件到后端
          const fileInfo = await uploadFile(file, (progress) => {
          });


          // 等待文件解析完成（status = 'ready'）
          let retries = 0;
          let partsData: { total: number; parts: SharedPart[] };
          let fileReady = false;
          while (retries < 60) {
            // 最多等待60秒
            const response = await getParts(fileInfo.id);
            // 检查文件状态和零件数据
            if (response.parts && response.parts.length > 0) {
              // 额外检查文件状态是否为ready
              const statusResponse = await fetch(`/api/drawing/files/${fileInfo.id}/status`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.status === 'ready') {
                  fileReady = true;
                  partsData = response;
                  break;
                }
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retries++;
          }

          if (!fileReady || !partsData || !partsData.parts || partsData.parts.length === 0) {
            console.error('Failed to parse file or file not ready:', fileName);
            continue;
          }


          const fileThumbnailUrl = `/api/drawing/files/${fileInfo.id}/thumbnail`;

          // 将后端返回的零件数据转换为前端格式
          partsData.parts.forEach((sharedPart: SharedPart) => {
            const width = sharedPart.bbox.maxX - sharedPart.bbox.minX;
            const height = sharedPart.bbox.maxY - sharedPart.bbox.minY;

            newParts.push({
              id: sharedPart.id,
              name: sharedPart.name,
              fileId: sharedPart.fileId,
              fileName: fileName,
              dimensions: { width, height },
              quantity: 1,
              material: materialGroups[0].material,
              thickness: materialGroups[0].thickness,
              area: sharedPart.area,
              status: 'pending',
              thumbnail: sharedPart.thumbnail,
              thumbnailUrl: `/api/drawing/files/${sharedPart.fileId}/parts/${sharedPart.id}/thumbnail`,
              fileThumbnailUrl: fileThumbnailUrl,
              bbox: sharedPart.bbox,
              filePath: file.name,
              importTime: now,
            });
          });
        } catch (error) {
          console.error('Failed to import file:', fileName, error);
        }
      }

      setParts((prev) => [...prev, ...newParts]);

      // Update material group stats
      if (activeMaterialGroupId) {
        setMaterialGroups((prev) =>
          prev.map((g) => {
            if (g.id === activeMaterialGroupId) {
              return {
                ...g,
                partCount: g.partCount + newParts.length,
                totalQuantity:
                  g.totalQuantity + newParts.reduce((sum, p) => sum + p.quantity, 0),
              };
            }
            return g;
          })
        );
      }
    },
    [activeMaterialGroupId, materialGroups, setMaterialGroups]
  );

  const handleDeleteParts = useCallback(
    (partIds: string[]) => {
      setParts((prev) => prev.filter((p) => !partIds.includes(p.id)));
      setSelectedPartIds(new Set());

      // Update material group stats
      if (activeMaterialGroupId) {
        const deletedParts = parts.filter((p) => partIds.includes(p.id));
        setMaterialGroups((prev) =>
          prev.map((g) => {
            if (g.id === activeMaterialGroupId) {
              return {
                ...g,
                partCount: g.partCount - deletedParts.length,
                totalQuantity:
                  g.totalQuantity - deletedParts.reduce((sum, p) => sum + p.quantity, 0),
              };
            }
            return g;
          })
        );
      }
    },
    [parts, activeMaterialGroupId, setMaterialGroups]
  );

  const handleDuplicateParts = useCallback((partIds: string[]) => {
    setParts((prev) => {
      const newParts: Part[] = [];
      partIds.forEach((id) => {
        const part = prev.find((p) => p.id === id);
        if (part) {
          newParts.push({
            ...part,
            id: `part-${Date.now()}-${Math.random()}`,
            name: `${part.name} (副本)`,
            status: 'pending',
          });
        }
      });
      return [...prev, ...newParts];
    });
  }, []);

  const getFilteredParts = useCallback(() => {
    let filtered = [...parts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply area filter
    if (filterMinArea !== undefined) {
      filtered = filtered.filter(
        (p) => (p.area || p.dimensions.width * p.dimensions.height) >= filterMinArea
      );
    }
    if (filterMaxArea !== undefined) {
      filtered = filtered.filter(
        (p) => (p.area || p.dimensions.width * p.dimensions.height) <= filterMaxArea
      );
    }

    // Apply quantity filter
    if (filterMinQuantity !== undefined) {
      filtered = filtered.filter((p) => p.quantity >= filterMinQuantity);
    }
    if (filterMaxQuantity !== undefined) {
      filtered = filtered.filter((p) => p.quantity <= filterMaxQuantity);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      const areaA = a.area || a.dimensions.width * a.dimensions.height;
      const areaB = b.area || b.dimensions.width * b.dimensions.height;

      switch (sortBy) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'area':
          comparison = areaA - areaB;
          break;
        case 'time':
          comparison = (a.importTime || '').localeCompare(b.importTime || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [parts, searchQuery, filterMinArea, filterMaxArea, filterMinQuantity, filterMaxQuantity, filterStatus, sortBy, sortOrder]);

  const filters = {
    searchQuery,
    setSearchQuery,
    filterMinArea,
    setFilterMinArea,
    filterMaxArea,
    setFilterMaxArea,
    filterMinQuantity,
    setFilterMinQuantity,
    filterMaxQuantity,
    setFilterMaxQuantity,
    filterStatus,
    setFilterStatus,
  };
  const sorting = {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
  const actions = {
    handleImportParts,
    handleDeleteParts,
    handleDuplicateParts,
  };

  return {
    parts,
    setParts,
    selectedPartIds,
    setSelectedPartIds,
    filters,
    sorting,
    actions,
    getFilteredParts,
  };
};
