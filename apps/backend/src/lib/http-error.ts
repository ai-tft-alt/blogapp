export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = '리소스를 찾을 수 없습니다.') =>
  new HttpError(404, 'NOT_FOUND', message);
export const forbidden = (message = '권한이 없습니다.') => new HttpError(403, 'FORBIDDEN', message);
export const unauthorized = (message = '로그인이 필요합니다.') =>
  new HttpError(401, 'UNAUTHORIZED', message);
