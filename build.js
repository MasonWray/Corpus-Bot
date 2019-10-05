const fs = require('fs');
const progress = require('cli-progress');
var model = new Model();

var progEnabled = true;
var multibar;

exports.run = async function () {
    fs.readdir("./corpus", (err, data) => {
        if (err) {
            console.log(`Failed to read corpus directory: \n ${err}`)
            process.exit(0);
        }
        else {
            if (data.length < 1) {
                console.log("No files were found in the corpus directory!");
                process.exit(0);
            }
            else {
                console.log("Building model...");
                if (progEnabled) {
                    multibar = new progress.MultiBar({
                        format: '|' + '{bar}' + '| {name} | {percentage}% | {value}/{total} {units}',
                        barCompleteChar: '\u2588',
                        barIncompleteChar: '\u2591',
                        hideCursor: true
                    })
                }


                var bars = new Array();
                var streams = new Array();
                var running = 0;
                for (var i in data) {
                    const path = "./corpus/" + data[i];

                    var size = fs.statSync(path)["size"];

                    if (progEnabled) {
                        const bar = multibar.create(size, 0, { name: data[i], units: "Bytes" });
                        bar.total = size;
                        bars.push(bar);
                    }

                    const filestream = fs.createReadStream(path, { highWaterMark: 1, encoding: "utf8" });
                    filestream.index = i;
                    streams.push(filestream);
                    running++;

                    streams[i].on('end', function () {
                        if (progEnabled) {
                            bars[this.index].update(bars[this.index].total)
                        }

                        running--;
                        if (running <= 0) {
                            if (progEnabled) {
                                multibar.stop();
                            }

                            // console.log(model)

                            console.log("\nGenerating output...")
                            generate();
                            process.exit(0);
                        }
                    })
                }

                var sentence = "";

                for (var i in streams) {
                    streams[i].on('data', function (chunk) {
                        if (progEnabled) {
                            bars[this.index].increment();
                        }

                        sentence += chunk;

                        if (chunk == ".") {
                            addSentence(sentence);
                            sentence = "";
                        }
                    })
                }
            }
        }
    });
}

function addSentence(sentence) {
    // console.log(`Adding ${scrub(sentence)}`);
    arr = split(scrub(sentence));
    // console.log(arr)
    for (var w in arr) {
        // add vertex
        if (!model.vertices.includes(arr[w])) {
            model.vertices.push(arr[w]);
        }

        var index = model.vertices.indexOf(arr[w]);

        // link to start
        if (w == 0) {
            // console.log(`Linking <START> to ${arr[w]}`)
            let exists = false;
            for (var i in model.edges) {
                if (model.edges[i].from == model.vertices.indexOf("<START>") && model.edges[i].to == index) {
                    model.edges[i].count++;
                    exists = true;
                }
            }
            if (!exists) {
                model.edges.push(new Edge(model.vertices.indexOf("<START>"), index));
            }
        }

        // link to end
        if (w == arr.length - 1) {
            // console.log(`Linking ${arr[w]} to <END>`)
            let exists = false;
            for (var i in model.edges) {
                if (model.edges[i].from == index && model.edges[i].to == model.vertices.indexOf("<END>")) {
                    model.edges[i].count++
                    exists = true;
                }
            }
            if (!exists) {
                model.edges.push(new Edge(model.vertices.indexOf("<END>"), index));
            }
        }

        // link to next
        else {
            // console.log(`Linking ${arr[w]} to ${arr[Math.trunc(w) + 1]}`)
            if (!model.vertices.includes(arr[Math.trunc(w) + 1])) {
                model.vertices.push(arr[Math.trunc(w) + 1]);
            }
            var nextIndex = model.vertices.indexOf(arr[Math.trunc(w) + 1]);

            let exists = false;
            for (var i in model.edges) {
                if (model.edges[i].from == index && model.edges[i].to == nextIndex) {
                    model.edges[i].count++;
                    exists = true;
                }
            }
            if (!exists) {
                model.edges.push(new Edge(index, nextIndex));
            }
        }
    }
}

function scrub(sentence) {
    sentence = sentence.replace(new RegExp(/(\n|:|\[|\]|"|”|“|\.\.\.)/, 'g'), " ");
    sentence = sentence.replace(new RegExp(" +", 'g'), " ");
    sentence = sentence.replace(new RegExp(/( ,)/, 'g'), ",");
    sentence = sentence.replace(new RegExp(/(, \.| \.)/, 'g'), ".");
    sentence = sentence.replace(new RegExp(/(\.|,)/, 'g'), "");
    return sentence;
}

function split(sentence) {
    let s = sentence.split(" ");
    let n = new Array();
    for (var w of s) {
        if (w != "") { n.push(w) }
    }
    return n;
}

function Edge(from, to) {
    this.from = from;
    this.to = to;
    this.count = 1;
}

function Model() {
    this.vertices = ["<START>", "<END>"];
    this.edges = new Array();
}

function generate() {
    var out = "";
    var index = next(0);
    while (index != 1 && index != 0) {
        out = `${out} ${model.vertices[index]}`;
        index = next(index);
        // count++;
    }
    // out += model.vertices[1];
    console.log(out);
}

function next(index) {
    ret = 0;
    var dist = new Array();
    for (var e of model.edges) {
        if (e.from == index) {
            for(c = e.count; c > 0; c--){
                dist.push(e.to);
            }
            // console.log(`${e.to} (${model.vertices[e.to]})`)
            ret = e.to;
        }
    }
    if(dist.length > 0){
        ret = dist[Math.trunc(Math.random() * dist.length)]
    }
    return ret;
}