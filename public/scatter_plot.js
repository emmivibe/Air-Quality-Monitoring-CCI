document.addEventListener('DOMContentLoaded', function () {
    const margin = { top: 60, right: 200, bottom: 60, left: 60 };
    const metrics = ['rco2', 'atmp', 'rhum', 'tvoc_index', 'pm01', 'pm02', 'pm10'];
    const size = 200; // Size of each scatter plot
    const padding = 20; // Padding between scatter plots
    const width = size * metrics.length + margin.left + margin.right;
    const height = size * metrics.length + margin.top + margin.bottom;
  
    const svg = d3.select("#chart").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const tooltip = d3.select("#tooltip");
  
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(metrics);
  
    const xScales = {};
    const yScales = {};
  
    metrics.forEach(metric => {
      xScales[metric] = d3.scaleLinear().range([padding / 2, size - padding / 2]);
      yScales[metric] = d3.scaleLinear().range([size - padding / 2, padding / 2]);
    });
  
    d3.json('readings_greencoat.json').then(data => {
      const readings = data.readings.map(d => ({
        date: new Date(d.message.time_ms * 1000), // Convert time_ms from seconds to milliseconds
        rco2: +d.message.rco2,
        atmp: +d.message.atmp,
        rhum: +d.message.rhum,
        tvoc_index: +d.message.tvoc_index,
        pm01: +d.message.pm01,
        pm02: +d.message.pm02,
        pm10: +d.message.pm10
      }));
  
      metrics.forEach(metric => {
        xScales[metric].domain(d3.extent(readings, d => d[metric]));
        yScales[metric].domain(d3.extent(readings, d => d[metric]));
      });
  
      const grid = svg.append("g");
  
      metrics.forEach((xMetric, i) => {
        metrics.forEach((yMetric, j) => {
          if (i !== j) {
            const cell = grid.append("g")
              .attr("transform", `translate(${i * size},${j * size})`);
  
            cell.append("rect")
              .attr("class", "frame")
              .attr("x", padding / 2)
              .attr("y", padding / 2)
              .attr("width", size - padding)
              .attr("height", size - padding)
              .style("fill", "none")
              .style("stroke", "#aaa");
  
            // Add axis labels
            if (j === metrics.length - 1) {
              cell.append("text")
                .attr("x", size / 2)
                .attr("y", size + padding / 2)
                .attr("dy", ".71em")
                .attr("text-anchor", "middle")
                .text(xMetric);
            }
            if (i === 0) {
              cell.append("text")
                .attr("x", -padding / 2)
                .attr("y", size / 2)
                .attr("dy", ".71em")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .text(yMetric);
            }
  
            cell.selectAll(".dot")
              .data(readings)
              .enter().append("circle")
              .attr("class", "dot")
              .attr("r", 3)
              .attr("cx", d => xScales[xMetric](d[xMetric]))
              .attr("cy", d => yScales[yMetric](d[yMetric]))
              .style("fill", colorScale(xMetric))
              .style("opacity", 0.6)
              .on("mouseover", function (event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`Date: ${d.date}<br>${xMetric}: ${d[xMetric]}<br>${yMetric}: ${d[yMetric]}`)
                  .style("left", (event.pageX + 5) + "px")
                  .style("top", (event.pageY - 28) + "px");
              })
              .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
              });
          }
        });
      });
  
      function updateAnimation() {
        const currentDate = new Date();
        const pastDate = new Date(currentDate.getTime() - 60 * 60 * 1000); // 1 hour ago
        const filteredReadings = readings.filter(d => d.date >= pastDate && d.date <= currentDate);
  
        metrics.forEach((xMetric, i) => {
          metrics.forEach((yMetric, j) => {
            if (i !== j) {
              const cell = svg.select(`g:nth-child(${i * metrics.length + j + 1})`);
              cell.selectAll(".dot")
                .data(filteredReadings)
                .transition()
                .duration(1000)
                .attr("cx", d => xScales[xMetric](d[xMetric]))
                .attr("cy", d => yScales[yMetric](d[yMetric]));
            }
          });
        });
      }
  
      setInterval(updateAnimation, 1000);
    });
  
    // Add a title
    svg.append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("class", "title")
      .style("font-size", "20px")
      .text("Animated Scatter Plot Matrix of Air Quality Metrics");
  
    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right + 20}, 0)`);
  
    metrics.forEach((metric, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0,${i * 20})`);
  
      legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale(metric));
  
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text(metric);
    });
  });
  