const mongoose = require("mongoose");
const { Schema } = mongoose;

const employeeSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Citizen", "PR", "Foreigner"], required: true },
  age: { type: Number, required: true },
  salary: { type: Number, required: true },
  bonuses: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  cpfHistory: [
    {
      month: String,
      employeeCPF: Number,
      employerCPF: Number,
      totalCPF: Number,
    },
  ],
});



const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
