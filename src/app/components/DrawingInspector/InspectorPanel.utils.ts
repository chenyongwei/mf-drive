import { InspectionLevel, IssueType } from '@dxf-fix/shared/types/inspection';

export const getLevelColor = (level: InspectionLevel): string => {
  switch (level) {
    case InspectionLevel.ERROR:
      return 'text-red-600 bg-red-50 border-red-200';
    case InspectionLevel.WARNING:
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case InspectionLevel.INFO:
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getLevelIcon = (level: InspectionLevel): string => {
  switch (level) {
    case InspectionLevel.ERROR:
      return '✕';
    case InspectionLevel.WARNING:
      return '⚠';
    case InspectionLevel.INFO:
      return '●';
    default:
      return '•';
  }
};

export const getIssueTypeLabel = (type: IssueType): string => {
  switch (type) {
    case IssueType.UNCLOSED_CONTOUR:
      return '不封闭轮廓';
    case IssueType.DUPLICATE_LINES:
      return '重复线';
    case IssueType.OVERLAPPING_LINES:
      return '交叠线';
    case IssueType.SELF_INTERSECTION:
      return '自相交';
    case IssueType.TINY_ENTITY:
      return '微小实体';
    case IssueType.ZERO_LENGTH:
      return '零长度';
    default:
      return '未知问题';
  }
};
