const Subcategory = require("../../Model/Auth/Subcategory");

exports.addSubcategory = async (req, res) => {
  try {
    const { name, icon, category, sortOrder } = req.body;
    if (!name || !category)
      return res.status(400).json({ success: false, message: "Name and category are required" });
    const imageUrl = req.file?.path || "";
    const sub = await Subcategory.create({
      name: name.trim(), icon: icon || "", imageUrl, category, sortOrder: sortOrder || 0,
    });
    return res.status(201).json({ success: true, subcategory: sub });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "Subcategory already exists in this category" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const { category, activeOnly } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (activeOnly === "true") filter.isActive = true;
    const subcategories = await Subcategory.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .populate("category", "name icon");
    return res.status(200).json({ success: true, subcategories });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, isActive, sortOrder } = req.body;
    const update = {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    };
    if (req.file?.path) update.imageUrl = req.file.path;
    const sub = await Subcategory.findByIdAndUpdate(id, update, { new: true });
    if (!sub) return res.status(404).json({ success: false, message: "Subcategory not found" });
    return res.status(200).json({ success: true, subcategory: sub });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Subcategory.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Subcategory deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
