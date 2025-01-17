const app = require("./app");
const connectDB = require("./config/mongodbConnection");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  console.log("DB is conneted");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
