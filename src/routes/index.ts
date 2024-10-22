import Router from "express";
import OTPRoutes from "./OTP.route";
const router = Router();

const moduleRoutes = [
	{
		path: "/otp",
		routes: OTPRoutes,
	},
];

moduleRoutes.forEach((route) => router.use(route.path, route.routes));
export default router;
