import { Hono } from "hono";
import { createErrorResponse } from "./src/utils/responses";
import restaurantsRouter from "./src/routes/restaurants";
import cuisinesRouter from "./src/routes/cuisines";
import authRouter from "./src/routes/auth";
import { type AuthType } from "./src/lib/auth";
import { sessionMiddleware } from "./src/middlewares/authMiddleware";

const PORT = parseInt(process.env.PORT || "3000");

const app = new Hono<{ Variables: AuthType }>({
  strict: false,
});

app.route("/api/auth", authRouter);

app.use("*", sessionMiddleware);

app.route("/restaurants", restaurantsRouter);
app.route("/cuisines", cuisinesRouter);

app.onError((err, c) => {
  console.error(`Application Error: ${err.message}`, err.stack);

  const errorBody = createErrorResponse("Internal Server Error");

  return c.json(errorBody, 500);
});

app.notFound((c) => {
  const errorBody = createErrorResponse("Not Found");
  return c.json(errorBody, 404);
});

console.log(`Application running on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
