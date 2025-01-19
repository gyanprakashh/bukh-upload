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
// Export the app as a serverless function for Vercel
module.exports = (req, res) => {
  // Use the Express app to handle the request and response
  app(req, res);
};
