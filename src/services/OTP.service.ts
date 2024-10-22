import prisma from "../db/prisma";
import otpGenerator from "otp-generator";
import { OTP, Prisma } from "@prisma/client";
import {
	ApiError,
	DatabaseError,
	NotFoundError,
	ValidationError,
} from "../errors";
import axios from "axios";

const OTPEmailTemplate = `
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 0; margin: 0;">
  <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="padding-bottom: 20px; text-align: center;">
        <h2 style="color: #333333;">Your Verification Code</h2>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom: 20px; text-align: center;">
        <p style="color: #666666; font-size: 16px;">Hi <strong>[User's First Name]</strong>,</p>
        <p style="color: #666666; font-size: 16px;">Your OTP code is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">[OTP Code]</p>
        <p style="color: #666666; font-size: 16px;">
          This code will expire in <strong>[OTP Expiry Time]</strong> minutes. Please enter it in the <strong>[App Name]</strong> app to verify your account.
        </p>
        <p style="color: #999999; font-size: 14px;">If you did not request this code, please ignore this email or contact support at <a href="mailto:[Support Email]" style="color: #4CAF50; text-decoration: none;">[Support Email]</a>.</p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 20px 0;">
        <p style="color: #666666; font-size: 14px;">
          Need help? Visit our <a href="[Help Center Link]" style="color: #4CAF50; text-decoration: none;">Help Center</a> or contact us at <a href="mailto:[Support Email]" style="color: #4CAF50; text-decoration: none;">[Support Email]</a>.
        </p>
        <p style="color: #666666; font-size: 14px;">
          Security Tip: For your safety, never share your verification code with anyone.
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 20px; border-top: 1px solid #dddddd;">
        <p style="color: #999999; font-size: 12px;">[App Name] © [Year] | [Company Address] | <a href="[Unsubscribe Link]" style="color: #999999; text-decoration: none;">Unsubscribe</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

interface PlaceholderData {
	firstName: string;
	otpCode: string;
	otpExpiry: string;
	appName: string;
	supportEmail: string;
	helpCenterLink: string;
	unsubscribeLink: string;
	year: string;
	companyAddress: string;
}

// Function to replace placeholders
function replacePlaceholders(template: string, data: PlaceholderData): string {
	return template
		.replace("[User's First Name]", data.firstName)
		.replace("[OTP Code]", data.otpCode)
		.replace("[OTP Expiry Time]", data.otpExpiry)
		.replace("[App Name]", data.appName)
		.replace("[Support Email]", data.supportEmail)
		.replace("[Help Center Link]", data.helpCenterLink)
		.replace("[Unsubscribe Link]", data.unsubscribeLink)
		.replace("[Year]", data.year)
		.replace("[Company Address]", data.companyAddress);
}

const storeOTP = async (userId: number, otp: string, createdBy: number) => {
	// Validate input and throw ValidationError
	if (userId === undefined || userId === null) {
		throw new ValidationError("User ID is undefined or null");
	}

	try {
		const otpData = await prisma.oTP.create({
			data: {
				userId: userId,
				otpCode: otp,
				expirationTime: new Date(Date.now() + 300000).toISOString(), // 5 minutes
				isUsed: false,
				isActive: true,
				createdAt: new Date(),
				createdBy: createdBy,
			},
		});
		return otpData;
	} catch (error) {
		// Log the original error and throw DatabaseError
		throw new DatabaseError("Error storing OTP in the database", error);
	}
};

const retrieveOTP = async (userId: number) => {
	if (userId === undefined || userId === null) {
		throw new ValidationError("User ID is undefined or null");
	}
	try {
		const otpData = await prisma.oTP.findFirst({
			where: {
				userId: userId,
				isUsed: false,
				isActive: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});
		if (!otpData) {
			throw new NotFoundError("OTP not found");
		}
		return otpData;
	} catch (error) {
		throw new DatabaseError("Error retrieving OTP", error);
	}
};

const updateOTP = async (otpData: OTP, isUsed: boolean, updatedBy: number) => {
	try {
		const updatedOTP = await prisma.oTP.update({
			where: {
				id: otpData.id,
			},
			data: {
				isUsed: isUsed,
				updatedAt: new Date(),
				updatedBy: updatedBy,
			},
		});
		return updatedOTP;
	} catch (error) {
		throw new DatabaseError("Error updating OTP", error);
	}
};

const verifyOTP = async (userId: number, otpCode: string) => {
	try {
		if (otpCode === undefined || otpCode === null) {
			throw new ValidationError("OTP code is undefined or null");
		}
		if (otpCode === undefined || otpCode === null) {
			throw new ValidationError("OTP code is undefined or null");
		}
		const otpData = await retrieveOTP(userId);
		const isExpired = new Date() > otpData.expirationTime;
		if (isExpired) {
			throw new ValidationError("OTP has expired");
		}
		const isValid = otpData.otpCode === otpCode;
		await updateOTP(otpData, true, userId);
		return isValid;
	} catch (error) {
		throw new DatabaseError("Error verifying OTP in the database", error);
	}
};

const generateOTP = async (userId: number) => {
	try {
		// Generate OTP with 6 characters (digits and uppercase alphabets)
		const otp = otpGenerator.generate(6, {
			digits: true,
			upperCaseAlphabets: true,
			lowerCaseAlphabets: false,
			specialChars: false,
		});

		// Store the generated OTP and handle database errors
		const otpData = await storeOTP(userId, otp, 1);
		return otpData;
	} catch (error) {
		// Check for known Prisma errors
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			throw new DatabaseError(
				"Failed to store OTP in the database",
				error
			);
		}

		// Catch any other unknown errors
		throw new ApiError(
			500,
			"An unexpected error occurred while generating OTP"
		);
	}
};

// const sendOTP = async (userEmail: string, userId: number, retry = false) => {
// 	let otpData: OTP | null = null;

// 	// Generate or retrieve OTP based on retry flag
// 	if (retry) {
// 		otpData = await retrieveOTP(userId);
// 		if (otpData.isUsed) {
// 			throw new ValidationError("OTP has already been used");
// 		}
// 		const isExpired = new Date() > otpData.expirationTime;
// 		if (isExpired) {
// 			// Generate a new OTP if the existing one has expired
// 			otpData = await generateOTP(userId);
// 		}
// 	} else {
// 		otpData = await generateOTP(userId);
// 	}

// 	// Define dynamic data for email template

// 	const emailData = {
// 		firstName: "User",
// 		otpCode: otpData.otpCode,
// 		otpExpiry: "5", // For example, 5 minutes
// 		appName: "Lighpex App",
// 		supportEmail: "support@lighpex.com",
// 		helpCenterLink: "https://lighpex.com/help",
// 		unsubscribeLink: "https://lighpex.com/unsubscribe",
// 		year: new Date().getFullYear().toString(),
// 		companyAddress: "123 Lighpex Street, Ghana",
// 	};

// 	// Replace placeholders in the OTP email template
// 	const htmlContent = replacePlaceholders(OTPEmailTemplate, emailData);

// 	// Setup Mailgun configuration
// 	const mailgunDomain = config.MAILGUN_DOMAIN;
// 	const mailgunApiKey = config.MAILGUN_API_KEY;
// 	const auth = { username: "api", password: mailgunApiKey };

// 	// Create FormData for Mailgun request
// 	const form = new FormData();
// 	form.append("from", `Lighpex <no-reply@${mailgunDomain}>`);
// 	form.append("to", userEmail);
// 	form.append("subject", "Your OTP Verification Code");
// 	form.append("html", htmlContent);

// 	const mailgunUrl = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;

// 	try {
// 		// Send the email using Axios
// 		const response = await axios.post(mailgunUrl, form, {
// 			headers: { "Content-Type": "multipart/form-data" },
// 			auth: auth,
// 		});

// 		return response.data; // Return Mailgun response data
// 	} catch (error: any) {
// 		// Handle Axios or other errors
// 		if (axios.isAxiosError(error)) {
// 			const message =
// 				error.response?.data?.message ||
// 				"Failed to send OTP due to an API error";
// 			throw new ApiError(500, message);
// 		} else {
// 			throw new ApiError(
// 				500,
// 				"Failed to send OTP due to an unknown error"
// 			);
// 		}
// 	}
// };

export const OTPService = {
	verifyOTP,
	generateOTP,
};
