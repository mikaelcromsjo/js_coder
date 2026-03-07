const fs   = require("fs");
const path = require("path");
const string_bin_path = path.resolve(__dirname, "../bin/agef.js");
fs.chmodSync(string_bin_path, "755");
console.log("chmod 755 bin/agef.js — done");
