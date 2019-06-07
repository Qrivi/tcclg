#!/usr/bin/env node

const chalk       = require('chalk');
const clear       = require('clear');
const figlet      = require('figlet');

const files        = require('./lib/files');

clear();
console.log(
  chalk.blue(
    figlet.textSync('TCCL', { font: 'small' })
  )
);

const run = async () => {
  try {
    console.log('Let\'s get this bread.');
  } catch(err) {
        console.log('Whoops.');
  }
}

run();
