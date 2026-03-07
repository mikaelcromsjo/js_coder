const readline = require('readline');
const timer = require('timers');
const fs = require('fs');

const int_board_width = 10;
const int_board_height = 20;
const str_empty_space = ' ';
const str_piece_shapes = {
  'I': [
    ['####']
  ],
  'J': [
    ['###'],
    ['  #']
  ],
  'L': [
    ['###'],
    ['#  ']
  ],
  'O': [
    ['##'],
    ['##']
  ],
  'S': [
    [' ##'],
    ['## ']
  ],
  'T': [
    ['###'],
    [' # ']
  ],
  'Z': [
    ['## '],
    [' ##']
  ]
};

let list_board = Array(int_board_height).fill().map(() => Array(int_board_width).fill(str_empty_space));
let str_current_piece = 'I';
let int_piece_x = 0;
let int_piece_y = 0;
let int_score = 0;
let int_level = 1;
let int_speed = 5000;
let bool_game_over = false;

function get_string_board() {
  let str_board = '';
  for (let int_y = 0; int_y < int_board_height; int_y++) {
    for (let int_x = 0; int_x < int_board_width; int_x++) {
      str_board += list_board[int_y][int_x];
    }
    str_board += '\n';
  }
  return str_board;
}

function get_string_test_error() {
  return 'No test error';
}

function set_bool_game_over() {
  bool_game_over = true;
}

function get_bool_game_over() {
  return bool_game_over;
}

function get_int_score() {
  return int_score;
}

function get_int_speed() {
  return int_speed;
}

function set_bool_collision(bool_collision) {
  if (bool_collision) {
    set_bool_game_over();
  }
}

function set_bool_valid_move(bool_valid_move, int_new_x, int_new_y) {
  if (bool_valid_move) {
    int_piece_x = int_new_x;
    int_piece_y = int_new_y;
  }
}

function update_bool_board() {
  for (let int_y = 0; int_y < str_piece_shapes[str_current_piece].length; int_y++) {
    for (let int_x = 0; int_x < str_piece_shapes[str_current_piece][int_y].length; int_x++) {
      if (str_piece_shapes[str_current_piece][int_y][int_x] === '#') {
        list_board[int_piece_y + int_y][int_piece_x + int_x] = '#';
      }
    }
  }
}

function update_int_score() {
  let int_rows_cleared = 0;
  for (let int_y = 0; int_y < int_board_height; int_y++) {
    let bool_row_full = true;
    for (let int_x = 0; int_x < int_board_width; int_x++) {
      if (list_board[int_y][int_x] === str_empty_space) {
        bool_row_full = false;
        break;
      }
    }
    if (bool_row_full) {
      int_rows_cleared++;
      list_board.splice(int_y, 1);
      list_board.unshift(Array(int_board_width).fill(str_empty_space));
    }
  }
  int_score += int_rows_cleared * int_rows_cleared;
}

function update_int_speed() {
  int_speed -= 100;
  if (int_speed < 100) {
    int_speed = 100;
  }
}

function update_int_level() {
  int_level++;
}

function handle_input(input) {
  switch (input) {
    case 'w':
      if (int_piece_y > 0) {
        int_piece_y--;
      }
      break;
    case 'a':
      if (int_piece_x > 0) {
        int_piece_x--;
      }
      break;
    case 'd':
      if (int_piece_x < int_board_width - str_piece_shapes[str_current_piece][0].length) {
        int_piece_x++;
      }
      break;
    case 's':
      if (int_piece_y < int_board_height - str_piece_shapes[str_current_piece].length) {
        int_piece_y++;
      } else {
        update_bool_board();
        update_int_score();
        update_int_speed();
        update_int_level();
        str_current_piece = 'I';
        int_piece_x = 0;
        int_piece_y = 0;
      }
      break;
  }
}

function save_int_score_to_file() {
  fs.writeFile('score.txt', int_score.toString(), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

function run_bool_game_loop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.setPrompt('');
  rl.prompt();

  timer.setInterval(() => {
    if (get_bool_game_over()) {
      console.log('Game Over!');
      console.log('Final Score: ' + get_int_score());
      save_int_score_to_file();
      rl.close();
      console.log('Goodbye!');
      process.exit();
    } else {
      if (int_piece_y < int_board_height - str_piece_shapes[str_current_piece].length) {
        int_piece_y++;
      } else {
        update_bool_board();
        update_int_score();
        update_int_speed();
        update_int_level();
        str_current_piece = 'I';
        int_piece_x = 0;
        int_piece_y = 0;
      }
      console.log(get_string_board());
      console.log('Score: ' + get_int_score());
      console.log('Level: ' + int_level);
      rl.prompt();
    }
  }, int_speed);

  rl.on('line', (input) => {
    handle_input(input);
    console.log(get_string_board());
    console.log('Score: ' + get_int_score());
    console.log('Level: ' + int_level);
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Goodbye!');
    process.exit();
  });
}

if (require.main === module) {
  run_bool_game_loop();
}

module.exports = {
  get_string_board,
  get_string_test_error,
  set_bool_game_over,
  get_bool_game_over,
  get_int_score,
  get_int_speed,
  set_bool_collision,
  set_bool_valid_move,
  update_bool_board,
  update_int_score,
  update_int_speed,
  update_int_level,
  handle_input,
  save_int_score_to_file,
  run_bool_game_loop
};