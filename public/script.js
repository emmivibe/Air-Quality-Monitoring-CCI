document.addEventListener('DOMContentLoaded', function () {
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;
  
    const svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const parseTime = d3.timeParse("%a %b %d %H:%M:%S %Y");
    const formatTime = d3.timeFormat("%Y-%m-%d %H:%M:%S");
  
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
  
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value));
  
    const tooltip = d3.select("#tooltip");
  
    const metrics = ['rco2', 'atmp', 'rhum', 'tvoc_index', 'pm01', 'pm02', 'pm10'];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(metrics);
  
    let readings = [];
    const maxDataPoints = 50;
    let interval;
    const activeMetrics = new Set(metrics);
  
    x.domain([new Date(), new Date(Date.now() + 60000)]);
    y.domain([0, 500]); // Example domain, adjust based on your data
  
    const metricLines = metrics.map(metric => ({
      metric,
      line: svg.append("path")
        .datum([])
        .attr("fill", "none")
        .attr("stroke", colorScale(metric))
        .attr("stroke-width", 1.5)
        .attr("class", "line"),
      dots: svg.append("g").attr("class", "dots")
    }));
  
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x));
  
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));
  
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height + margin.bottom - 10)
      .text("Time");
  
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "end")
      .attr("x", -margin.top)
      .attr("y", -margin.left + 20)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text("Value");
  
    svg.append("text")
      .attr("class", "title")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .text("Real-time Air Quality Data Stream");
  
    const legend = d3.select("#legend");
  
    metrics.forEach(metric => {
      const legendItem = legend.append("div").attr("class", "legend-item");
      legendItem.append("div")
        .attr("class", "legend-color")
        .style("background-color", colorScale(metric));
      legendItem.append("span").text(metric);
  
      legendItem.on("click", function () {
        if (activeMetrics.has(metric)) {
          activeMetrics.delete(metric);
        } else {
          activeMetrics.add(metric);
        }
        updateVisualization();
      });
    });
  
    const thresholdLines = [
      { value: 50, color: 'green', label: 'Good' },
      { value: 100, color: 'yellow', label: 'Moderate' },
      { value: 150, color: 'orange', label: 'Unhealthy for Sensitive Groups' },
      { value: 200, color: 'red', label: 'Unhealthy' },
      { value: 300, color: 'purple', label: 'Very Unhealthy' },
      { value: 500, color: 'maroon', label: 'Hazardous' }
    ];
  
    thresholdLines.forEach(threshold => {
      svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(threshold.value))
        .attr("y2", y(threshold.value))
        .attr("stroke", threshold.color)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4");
  
      svg.append("text")
        .attr("x", width - 5)
        .attr("y", y(threshold.value) - 5)
        .attr("text-anchor", "end")
        .attr("fill", threshold.color)
        .text(threshold.label);
    });
  
    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .translateExtent([[-100, -100], [width + 90, height + 100]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);
  
    svg.call(zoom);
  
    function zoomed(event) {
      const newX = event.transform.rescaleX(x);
      const newY = event.transform.rescaleY(y);
  
      svg.selectAll(".x-axis").call(d3.axisBottom(newX));
      svg.selectAll(".y-axis").call(d3.axisLeft(newY));
  
      metricLines.forEach(lineObj => {
        lineObj.line.attr("d", line.x(d => newX(d.date)).y(d => newY(d.value)));
        lineObj.dots.selectAll(".dot")
          .attr("cx", d => newX(d.date))
          .attr("cy", d => newY(d.value));
      });
    }
  
    function updateData() {
      const now = new Date();
      metrics.forEach(metric => {
        const value = Math.random() * 500; // Simulate random data, replace with real data if available
        readings.push({ date: now, metric, value });
      });
  
      readings = readings.slice(-maxDataPoints);
  
      x.domain([new Date(now.getTime() - maxDataPoints * 1000), now]);
      svg.select(".x-axis").transition().duration(1000).call(d3.axisBottom(x));
  
      metrics.forEach(metric => {
        const metricData = readings.filter(d => d.metric === metric);
  
        const lineObj = metricLines.find(d => d.metric === metric);
  
        lineObj.line.datum(metricData)
          .transition()
          .duration(1000)
          .attr("d", line);
  
        const dots = lineObj.dots.selectAll(".dot").data(metricData, d => d.date);
  
        dots.exit().remove();
  
        dots.enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3)
          .attr("fill", colorScale(metric))
          .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Date: ${formatTime(d.date)}<br>${metric}: ${d.value}`)
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
          })
          .merge(dots)
          .transition()
          .duration(1000)
          .attr("cx", d => x(d.date))
          .attr("cy", d => y(d.value));
      });
    }
  
    document.getElementById("play").addEventListener("click", function () {
      if (!interval) {
        interval = setInterval(updateData, 1000);
      }
    });
  
    document.getElementById("pause").addEventListener("click", function () {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    });
  
    document.getElementById("stop").addEventListener("click", function () {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      readings = [];
      metricLines.forEach(lineObj => {
        lineObj.line.datum([]).attr("d", line);
        lineObj.dots.selectAll(".dot").remove();
      });
    });
  
    function updateVisualization() {
      metricLines.forEach(lineObj => {
        if (activeMetrics.has(lineObj.metric)) {
          lineObj.line.style("display", null);
          lineObj.dots.style("display", null);
        } else {
          lineObj.line.style("display", "none");
          lineObj.dots.style("display", "none");
        }
      });
      updateData(); // Ensure data updates correctly
    }
  
    updateData(); // Initialize with some data
  });  