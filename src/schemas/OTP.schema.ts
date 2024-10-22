import { z } from 'zod';

export const generateOTPSchema = z.object({
	userId: z.number().min(1, { message: 'User ID must be a positive number' }),
});

export const verifyOTPSchema = z.object({
	userId: z.number().min(1, { message: 'User ID must be a positive number' }),
	otpCode: z.string().min(1, { message: 'OTP code is required' }),
});

export const sendOTPSchema = z.object({
	userId: z.number().min(1, { message: 'User ID must be a positive number' }),
	email: z.string().email({ message: 'Invalid email format' }),
});
