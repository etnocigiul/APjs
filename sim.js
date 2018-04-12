
var fs = require('fs');

var args = process.argv.slice(2);

var ep = process.hrtime()


var datasetFile = "/home/conte/workspace/ap_sm/" + args[0] + "_" + args[1] + ".txt"
var smFile = "/home/conte/workspace/ap_sm/" + args[0] + "_" + args[1] + "/SM/part-00000"
var nodesFile = "/home/conte/workspace/ap_sm/" + args[0] + "_" + args[1] + "/nodes/part-00000"

var dataset = fs.readFileSync(datasetFile).toString().split("\n");
dataset = keyValueForm(dataset)

var adjList = groupNodes(dataset)
var nodes = Object.keys(adjList)

var sm = calculateSM(adjList, nodes)

/// write to file
fs.writeFile(smFile, formatResult(sm), (err) =>{
    if(err) throw err;
});

fs.writeFile(nodesFile, formatResult2(nodes), (err) =>{
    if(err) throw err;
});

console.log(sm.length)
console.log(nodes.length)

function keyValueForm(dataset){
    dataset = dataset.filter(correctLengthString)
    for(var i = 0; i < dataset.length; i++){
        var cs = dataset[i].split("\t")
        cs = cs.map(parseToIntArray)
        dataset[i] = cs; 
     }
    return dataset;
};

function groupNodes(dataset) {
    var adjList = {};
    
    for(var i = 0; i < dataset.length; i++) {
        adjList[dataset[i][0]] = new Array();   
        //adjList[dataset[i][1]] = new Array();   
        }

    for(var i = 0; i < dataset.length; i++){
        adjList[dataset[i][0]].push(dataset[i][1]);
        //adjList[dataset[i][1]].push(dataset[i][0]);
        }
    
    return adjList;
    };


function calculateSM(adjList, nodes){
    var v_min = Number.MAX_VALUE,
        v_max = -Number.MAX_VALUE;
    var n = nodes.length;
    var sm = new Array(n);
    for(var i = 0; i < n; i++){
        sm[i] =  new Array();
        for(var j = 0; j < n; j++){    
                if(i != j){
                    sm[i][j] = calculateSimilarity(adjList[nodes[i]], adjList[nodes[j]], nodes[i], nodes[j]);
                  //  console.log("s(" + nodes[i] + ", " + nodes[j] + ")= " + sm[i][j])

                    if(sm[i][j] > v_max) v_max = sm[i][j];
                    else if(sm[i][j] < v_min) v_min = sm[i][j];

                    }
            }
        }

    var preference = (v_max + v_min) / 2.0;
    
    for(var i = 0; i < n; i++) sm[i][i] = preference;

    return sm;
};

function calculateSimilarity(al1, al2, n1, n2){
    var a = intersect(al1, al2).length;
    var b = union(al1, al2).length;
    var sim, default_preference = 10.0;
    if(a != 0) {
        var jaccard = Math.log(a/b);
        sim = jaccard * default_preference;
        }
    else sim = -100.0;
//console.log("s(" + n1 + ", " + n2 + ")= " + sim + " ---> a: " + a + " b: " + b + " j: " + jaccard)
    return sim;
}

function union(a, b) { return a.concat(b) };

function intersect(a, b){
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
};

function parseToIntArray(num){
    return parseInt(num);
};

function correctLengthString(s){
    return s.length > 0 && !s.includes("#");
};

function formatResult(result){
    return result.map((v) => v.toString().split(",").join(" ")).toString().split(",").join("\n")
};

function formatResult2(result){
    return (result.toString() + "\n").split(",").join("\n")
};

function objToString (obj) {
    var string = '';
    for (var p in obj) string += '\t' + p + ' -> [' + obj[p] + ']\n';
    return string;
};

