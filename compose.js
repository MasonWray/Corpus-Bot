const fs = require('fs');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

var model;

exports.run = function () {
    if (fs.existsSync("./models")) {
        fs.readdir("./models/", (err, data) => {
            if (err) {
                console.log("Failed to get model list");
                process.exit(1);
            }

            var list = "Select a model for output generation:\n";
            for (var m in data) {
                list += `${m} | ${data[m]} \n`;
            }
            list += "> ";

            readline.question(list, (choice) => {
                if (Math.trunc(choice) < data.length) {
                    console.log(`Generating output from model ${data[Math.trunc(choice)]}\n`);
                    fs.readFile("./models/" + data[Math.trunc(choice)], (err, data) => {
                        if (err) {
                            console.log("Failed to load model.");
                            process.exit(1);
                        }
                        model = JSON.parse(data);
                        console.log(generate());
                        process.exit(0);
                    })
                }
                else {
                    console.log("Invalid selection!");
                    process.exit(1);
                }
            })
        })
    }
}

function generate() {
    var out = "";
    var index = next(0);
    while (index != 1 && index != 0) {
        out = `${out} ${model.vertices[index]}`;
        index = next(index);
    }
    return out;
}

function next(index) {
    ret = 0;
    var dist = new Array();
    for (var e of model.edges) {
        if (e.from == index) {
            for (c = e.count; c > 0; c--) {
                dist.push(e.to);
            }
            ret = e.to;
        }
    }
    if (dist.length > 0) {
        ret = dist[Math.trunc(Math.random() * dist.length)]
    }
    return ret;
}