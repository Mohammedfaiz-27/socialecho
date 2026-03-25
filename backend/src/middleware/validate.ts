import type { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false })
    if (error) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
        },
      })
      return
    }
    next()
  }
}
