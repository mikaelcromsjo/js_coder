const assert = require("assert");
const app = require("C:/Users/mikae/Documents/Project/agef_project/agef6/output/create-a-javascript/app.js");

// Accumulated regression tests (auto-generated, never manually edited)
assert.strictEqual(typeof str_board, 'string');
assert.strictEqual(str_test_error, 'No test error');
assert.strictEqual(app.get_bool_game_over(), true);
assert.strictEqual(app.get_bool_game_over(), false);
assert.strictEqual(typeof app.get_int_score(), 'number');
assert.strictEqual(typeof app.get_int_speed(), 'number');
assert.strictEqual(app.int_piece_x, 0);
assert.strictEqual(app.int_piece_y, 0);
assert.strictEqual(typeof app.list_board, 'object');
assert.strictEqual(typeof app.int_score, 'number');
assert.strictEqual(typeof app.int_speed, 'number');
assert.strictEqual(typeof app.int_level, 'number');
assert.strictEqual(typeof app.int_piece_x, 'number');
assert.strictEqual(typeof app.int_piece_y, 'number');

console.log("All 14 assertions passed.");
