const app = require("./app");
const connectDB = require("./config/mongodbConnection");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Export the serverless function to handle incoming requests
module.exports = async (req, res) => {
  try {
    // Connect to the database (only once per function invocation)
    await connectDB();

    // Call the app to handle the request
    app(req, res); // Express app as a serverless handler
  } catch (error) {
    console.error("Error handling the request:", error);
    res.status(500).send("Internal Server Error");
  }
};
