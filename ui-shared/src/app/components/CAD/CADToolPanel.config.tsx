import React from 'react';
import { Icons } from './components/CADIcons';

export type CADToolType =
  | 'select'
  | 'pan'
  | 'zoom-in'
  | 'zoom-out'
  | 'fit-view'
  | 'trim'
  | 'extend'
  | 'explode'
  | 'delete'
  | 'undo'
  | 'redo'
  | 'draw-line'
  | 'draw-polyline'
  | 'draw-circle'
  | 'draw-ellipse'
  | 'draw-arc'
  | 'draw-arc-3pt'
  | 'draw-rectangle'
  | 'draw-bezier'
  | 'draw-dimension'
  | 'draw-text';

export interface CADToolPanelProps {
  activeTool: CADToolType;
  onToolSelect: (tool: CADToolType) => void;
  onDelete?: () => void;
  onTrim?: () => void;
  onExtend?: () => void;
  onExplode?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
  hasSingleSelection?: boolean;
  hasEditableEntities?: boolean;
  theme?: 'dark' | 'light';
  editToolsEnabled?: boolean;
  showDrawTools?: boolean;
  style?: React.CSSProperties;
}

export interface ToolButton {
  id: CADToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  group: 'navigation' | 'edit' | 'history' | 'draw';
  hasSubmenu?: boolean;
}

export const TOOLS: ToolButton[] = [
  { id: 'select', icon: <Icons.Select />, label: '选择', shortcut: 'V', group: 'navigation' },
  { id: 'pan', icon: <Icons.Pan />, label: '平移', shortcut: 'Space', group: 'navigation' },
  { id: 'draw-dimension', icon: <Icons.Dimension />, label: '标注', shortcut: 'D', group: 'navigation' },
  { id: 'zoom-in', icon: <Icons.ZoomIn />, label: '放大', shortcut: '+', group: 'navigation' },
  { id: 'zoom-out', icon: <Icons.ZoomOut />, label: '缩小', shortcut: '-', group: 'navigation' },
  { id: 'fit-view', icon: <Icons.FitView />, label: '适合视图', shortcut: 'F', group: 'navigation' },

  { id: 'trim', icon: <Icons.Trim />, label: '修剪', shortcut: 'T', group: 'edit' },
  { id: 'extend', icon: <Icons.Extend />, label: '延伸', shortcut: 'E', group: 'edit' },
  { id: 'explode', icon: <Icons.Explode />, label: '炸开', shortcut: 'X', group: 'edit' },
  { id: 'delete', icon: <Icons.Delete />, label: '删除', shortcut: 'Del', group: 'edit' },

  { id: 'draw-line', icon: <Icons.Line />, label: '直线', shortcut: 'L', group: 'draw' },
  { id: 'draw-polyline', icon: <Icons.Polyline />, label: '多段线', shortcut: 'P', group: 'draw' },
  { id: 'draw-circle', icon: <Icons.Circle />, label: '圆形', shortcut: 'C', group: 'draw', hasSubmenu: true },
  { id: 'draw-rectangle', icon: <Icons.Rect />, label: '矩形', shortcut: 'R', group: 'draw' },
  { id: 'draw-bezier', icon: <Icons.Bezier />, label: '贝塞尔', shortcut: 'B', group: 'draw' },
  { id: 'draw-text', icon: <Icons.Text />, label: '文字', shortcut: 'M', group: 'draw' },

  { id: 'undo', icon: <Icons.Undo />, label: '撤销', shortcut: 'Ctrl+Z', group: 'history' },
  { id: 'redo', icon: <Icons.Redo />, label: '重做', shortcut: 'Ctrl+Y', group: 'history' },
];

export const DRAW_CIRCLE_SUBMENU_ITEMS = [
  { id: 'draw-circle' as CADToolType, label: '圆形', icon: <Icons.Circle width={14} height={14} /> },
  { id: 'draw-ellipse' as CADToolType, label: '椭圆', icon: <Icons.Ellipse width={14} height={14} /> },
  { id: 'draw-arc' as CADToolType, label: '扫描式圆弧', icon: <Icons.Arc width={14} height={14} /> },
  { id: 'draw-arc-3pt' as CADToolType, label: '三点圆弧', icon: <Icons.Arc3Pt width={14} height={14} /> },
];

export function getCADToolPanelStyles(theme: 'dark' | 'light') {
  return {
    container: {
      position: 'absolute' as const,
      top: '50%',
      left: '0',
      transform: 'translateY(-50%)',
      backgroundColor: theme === 'dark' ? 'rgba(25, 25, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#ccc',
      borderLeftWidth: '0',
      borderRadius: '0 8px 8px 0',
      padding: '4px 2px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0px',
      zIndex: 100,
      boxShadow: theme === 'dark' ? '4px 0 24px rgba(0, 0, 0, 0.5)' : '4px 0 12px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(16px)',
    },
    divider: {
      height: '1px',
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#eee',
      margin: '2px 2px',
    },
    button: {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      outline: 'none',
    },
    buttonActive: {
      backgroundColor: 'rgba(74, 158, 255, 0.15)',
      color: '#4A9EFF',
    },
    activeIndicator: {
      position: 'absolute' as const,
      left: '-2px',
      top: '6px',
      bottom: '6px',
      width: '2px',
      backgroundColor: '#4A9EFF',
      borderRadius: '0 2px 2px 0',
      boxShadow: '0 0 10px rgba(74, 158, 255, 0.5)',
    },
    buttonHover: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      color: theme === 'dark' ? '#ffffff' : '#000000',
    },
    buttonDisabled: {
      opacity: 0.2,
      cursor: 'not-allowed',
      filter: 'grayscale(1)',
    },
    tooltip: {
      position: 'absolute' as const,
      left: '38px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: theme === 'dark' ? '#1E1E21' : '#ffffff',
      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #ccc',
      color: theme === 'dark' ? '#ffffff' : '#333333',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
      zIndex: 200,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    },
    shortcut: {
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
      marginLeft: '6px',
      fontSize: '9px',
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      padding: '0px 3px',
      borderRadius: '2px',
    },
    submenuIndicator: {
      position: 'absolute' as const,
      bottom: '0px',
      right: '0px',
      width: '10px',
      height: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      borderRadius: '2px',
    },
    submenuArrow: {
      width: '0',
      height: '0',
      borderLeft: '3px solid transparent',
      borderRight: '3px solid transparent',
      borderTop: theme === 'dark' ? '3px solid rgba(255,255,255,0.5)' : '3px solid rgba(0,0,0,0.5)',
    },
  };
}
