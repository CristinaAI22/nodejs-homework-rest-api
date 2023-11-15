const app = require("./app");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
require("dotenv").config();
const mongoDB = process.env.MONGO_URL;
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`The server is running on port ${port}`);
  mongoose
    .connect(mongoDB)
    .then(() => {
      console.log("Database connection successful!");
    })
    .catch((err) => {
      console.error("Error to connect to the database:", err);
      process.exit(1);
    });
});
