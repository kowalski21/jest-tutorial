import { Request, Response, NextFunction } from "express";
import { OTPService } from "../services/OTP.service";
import { sendOTPSchema, verifyOTPSchema } from "../schemas/OTP.schema";

const handleOTP = async (
	req: Request,
	res: Response,
	next: NextFunction,
	isRetry: boolean = false
) => {
	try {
		const { userId, email } = sendOTPSchema.parse(req.body);
		await OTPService.sendOTP(email, userId, isRetry);
		res.status(201).json({
			status: "success",
			message: `OTP ${isRetry ? "re-sent" : "sent"} successfully`,
			data: null,
			errors: null,
		});
	} catch (error) {
		next(error);
	}
};

const sendOTP = (req: Request, res: Response, next: NextFunction) =>
	handleOTP(req, res, next);
const retryOTP = (req: Request, res: Response, next: NextFunction) =>
	handleOTP(req, res, next, true);

const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate input using Zod schema
		const parsedBody = verifyOTPSchema.parse(req.body);
		const { userId, otpCode } = parsedBody;

		const isValid = await OTPService.verifyOTP(userId, otpCode);

		if (isValid) {
			res.status(200).json({
				status: "success",
				message: "OTP verified successfully",
				data: null,
				errors: null,
			});
		} else {
			res.status(400).json({ message: "Invalid OTP" });
		}
	} catch (error) {
		next(error);
	}
};

export const OTPController = {
	sendOTP,
	retryOTP,
	verifyOTP,
};
