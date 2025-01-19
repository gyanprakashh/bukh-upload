const express = require("express");
const {
  getAllEmployees,
  addEmployee1,
  uploadCSV1,
  uploadXLSX,
  downloadCSV1,
} = require("../controllers/employeeController");
//const multer = require("multer");

// Multer configuration
//const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.get("/", getAllEmployees);
router.post("/", addEmployee1);

// File upload routes
//router.post("/upload-csv", upload.single("file"), uploadCSV1);
//router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

// Download CSV route
router.get("/download-csv", downloadCSV1);

module.exports = router;
