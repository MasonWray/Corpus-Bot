
const progress = require('cli-progress');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

const build = require('./build.js');
const compose = require("./compose.js");

if (process.argv.length < 3) {
    console.log("Error: no command provided.");
    console.log("Pass --help for usage information.");
    process.exit(0);
}
else {
    switch (process.argv[2]) {
        case "--help":
            help();
            break;

        case "--build":
            build.run();
            break;

        case "--compose":
            compose.run();
            break;

        default:
            def();
            break;
    }
}

function help() {
    console.log("All the help stuff.");
    process.exit(0);
}

function def() {
    console.log(`${process.argv[2]} is not recognized as a valid command input.`);
    console.log("Pass --help for usage information.");
    process.exit(0);
}