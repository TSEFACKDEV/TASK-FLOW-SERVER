import { Router } from "express"
import authRoute from "./auth.route.js"
import projectRouter from "./project.route.js"
import taskRouter from "./task.route.js"
import userRouter from "./user.route.js"
import testRouter from "./test.route.js"
const router = Router()

router.use("/auth",authRoute)
router.use("/projects",projectRouter)
router.use("/tasks",taskRouter)
router.use("/users",userRouter)
router.use("/test",testRouter)

export default router