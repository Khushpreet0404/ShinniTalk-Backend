import express from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { getMessages, sendMessage } from '../controllers/message.controller.js'

const router = express.Router()

router.get("/get/:chatId", getMessages)
router.post("/send", protect, sendMessage)

export default router    