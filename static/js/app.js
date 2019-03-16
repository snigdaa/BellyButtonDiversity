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
  })

    // BONUS: Build the Gauge Chart
    // buildGauge(data.WFREQ);
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