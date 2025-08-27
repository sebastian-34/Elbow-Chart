// K-Means and Elbow Chart Demo

const POINTS = 120;
const K_MIN = 1;
const K_MAX = 10;
const DIM = 2;

let data = [];
let clusterings = [];
let inertias = [];

function randomPoints(n, dim) {
  return Array.from({length: n}, () => Array.from({length: dim}, () => Math.random() * 10));
}

function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

function assignClusters(points, centroids) {
  return points.map(p => {
    let minDist = Infinity, idx = 0;
    centroids.forEach((c, i) => {
      let d = euclidean(p, c);
      if (d < minDist) { minDist = d; idx = i; }
    });
    return idx;
  });
}

function updateCentroids(points, labels, k) {
  let centroids = Array.from({length: k}, () => Array(DIM).fill(0));
  let counts = Array(k).fill(0);
  points.forEach((p, i) => {
    let l = labels[i];
    counts[l]++;
    for (let d = 0; d < DIM; d++) centroids[l][d] += p[d];
  });
  for (let i = 0; i < k; i++) {
    if (counts[i] === 0) centroids[i] = Array.from({length: DIM}, () => Math.random() * 10);
    else centroids[i] = centroids[i].map(x => x / counts[i]);
  }
  return centroids;
}

function inertia(points, centroids, labels) {
  let sum = 0;
  points.forEach((p, i) => {
    sum += euclidean(p, centroids[labels[i]]) ** 2;
  });
  return sum;
}

function kmeans(points, k, maxIter=100) {
  let centroids = randomPoints(k, DIM);
  let labels = Array(points.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    labels = assignClusters(points, centroids);
    let newCentroids = updateCentroids(points, labels, k);
    if (JSON.stringify(newCentroids) === JSON.stringify(centroids)) break;
    centroids = newCentroids;
  }
  return {labels, centroids};
}

function computeClusterings() {
  clusterings = [];
  inertias = [];
  for (let k = K_MIN; k <= K_MAX; k++) {
    let {labels, centroids} = kmeans(data, k);
    clusterings.push({labels, centroids});
    inertias.push(inertia(data, centroids, labels));
  }
}

function plotClusters(kIdx) {
  let {labels, centroids} = clusterings[kIdx];
  let colors = [
    '#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd',
    '#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'
  ];
  let centroidColors = [
    '#FFD700', '#00FFFF', '#FF69B4', '#00FF00', '#FFA500',
    '#FF00FF', '#00BFFF', '#FF6347', '#ADFF2F', '#FF4500'
  ];
  let traces = [];
  // Draw lines from each point to its centroid
  for (let k = 0; k < centroids.length; k++) {
    let clusterPoints = data.filter((_, i) => labels[i] === k);
    let lines = clusterPoints.map(p => {
      return {
        x: [p[0], centroids[k][0]],
        y: [p[1], centroids[k][1]],
        mode: 'lines',
        type: 'scatter',
        line: {color: colors[k % colors.length], width: 1},
        hoverinfo: 'skip',
        showlegend: false
      };
    });
    traces.push(...lines);
    // Points
    traces.push({
      x: clusterPoints.map(p => p[0]),
      y: clusterPoints.map(p => p[1]),
      mode: 'markers',
      type: 'scatter',
      name: `Cluster ${k+1}`,
      marker: {color: colors[k % colors.length], size: 8}
    });
    // Centroid
    traces.push({
      x: [centroids[k][0]],
      y: [centroids[k][1]],
      mode: 'markers',
      type: 'scatter',
      name: `Centroid ${k+1}`,
      marker: {
        color: centroidColors[k % centroidColors.length],
        size: 32,
        line: {color: '#222', width: 3},
        symbol: 'circle-open-dot',
        opacity: 1
      },
      showlegend: false
    });
  }
  Plotly.newPlot('cluster-plot', traces, {
    margin: {t: 20},
    xaxis: {title: 'X'},
    yaxis: {title: 'Y'},
    legend: {orientation: 'h', y: -0.2}
  });
}

function plotElbow() {
  let x = Array.from({length: K_MAX - K_MIN + 1}, (_, i) => i + K_MIN);
  let trace = {
    x: x,
    y: inertias,
    mode: 'lines+markers',
    type: 'scatter',
    marker: {size: 10, color: '#d62728'},
    line: {shape: 'linear'}
  };
  Plotly.newPlot('elbow-chart', [trace], {
    margin: {t: 20},
    xaxis: {title: 'Number of Centroids (k)', dtick: 1},
    yaxis: {title: 'Inertia'},
    hovermode: 'closest'
  });
  let chart = document.getElementById('elbow-chart');
  chart.on('plotly_click', function(data) {
    let kIdx = data.points[0].pointIndex;
    plotClusters(kIdx);
  });
}

function main() {
  function regenerate() {
    data = randomPoints(POINTS, DIM);
    computeClusterings();
    plotClusters(1); // default k=2
    plotElbow();
  }
  regenerate();
  const btn = document.getElementById('regen-btn');
  if (btn) btn.onclick = regenerate;
}

window.onload = main;
