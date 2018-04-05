var apclust = require('affinity-propagation')
var fs = require('fs');

var args = process.argv.slice(2);

var fileSM = "/home/luigi/workspace/scala/SM_"+ args[0] + "/output/"+ args[0] + "_" + args[1] +"/SM/part-00000";
var fileNodes = "/home/luigi/workspace/scala/SM_"+ args[0] + "/output/"+ args[0] + "_" + args[1] +"/nodes/part-00000";
var resultsFile = "/home/luigi/workspace/affinity-propagation/output/" + args[0] + "_" + args[1] + ".txt";


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
                    "\n\n----------\nNumber of clusters:\n\t " + result.number_clusters +
                    "\n\n----------\nExecution time:\n" + result.times.total;    
    
    return string;
};

function objToString (obj) {
    var string = '';
    for (var p in obj) string += '\t' + p + ' -> [' + obj[p] + ']\n';
    return string;
};





