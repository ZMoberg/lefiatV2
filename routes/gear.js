const express = require('express')
const router = express.Router()

const multer = require('multer')
const Product = require('./../models/product')
const ejsRender = require("./../utils/ejsRender");
const catchAsync = require('../utils/catchAsync')
const { parseProductData, saveProductAndRedirect } = require("../utils/productUtil");

// multer file upload setup

const storage = multer.diskStorage({
  // destination for file
  destination: function (req, file, callback) {
    callback(null, "./public/products/");
  },
  // add back the extension
  filename: function (req, file, callback) {
    callback(
      null,
      new Date().toISOString().replace(/[:\.]/g, "-") + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// upload parameters for multer

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 3,
  },
  fileFilter: fileFilter,
});

router.get(
  "/",
  catchAsync(async (req, res) => {
    const products = await Product.find().sort({ createdAt: "desc" });
    ejsRender(req, res, "gear/index", { products: products });
  })
);

router.get("/new", (req, res) => {
  ejsRender(req, res, "gear/new", { product: new Product() });
});

router.get(
  "/edit/:id",
  catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);
    ejsRender(req, res, "gear/edit", { product: product });
  })
);

router.get(
  "/:slug",
  catchAsync(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug });
    if (product == null) res.redirect("/gear");
    else ejsRender(req, res, "gear/show", { product: product });
  })
);

router.post(
  "/",
  upload.single("image"),
  catchAsync(async (req, res) => {
    req.product = new Product();
    await saveProductAndRedirect(req, res, "new")
  })
);

router.put(
  "/:id",
  upload.single("image"),
  catchAsync(async (req, res) => {
    const product = parseProductData(req);
    try {
      req.product = await Product.findOneAndUpdate(
        { id: req.params.id },
        product
      );
    } catch (error) {
      res.redirect(`/gear/edit`, { product });
    }
    res.redirect(`/gear/${req.product.slug}`);

  })
);

router.delete(
  "/:id",
  catchAsync(async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    req.flash("success", "Successfully deleted a product!");
    res.redirect(`/gear`);
  })
);

module.exports = router;
