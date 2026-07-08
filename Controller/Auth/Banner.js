const Banner = require("../../Model/Auth/Banner");

exports.addBanner = async (req, res) => {
  try {
    const { title, subtitle, imageUrl, link, sortOrder } = req.body;
    if (!imageUrl)
      return res.status(400).json({ success: false, message: "imageUrl is required" });
    const banner = await Banner.create({
      title: title || "", subtitle: subtitle || "",
      imageUrl, link: link || "", sortOrder: sortOrder || 0,
    });
    return res.status(201).json({ success: true, banner });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBanners = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === "true" ? { isActive: true } : {};
    const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    return res.status(200).json({ success: true, banners });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, link, isActive, sortOrder } = req.body;
    const banner = await Banner.findByIdAndUpdate(
      id,
      {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(imageUrl && { imageUrl }),
        ...(link !== undefined && { link }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      { new: true }
    );
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    return res.status(200).json({ success: true, banner });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
