const continents = [
  "Africa",
  "Americas",
  "Asia",
  "Europe",
  "Latin America and the Caribbean",
  "Northern America",
  "Oceania"
];




const data = []

async function getMaxMin(){
    let maxLimitForValue = 0;
    let minLimitForValue = 0;
    await d3.csv("continent.csv").then(function (data) {
        minLimitForValue = d3.min(data, d => parseFloat(d["Life_expectancy"]));
        maxLimitForValue = d3.max(data, d => parseFloat(d["Life_expectancy"]));

});

return {min:minLimitForValue, max:maxLimitForValue}
}

 function generateDataSets({ size = 100 }) {

    const maxLimitForValue =79.224;
    const minLimitForValue = 26.4; 
  const dataSets = [];
  const currentYear = 2019;
  
  const maximumModelCount = 7;

  for (let i = 0; i < size; i++) {
    dataSets.push({
      date: currentYear - (size - (i + 1)),
      dataSet: continents
        .sort(function() {
          return Math.random() - 0.5;
        })
        .map(continent => ({
          name: continent,
          value:Math.random() * (maxLimitForValue - minLimitForValue) + minLimitForValue
        }))
    });
  }
  console.log(dataSets)
  return dataSets;
}


// function createViz(){
//     console.log("Using D3 v"+d3.version);
//     Object.keys(PROJECTIONS).forEach(function(k) {
//         PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
//     });
//     let svgEl = d3.select("#f4").append("svg");
//     svgEl.attr("width", MAP_W);
//     svgEl.attr("height", MAP_H);
//     loadData(svgEl);
// };


