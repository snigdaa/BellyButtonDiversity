function buildMetadata(sample) {
  console.log("building metadata...")
  //get jsonified info from flask
  var url = `/metadata/${sample}`;
  // @TODO: Complete the following function that builds the metadata panel
  d3.json(url).then((totDict) => {
    //select panel with "sample-metadata" and clear it
    var sampleSel = d3.select("#sample-metadata");
    sampleSel.html("");
    // Use `Object.entries` to add each key and value pair to the panel
    Object.entries(totDict).forEach(([key, value]) => {
      var row = sampleSel.append("h6");
      row.text(`${key} : ${value}`);
      console.log(row.textContent)
    })

    //Build a Gauge chart that gauges the wash frequency of the subject
    var wfreq = totDict.WFREQ;
    //since 180/6 = 20, we're binding the angle to the wfreq value according to the sections of the gauge
    var angle = 180 - (wfreq * 20),
        // length of pointer ratio to gauge
        radius = 0.5;
    var radians = angle * Math.PI / 180;
    var x = radius * Math.cos(radians);
    var y = radius * Math.sin(radians);

    var mainPath = 'M -.0 -0.05 L .0 0.05 L ',
        xPath = String(x),
        space = ' ',
        yPath = String(y),
        endPath = ' Z';
    var path = mainPath.concat(xPath, space, yPath, endPath);

    //define the pie chart that we'll make into a gauge
    var data = [{ type: 'scatter',
      x: [0], y:[0],
        marker: {size: 1, color:'850000'},
        showlegend: false,
        name: 'Washes',
        text: wfreq,
        hoverinfo: 'text+name'},
      { values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50],
      rotation: 90,
      text: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3',
                '1-2', '0-1', ''],
      textinfo: 'text',
      textposition:'inside',
      marker: {colors:['rgba(0, 50, 0, .5)', 'rgba(0, 75, 0, .5)',
                            'rgba(0, 100, 0, .5)', 'rgba(14, 127, 0, .5)',
                            'rgba(110, 154, 22, .5)', 'rgba(170, 202, 42, .5)',
                            'rgba(202, 209, 95, .5)', 'rgba(210, 206, 145, .5)',
                            'rgba(232, 226, 202, .5)', 'rgba(255, 255, 255, 0)']},
      labels: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
      hoverinfo: 'label',
      hole: .5,
      type: 'pie',
      showlegend: false
    }];

    //define layout for gauge
    var layout = {
      shapes:[{
          type: 'path',
          path: path,
          // Set the color for the pointer
          fillcolor: '850000',
          line: {
            color: '850000'
          }
        }],
      title: '<b> Belly Button Wash Frequency </b><br> Scrubs per Week',
      xaxis: {zeroline:false, showticklabels:false,
                showgrid: false, range: [-1, 1]},
      yaxis: {zeroline:false, showticklabels:false,
                showgrid: false, range: [-1, 1]}
    };

    //plot gauge based on wash frequency
    var GAUGE = document.getElementById("gauge");
    Plotly.newPlot(GAUGE, data, layout);
  })

}

function buildCharts(sample) {
  //console.log("building chart...")
  //console.log(sample)
  //get sample info from flask
  var url = `samples/${sample}`
  var ids = []
  var lbls = []
  var svals = []

  //create the function with which we will sort resulting data
  function compare(a,b) {
    const A = a.sampleVal;
    const B = b.sampleVal;

    let comparison = 0;
    if(A>B) { comparison=-1; }
    else if(A<B) { comparison=1; }

    return comparison;
  }

  var sortArray = [];
  var topTen = [];
  // @TODO: Use `d3.json` to fetch the sample data for the plots
  d3.json(url).then((sampleInfo) => {
    ids = sampleInfo.otu_ids;
    lbls = sampleInfo.otu_labels;
    svals = sampleInfo.sample_values;
    console.log(sampleInfo)

    //Make an array of dicts to use sort(compare) on
    for (var counter = 0; counter < ids.length; counter++){
      sortArray.push({
        "otuID": ids[counter],
        "otulabel": lbls[counter],
        "sampleVal":svals[counter]
      })
    };
    //sort the array to get the top sample values in the beginning
    sortArray.sort(compare);
    topTen = sortArray.slice(0,10);
    console.log(topTen);

  // @TODO: Build a Bubble Chart using the sample data
  // @TODO: Build a Pie Chart

  var PIE = document.getElementById("pie");
  var BUBBLE = document.getElementById("bubble");

  //make bubble trace
  var bubbleTrace = {
    x: ids,
    y: svals,
    text: lbls,
    mode: 'markers',
    marker: {
      size: svals,
      color: ids
    }
  };
  //make bubble layout
  var bubbleLayout = {
    title: "OTU Sample Values per ID",
    showlegend: false
  };
  //plot the bubble plot
  Plotly.newPlot(BUBBLE, [bubbleTrace], bubbleLayout);

  //make Pie trace
  var toplabels = topTen.map(data => data.otuID);
  var topValues = topTen.map(data => data.sampleVal);
  var hovertext = topTen.map(data => data.otulabel);
  console.log(toplabels)
  console.log(topValues)
  console.log(hovertext)
  var pieTrace = {
    values: topValues,
    labels: toplabels,
    hovertext: hovertext,
    type: 'pie'
  }
  //make pie layout
  var pieLayout = {
    title: "Top Ten Samples"
  }
  //plot pie chart
  Plotly.newPlot(PIE, [pieTrace], pieLayout)
  //end of d3.json.then
  })
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  console.log("optionChanged...")
  buildCharts(newSample);
  buildMetadata(newSample);
}

// Initialize the dashboard
init();