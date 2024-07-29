document.addEventListener('DOMContentLoaded', function () {
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const width = 1000 - margin.left - margin.right;
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
  let useMQTT = false; // Flag to switch between JSON and MQTT
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
      { value: 50, color: 'green' },
      { value: 100, color: 'yellow' },
      { value: 150, color: 'orange' },
      { value: 200, color: 'red' },
      { value: 300, color: 'purple' },
      { value: 500, color: 'maroon' }
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
  }

  function processData(data) {
      const now = new Date();
      metrics.forEach(metric => {
          const value = data[metric]; // Assuming the incoming data has the same structure
          readings.push({ date: now, metric, value });
      });

      // Keep only the data from the last 50 seconds
      const cutoffTime = new Date(now.getTime() - 50000); // 50 seconds in milliseconds
      readings = readings.filter(d => d.date >= cutoffTime);

      x.domain([cutoffTime, now]);
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

  const alertThresholds = {
    rco2: 1000,
    atmp: 30,
    rhum: 70,
    tvoc_index: 3,
    pm01: 35,
    pm02: 25,
    pm10: 50
  };
  
  function checkForAlerts(data) {
    const alerts = metrics.filter(metric => data[metric] > alertThresholds[metric]);
    if (alerts.length > 0) {
      triggerAlert(alerts);
    }
  }
  
  function triggerAlert(alerts) {
    const alertMessage = `Alert! High levels detected for: ${alerts.join(', ')}`;
    // Show a browser notification
    if (Notification.permission === "granted") {
      new Notification("Air Quality Alert", { body: alertMessage });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("Air Quality Alert", { body: alertMessage });
        }
      });
    }
  
    // Send an email alert
    sendEmail("recipient@example.com", "Air Quality Alert", alertMessage);
  }
  
  function sendEmail(to, subject, message) {
    // This is a placeholder function. You would implement this using an email API such as SendGrid, Mailgun, etc.
    console.log(`Sending email to ${to} with subject "${subject}" and message "${message}"`);
  }

  function updateFromJSON() {
      d3.json('readings_greencoat.json').then(data => {
          let index = 0;
          interval = setInterval(() => {
              if (index < data.readings.length) {
                  processData(data.readings[index].message);
                  index++;
              } else {
                  clearInterval(interval);
                  useMQTT = true;
                  initializeMQTT();
              }
          }, 1000);
      });
  }

  const buildingTopics = {
      "Greencoat GB_G03": "airgradient/readings/0cb815082660",
      "Greencoat GB_G04": "airgradient/readings/4022d8f9b4d8",
      "Peckham PR_B501-01": "airgradient/readings/dc5475bb845c",
      "Peckham PR_B501-02": "airgradient/readings/b48a0a613900",
      "Peckham PR_B501-03": "airgradient/readings/dc5475bcc430",
      "High Holborn HH_302": "airgradient/readings/dc5475bce770",
      "High Holborn HH_308": "airgradient/readings/dc5475bacb84"
  };

  function initializeMQTT() {
      const selectedBuilding = document.getElementById('building').value;
      const topic = buildingTopics[selectedBuilding];

      if (!topic) return;

      const clientId = "mqtt_" + Math.random().toString(16).substr(2, 8);
      const client = new Paho.MQTT.Client("mqtt.cci.arts.ac.uk", 1883, clientId);

      client.onConnectionLost = function (responseObject) {
          if (responseObject.errorCode !== 0) {
              console.log("onConnectionLost:" + responseObject.errorMessage);
          }
      };

      client.onMessageArrived = function (message) {
          const data = JSON.parse(message.payloadString);
          processData(data);
      };

      const options = {
          useSSL: true,
          userName: "student",
          password: "austral-clash-sawyer-blaze",
          onSuccess: onConnect,
          onFailure: function (message) {
              console.log("Connection failed: " + message.errorMessage);
          }
      };

      client.connect(options);

      function onConnect() {
          console.log("Connected to MQTT broker");
          client.subscribe(topic);
      }
  }

// Event listener for the download button
document.getElementById('download').addEventListener('click', function () {
  const dateInput = document.getElementById('download-date').value;
  if (!dateInput) {
    alert("Please select a date.");
    return;
  }

  const selectedDate = new Date(dateInput);
  const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

  const filteredReadings = readings.filter(d => d.date >= startOfDay && d.date <= endOfDay);

  if (filteredReadings.length === 0) {
    alert("No data available for the selected date.");
    return;
  }

  const dataStr = JSON.stringify(filteredReadings, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `streamed_data_${dateInput}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

  // Event listeners for play, pause, and stop buttons
  document.getElementById('play').addEventListener('click', function () {
      if (!interval) {
          updateFromJSON();
      }
  });

  document.getElementById('pause').addEventListener('click', function () {
      clearInterval(interval);
      interval = null;
  });

  document.getElementById('stop').addEventListener('click', function () {
      clearInterval(interval);
      interval = null;
      readings = [];
      svg.selectAll(".line").datum([]).attr("d", line);
      svg.selectAll(".dots").selectAll(".dot").remove();
  });

  // Start with JSON data
  updateFromJSON();

  function displayPMStandards() {
      const pmStandards = [
          { category: 'Good', pm25: '0-10 µg/m³', pm10: '0-20 µg/m³', color: 'green' },
          { category: 'Moderate', pm25: '11-20 µg/m³', pm10: '21-50 µg/m³', color: 'yellow' },
          { category: 'Unhealthy for Sensitive Groups', pm25: '21-35 µg/m³', pm10: '51-100 µg/m³', color: 'orange' },
          { category: 'Unhealthy', pm25: '36-50 µg/m³', pm10: '101-200 µg/m³', color: 'red' },
          { category: 'Very Unhealthy', pm25: '51-100 µg/m³', pm10: '201-400 µg/m³', color: 'purple' },
          { category: 'Hazardous', pm25: '101+ µg/m³', pm10: '401+ µg/m³', color: 'maroon' }
      ];

      const table = d3.select("body").append("table").attr("class", "pm-standards-table");
      const thead = table.append("thead");
      const tbody = table.append("tbody");

      thead.append("tr")
          .selectAll("th")
          .data(['Category', 'PM2.5 (µg/m³)', 'PM10 (µg/m³)'])
          .enter()
          .append("th")
          .text(d => d);

      const rows = tbody.selectAll("tr")
          .data(pmStandards)
          .enter()
          .append("tr")
          .style("background-color", d => d.color);

      rows.selectAll("td")
          .data(d => [d.category, d.pm25, d.pm10])
          .enter()
          .append("td")
          .text(d => d);
  }

  // Call the function to display the table
  displayPMStandards();

  document.getElementById('building').addEventListener('change', function () {
      clearInterval(interval);
      interval = null;
      readings = [];
      svg.selectAll(".line").datum([]).attr("d", line);
      svg.selectAll(".dots").selectAll(".dot").remove();
      initializeMQTT();
  });
});
