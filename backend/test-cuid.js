const { z } = require('zod');

const id = "cmmoazmex0000nyplc3qh3m9x";

try {
  z.string().cuid().parse(id);
  console.log("Valid cuid");
} catch (e) {
  console.error("Invalid cuid:", e.message);
}

try {
  z.string().cuid2().parse(id);
  console.log("Valid cuid2");
} catch (e) {
  console.error("Invalid cuid2:", e.message);
}