function BarChartRace(chartId, extendedSettings) {
    const chartSettings = {
      width: (window.innerWidth - 40)*0.5,
      height: (window.innerHeight - 40)*0.5,
      padding: 20,
      titlePadding: 5,
      columnPadding: 0.4,
      ticksInXAxis: 5,
      duration: 5000,
      ...extendedSettings
    };
  
    chartSettings.innerWidth = chartSettings.width - chartSettings.padding;
    chartSettings.innerHeight = chartSettings.height - chartSettings.padding;
  
    const chartDataSets = [];
    let chartTransition;
    let timerStart, timerEnd;
    let currentDataSetIndex = 0;
    let elapsedTime = chartSettings.duration;
  
    const chartContainer = d3.select(`#${chartId} .chart-container`);
    const xAxisContainer = d3.select(`#${chartId} .x-axis`);
    const yAxisContainer = d3.select(`#${chartId} .y-axis`);
  
    const xAxisScale = d3.scaleLinear().range([0, chartSettings.innerWidth]);
  
    const yAxisScale = d3
      .scaleBand()
      .range([0, chartSettings.innerHeight - chartSettings.padding])
      .padding(chartSettings.columnPadding);
  
    d3.select(`#${chartId}`)
      .attr("width", chartSettings.width)
      .attr("height", chartSettings.height);
  
    chartContainer.attr(
      "transform",
      `translate(${chartSettings.padding} ${chartSettings.padding})`
    );
  
    chartContainer
      .select(".current-date")
      .attr(
        "transform",
        `translate(${chartSettings.innerWidth /2} ${chartSettings.innerHeight/2})`
      );
  
    function draw({ dataSet, date: currentDate }, transition) {
      const { innerHeight, ticksInXAxis, titlePadding } = chartSettings;
      const dataSetDescendingOrder = dataSet.sort(
        ({ value: firstValue }, { value: secondValue }) =>
          secondValue - firstValue
      );
  
      chartContainer.select(".current-date").text(currentDate);
  
      xAxisScale.domain([0, dataSetDescendingOrder[0].value]);
      yAxisScale.domain(dataSetDescendingOrder.map(({ name }) => name));
  
      xAxisContainer.transition(transition).call(
        d3
          .axisTop(xAxisScale)
          .ticks(ticksInXAxis)
          .tickSize(-innerHeight)
      );
  
      yAxisContainer
        .transition(transition)
        .call(d3.axisLeft(yAxisScale).tickSize(0));
  
      // The general update Pattern in d3.js
  
      // Data Binding
      const barGroups = chartContainer
        .select(".columns")
        .selectAll("g.column-container")
        .data(dataSetDescendingOrder, ({ name }) => name);
  
      // Enter selection
      const barGroupsEnter = barGroups
        .enter()
        .append("g")
        .attr("class", "column-container")
        .attr("transform", `translate(0,${innerHeight})`);
  
      barGroupsEnter
        .append("rect")
        .attr("class", "column-rect")
        .attr("width", 0)
        .attr("height", yAxisScale.step() * (1 - chartSettings.columnPadding));
  
      barGroupsEnter
        .append("text")
        .attr("class", "column-title")
        .attr("y", (yAxisScale.step() * (1 - chartSettings.columnPadding)) / 2)
        .attr("x", -titlePadding)
        .text(({ name }) => name);
  
      barGroupsEnter
        .append("text")
        .attr("class", "column-value")
        .attr("y", (yAxisScale.step() * (1 - chartSettings.columnPadding)) / 2)
        .attr("x", titlePadding)
        .text(0);
  
      // Update selection
      const barUpdate = barGroupsEnter.merge(barGroups);
  
      barUpdate
        .transition(transition)
        .attr("transform", ({ name }) => `translate(0,${yAxisScale(name)})`)
        .attr("fill", "normal");
  
      barUpdate
        .select(".column-rect")
        .transition(transition)
        .attr("width", ({ value }) => xAxisScale(value));
  
      barUpdate
        .select(".column-title")
        .transition(transition)
        .attr("x", ({ value }) => xAxisScale(value) - titlePadding);
  
      barUpdate
        .select(".column-value")
        .transition(transition)
        .attr("x", ({ value }) => xAxisScale(value) + titlePadding)
        .tween("text", function({ value }) {
          const interpolateStartValue =
            elapsedTime === chartSettings.duration
              ? this.currentValue || 0
              : +this.innerHTML;
  
          const interpolate = d3.interpolate(interpolateStartValue, value);
          this.currentValue = value;
  
          return function(t) {
            d3.select(this).text(Math.ceil(interpolate(t)));
          };
        });
  
      // Exit selection
      const bodyExit = barGroups.exit();
  
      bodyExit
        .transition(transition)
        .attr("transform", `translate(0,${innerHeight})`)
        .on("end", function() {
          d3.select(this).attr("fill", "none");
        });
  
      bodyExit
        .select(".column-title")
        .transition(transition)
        .attr("x", 0);
  
      bodyExit
        .select(".column-rect")
        .transition(transition)
        .attr("width", 0);
  
      bodyExit
        .select(".column-value")
        .transition(transition)
        .attr("x", titlePadding)
        .tween("text", function() {
          const interpolate = d3.interpolate(this.currentValue, 0);
          this.currentValue = 0;
  
          return function(t) {
            d3.select(this).text(Math.ceil(interpolate(t)));
          };
        });
  
      return this;
    }
  
    function addDataset(dataSet) {
      chartDataSets.push(dataSet);
  
      return this;
    }
  
    function addDatasets(dataSets) {
      chartDataSets.push.apply(chartDataSets, dataSets);
  
      return this;
    }
  
    function setTitle(title) {
      d3.select(".chart-title")
        .attr("x", chartSettings.width / 2)
        .attr("y", -chartSettings.padding / 2)
        .text(title);
  
      return this;
    }
  
    /* async function render() {
      for (const chartDataSet of chartDataSets) {
        chartTransition = chartContainer
          .transition()
          .duration(chartSettings.duration)
          .ease(d3.easeLinear);
  
        draw(chartDataSet, chartTransition);
  
        await chartTransition.end();
      }
    } */
  
    async function render(index = 0) {
      currentDataSetIndex = index;
      timerStart = d3.now();
  
      chartTransition = chartContainer
        .transition()
        .duration(elapsedTime)
        .ease(d3.easeLinear)
        .on("end", () => {
          if (index < chartDataSets.length) {
            elapsedTime = chartSettings.duration;
            render(index + 1);
          } else {
            d3.select("button").text("Play");
          }
        })
        .on("interrupt", () => {
          timerEnd = d3.now();
        });
  
      if (index < chartDataSets.length) {
        draw(chartDataSets[index], chartTransition);
      }
  
      return this;
    }
  
    function stop() {
      d3.select(`#${chartId}`)
        .selectAll("*")
        .interrupt();
  
      return this;
    }
  
    function start() {
      elapsedTime -= timerEnd - timerStart;
  
      render(currentDataSetIndex);
  
      return this;
    }
  
    return {
      addDataset,
      addDatasets,
      render,
      setTitle,
      start,
      stop
    };
  }
  





























const myChart = new BarChartRace("bar-chart-race");

myChart
  .setTitle("Bar Chart Race Title")
  .addDatasets(generateDataSets({ size: 100}))
  .render();

d3.select("#stop").on("click", function() {
  if (this.innerHTML === "Stop") {
    this.innerHTML = "Resume";
    myChart.stop();
  } else if (this.innerHTML === "Resume") {
    this.innerHTML = "Stop";
    myChart.start();
  } else {
    this.innerHTML = "Stop";
    myChart.render();
  }
});