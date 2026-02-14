const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createReflection,
  getReflections,
  getReflection,
  updateReflection,
  deleteReflection,
  getReflectionStats,
  reanalyzeReflection
} = require("../controllers/reflectionController");

// All routes are protected
router.use(protect);

router.route("/")
  .post(createReflection)
  .get(getReflections);

router.route("/stats")
  .get(getReflectionStats);

router.route("/:id")
  .get(getReflection)
  .put(updateReflection)
  .delete(deleteReflection);

// Add reanalyze endpoint
router.post("/:id/reanalyze", reanalyzeReflection);

module.exports = router;
