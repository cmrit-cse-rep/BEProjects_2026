const express = require('express');
const router = express.Router();
const StudentResponse = require('../models/StudentResponse');

// Sample GET route
router.get('/', async (req, res) => {
    try {
        const data = await StudentResponse.find().limit(10);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
