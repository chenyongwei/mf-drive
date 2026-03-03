/**
 * Validate number is within range
 */
export function validateNumber(value: number, min?: number, max?: number): { isValid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, error: '请输入有效的数字' };
  }

  if (min !== undefined && value < min) {
    return { isValid: false, error: `值不能小于 ${min}` };
  }

  if (max !== undefined && value > max) {
    return { isValid: false, error: `值不能大于 ${max}` };
  }

  return { isValid: true };
}

/**
 * Validate string length
 */
export function validateString(value: string, min?: number, max?: number): { isValid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { isValid: false, error: '请输入有效的文本' };
  }

  const length = value.trim().length;

  if (min !== undefined && length < min) {
    return { isValid: false, error: `长度不能少于 ${min} 个字符` };
  }

  if (max !== undefined && length > max) {
    return { isValid: false, error: `长度不能超过 ${max} 个字符` };
  }

  return { isValid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (typeof email !== 'string') {
    return { isValid: false, error: '请输入有效的邮箱' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '邮箱格式不正确' };
  }

  return { isValid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): { isValid: boolean; error?: string } {
  if (typeof url !== 'string') {
    return { isValid: false, error: '请输入有效的 URL' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'URL 格式不正确' };
  }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = '此字段'): { isValid: boolean; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName}为必填项` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, error: `${fieldName}为必填项` };
  }

  return { isValid: true };
}
