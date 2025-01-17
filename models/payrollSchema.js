const mongoose = require("mongoose");
const { Schema } = mongoose;

const payrollSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
  grossSalary: { type: Number, required: true },
  cpfEmployeeContribution: { type: Number, required: true },
  cpfEmployerContribution: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  bonuses: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  month: { type: String, required: true },
});

const Payroll = mongoose.model("Payroll", payrollSchema);


module.exports = Payroll;