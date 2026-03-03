export function getProcessTypeColor(type: string): string {
  switch (type) {
    case 'CUT':
      return 'bg-green-100 text-green-800';
    case 'MARK':
      return 'bg-cyan-100 text-cyan-800';
    case 'NONE':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getProcessTypeText(type: string): string {
  switch (type) {
    case 'CUT':
      return '切割';
    case 'MARK':
      return '打标';
    case 'NONE':
      return '不加工';
    default:
      return type;
  }
}
