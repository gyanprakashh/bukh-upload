const express = require("express");
const router = express.Router();
const { generatePayroll } = require("../controllers/payrollController");

//router.post("/", generatePayroll);

module.exports = router;
