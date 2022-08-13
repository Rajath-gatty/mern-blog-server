const router = require("express").Router();

const BrowserController = require("../Controllers/BrowserController");

router.get("/", BrowserController.getIndexPage);

router.get("/posts/:postId", BrowserController.getSinglePage);

router.get("/search", BrowserController.search);

module.exports = router;
