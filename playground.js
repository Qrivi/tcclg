#!/usr/bin/env node

const fs = require('fs');
const file = fs.createWriteStream('./output/tcclg.log', {flags: 'a'});

for(let i=0; i<= 100; i++) {
    console.log(i);
  file.write(i +' Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n');
}