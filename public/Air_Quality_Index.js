document.addEventListener('DOMContentLoaded', function () {
    const metrics = ['rco2', 'atmp', 'rhum', 'tvoc_index', 'pm01', 'pm02', 'pm10'];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(metrics);
    let readings = [];
  
    // Load data from JSON files
    const loadData = async () => {
      const greencoatData = await d3.json('readings_greencoat.json');
      const hh302Data = await d3.json('readings_hh302.json');
      const hh308Data = await d3.json('readings_hh308.json');
      
      readings = [
        ...greencoatData.readings.map(d => ({ ...d.message, date: new Date(d.time_ms * 1000), topic: 'greencoat' })),
        ...hh302Data.readings.map(d => ({ ...d.message, date: new Date(d.time_ms * 1000), topic: 'highholborn_302' })),
        ...hh308Data.readings.map(d => ({ ...d.message, date: new Date(d.time_ms * 1000), topic: 'highholborn_308' }))
      ];
    };
  
    // Create combined bar and line chart
    const combinedChartPanel = d3.select("#combinedChartPanel");
    createCombinedChart(combinedChartPanel);
  
    // Create scatter plot
    const scatterPlotPanel = d3.select("#scatterPlotPanel");
    createScatterPlot(scatterPlotPanel);
  
    // Create heatmap
    const heatmapPanel = d3.select("#heatmapPanel");
    createHeatmap(heatmapPanel);
  
    // Add event listeners for controls
    document.getElementById("visualizeButton").addEventListener("click", updateDashboard);
  
    function updateDashboard() {
      const location = document.getElementById("location").value;
      const filteredReadings = readings.filter(d => location === 'all' || d.topic === location);
  
      // Update combined chart
      updateCombinedChart(combinedChartPanel, filteredReadings);
  
      // Update scatter plot
      updateScatterPlot(scatterPlotPanel, filteredReadings);
  
      // Update heatmap
      updateHeatmap(heatmapPanel, filteredReadings);
    }
  
    function createCombinedChart(container) {
      const margin = { top: 20, right: 50, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`);
  
      svg.append("g")
        .attr("class", "y axis");
  
      svg.append("path")
        .attr("class", "line");
  
      svg.append("g")
        .attr("class", "bars");
  
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Combined CO2 and PM Levels Over Time");
  
      svg.append("text")
        .attr("class", "x label")
        .attr("x", width / 2)
        .attr("y", height + 30)
        .attr("text-anchor", "middle")
        .text("Date");
  
      svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .text("Value");
    }
  
    function updateCombinedChart(container, data) {
      const margin = { top: 20, right: 50, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      const svg = container.select("svg g");
      const xScale = d3.scaleTime().range([0, width]);
      const yScaleLine = d3.scaleLinear().range([height, 0]);
      const yScaleBar = d3.scaleLinear().range([height, 0]);
      const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScaleLine(d.rco2));
  
      xScale.domain(d3.extent(data, d => d.date));
      yScaleLine.domain([0, d3.max(data, d => d.rco2)]);
      yScaleBar.domain([0, d3.max(data, d => d3.max([d.pm01, d.pm02, d.pm10]))]);
  
      const xAxis = d3.axisBottom(xScale);
      const yAxisLine = d3.axisLeft(yScaleLine);
      const yAxisBar = d3.axisRight(yScaleBar);
  
      svg.select(".x.axis")
        .transition()
        .duration(750)
        .call(xAxis);
  
      svg.select(".y.axis")
        .transition()
        .duration(750)
        .call(yAxisLine);
  
      svg.select(".line")
        .datum(data)
        .transition()
        .duration(750)
        .attr("d", line)
        .style("stroke", colorScale('rco2'));
  
      const bars = svg.select(".bars").selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.date))
        .attr("y", d => yScaleBar(d.pm02))
        .attr("width", 5)
        .attr("height", d => height - yScaleBar(d.pm02))
        .style("fill", colorScale('pm02'))
        .style("opacity", 0.7);
  
      bars.on("mouseover", function (event, d) {
        d3.select("#tooltip")
          .transition().duration(200)
          .style("opacity", .9);
        d3.select("#tooltip")
          .html(`PM2.5: ${d.pm02}<br>CO2: ${d.rco2}<br>Date: ${d.date.toLocaleString()}`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.select("#tooltip")
          .transition().duration(500)
          .style("opacity", 0);
      });
    }
  
    function createScatterPlot(container) {
      const margin = { top: 20, right: 50, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`);
  
      svg.append("g")
        .attr("class", "y axis");
  
      svg.append("g")
        .attr("class", "scatterplot");
  
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Temperature vs Humidity");
  
      svg.append("text")
        .attr("class", "x label")
        .attr("x", width / 2)
        .attr("y", height + 30)
        .attr("text-anchor", "middle")
        .text("Temperature (°C)");
  
      svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .text("Humidity (%)");
    }
  
    function updateScatterPlot(container, data) {
      const margin = { top: 20, right: 50, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      const svg = container.select("svg g");
      const xScale = d3.scaleLinear().range([0, width]);
      const yScale = d3.scaleLinear().range([height, 0]);
  
      xScale.domain([0, d3.max(data, d => d.atmp)]);
      yScale.domain([0, d3.max(data, d => d.rhum)]);
  
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);
  
      svg.select(".x.axis")
        .transition()
        .duration(750)
        .call(xAxis);
  
      svg.select(".y.axis")
        .transition()
        .duration(750)
        .call(yAxis);
  
      const tooltip = d3.select("#tooltip");
  
      const dots = svg.select(".scatterplot")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => xScale(d.atmp))
        .attr("cy", d => yScale(d.rhum))
        .attr("r", 5)
        .style("fill", colorScale('atmp'))
        .style("opacity", 0.7);
  
      dots.on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`Temperature: ${d.atmp}°C<br>Humidity: ${d.rhum}%`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });
    }
  
    function createHeatmap(container) {
      const margin = { top: 20, right: 50, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`);
  
      svg.append("g")
        .attr("class", "y axis");
  
      svg.append("g")
        .attr("class", "heatmap");
  
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Heatmap of Air Quality Metrics");
  
      svg.append("text")
        .attr("class", "x label")
        .attr("x", width / 2)
        .attr("y", height + 30)
        .attr("text-anchor", "middle")
        .text("Metric");
  
      svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .text("Date");
    }
  
    function updateHeatmap(container, data) {
      const margin = { top: 20, right: 50, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      const svg = container.select("svg g");
      const xScale = d3.scaleBand().range([0, width]).padding(0.05);
      const yScale = d3.scaleBand().range([height, 0]).padding(0.05);
      const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, d3.max(data, d => d3.max(metrics, metric => d[metric]))]);
  
      xScale.domain(metrics);
      yScale.domain(data.map(d => d.date));
  
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);
  
      svg.select(".x.axis")
        .transition()
        .duration(750)
        .call(xAxis);
  
      svg.select(".y.axis")
        .transition()
        .duration(750)
        .call(yAxis);
  
      const heatmapData = [];
      data.forEach(d => {
        metrics.forEach(metric => {
          heatmapData.push({ metric, date: d.date, value: d[metric] });
        });
      });
  
      const tooltip = d3.select("#tooltip");
  
      const cells = svg.select(".heatmap")
        .selectAll("rect")
        .data(heatmapData)
        .join("rect")
        .attr("x", d => xScale(d.metric))
        .attr("y", d => yScale(d.date))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", d => colorScale(d.value))
        .style("opacity", 0.8);
  
      cells.on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`${d.metric}: ${d.value}<br>Date: ${d.date.toLocaleString()}`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });
    }
  
    // Load the data and initialize the visualizations
    loadData().then(() => {
      updateDashboard();
    });
  });
  