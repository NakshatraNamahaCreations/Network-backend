const express = require("express");
const { createPlan, getAllPlans, getPlanById, updatePlan, deletePlan } = require("../../Controller/Auth/Plan");
const router = express.Router();

router.get("/",      getAllPlans);
router.get("/:id",   getPlanById);
router.post("/",     createPlan);
router.put("/:id",   updatePlan);
router.delete("/:id", deletePlan);

module.exports = router;
