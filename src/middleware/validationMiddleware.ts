import { Request, Response, NextFunction } from "express";
import joi from "joi";

export const validateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const schema = joi.object({
    firstname: joi.string().required().messages({
      "sting.empty": "firstname cannot be empty",
      "any.required": "lastname is required",
      "string.base": "invalid type,please provide a valid string",
    }),
    lastname: joi.string().required().messages({
      "string.empty": "lastname cannot be empty",
      "any.required": "lastname is required",
      "string.base": "invalid type,please provide a valid string",
    }),
    middlename: joi.string().messages({
      "string.base": "middlename must be a string",
    }),
    email: joi.string().required().messages({
      "string.empty": "email cannot be empty",
      "any.required": "email is required",
      "string.base": "invalid type,please provide a valid string",
    }),
    password: joi
      .string()
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d])[A-Za-z\\d\\S]{8,}$"
        )
      )
      .required()
      .messages({
        "any.required": "Password is required.",
        "string.empty": "Password cannot be empty.",
        "string.pattern.base":
          "Password must be at least 8 characters long, contain uppercase letters, lowercase letters, numbers, and special characters.",
      }),

    confirmPassword: joi
      .string()
      .valid(joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Confirm password is required",
        "string.empty": "Confirm password cannot be empty",
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

export const validateLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userSchema = joi.object({
      email: joi.string().email().required().messages({
        "string.email": "provide a valid email",
        "any.required": "email is required",
        "string.empty": "email cannot be empty",
      }),
      password: joi.string().required().messages({
        "any.required": "password is required",
        "string.emoty": "password cannot be empty",
      }),
    });
    await userSchema.validateAsync(req.body, { abortEarly: false });
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
