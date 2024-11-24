import { OTPService } from "../services/OTP.service";
import prisma from "../db/prisma";
import { generate } from "otp-generator";
import { prismaMock } from "../singleton";

beforeEach(() => {
  jest.clearAllMocks(); // clear all mocks
});

const generateMock = jest.fn();
jest.mock("prisma");

describe("OTPService", () => {
  describe("generateOTP", () => {
    it("should generate and store OTP for user", async () => {
      const mockUserId = 1;
      const mockOTP = "A1B2C3";
      generateMock.mockReturnValue(mockOTP);
      const mockOTPData = {
        id: 1,
        userId: mockUserId,
        otpCode: mockOTP,
        expirationTime: new Date("2024-11-25T15:23:45.123Z"),
        isUsed: false,
        activeStatus: true,
        createdAt: new Date("2024-11-24T15:23:45.123Z"),
        updatedAt: new Date("2024-11-24T15:23:45.123Z"),
        createdBy: 1,
        isActive: true,
        updatedBy: 1,
      };

      // mock the prisma db
      prismaMock.oTP.create.mockResolvedValue(mockOTPData);

      await expect(prisma.oTP.create({ data: mockOTPData })).resolves.toEqual(mockOTPData);
    });
  });
});
