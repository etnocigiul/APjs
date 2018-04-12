
var fs = require('fs');

var args = process.argv.slice(2);

var ep = process.hrtime()

var datasetFile = "path/to/dataset_input"
var smFile = "path/to/sm_file_output"
var nodesFile = "path/to/nodes_file_output"

var dataset = fs.readFileSync(datasetFile).toString().split("\n");
dataset = keyValueForm(dataset)

var adjList = groupNodes(dataset)
var nodes = Object.keys(adjList)

var sm = calculateSM(adjList, nodes)

//Scrittura file di output contenente la matrice delle similarità
fs.writeFile(smFile, formatSimilarityMatrix(sm), (err) =>{
    if(err) throw err;
});

//Scrittura file di output relativo ai nodi
fs.writeFile(nodesFile, formatNodesList(nodes), (err) =>{
    if(err) throw err;
});


function keyValueForm(dataset){
    dataset = dataset.filter(correctLengthString)
    for(var i = 0; i < dataset.length; i++){
        var cs = dataset[i].split("\t")
        cs = cs.map(parseToIntArray)
        dataset[i] = cs; 
     }
    return dataset;
};

//Funzione per la creazione delle liste di adiacenza dei nodi del dataset
function groupNodes(dataset) {
    var adjList = {};
    
    for(var i = 0; i < dataset.length; i++) {
        adjList[dataset[i][0]] = new Array();   
        //adjList[dataset[i][1]] = new Array();   solo se nel dataset abbiamo che a -> b, allora b -> a
        }

    for(var i = 0; i < dataset.length; i++){
        adjList[dataset[i][0]].push(dataset[i][1]);
        //adjList[dataset[i][1]].push(dataset[i][0]);   solo se nel dataset abbiamo che a -> b, allora b -> a
        }
    
    return adjList;
    };

//Funzione che calcola e restituisce la matrice delle similarità tra coppie di nodi
function calculateSM(adjList, nodes){
    var v_min = Number.MAX_VALUE,
        v_max = -Number.MAX_VALUE;
    var n = nodes.length;
    var sm = new Array(n);
    for(var i = 0; i < n; i++){
        sm[i] =  new Array();
        for(var j = 0; j < n; j++){    
                if(i != j){
                    sm[i][j] = calculateSimilarity(adjList[nodes[i]], adjList[nodes[j]]);

                    if(sm[i][j] > v_max) v_max = sm[i][j];
                    else if(sm[i][j] < v_min) v_min = sm[i][j];

                    }
            }
        }

    var preference = (v_max + v_min) / 2.0;
    
    for(var i = 0; i < n; i++) sm[i][i] = preference;

    return sm;
};

//Funzione che calcola la similarità che intercorre tra una coppia di nodi
function calculateSimilarity(al1, al2){
    var a = intersect(al1, al2).length;
    var b = union(al1, al2).length;
    var sim, default_preference = 10.0;
    if(a != 0) {
        var jaccard = Math.log(a/b);
        sim = jaccard * default_preference;
        }
    else sim = -100.0;
    return sim;
}

//Funzione che prende come parametro due array e restituisce l'array risultante dalla loro unione
function union(a, b) { return a.concat(b) };

//Funzione che prende come parametro due array e restituisce l'array risultante dalla loro intersezione
function intersect(a, b){
    var t;
    if (b.length > a.length) t = b, b = a, a = t;
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

function formatSimilarityMatrix(sm){
    return sm.map((v) => v.toString().split(",").join(" ")).toString().split(",").join("\n")
};

function formatNodesList(nodes){
    return (nodes.toString() + "\n").split(",").join("\n")
};

function objToString (obj) {
    var string = '';
    for (var p in obj) string += '\t' + p + ' -> [' + obj[p] + ']\n';
    return string;
};
