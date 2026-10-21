const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'API no ar' });
});

module.exports = router;
