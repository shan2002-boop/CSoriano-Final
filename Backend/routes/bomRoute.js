const express = require('express');
const { generateBOM } = require('../controllers/generateBomController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Route to generate BOM
router.post('/generate', generateBOM);

module.exports = router;
