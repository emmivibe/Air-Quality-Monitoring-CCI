// Paths to the data files
const dataFiles = [
    'readings_greencoat.json',
    'readings_hh302.json',
    'readings_hh308.json'
];

// Initialize empty object to store processed data
const data = {
    buildings: ["Greencoat", "HH_302", "HH_308"],
    co2: [],
    temperature: [],
    humidity: [],
    tvoc: [],
    pm10: []
};

// Function to read JSON files and process the data
function loadData() {
    Promise.all(dataFiles.map(file => d3.json(file))).then(files => {
        files.forEach((file, index) => {
            const co2 = file.readings.map(d => d.message.rco2).reduce((a, b) => a + b) / file.readings.length;
            const temperature = file.readings.map(d => d.message.atmp).reduce((a, b) => a + b) / file.readings.length;
            const humidity = file.readings.map(d => d.message.rhum).reduce((a, b) => a + b) / file.readings.length;
            const tvoc = file.readings.map(d => d.message.tvoc_index).reduce((a, b) => a + b) / file.readings.length;
            const pm10 = file.readings.map(d => d.message.pm10).reduce((a, b) => a + b) / file.readings.length;

            data.co2.push(co2);
            data.temperature.push(temperature);
            data.humidity.push(humidity);
            data.tvoc.push(tvoc);
            data.pm10.push(pm10);
        });

        // After loading data, initialize the chart with the default parameter
        updateChart('co2');
    }).catch(error => console.error('Error loading data:', error));
}

// D3.js code for creating the bar chart
const svg = d3.select("svg")
              .attr("viewBox", `0 0 800 500`)
              .attr("preserveAspectRatio", "xMinYMin meet"),
      margin = {top: 20, right: 30, bottom: 40, left: 40},
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const x = d3.scaleBand()
            .domain(data.buildings)
            .range([margin.left, width - margin.right])
            .padding(0.1);

const y = d3.scaleLinear()
            .range([height - margin.bottom, margin.top]);

const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .attr("class", "axis-label");

const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .attr("class", "axis-label");

svg.append("g")
    .attr("class", "x-axis");

svg.append("g")
    .attr("class", "y-axis");

svg.append("text")
    .attr("class", "legend")
    .attr("x", width - margin.right)
    .attr("y", margin.top)
    .attr("text-anchor", "end")
   

// Create tooltip div
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function updateChart(param) {
    y.domain([0, d3.max(data[param])]).nice();

    svg.selectAll(".y-axis")
       .transition()
       .duration(1000)
       .call(yAxis);

    const bars = svg.selectAll(".bar")
                    .data(data[param]);

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => x(data.buildings[i]))
        .attr("y", d => y(d))
        .attr("height", d => y(0) - y(d))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "orange");
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Value: ${d}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "steelblue");
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    bars.transition()
        .duration(1000)
        .attr("x", (d, i) => x(data.buildings[i]))
        .attr("y", d => y(d))
        .attr("height", d => y(0) - y(d))
        .attr("width", x.bandwidth());

    bars.exit().remove();
}

// Dynamic data loading function
function loadSelectedData() {
    const selectedFile = document.getElementById('dataset-select').value;
    d3.json(selectedFile).then(file => {
        // Process the file and update the chart
        processFile(file);
        updateChart('co2'); // or any default parameter
    }).catch(error => console.error('Error loading selected data:', error));
}

svg.append("g").call(xAxis);

// Load the data and initialize the chart
loadData();
