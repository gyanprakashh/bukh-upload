const Employee = require("../models/employeeSchema");
const { generatePayroll } = require("./payrollController");
const csvWriter = require("csv-writer");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

// Get all employees
exports.getAllEmployees = async (req, res) => {
  // await Employee.deleteMany({});
  // return
  try {
    const employees = await Employee.find({});
    console.log(employees);
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
};

// Add a new employee
exports.addEmployee = async (req, res) => {
  try {
    console.log(req);
    const { month, ...employee_data } = req.body;
    let employee = await Employee.findOne({ name: employee_data.name });
    if (!employee) {
      // Create a new employee if it doesn't exist
      employee = new Employee(employee_data);
      await employee.save();
    } else {
      // Update existing employee
      employee = await Employee.findByIdAndUpdate(employee._id, employee_data, {
        new: true,
      });
      await employee.save();
    }
    console.log({ employee });
    await generatePayroll({
      body: {
        employeeId: employee._id.toString(),
        month: employee.month,
      },
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error adding employee", error });
  }
};

// module.exports ={addEmployee}

// Bulk upload employees from CSV
exports.uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) =>
        results.push({
          ...Object.keys(data).reduce((acc, key) => {
            acc[key.toLowerCase()] = data[key];
            return acc;
          }, {}),
        })
      )
      .on("end", async () => {
        try {
          // Validate and insert data
          const validRecords = results.filter(
            (emp) =>
              emp.name &&
              emp.type &&
              ["Citizen", "PR", "Foreigner"].includes(emp.type) &&
              emp.age &&
              emp.salary &&
              emp.month
          );

          const insertedEmployees = await Promise.all(
            validRecords.map(async (data) => {
              console.log({ data });
              const employee_data = await exports.addEmployee({
                body: { ...data },
              });
              return employee_data;
            })
          );
          console.log({ insertedEmployees });

          // const insertedEmployees = await Employee.insertMany(validRecords);

          // // Call the custom function for each inserted employee
          // await Promise.all(
          //   insertedEmployees.map(({ _id, month = "jan" }) => {
          //     generatePayroll({
          //       body: {
          //         employeeId: _id,
          //         month: month,
          //       },
          //     });
          //   })
          // );

          fs.unlinkSync(req.file.path); // Delete file after processing
          res.status(201).json({
            message: "Employees uploaded successfully from CSV.",
            insertedCount: insertedEmployees.length,
            insertedEmployees,
          });
        } catch (error) {
          res.status(500).json({
            message: "Error processing CSV file.",
            error: error.message,
          });
        }
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file.", error: error.message });
  }
};

// Bulk upload employees from XLSX
exports.uploadXLSX = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Validate and insert data
    const validRecords = data.filter(
      (emp) =>
        emp.name &&
        emp.type &&
        ["Citizen", "PR", "Foreigner"].includes(emp.type) &&
        emp.age &&
        emp.salary &&
        emp.month
    );

    const insertedEmployees = await Employee.doc(validRecords);
    fs.unlinkSync(req.file.path); // Delete file after processing
    res.status(201).json({
      message: "Employees uploaded successfully from XLSX.",
      insertedCount: insertedEmployees.length,
      insertedEmployees,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file.", error: error.message });
  }
};

// Function to generate CSV file and send it for download
exports.downloadCSV = async (req, res) => {
  try {
    const employees = await Employee.find();

    const filePath = path.join(__dirname, "../downloads/employees.csv");

    // CSV writer setup
    if (!fs.existsSync(filePath)) {
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Create the file
      fs.open(filePath, "w", function (err, file) {
        if (err) throw err;
        console.log("File created!");
      });
    }

    const csv = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: "name", title: "Name" },
        { id: "type", title: "Type" },
        { id: "age", title: "Age" },
        { id: "salary", title: "Salary" },
        { id: "bonuses", title: "Bonuses" },
        { id: "allowances", title: "Allowances" },
        { id: "month", title: "Month" },
      ],
    });
    let employee_array = [];
    if (employees.length !== 0) {
      if (employees?.cpfHistory && employees?.cpfHistory.length > 0) {
        const { cpfHistory, employee_data } = employees;
        employee_array = employees?.cpfHistory.map((emp) => ({
          ...employee_data,
          ...emp,
        }));
      } else {
        employee_array = employees;
      }
    }

    // Writing data to CSV
    await csv.writeRecords(employee_array);

    // Sending the CSV file as a download
    res.download(filePath, "employees.csv", (err) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Error generating CSV file.", error: err.message });
      } else {
        // Delete the file after download
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully.");
          }
        });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error downloading CSV file.", error: error.message });
  }
};

// module.exports={addEmployee}

// Helper function to add or update an employee
const addEmployeeHelper = async (employeeData) => {
  const { month, ...employee_data } = employeeData;

  let employee = await Employee.findOne({ name: employee_data.name });

  if (!employee) {
    // Create a new employee if it doesn't exist
    employee = new Employee(employee_data);
    await employee.save();
  } else {
    // Update existing employee
    employee = await Employee.findByIdAndUpdate(employee._id, employee_data, {
      new: true,
    });
  }

  // Generate payroll for the employee
  await generatePayroll({
    body: {
      employeeId: employee._id,
      month: month || "January", // Default to January if month is missing
    },
  });

  return employee;
};

// Route handler to add a single employee
exports.addEmployee1 = async (req, res) => {
  try {
    const employee = await addEmployeeHelper(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error adding employee", error });
  }
};

// Route handler to upload employees via CSV
exports.uploadCSV1 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) =>
        results.push(
          Object.keys(data).reduce((acc, key) => {
            acc[key.toLowerCase()] = data[key];
            return acc;
          }, {})
        )
      )
      .on("end", async () => {
        try {
          // Validate and process data
          const validRecords = results.filter(
            (emp) =>
              emp.name &&
              emp.type &&
              ["Citizen", "PR", "Foreigner"].includes(emp.type) &&
              emp.age &&
              emp.salary &&
              emp.month
          );

          const insertedEmployees = await Promise.all(
            validRecords.map(async (data) => {
              try {
                const employee = await addEmployeeHelper(data);
                return employee;
              } catch (err) {
                console.error(`Error processing employee ${data.name}:`, err);
                return null;
              }
            })
          );

          fs.unlinkSync(req.file.path); // Delete the uploaded file after processing
          res.status(201).json({
            message: "Employees uploaded successfully from CSV.",
            insertedCount: insertedEmployees.filter((emp) => emp !== null)
              .length,
            insertedEmployees: insertedEmployees.filter((emp) => emp !== null),
          });
        } catch (error) {
          res.status(500).json({
            message: "Error processing CSV file.",
            error: error.message,
          });
        }
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file.", error: error.message });
  }
};

exports.downloadCSV1 = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../downloads/employees.csv");

    if (!fs.existsSync(filePath)) {
      res.status(500).json({ message: "Error generating CSV file." });
    }

    // Sending the CSV file as a download
    res.download(filePath, "employees.csv", (err) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Error generating CSV file.", error: err.message });
      } else {
        // Delete the file after download
        console.log("File downloaded successfully.");

      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading file.", error: error.message });
  }
};
