// Affinity propagation clustering
//
// Frey & Dueck: Clustering by Passing Messages Between Data Points, Science 2007
// http://www.psi.toronto.edu/affinitypropagation/FreyDueckScience07.pdf
//
// Code adapted from and tested against http://www.psi.toronto.edu/affinitypropagation/software/apcluster.m

'use strict'

var _ = require('lodash')
var NAME = 'AffinityPropagation'

module.exports = {

    getClusters: function(S, idxs, options) {

        options = options || {}
        
        if (!_.isArray(S) || S.length < 3) {
	    throw {name: 'ArgumentError', message: NAME + ' requires a square matrix or an array representing one as an argument'}
        }
        if (typeof S[0] === 'object') { // 2D array
            var size = S.length
            for (var i = 0 ; i < size; i++) {
                if (!_.isArray(S[i]) || S[i].length !== size) {
                    throw {name: 'ArgumentError', message: NAME + ' requires a square matrix'}
                }
            }
        } else { // 1D array representing a matrix
            if (options.symmetric === true) {
                if (((1 + Math.sqrt(1 + 8 * S.length)) / 2) % 1 !== 0) { // complicated analytic mathematics
                    throw {name: 'ArgumentError', message: NAME + ' requires an array of length n * (n - 1) / 2 if given the \'symmetric\' option'}
                }
            } else {
                if (Math.sqrt(S.length) % 1 !== 0) {
                    throw {name: 'ArgumentError', message: NAME + ' requires a square matrix or an array representing one'}
                }
            }
        }
        
	var maxIter = options.maxIter || 1000, // maximum number of iterations to run
	    convIter = options.convIter || 100, // minimum number of iterations to run, clustering stops if it has converged after convIter
	    damping = options.damping || 0.8 // damping factor
        if (damping < 0.5 || damping >= 1) {
            throw {name: 'ArgumentError', message: NAME + ': damping must be >= 0.5 and < 1'}
        }
        
        var n, // number of data points
            S_, // similarity matrix (1D array)
            p, // preference for each data point being an exemplar
            R, // responsibility matrix (1D array)
            A, // availability matrix (1D array)
            times = { // milliseconds taken updating the two matrices
                R: 0,
                A: 0,
                total: 0
            }

        var totalTime = process && process.hrtime && process.hrtime()
        
        // initialize 
        if (typeof S[0] === 'object') { // data given as 2D array
            n = S.length
            S_ = new Array(n * n)
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    S_[i * n + j] = S[i][j]
                }
            }
        } else { // data given as 1D array
            if (options.symmetric === true) { // data given in a compact form (length = n * (n - 1) / 2)
                n = (1 + Math.sqrt(1 + 8 * S.length)) / 2
                S_ = new Array(n * n)
                var i = 0
                for (var i1 = 0; i1 < n - 1; i1++) {
                    for (var i2 = i1 + 1; i2 < n; i2++) {
                        S_[i1 * n + i2] = S[i]
                        S_[i2 * n + i1] = S[i]
                        i++
                    }
                }
            } else {
                n = Math.sqrt(S.length)
                S_ = new Array(S.length)
                for (var i = 0; i < S.length; i++) {
                    S_[i] = S[i]
                }
            }
        }
        
        // place preferences on the diagonal
        p = this._getPreference(S_, options.preference)
        for (var i = 0; i < n; i++) {
            S_[i * n + i] = p
        }

        // initialize responsiblity matrix
	R = new Array(S_.length)
        for (var i = 0; i < R.length; i++) {
            R[i] = 0.0
        }
        
        // initialize availability matrix
	A = new Array(S_.length)
        for (var i = 0; i < A.length; i++) {
            A[i] = 0.0
        }
        
        // run affinity propagation
        
        var time = null
        var old = new Array(n)
        var Rp = new Array(n)
        var se = new Array(n)
        for (var i = 0; i < n; i++) {
            old[i] = 0.0
            Rp[i] = 0.0
            se[i] = 0
        }
        var e = new Array(n * convIter)
        for (var i = 0; i < e.length; i++) {
            e[i] = 0
        }
    
        var iter, converged = false
    	for (iter = 0; iter < maxIter; iter++) {

            // update responsibility matrix

            time = process && process.hrtime && process.hrtime()

            for (var i = 0; i < n; i++) {

                var max = -Number.MAX_VALUE,
                    max2 = -Number.MAX_VALUE,   //max2 mi serve perché nel calcolo della responsability r(i, k) poi k != k'
                    maxI = -1,
                    AS = 0.0
                
                for (var j = 0; j < n; j++) {

                    old[j] = R[i * n + j]

                    AS = A[i * n + j] + S_[i * n + j]
                    if (AS >= max) {
                        max2 = max
                        max = AS
                        maxI = j
                    } else if (AS > max2) {
                        max2 = AS
                    }
                }

                for (var j = 0; j < n; j++) {
                    R[i * n + j] = damping * (S_[i * n + j] - max) + (1 - damping) * old[j]
                }
                
                R[i * n + maxI] = damping * (S_[i * n + maxI] - max2) + (1 - damping) * old[maxI] //questo perchè k!= k'
            }

            if (time) {
                time = process.hrtime(time)
                times.R += (time[0] * 1e9 + time[1]) / 1e6
            }

            // update availability matrix

            time = process && process.hrtime && process.hrtime()

            for (var i = 0; i < n; i++) {

                var sum = 0

                for (var j = 0; j < n; j++) {
                    old[j] = A[j * n + i]
                    Rp[j] = Math.max(0, R[j * n + i])
                    sum += Rp[j]
                }
                
                sum -= Rp[i]
                Rp[i] = R[i * n + i]
                sum += Rp[i]    //r(k,k) + sum
                
                for (var j = 0; j < n; j++) {
                    A[j * n + i] = damping * Math.min(0, sum - Rp[j]) + (1 - damping) * old[j]
                }
                A[i * n + i] = damping * (sum - Rp[i]) + (1 - damping) * old[i] //self-availability
            }
            
            if (time) {
                time = process.hrtime(time)
                times.A += (time[0] * 1e9 + time[1]) / 1e6
            }

            // check convergence

            var K = 0
            for (var i = 0; i < n; i++) {
                var E = A[i * n + i] + R[i * n + i] > 0 ? 1 : 0
                e[(iter % convIter) * n + i] = E
                K += E
            }
            
            if (K > 0 && (iter >= convIter - 1 || iter == maxIter - 1)) {

                //TODO se doesn't need to be an array
                var sum = 0
                for (var i = 0; i < n; i++) {
                    se[i] = 0
                    for (var j = 0; j < convIter; j++) {
                        se[i] += e[j * n + i]
                    }
                    if (se[i] === 0 || se[i] === convIter) {
                        sum++
                    }
                }

                if (sum === n) {
                    converged = true
                    break
                }
            }
	}

        times.R = Math.round(times.R / 1e6)
        times.A = Math.round(times.A / 1e6)
        
       

	var clusters = this._findClusters(n, R, A, idxs)


        if (totalTime) {
            totalTime = process.hrtime(totalTime)
            times.total = totalTime[0] + (totalTime[1] / 1e9)
        }
        
        R = null
        A = null
        S_ = null

        var result = {
            preference: p,
            damping: damping,
            iterations: (iter + 1),
            converged: converged,
            exemplars: Object.keys(clusters),
            clusters: clusters,
            number_clusters: Object.keys(clusters).length
        }
        if (times.total > 0) {
            result.times = times
        }
        
        return result
    },

    // calculate preference for each data point being an exemplar
    _getPreference: function(S_, given) {
        
        var preference = given || 'median'
        var p = null

        if (preference === 'median') { // set affinity propagation input preference to median of similarities

            var arr = _.sortBy(S_)
            if (arr.length % 2 === 0) {
                p = (arr[arr.length / 2] + arr[arr.length / 2 - 1]) / 2
            } else {
                p = arr[Math.floor(arr.length / 2)]
            }
            
        } else if (preference === 'min') { // set affinity propagation input preference to minimum of similarities (yields smaller number of clusters)
            
            var arr = _.sortBy(S_)
            p = arr[0]
            
        } else if (_.isFinite(preference)) { // set affinity propagation input preference to the given number
            
            p = preference
            
        } else {
            
            throw {name: 'ArgumentError', message: NAME + ': preference must be \'median\', \'min\', or a number'}
        }
        
        return p
    },

    //find the exemplar for each data point in the matrix
    _findExemplars: function(n, R, A) {
        
        var exemplars = []
        var maxV = -Number.MAX_VALUE;
        var id_exemplar = -1;
        for (var i = 0; i < n; i++) {
            maxV = -Number.MAX_VALUE;
            for(var j = 0; j < n; j++){
	          if (R[i * n + j] + A[i * n + j] > maxV) {
                maxV = R[i * n + j] + A[i * n + j];
                id_exemplar = j;
	            }
            }
            exemplars.push(id_exemplar);
        }
        
        return exemplars;
    },


    //form the clusters given the exemplars array, furthermore execute the data point id conversion
    _groupClusters: function(exemplars, idxs) {
        var clusters = Object.create(null);
        for(var i = 0; i < exemplars.length; i++) {
            if(clusters[idxs[exemplars[i]]]) clusters[idxs[exemplars[i]]] = clusters[idxs[exemplars[i]]] + ", " + idxs[i].toString();
            else clusters[idxs[exemplars[i]]] = idxs[i].toString();
        }
        return clusters;
    },

    //find the exemplars and  construct the clusters
    _findClusters: function(n, R, A, idxs) {
        
        var exemplars = this._findExemplars(n, R, A);
        var clusters = this._groupClusters(exemplars, idxs);
    
        return clusters;
       
    }
}
