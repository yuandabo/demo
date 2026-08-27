import type { NextFunction, Request, Response } from 'express'

/** 统一响应信封（契约：docs/design/api/*.md，code 取值 0/400/401/403/404/409/500） */
export interface ApiEnvelope<T = unknown> {
  code: number
  message: string
  data: T
}

/** 业务错误：路由内 throw，由全局错误中间件转为统一信封（替代散落的 res.status 链） */
export class HttpError extends Error {
  readonly status: number
  readonly code: number

  constructor(status: number, message: string, code: number = status) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** 成功响应：200 + {code:0, message:'ok', data} */
export function ok(res: Response, data: unknown = null): void {
  res.status(200).json({ code: 0, message: 'ok', data })
}

/** 失败响应：code 默认与 HTTP 状态码一致（当前全部 API 契约均如此，不同步时显式传入） */
export function fail(res: Response, status: number, message: string, code: number = status): void {
  res.status(status).json({ code, message, data: null })
}

/** 未匹配路由兜底：404 JSON（覆盖未知 /api 路径与静态资源缺失场景） */
export function notFoundHandler(_req: Request, res: Response): void {
  fail(res, 404, '接口不存在')
}

/** 异常兜底：HttpError 按其状态码返回，未预期异常 500（不向客户端暴露堆栈） */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    fail(res, err.status, err.message, err.code)
    return
  }
  // express.json 解析失败（body-parser SyntaxError，type=entity.parse.failed）→ 契约 400 文案
  if (err instanceof SyntaxError && (err as SyntaxError & { type?: string }).type === 'entity.parse.failed') {
    fail(res, 400, '请求体格式错误')
    return
  }
  console.error('[server] unhandled error:', err)
  fail(res, 500, '服务器内部错误')
}
