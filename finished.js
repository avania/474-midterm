'use strict';

(function() {

  let data = ""; // keep data in global scope
  let svgContainer = ""; // keep SVG reference in global scope


  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 800)
      .attr('height', 500);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("season_data.csv")
      .then((csvData) => makeBarChart(csvData));
  }

  // make scatter plot with trend line
  function makeBarChart(csvData) {
    data = csvData;
    svgContainer.html("");

    // get an array of gre scores and an array of chance of admit
    
    let avgViewers = data.map((row) => parseFloat(row["Avg. Viewers (mil)"]));
    let years = data.map((row) => parseFloat(row["Year"]));

    let axesLimits = findMinMax(years, avgViewers);

    // draw axes with ticks and return mapping and scaling functions
    let mapFunctions = drawTicks(axesLimits);

    // plot the data using the mapping and scaling functions
    plotData(mapFunctions);

    // draw line for average views over time
    drawAverageLine(mapFunctions, avgViewers)

    // draw title, axes labels, and color key code
    makeLabels();
  }

    // draw line for average views over time
    function drawAverageLine(map, avgViewers) {
      let div = d3.select("body").append("div")
      .attr("class", "avg")
      .style("opacity", 0);

      let yMap = map.yScale;

      let avg = d3.mean(avgViewers)
      svgContainer.append("line")
      .style("stroke", "black")
      .attr('x1', 50)
      .attr("y1", d => yMap(avg))
      .attr("x2", 750)
      .attr("y2", d => yMap(avg))
      .attr("stroke-width", 3)
      .style("stroke-dasharray", ("5, 2"))
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html('<p>' + 
            'Average = ' + (Math.round( avg * 100) /100) + '<br/>' + 
            '</p>'
          )
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

      svgContainer.append('text')
      .attr('x', 700)
      .attr('y',  d => yMap(avg)-4)
      .style('font-size', '9pt')
      .text(Math.round( avg * 10) /10);
    }

    // make title and axes labels
    function makeLabels() {
      svgContainer.append('text')
        .attr('x', 250)
        .attr('y', 30)
        .style('font-size', '16pt')
        .text("Average Viewership By Season");
  
        svgContainer.append('text')
        .attr('x', 350)
        .attr('y', 490)
        .style('font-size', '10pt')
        .text('Season (years)');
  
        svgContainer.append('text')
        .attr('transform', 'translate(20, 315)rotate(-90)')
        .style('font-size', '10pt')
        .text('Avg Views (millions)');
  
        // Add color key to mimic Tableau file
        svgContainer.append('text')
        .attr('x', 650)
        .attr('y', 75)
        .style('font-size', '10pt')
        .text('Viewership Data');

        svgContainer.append('rect')
        .attr("x", 650)
        .attr("y", 85)
        .attr("width", 15)
        .attr("height", 15)
        .attr('fill', "#75C3FE");

        svgContainer.append('text')
        .attr('x', 670)
        .attr('y', 97)
        .style('font-size', '9pt')
        .text('Actual');

        svgContainer.append('rect')
        .attr("x", 650)
        .attr("y", 110)
        .attr("width", 15)
        .attr("height", 15)
        .attr('fill', "#787D80");

        svgContainer.append('text')
        .attr('x', 670)
        .attr('y', 122)
        .style('font-size', '9pt')
        .text('Estimated');
    }

  // plot all the data points on the SVG
  function plotData(map) {
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    svgContainer.selectAll('.dot')
    .data(data)
    .enter()
    .append("rect")
    .attr("x", x => xMap(x) -10)
    .attr("y", y => yMap(y) -0.5) // cleans up axis
    .attr("width", 20)
    .attr("height", x => (450 -yMap(x)))
    .attr('fill', "#75C3FE")
    .on("mouseover", (d) => {
      div.transition()
        .duration(200)
        .style("opacity", 0.9)
        .style("stroke", 'grey');
      div.html('<p>' + 
          'Season #' + d.Year + '<br/>' + 
          'Year:              ' + d.Year + '<br/>' + 
          'Episodes:          ' + d.Episodes + '<br/>' + 
          'Avg Viewers (mil): ' + d['Avg. Viewers (mil)'] + '<br/>' + 
          '<br/>' +
          'Most Watched Episode: ' + d['Most watched episode'] + '<br/>' +
          'Viewers (mil): '+  d['Viewers (mil)'] + '<br/>' +
          '</p>'
        )
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY-28) + "px");
    })
    .on("mouseout", (d) => {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .filter(function(d) { return d['Data']=='Estimated' }) // Recolor for estimated vs actual
    .attr('fill', "#787D80")
      
      // Add view count label to top of bars
      svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append("text")
      .attr("x", x => xMap(x) -10)
      .attr("y", y => yMap(y)-3)
      .style('font-size', '8pt')
      .text(d => d['Avg. Viewers (mil)']);
      
  }

  // draw the axes and ticks
  function drawTicks(limits) {
    // return gre score from a row of data
    let xValue = function(d) { return +d["Year"]}

    // function to scale gre score
    let xScale = d3.scaleLinear()
      .domain([limits.yearMin -1, limits.yearMax + 1]) // give domain buffer room
      .range([50, 750]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d"));
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return Chance of Admit from a row of data
    let yValue = function(d) { return +d["Avg. Viewers (mil)"]}

    // function to scale Chance of Admit
    let yScale = d3.scaleLinear()
      .domain([limits.viewMax+2, limits.viewMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for GRE Scores and Chance of Admit
  function findMinMax(year, avgViewers) {

    // get min/max gre scores
    let yearMin = d3.min(year);
    let yearMax = d3.max(year);

    // get min/max admit chance
    let viewMin = d3.min(avgViewers);
    let viewMax = d3.max(avgViewers);

    // return formatted min/max data as an object
    return {
      yearMin : yearMin,
      yearMax : yearMax,
      viewMin : viewMin,
      viewMax : viewMax
    }
  }

})();
