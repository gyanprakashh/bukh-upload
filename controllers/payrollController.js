const Payroll = require("../models/payrollSchema");
const Employee = require("../models/employeeSchema");


// CPF Calculation Function
function calculateCPF(employee) {
  const { age, salary } = employee;
  let employeeContributionRate = 0;
  let employerContributionRate = 0;

  if (age < 55) {
    employeeContributionRate = 20;
    employerContributionRate = 17;
  } else if (age >= 55 && age <= 60) {
    employeeContributionRate = 13;
    employerContributionRate = 13;
  } else if (age > 60 && age <= 65) {
    employeeContributionRate = 7.5;
    employerContributionRate = 9;
  } else if (age > 65) {
    employeeContributionRate = 5;
    employerContributionRate = 7.5;
  }

  const cpfCeiling = 6000; // CPF ceiling
  const totalSalary = Math.min(salary, cpfCeiling);

  const employeeCPF = (employeeContributionRate / 100) * totalSalary;
  const employerCPF = (employerContributionRate / 100) * totalSalary;

  return { employeeCPF, employerCPF, totalCPF: employeeCPF + employerCPF };
}

// Generate payroll for an employee
exports.generatePayroll = async (req, res) => {
  
  try {
    const { employeeId, month } = req.body;
    const employee = await Employee.findById(employeeId);
    
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const { employeeCPF, employerCPF, totalCPF } = calculateCPF(employee);
    const grossSalary =
      employee.salary + employee.bonuses + employee.allowances;
    const netSalary = grossSalary - employeeCPF;

    // Create payroll record
    const payroll = new Payroll({
      employeeId,
      grossSalary,
      cpfEmployeeContribution: employeeCPF,
      cpfEmployerContribution: employerCPF,
      netSalary,
      bonuses: employee.bonuses,
      allowances: employee.allowances,
      month: month,
    });

    await payroll.save();
    



    // Update employee's CPF history
    employee.cpfHistory.push({ month, employeeCPF, employerCPF, totalCPF });
    await employee.save();
    return

    res.status(201).json(payroll);
  } catch (error) {
    return "Error generating payroll"
    res.status(500).json({ message: "Error generating payroll", error });
  }
};
