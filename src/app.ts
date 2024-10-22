import express from "express";
import Routes from "./routes/index";
const app = express();

app.use(express.json());
app.use("/api/", Routes);

app.listen(3000, () => {
	console.log("Server started");
});
