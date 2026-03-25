import type { Response } from 'express'

export function success<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data })
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return res.status(200).json({
    data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  })
}

export function error(res: Response, message: string, code: string, status = 400) {
  return res.status(status).json({ error: { code, message } })
}
