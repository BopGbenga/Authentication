import { Request, Response, NextFunction } from "express";
import joi from "joi";

export const validateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const schema = joi.object({
    firstName: joi.string().required().messages({
      "sting.empty": "firstname cannot be empty",
      "any.required": "lastname is required",
      "string.base": "invalid type,please provide a valid string",
    }),
    lastname: joi.string().required().messages({
      "string.empty": "lastname cannot be empty",
      "any.required": "lastname is required",
      "string.base": "invalid type,please provide a valid string",
    }),
    middleName: joi.string().messages({
      "string.base": "middlename must be a string",
    }),
    email: joi.string().required().messages({
      "string.empty": "email cannot be empty",
      "any.required": "email is required",
      "string.base": "invalid type,please provide a valid string",
    }),
  });
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error: any) {
    const errors = error.details.map((detail: any) => ({
      field: detail.context.key,
      message: detail.message,
    }));
    res.status(422).json({
      message: "validation error",
      success: false,
      errors,
    });
  }
};
