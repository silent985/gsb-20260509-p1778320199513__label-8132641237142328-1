export interface APIError {
  status?: number;
  code?: string | number;
  message?: string;
  error?: {
    code?: string | number;
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  '403': '403 错误：API 密钥无效或无权限，请检查配置',
  '401': '401 错误：API 密钥未授权，请检查配置',
  '429': '429 错误：API 请求过于频繁，请稍后再试',
  '30001': '账户余额不足，请充值后再试',
};

const DEFAULT_ERROR_MESSAGE = '发送消息失败';

export const mapAPIError = (err: APIError): string => {
  if (err.status && ERROR_MESSAGES[err.status]) {
    return ERROR_MESSAGES[err.status];
  }
  if (err.code && ERROR_MESSAGES[String(err.code)]) {
    return ERROR_MESSAGES[String(err.code)];
  }
  if (err.error?.code && ERROR_MESSAGES[String(err.error.code)]) {
    return ERROR_MESSAGES[String(err.error.code)];
  }
  if (err.message) {
    return err.message;
  }
  return DEFAULT_ERROR_MESSAGE;
};
