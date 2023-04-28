require("dotenv").config({
  path: __dirname + "../../.env",
});

class Env {
  get(variable) {
    return process.env[variable];
  }
}

module.exports = new Env();
