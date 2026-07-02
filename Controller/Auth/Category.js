const Category = require("../../Model/Auth/Category");

exports.addCategory = async (req, res) => {
  try {
    const { name, icon, sortOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) return res.status(400).json({ success: false, message: "Category already exists" });

    const category = await Category.create({ name: name.trim(), icon: icon || "", sortOrder: sortOrder || 0 });
    return res.status(201).json({ success: true, category });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === "true" ? { isActive: true } : {};
    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, isActive, sortOrder } = req.body;
    const category = await Category.findByIdAndUpdate(
      id,
      { ...(name && { name }), ...(icon !== undefined && { icon }), ...(isActive !== undefined && { isActive }), ...(sortOrder !== undefined && { sortOrder }) },
      { new: true }
    );
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    return res.status(200).json({ success: true, category });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
