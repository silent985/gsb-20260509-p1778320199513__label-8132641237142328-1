export interface ApiError extends Error {
  status?: number;
  code?: string | number;
  error?: { code?: string | number };
}

export const ErrorType = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  UNKNOWN: 'UNKNOWN'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

export const classifyError = (error: ApiError): ErrorType => {
  if (error.status === 401) return ErrorType.UNAUTHORIZED;
  if (error.status === 403) return ErrorType.FORBIDDEN;
  if (error.status === 429) return ErrorType.RATE_LIMITED;
  if (error.code === 30001 || error.error?.code === 30001) return ErrorType.INSUFFICIENT_BALANCE;
  return ErrorType.UNKNOWN;
};

export const getErrorMessage = (error: ApiError): string => {
  const errorType = classifyError(error);
  
  switch (errorType) {
    case ErrorType.FORBIDDEN:
      return '403 错误：API 密钥无效或无权限，请检查配置';
    case ErrorType.UNAUTHORIZED:
      return '401 错误：API 密钥未授权，请检查配置';
    case ErrorType.RATE_LIMITED:
      return '429 错误：API 请求过于频繁，请稍后再试';
    case ErrorType.INSUFFICIENT_BALANCE:
      return '账户余额不足，请充值后再试';
    default:
      return error.message || '发送消息失败';
  }
};

export const logError = (error: ApiError, context: string = 'API'): void => {
  console.error(`${context} Error:`, error);
};
