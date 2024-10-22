import { OTPService } from "../services/OTP.service";
import prisma from "../db/prisma";
import otpGenerator, { generate } from "otp-generator";

// Mock the Prisma client
jest.mock("prisma");

// Mock the otp-generator library
jest.mock("otp-generator", () => ({
	generate: jest.fn(), // Directly mock the generate function
}));

beforeEach(() => {
	jest.clearAllMocks(); // Clear mocks before each test
});

describe("OTPService", () => {
	describe("generateOTP", () => {
		it("should generate and store an OTP for a user", async () => {
			const mockUserId = 1;
			const mockOTP = "A1B2C3";

			// Mock the return value of otpGenerator.generate
			(otpGenerator.generate as jest.Mock).mockReturnValue(mockOTP);

			const mockOTPData = {
				id: 1,
				userId: mockUserId,
				otpCode: mockOTP,
				expirationTime: expect.any(String),
				isUsed: false,
				activeStatus: true,
				createdAt: expect.any(Date),
				createdBy: 1,
			};

			// Mock the Prisma create function to return the mock data
			(prisma.oTP.create as jest.Mock).mockResolvedValue(mockOTPData);

			const result = await OTPService.generateOTP(mockUserId);

			// Verify otpGenerator.generate was called with the right parameters
			expect(otpGenerator.generate).toHaveBeenCalledWith(6, {
				digits: true,
				upperCaseAlphabets: true,
			});

			// Verify prisma.oTP.create was called with the right data
			expect(prisma.oTP.create).toHaveBeenCalledWith({
				data: {
					userId: mockUserId,
					otpCode: mockOTP,
					expirationTime: expect.any(String),
					isUsed: false,
					activeStatus: true,
					createdAt: expect.any(Date),
					createdBy: 1,
				},
			});

			// Verify the result is what we expect
			expect(result).toEqual(mockOTPData);
		});
	});
});
