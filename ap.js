var apclust = require('affinity-propagation')
var fs = require('fs');

var args = process.argv.slice(2);

var ep = process.hrtime()

var fileSM = "path/to/similarity/matrix/file"
var fileNodes = "path/to/data/points/file"
var resultsFile = "path/to/output.txt";

var sm = fs.readFileSync(fileSM).toString().split("\n");
sm = transformSM(sm)

var nodes = fs.readFileSync(fileNodes).toString().split("\n");
nodes = nodes.filter(correctLengthString).map(parseToFloatArray)

var preference = sm[0][0];
var result = apclust.getClusters(sm, nodes, {preference: preference, damping: 0.5, maxIter: 100, convIter: 40, symmetric: false})


/// write to file
fs.writeFile(resultsFile, formatResult(result), (err) =>{
    if(err) throw err;
});


function transformSM(sm){
    
    sm = sm.filter(correctLengthString)
    for(var i = 0; i < sm.length; i++){
        var cs = sm[i].split(" ");
        cs = cs.map(parseToFloatArray)
        sm[i] = cs; 
     }
    return sm;
};

function parseToFloatArray(num){
    return parseFloat(num);
};

function correctLengthString(s){
    return s.length > 0;
};
function formatResult(result){
    var string = "----------\nPreference:\n\t" + result.preference + 
                    "\n\nDelta:\n\t" + result.damping +
                    "\n\nIterations:\n\t" + result.iterations +
                    "\n\nConverged:\n\t" + result.converged +
                    "\n\n----------\nEXEMPLARS:\n\n\t" + result.exemplars +
                    "\n\n----------\nCLUSTERS:\n\n" + objToString(result.clusters) +
                    "\n\n----------\nNumber of clusters:\n   " + result.number_clusters +
                    "\n\n----------\nExecution time AP:\n\t" + result.times.total + " seconds";

    var end = process.hrtime(ep)
    var time =  end[0] + (end[1] / 1e9)

    string = string   + "\n\n----------\nElapsed time:\n\t" + time + " seconds\n";
    
    return string;
};

function objToString (obj) {
    var string = '';
    for (var p in obj) string += '\t' + p + ' -> [' + obj[p] + ']\n';
    return string;
};




