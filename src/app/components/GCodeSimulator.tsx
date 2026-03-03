import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage } from 'react-konva';
import { gcodeParser, GCodeCommand, Point } from '../services/gcodeParser';
import {
  CurrentCommandPanel,
  SimulatorControls,
  SimulatorInfoPanel,
  SimulatorLegend,
  SimulatorProgressBar,
  SimulatorSpeedControl,
} from './GCodeSimulator.panels';
import { GCodeSimulatorCanvas } from './GCodeSimulator.canvas';
import './GCodeSimulator.css';

interface GCodeSimulatorProps {
  gcode: string;
  onClose?: () => void;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const GCodeSimulator: React.FC<GCodeSimulatorProps> = ({ gcode, onClose }) => {

  const [commands, setCommands] = useState<GCodeCommand[]>([]);
  const [bbox, setBbox] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0);
  const [view, setView] = useState<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // 解析 G 代码
  useEffect(() => {
    const result = gcodeParser.parse(gcode);
    setCommands(result.commands);
    setBbox(result.bbox);

    // 自动适配视图
    if (result.commands.length > 0) {
      autoFitView(result.bbox);
    }

    // 重置状态
    setCurrentIndex(-1);
    setProgress(0);
    setIsPlaying(false);
  }, [gcode]);

  // 自动适配视图
  const autoFitView = useCallback((box: { minX: number; minY: number; maxX: number; maxY: number }) => {
    const padding = 40;
    const container = document.querySelector('.gcode-simulator')?.clientWidth || 600;
    const width = container - padding * 2;
    const height = 400 - padding * 2;

    const contentWidth = box.maxX - box.minX;
    const contentHeight = box.maxY - box.minY;

    const scaleX = width / (contentWidth || 1);
    const scaleY = height / (contentHeight || 1);
    const scale = Math.min(scaleX, scaleY) * 0.9;

    const centerX = (box.minX + box.maxX) / 2;
    const centerY = (box.minY + box.maxY) / 2;

    setView({
      scale,
      offsetX: width / 2 - centerX * scale,
      offsetY: height / 2 - centerY * scale,
    });
  }, []);

  // 动画循环
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastUpdateTimeRef.current;

      // 控制更新频率
      if (deltaTime > 100 / speed) {
        lastUpdateTimeRef.current = timestamp;

        if (currentIndex < commands.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setProgress(((nextIndex + 1) / commands.length) * 100);
        } else {
          // 播放完成
          setIsPlaying(false);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, currentIndex, commands.length, speed]);

  // 播放控制
  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else if (currentIndex >= commands.length - 1) {
      // 重新开始
      setCurrentIndex(-1);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(true);
    }
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setProgress(((newIndex + 1) / commands.length) * 100);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentIndex < commands.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setProgress(((newIndex + 1) / commands.length) * 100);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setProgress(0);
  };

  const handleEnd = () => {
    setIsPlaying(false);
    setCurrentIndex(commands.length - 1);
    setProgress(100);
  };

  // 进度条控制
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    const newIndex = Math.floor((newProgress / 100) * (commands.length - 1));
    setProgress(newProgress);
    setCurrentIndex(newIndex);
    setIsPlaying(false);
  };

  // 鼠标拖拽
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const oldScale = view.scale;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // 限制缩放范围
    const clampedScale = Math.max(0.1, Math.min(newScale, 10));

    setView({
      scale: clampedScale,
      offsetX: e.stagePointer.x - (e.stagePointer.x - view.offsetX) * (clampedScale / oldScale),
      offsetY: e.stagePointer.y - (e.stagePointer.y - view.offsetY) * (clampedScale / oldScale),
    });
  };

  const handleMouseDown = (e: any) => {
    setIsDragging(true);
    setDragStart({ x: e.evt.clientX, y: e.evt.clientY });
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging || !dragStart) return;

    const dx = e.evt.clientX - dragStart.x;
    const dy = e.evt.clientY - dragStart.y;

    setView({
      ...view,
      offsetX: view.offsetX + dx,
      offsetY: view.offsetY + dy,
    });

    setDragStart({ x: e.evt.clientX, y: e.evt.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // 转换坐标
  const transformPoint = (p: Point) => ({
    x: p.x * view.scale + view.offsetX,
    y: p.y * view.scale + view.offsetY,
  });

  const currentPos = currentIndex >= 0 && currentIndex < commands.length
    ? commands[currentIndex].end
    : (commands.length > 0 ? commands[0].start : { x: 0, y: 0 });

  const transformedCurrentPos = transformPoint(currentPos);

  return (
    <div className="gcode-simulator">
      <div className="simulator-header">
        <span className="simulator-title">G 代码模拟</span>
        {onClose && (
          <button className="btn-control" onClick={onClose}>✕</button>
        )}
      </div>

      <SimulatorControls
        isPlaying={isPlaying}
        onReset={handleReset}
        onStepBack={handleStepBack}
        onPlayToggle={handlePlay}
        onStepForward={handleStepForward}
        onEnd={handleEnd}
      />

      {/* 画布 */}
      <div className="simulator-canvas">
        <Stage
          width={600}
          height={400}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <GCodeSimulatorCanvas
            bbox={bbox}
            view={view}
            commands={commands}
            currentIndex={currentIndex}
            transformPoint={transformPoint}
            transformedCurrentPos={transformedCurrentPos}
          />
        </Stage>
      </div>

      <SimulatorProgressBar progress={progress} onChange={handleProgressChange} />

      <SimulatorSpeedControl
        speed={speed}
        onChange={(e) => setSpeed(parseFloat(e.target.value))}
      />

      <CurrentCommandPanel
        command={
          currentIndex >= 0 && currentIndex < commands.length
            ? commands[currentIndex].raw
            : undefined
        }
      />

      <SimulatorLegend />

      <SimulatorInfoPanel bbox={bbox} commands={commands} />
    </div>
  );
};
