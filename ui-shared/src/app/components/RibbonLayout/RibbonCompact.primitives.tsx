import React, { useRef, useState } from 'react';
import { useDismissOnOutsideClick } from './hooks/useDismissOnOutsideClick';

interface RibbonButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  hotkey?: string;
  tooltip?: string;
  variant?: 'default' | 'primary';
  size?: 'small' | 'medium';
}

interface RibbonGroupProps {
  title: string;
  icon: React.ReactNode;
  hotkey?: string;
  children: React.ReactNode;
}

export const RibbonButton: React.FC<RibbonButtonProps> = ({
  label,
  icon,
  onClick,
  disabled = false,
  hotkey,
  tooltip,
  variant = 'default',
  size = 'small',
}) => {
  const sizeClasses = {
    small: 'w-9 h-10',
    medium: 'w-10 h-11',
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${tooltip}${hotkey ? ` (${hotkey})` : ''}`}
      className={`
        ${sizeClasses[size]} ${variantClasses[variant]}
        flex flex-col items-center justify-center rounded
        transition-all duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
      `}
    >
      <div className="flex-1 flex items-center justify-center">{icon}</div>
      <div className="text-[8px] leading-tight mt-0.5 opacity-80 font-medium truncate w-full">
        {label}
      </div>
    </button>
  );
};

export const RibbonGroup: React.FC<RibbonGroupProps> = ({ title, icon, hotkey, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(isOpen, menuRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-1" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-1 p-0.5 hover:bg-slate-100 rounded cursor-pointer">
          {children}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-10 flex flex-col items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
          title={`${title} (${hotkey})`}
        >
          <div className="flex-1 flex items-center justify-center">{icon}</div>
          <div className="text-[8px] leading-tight mt-0.5 opacity-80 font-medium truncate w-full">
            {title}
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[160px] z-50">
          <div className="px-3 py-1 text-xs font-semibold text-slate-500 border-b border-slate-100 mb-1">
            {title}
          </div>
          <div>
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  size: 'medium',
                  className: 'w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2',
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const RibbonSeparator: React.FC = () => {
  return <div className="w-px h-8 bg-slate-300 mx-1" />;
};
