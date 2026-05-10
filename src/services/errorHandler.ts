const STATUS_MESSAGES: Record<number, string> = {
  401: '401 错误：API 密钥未授权，请检查配置',
  403: '403 错误：API 密钥无效或无权限，请检查配置',
  429: '429 错误：API 请求过于频繁，请稍后再试',
};

const INSUFFICIENT_BALANCE_CODE = 30001;

function isInsufficientBalance(err: any): boolean {
  return err.code === INSUFFICIENT_BALANCE_CODE || err.error?.code === INSUFFICIENT_BALANCE_CODE;
}

export function formatApiError(err: any): string {
  if (err.status && STATUS_MESSAGES[err.status]) {
    return STATUS_MESSAGES[err.status];
  }
  if (isInsufficientBalance(err)) {
    return '账户余额不足，请充值后再试';
  }
  if (err.message) {
    return err.message;
  }
  return '发送消息失败';
}
