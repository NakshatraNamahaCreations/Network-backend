const Plan = require("../../Model/Auth/Plan");

exports.createPlan = async (req, res) => {
  try {
    const { name, price, sortOrder } = req.body;
    if (!name || price === undefined)
      return res.status(400).json({ success: false, message: "name and price are required" });

    const existing = await Plan.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing)
      return res.status(400).json({ success: false, message: "Plan with this name already exists" });

    const plan = await Plan.create({
      name: name.trim(),
      price: Number(price),
      sortOrder: sortOrder || 0,
    });
    return res.status(201).json({ success: true, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllPlans = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === "true" ? { isActive: true } : {};
    const plans = await Plan.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    return res.status(200).json({ success: true, plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    return res.status(200).json({ success: true, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, isActive, sortOrder } = req.body;

    const update = {};
    if (name !== undefined)      update.name      = name.trim();
    if (price !== undefined)     update.price     = Number(price);
    if (isActive !== undefined)  update.isActive  = isActive;
    if (sortOrder !== undefined) update.sortOrder = sortOrder;

    const plan = await Plan.findByIdAndUpdate(id, update, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    return res.status(200).json({ success: true, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    return res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
