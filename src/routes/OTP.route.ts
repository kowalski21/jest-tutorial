import { Router } from 'express';
import { OTPController } from '../controllers/OTP.controller';

const router = Router();

router.post('/send', OTPController.sendOTP);
router.post('/retry', OTPController.retryOTP);
router.post('/verify', OTPController.verifyOTP);

export default router;
