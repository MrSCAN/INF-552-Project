/*Animated Continent Chart Starts Here*/

const continents = [
    "Africa",
    "Americas",
    "Asia",
    "Europe",
    "The Caribbean",
    "Northern America",
    "Oceania"
];

const chartSettings = {
    width: 0.5 * window.innerWidth - 20,
    height: 0.5 * window.innerHeight - 20,
    padding: 40,
    titlePadding: 5,
    columnPadding: 0.4,
    ticksInXAxis: 5,
    duration: 500,
    color: [],
    dataSets: [],
};
chartSettings.color = ["#00202e", "#003f5c", "#2c4875", "#8a508f", "#bc5090", "#ff6361", "#ff8531"];

function createNodes() {
    let svgE2 = d3.select("#f4").append("svg").attr("id", "bar-chart-race");
    svgE2.attr("width", chartSettings.width);
    svgE2.attr("height", chartSettings.height);
    let container = svgE2.append("g").attr("class", "chart-container");
    container.append("text").attr("class", "chart-title");
    container.append("g").attr("class", "x-axis");
    container.append("g").attr("class", "y-axis");
    container.append("g").attr("class", "columns");
    container.append("text").attr("class", "current-date");
}

function loadContinents() {
    d3.csv("continent.csv").then(function (data) {
        generateDataSets(data);
        runBarChart();
    }).catch(function (error) { console.log(error) });
};



function generateDataSets(data) {
    for (let j = 0; j < 70; j++) {
        chartSettings.dataSets.push({
            date: data[j].year,
            dataSet: continents.map((continent, index) => ({
                name: continent,
                value: data[index * 70 + j].le
            }))
        });
    }
}


function BarChartRace(chartId) {

    chartSettings.innerWidth = chartSettings.width - chartSettings.padding * 2;
    chartSettings.innerHeight = chartSettings.height - chartSettings.padding * 2;

    const chartDataSets = [];
    let chartTransition;
    let timerStart, timerEnd;
    let currentDataSetIndex = 0;
    let elapsedTime = chartSettings.duration;

    const chartContainer = d3.select(`#${chartId} .chart-container`);
    const xAxisContainer = d3.select(`#${chartId} .x-axis`);
    const yAxisContainer = d3.select(`#${chartId} .y-axis`);

    const xAxisScale = d3.scaleLinear().range([0, chartSettings.innerWidth - chartSettings.padding * 4]);

    const yAxisScale = d3
        .scaleBand()
        .range([0, chartSettings.innerHeight - chartSettings.columnPadding])
        .padding(chartSettings.columnPadding);

    d3.select(`#${chartId}`)
        .attr("width", chartSettings.width - chartSettings.padding)
        .attr("height", chartSettings.height);

    chartContainer.attr(
        "transform",
        `translate(${chartSettings.padding * 2} ${chartSettings.padding})`
    );

    chartContainer
        .select(".current-date")
        .attr(
            "transform",
            `translate(${chartSettings.innerWidth - chartSettings.padding - 580}, -20)`
        );

    function draw({ dataSet, date: currentDate }, transition) {
        const { innerHeight, ticksInXAxis, titlePadding } = chartSettings;
        const dataSetDescendingOrder = dataSet.sort(
            ({ value: firstValue }, { value: secondValue }) =>
                secondValue - firstValue
        );

        chartContainer.select(".current-date").text(currentDate);
        // ctx.f4.setTitle("A Chart Showing Life Expectancy of Different Continents for "+currentDate);

        xAxisScale.domain([0, dataSetDescendingOrder[0].value]);
        yAxisScale.domain(dataSetDescendingOrder.map(({ name }) => name));

        xAxisContainer
            .transition(transition)
            .call(d3.axisTop(xAxisScale).ticks(ticksInXAxis).tickSize(-innerHeight));

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
            .style("fill", (d) => chartSettings.color[continents.indexOf(d.name)])
            .attr("height", yAxisScale.step() * (1 - chartSettings.columnPadding));

        // barGroupsEnter
        //     .append("text")
        //     .attr("class", "column-title")
        //     .attr("y", (yAxisScale.step() * (1 - chartSettings.columnPadding)) / 2)
        //     .attr("x", -titlePadding)
        //     .text(({ name }) => name);

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
            .attr("width", ({ value }) => xAxisScale(value))
            .attr("fill", "normal");

        barUpdate
            .select(".column-title")
            .transition(transition)
            .attr("x", ({ value }) => xAxisScale(value) - titlePadding);

        barUpdate
            .select(".column-value")
            .transition(transition)
            .attr("x", ({ value }) => xAxisScale(value) + titlePadding)
            .tween("text", function ({ value }) {
                const interpolateStartValue =
                    elapsedTime === chartSettings.duration
                        ? this.currentValue || 0
                        : +this.innerHTML;

                const interpolate = d3.interpolate(interpolateStartValue, value);
                this.currentValue = value;

                return function (t) {
                    d3.select(this).text(Math.ceil(interpolate(t)));
                };
            });

        // Exit selection
        const bodyExit = barGroups.exit();

        bodyExit
            .transition(transition)
            .attr("transform", `translate(0,${innerHeight})`)
            .on("end", function () {
                d3.select(this).attr("fill", "none");
            });

        bodyExit.select(".column-title").transition(transition).attr("x", 0);

        bodyExit.select(".column-rect").transition(transition).attr("width", 0);

        bodyExit
            .select(".column-value")
            .transition(transition)
            .attr("x", titlePadding)
            .tween("text", function () {
                const interpolate = d3.interpolate(this.currentValue, 0);
                this.currentValue = 0;

                return function (t) {
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
            .attr("x", -chartSettings.padding*2)
            .attr("y", -chartSettings.padding / 2)
            .text(title);

        return this;
    }

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
                    d3.select("#btn2").text("Play");
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
        d3.select(`#${chartId}`).selectAll("*").interrupt();

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

function runBarChart() {
    const f4 = new BarChartRace("bar-chart-race");
    ctx.f4 = f4;
    f4.setTitle("A Chart Showing Life Expectancy of Different Continents for")
        .addDatasets(chartSettings.dataSets)
        .render();

    d3.select("#btn2").on("click", function () {
        if (this.innerHTML === "Stop") {
            this.innerHTML = "Resume";
            f4.stop();
        } else if (this.innerHTML === "Resume") {
            this.innerHTML = "Stop";
            f4.start();
        } else {
            this.innerHTML = "Stop";
            f4.render();
        }
    });
}
/*Animated Continent Chart Ends Here*/










/*Density Chart For Male, Female & All Data Distribution Starts Here*/
const densityPlotData = {
    width: 0.5 * window.innerWidth - 20,
    height: 0.5 * window.innerHeight - 20,
}
function loadAllData() {
    d3.csv("who_life_expectancy_all.csv").then(function (data) {
        initSVGcanvas(data);
    }).catch(function (error) { console.log(error) });
};

function createVizf32() {
    const f3 = new BarChartRace("bar-chart-race");

    f3.setTitle("A Chart Showing Life Expectancy of Different Continents between 1950 & 2019")
        .addDatasets(chartSettings.dataSets)
        .render();

    var svgEl = d3.select("#f3").append("svg");
    svgEl.attr("width", densityPlotData.width);
    svgEl.attr("height", densityPlotData.height);
    var rootG = svgEl.append("g").attr("id", "rootG");
    // group for background elements (axes, labels)
    rootG.append("g").attr("id", "bkgG");
    loadAllData(svgEl);
};

/*-------------- Summary stats for box plot ------------------------*/
/*-------------- see Instructions/Section 3 ----------------------*/

function getSummaryStatistics(data) {
    return d3.rollup(data, function (d) {

        let q1 = d3.quantile(d.map(function (p) { return p["Life expectancy"]; }).sort(d3.ascending), .25);
        let median = d3.quantile(d.map(function (p) { return p["Life expectancy"]; }).sort(d3.ascending), .5);
        let q3 = d3.quantile(d.map(function (p) { return p["Life expectancy"]; }).sort(d3.ascending), .75);
        let iqr = q3 - q1;
        let min = d3.min(data, (d) => (d["Life expectancy"]));
        let max = d3.max(data, (d) => (d["Life expectancy"]));
        return ({ q1: q1, median: median, q3: q3, iqr: iqr, min: min, max: max })
    });
};

/*-------------- kernel density estimator ------------------------*/
/*-------------- see Instructions/Section 4 ----------------------*/

function kernelDensityEstimator(kernel, X) {
    return function (V) {
        return X.map(function (x) {
            return [x, d3.mean(V, function (v) { return kernel(x - v); })];
        });
    };
}

function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}


function initSVGcanvas(whoData) {
    let maxLe = d3.max(whoData, ((d) => parseFloat(d["Life expectancy"])));

    densityPlotData.yScale = d3.scaleLinear().domain([0, maxLe]).range([densityPlotData.height - 60, 20]);



    d3.select("#bkgG").append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(densityPlotData.yScale).ticks(10))
        .selectAll("text")
        .style("text-anchor", "end");

    // y-axis label
    d3.select("#bkgG")
        .append("text")
        .attr("y", 0)
        .attr("x", 0)
        .attr("transform", `rotate(-90) translate(-${densityPlotData.width / 4},15)`)
        .classed("axisLb", true)
        .text("Life Expectancy");



    gel = d3.select("g#rootG");

    gel.append("g").attr("id", "maleFemaleData");
    gel.append("g").attr("id", "femaleData");
    gel.append("g").attr("id", "maleData");


    let maleFemaleData = d3.select("#maleFemaleData");
    let femaleData = d3.select("#femaleData");
    let maleData = d3.select("#maleData");



    maleFemaleData.append("text")
        .attr("y", densityPlotData.height - densityPlotData.height / 8)
        .attr("x", (densityPlotData.width / 4) * 1)
        .classed("axisLb", true)
        .text("All")
        .style("text-anchor", "middle");


    femaleData.append("text")
        .attr("y", densityPlotData.height - densityPlotData.height / 8)
        .attr("x", (densityPlotData.width / 4) * 2)
        .classed("axisLb", true)
        .text("Female")
        .style("text-anchor", "middle");


    maleData.append("text")
        .attr("y", densityPlotData.height - densityPlotData.height / 8)
        .attr("x", (densityPlotData.width / 4) * 3)
        .classed("axisLb", true)
        .text("Male")
        .style("text-anchor", "middle");


    let maleFemaleData_circles = maleFemaleData.selectAll("circle")
        .data(whoData)
        .enter()
        .append("circle");
    maleFemaleData_circles.attr("cx", function (d) { return (densityPlotData.width / 4) * 1 - 25 + Math.random() * 50; })
        .attr("cy", function (d) { return densityPlotData.yScale(d["Life expectancy"]); })
        .attr("r", "0.5")
        .attr("fill", "#003f5c");

    let femaleData_circles = femaleData.selectAll("circle")
        .data(whoData.filter(function (d) {
            return (d.Gender == "Female");
        }))
        .enter()
        .append("circle");
    femaleData_circles.attr("cx", function (d) { return ((densityPlotData.width / 4) * 2) - 25 + (Math.random() * 50); })
        .attr("cy", function (d) { return densityPlotData.yScale(d["Life expectancy"]); })
        .attr("r", "0.5")
        .attr("fill", "#ffa0c5");

    let maleData_circles = maleData.selectAll("circle")
        .data(whoData.filter(function (d) {
            return (d.Gender == "Male");
        }))
        .enter()
        .append("circle");
    maleData_circles.attr("cx", function (d) { return ((densityPlotData.width / 4) * 3) - 25 + (Math.random() * 50); })
        .attr("cy", function (d) { return densityPlotData.yScale(d["Life expectancy"]); })
        .attr("r", "0.5")
        .attr("fill", "#ff6361");


    // Show the main vertical line

    femaleData_data = getSummaryStatistics(whoData.filter(function (d) {
        return (d.Gender == "Female");
    }));

    femaleData.append("line")
        .attr("x1", (densityPlotData.width / 4) * 2)
        .attr("x2", (densityPlotData.width / 4) * 2)
        .attr("y1", densityPlotData.yScale(femaleData_data.min))
        .attr("y2", densityPlotData.yScale(femaleData_data.max))
        .attr("stroke", "black");

    // Show the box

    femaleData.append("rect")
        .attr("x", (densityPlotData.width / 4) * 2 - 25)
        .attr("y", densityPlotData.yScale(femaleData_data.q3))
        .attr("height", (densityPlotData.yScale(femaleData_data.q1) - densityPlotData.yScale(femaleData_data.q3)))
        .attr("width", 50)
        .attr("stroke", "black")
        .style("fill", "transparent");

    // show median, min and max horizontal lines

    femaleData.selectAll("toto")
        .data([femaleData_data.min, femaleData_data.median, femaleData_data.max])
        .enter()
        .append("line")
        .attr("x1", (densityPlotData.width / 4) * 2 - 25)
        .attr("x2", (densityPlotData.width / 4) * 2 + 25)
        .attr("y1", function (d) { return (densityPlotData.yScale(d)) })
        .attr("y2", function (d) { return (densityPlotData.yScale(d)) })
        .attr("stroke", "black");



    maleData_data = getSummaryStatistics(whoData.filter(function (d) {
        return (d.Gender == "Male");
    }));


    maleData.append("line")
        .attr("x1", (densityPlotData.width / 4) * 3)
        .attr("x2", (densityPlotData.width / 4) * 3)
        .attr("y1", densityPlotData.yScale(maleData_data.min))
        .attr("y2", densityPlotData.yScale(maleData_data.max))
        .attr("stroke", "black");

    // Show the box

    maleData.append("rect")
        .attr("x", (densityPlotData.width / 4) * 3 - 25)
        .attr("y", densityPlotData.yScale(maleData_data.q3))
        .attr("height", (densityPlotData.yScale(maleData_data.q1) - densityPlotData.yScale(maleData_data.q3)))
        .attr("width", 50)
        .attr("stroke", "black")
        .style("fill", "transparent");

    // show median, min and max horizontal lines

    maleData.selectAll("toto")
        .data([maleData_data.min, maleData_data.median, maleData_data.max])
        .enter()
        .append("line")
        .attr("x1", (densityPlotData.width / 4) * 3 - 25)
        .attr("x2", (densityPlotData.width / 4) * 3 + 25)
        .attr("y1", function (d) { return (densityPlotData.yScale(d)) })
        .attr("y2", function (d) { return (densityPlotData.yScale(d)) })
        .attr("stroke", "black");
}


/*Density Chart For Male, Female & All Data Distribution Ends Here*/




const MAP_W = 0.5 * window.innerWidth;
const MAP_H = 0.5 * window.innerHeight;


// for figure 3
const dimensions = {
    viewBox: '0, 0, 600,300',
    margin: {
        top: 35,
        right: 10,
        bottom: 50,
        left: 20,
    },
    boundedWidth: 500,
    boundedHeight: 195,
}


const PROJECTIONS = {
    ER: d3.geoEquirectangular().scale(MAP_H / Math.PI),
    IM: d3.geoInterrupt(d3.geoMollweideRaw,
        [[ // northern hemisphere
            [[-180, 0], [-100, 90], [-40, 0]],
            [[-40, 0], [30, 90], [180, 0]]
        ], [ // southern hemisphere;
            [[-180, 0], [-160, -90], [-100, 0]],
            [[-100, 0], [-60, -90], [-20, 0]],
            [[-20, 0], [20, -90], [80, 0]],
            [[80, 0], [140, -90], [180, 0]]
        ]])
        .scale(165)
        .translate([MAP_W / 2, MAP_H / 2])
        .precision(.1),
};

const ctx = {
    currentProj: PROJECTIONS.ER,
    undefinedColor: "#AAA",
    YEAR: "2000",
    panZoomMode: true,
    TRANSITION_DURATION: 500,
    GENDER: "all",
    FACTOR: "Life expectancy",
    countries: [],
    SHOW_FIG3: false,
    SHOW_FIG2: false,
    min_max: {},
    animation_year: "2000",
    animation_button: true
};


function makeMap(svgEl) {

    ctx.dwScale4color = d3.scaleLinear().domain([ctx.min_max.min_LE, ctx.min_max.max_LE]).range([1, 0]);
    let legendG = svgEl.append("g")
        .attr("id", "colorLegend")
        .attr("opacity", 1)
        .attr("transform", "translate(0,100)");

    ctx.rangeOverAll = [ctx.min_max.min_LE, ctx.min_max.max_LE];
    let range = d3.range(ctx.min_max.min_LE, ctx.min_max.max_LE, (ctx.min_max.max_LE - ctx.min_max.min_LE) / 50).reverse()
    let scale4colorLegend = d3.scaleLinear()
        .domain(ctx.rangeOverAll)
        .rangeRound([250, 0]);

    legendG.selectAll("line")
        .data(range)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("y1", (d, j) => (j * 5))
        .attr("x2", 20)
        .attr("y2", (d, j) => (j * 5))
        .attr("stroke-width", 5)
        .attr("stroke", (d) => d3.interpolateGnBu(ctx.dwScale4color(d)));
    legendG.append("g")
        .attr("transform", `translate(25,-2.5)`)
        .call(d3.axisRight(scale4colorLegend).ticks(5));
    legendG.append("text")
        .attr("x", 0)
        .attr("y", 250 + 12)
        .text(ctx.FACTOR);


    ctx.mapG = svgEl.append("g")
        .attr("id", "map")
        .attr("clip-path", "url(#clip)")
        ;
    // bind and draw geographical features to <path> elements
    addCountries();
    // panning and zooming
    // svgEl.append("rect")
    //      .attr("id", "pz")
    //      .attr("width", MAP_W)
    //      .attr("height", MAP_H)
    //      .style("fill", "none")
    //      .style("pointer-events", "all")
    //      .call(d3.zoom()
    //              .scaleExtent([1, 8])
    //              .on("zoom", zoomed)
    //      );
    function zoomed(event, d) {
        if (ctx.panZoomMode) {
            ctx.mapG.attr("transform", event.transform);
        }
    }
};


function addCountries() {

    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style('background-color', 'Gainsboro')
        .text("a simple tooltip");

    let geoGenrator = d3.geoPath().projection(ctx.currentProj);
    ctx.mapG.selectAll("path.country")
        .data(ctx.countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", geoGenrator)
        .style("fill", d => { if (d.properties["adm0_a3"] == "FRA") { ctx.COUNTRY = d }; return getColor(d) })
        .style("pointer-events", "all")
        .on("mouseover", function (d, i) {
            d3.select(this).style("fill", "red").style("stoke", "black");
            return tooltip.style("visibility", "visible").html("<p>" + d.path[0]["__data__"].properties.formal_en + "<br>" + ctx.FACTOR + ": " + getValue(d.path[0]["__data__"], ctx.YEAR, ctx.FACTOR, ctx.GENDER) + "</p>");
        })
        .on('mousemove', function (d) {
            return tooltip.style('top', (event.pageY - 50) + 'px').style('left', (event.pageX + 50) + 'px');
        })
        .on("mouseout", function () { d3.select(this).style("fill", getColor); return tooltip.style("visibility", "hidden"); })
        .on("click", d => { ctx.COUNTRY = d.path[0]["__data__"]; linePlot(ctx.COUNTRY); ctx.SHOW_FIG2 = true; });
    ;

    linePlot();
};

function getValue(d, YEAR, FACTOR, GENDER) {
    if (GENDER == "all") {
        if (JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[YEAR] && d.properties.data_full.male[YEAR][FACTOR]
            && JSON.stringify(d.properties.data_full.female) != "{}" && d.properties.data_full.female[YEAR] && d.properties.data_full.female[YEAR][FACTOR]) {
            return ((parseFloat(d.properties.data_full["female"][YEAR][FACTOR]) + parseFloat(d.properties.data_full["male"][YEAR][FACTOR])) / 2).toFixed(3);
        }
    } else {
        if (JSON.stringify(d.properties.data_full[GENDER]) != "{}" && d.properties.data_full[GENDER][YEAR] && d.properties.data_full[GENDER][YEAR][FACTOR]) {
            return d.properties.data_full[GENDER][YEAR][FACTOR];
        }
    }
    return "not recorded"
}

function getColor(d) {
    if (ctx.GENDER == "all") {
        if (JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[ctx.YEAR] && d.properties.data_full.male[ctx.YEAR][ctx.FACTOR]
            && JSON.stringify(d.properties.data_full.female) != "{}" && d.properties.data_full.female[ctx.YEAR] && d.properties.data_full.female[ctx.YEAR][ctx.FACTOR]) {
            // console.log(ctx.dwScale4color(parseFloat(d.properties.data_full["female"][ctx.YEAR][ctx.FACTOR])));
            return d3.interpolateGnBu(ctx.dwScale4color((parseFloat(d.properties.data_full["female"][ctx.YEAR][ctx.FACTOR]) + parseFloat(d.properties.data_full["male"][ctx.YEAR][ctx.FACTOR])) / 2));
        }
    } else {
        if (JSON.stringify(d.properties.data_full[ctx.GENDER]) != "{}" && d.properties.data_full[ctx.GENDER][ctx.YEAR] && d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]) {
            return d3.interpolateGnBu(ctx.dwScale4color(d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]));
        }
    }
    return ctx.undefinedColor;
}

function getGlobalView() {
    // ...
    d3.select("#map")
        .transition()
        .duration(ctx.TRANSITION_DURATION)
        .attr("transform", "scale(1,1)");
};


function initializeSelectBox() {
    d3.select("#year")
        .on('change', function () {
            fig1Year(this.value);
            if (!ctx.SHOW_FIG3) {
                // document.getElementById("f3").innerHTML = "";
                // createButton();
                // createViz3();
                // ScattorPlot();
                // ctx.SHOW_FIG3 = true;
            } else {
                ScatterChange();
            }
        });
    d3.select("#gender")
        .on('change', function () {
            fig1Gender(this.value);
            if (ctx.GENDER == 'male') {
                d3.select('#group1')
                    .selectAll('circle')
                    .transition()
                    .duration(1000)
                    .style("fill-opacity", 1)
                d3.select('#group2')
                    .selectAll('circle')
                    .transition()
                    .duration(1000)
                    .style("fill-opacity", 0)
            } else if (ctx.GENDER == 'female') {
                console.log(2)
                d3.select('#group1')
                    .selectAll('circle')
                    .transition()
                    .duration(1000)
                    .style("fill-opacity", 0)
                d3.select('#group2')
                    .selectAll('circle')
                    .transition()
                    .duration(1000)
                    .style("fill-opacity", 1)
            } else {
                d3.select('#group1')
                    .selectAll('circle')
                    .transition()
                    .duration(1000)
                    .style("fill-opacity", 1)
                d3.select('#group2')
                    .selectAll('circle')
                    .transition()
                    .duration(1000)
                    .style("fill-opacity", 1)
            }
            if (ctx.SHOW_FIG2) {
                linePlot();
            }
        });
    d3.select("#factor")
        .on('change', function () {
            fig1Factor(this.value);
            d3.select("#f1")["_groups"][0][0].childNodes[0].data = "World map showing the heatmap of " + ctx.FACTOR;
            if (ctx.SHOW_FIG2) {
                linePlot();
            }
            if (!ctx.SHOW_FIG3) {
                document.getElementById("f3").innerHTML = "";
                createButton()
                d3.select("#f3").append("div").attr("id", "fig3_title").text("A scatter plot of Life Expectancy versus " + ctx.FACTOR);
                createViz3();
                ScattorPlot();
                ctx.SHOW_FIG3 = true;
            } else {
                ScatterChange();
            }
        });
}

/* function to update year */

function fig1Year(year) {
    ctx.YEAR = year;
    updateMap();
}

/* function to update gender */

function fig1Gender(gender) {
    ctx.GENDER = gender;
    updateMap();
}

/* function to update factor */

function fig1Factor(factor) {
    let min = 0;
    let max = 0;
    switch (factor) {
        case "Life expectancy":
            min = ctx.min_max.min_LE;
            max = ctx.min_max.max_LE;
            break;
        case "Unemployment":
            min = ctx.min_max.min_UE;
            max = ctx.min_max.max_UE;
            break;
        case "Infant Mortality":
            min = ctx.min_max.min_IM;
            max = ctx.min_max.max_IM;
            break;
        case "GDP":
            min = ctx.min_max.min_GD;
            max = ctx.min_max.max_GD;
            break;
        case "GNI":
            min = ctx.min_max.min_GN;
            max = ctx.min_max.max_GN;
            break;
        case "Clean fuels and cooking technologies":
            min = ctx.min_max.min_CF;
            max = ctx.min_max.max_CF;
            break;
        case "Per Capita":
            min = ctx.min_max.min_PC;
            max = ctx.min_max.max_PC;
            break;
        case "Mortality caused by road traffic injury":
            min = ctx.min_max.min_MC;
            max = ctx.min_max.max_MC;
            break;
        case "Tuberculosis Incidence":
            min = ctx.min_max.min_TI;
            max = ctx.min_max.max_TI;
            break;
        case "DPT Immunization":
            min = ctx.min_max.min_DP;
            max = ctx.min_max.max_DP;
            break;
        case "HepB3 Immunization":
            min = ctx.min_max.min_HI;
            max = ctx.min_max.max_HI;
            break;
        case "Measles Immunization":
            min = ctx.min_max.min_MI;
            max = ctx.min_max.max_MI;
            break;
        case "Hospital beds":
            min = ctx.min_max.min_HB;
            max = ctx.min_max.max_HB;
            break;
        case "Basic sanitation services":
            min = ctx.min_max.min_BS;
            max = ctx.min_max.max_BS;
            break;
        case "Tuberculosis treatment":
            min = ctx.min_max.min_TT;
            max = ctx.min_max.max_TT;
            break;
        case "Urban population":
            min = ctx.min_max.min_UP;
            max = ctx.min_max.max_UP;
            break;
        case "Rural population":
            min = ctx.min_max.min_RP;
            max = ctx.min_max.max_RP;
            break;
        case "Non-communicable Mortality":
            min = ctx.min_max.min_NC;
            max = ctx.min_max.max_NC;
            break;
        case "Sucide Rate":
            min = ctx.min_max.min_SR;
            max = ctx.min_max.max_SR;
            break;
    }
    if (factor == "GDP" || factor == "GNI") {
        ctx.dwScale4color = d3.scaleLog().domain([min, max]).range([1, 0]);
        ctx.fig3_scaler = d3.scaleLog().domain([min, max]).range([0, dimensions.boundedWidth]);
    } else {
        ctx.dwScale4color = d3.scaleLinear().domain([min, max]).range([1, 0]);
        ctx.fig3_scaler = d3.scaleLinear().domain([min, max]).range([0, dimensions.boundedWidth]);
    }
    ctx.rangeOverAll = [min, max];
    ctx.FACTOR = factor;
    updateMap();
}

/* function to update the map */

function updateMap() {
    let scale4colorLegend = d3.scaleLinear()
        .domain(ctx.rangeOverAll)
        .rangeRound([250, 0]);
    if (ctx.FACTOR == "GDP" || ctx.FACTOR == "GNI") {
        scale4colorLegend = d3.scaleLog()
            .domain(ctx.rangeOverAll)
            .rangeRound([250, 0]);
    }
    d3.select("#colorLegend>g")
        .transition()
        .duration(500)
        .attr("transform", `translate(25,-2.5)`)
        .call(d3.axisRight(scale4colorLegend).ticks(5));
    d3.select("#colorLegend>text")
        .transition()
        .duration(500)
        .attr("x", 0)
        .attr("y", 250 + 12)
        .text(ctx.FACTOR);

    ctx.mapG.selectAll("path.country")
        .transition()
        .duration(500)
        .style("fill", function (d) {
            if (ctx.GENDER == "all") {
                if (JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[ctx.YEAR] && d.properties.data_full.male[ctx.YEAR][ctx.FACTOR]
                    && JSON.stringify(d.properties.data_full.female) != "{}" && d.properties.data_full.female[ctx.YEAR] && d.properties.data_full.female[ctx.YEAR][ctx.FACTOR]) {
                    return d3.interpolateGnBu(ctx.dwScale4color((parseFloat(d.properties.data_full["female"][ctx.YEAR][ctx.FACTOR]) + parseFloat(d.properties.data_full["male"][ctx.YEAR][ctx.FACTOR])) / 2));
                }
            } else {
                if (JSON.stringify(d.properties.data_full[ctx.GENDER]) != "{}" && d.properties.data_full[ctx.GENDER][ctx.YEAR] && d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]) {
                    return d3.interpolateGnBu(ctx.dwScale4color(d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]));
                }
            }
            return ctx.undefinedColor;
        })
}

/* function to create load data */

function loadData(svgEl) {

    getDataRange();
    initializeSelectBox();
    promise1 = d3.json("custom.geo.json");
    promise2 = d3.csv("who_life_expectancy_all.csv");

    Promise.all([promise1, promise2])
        .then(function (data) {
            let temp = {};
            data[0].features.forEach(
                function (d) {
                    male = {};
                    female = {};
                    for (i = 0; i < data[1].length; i++) {
                        if (data[1][i].Code === d.properties["iso_a3_eh"]) {
                            let year = data[1][i].Year;
                            if (data[1][i].Gender == "Male") {
                                male[year] = data[1][i];
                            } else {
                                female[year] = data[1][i];
                            }
                        }
                    }
                    d.properties['data_full'] = { male: male, female: female, };
                }
            )
            ctx.countries = data[0];
            makeMap(svgEl);
            fig1Factor("Life expectancy");
        });
};

/* function to count the range of data of each factor */

function getDataRange(data) {
    d3.csv("who_life_expectancy_all.csv").then(function (data) {
        var min_LE = d3.min(data, d => parseFloat(d["Life expectancy"]));
        var max_LE = d3.max(data, d => parseFloat(d["Life expectancy"]));
        var min_UE = d3.min(data, d => parseFloat(d["Unemployment"]));
        var max_UE = d3.max(data, d => parseFloat(d["Unemployment"]));
        var min_IM = d3.min(data, d => parseFloat(d["Infant Mortality"]));;
        var max_IM = d3.max(data, d => parseFloat(d["Infant Mortality"]));;
        var min_GD = d3.min(data, d => parseFloat(d["GDP"]));
        var max_GD = d3.max(data, d => parseFloat(d["GDP"]));
        var min_GN = d3.min(data, d => parseFloat(d["GNI"]));
        var max_GN = d3.max(data, d => parseFloat(d["GNI"]));
        var min_CF = d3.min(data, d => parseFloat(d["Clean fuels and cooking technologies"]));
        var max_CF = d3.max(data, d => parseFloat(d["Clean fuels and cooking technologies"]));
        var min_PC = d3.min(data, d => parseFloat(d["Per Capita"]));
        var max_PC = d3.max(data, d => parseFloat(d["Per Capita"]));
        var min_MC = d3.min(data, d => parseFloat(d["Mortality caused by road traffic injury"]));
        var max_MC = d3.max(data, d => parseFloat(d["Mortality caused by road traffic injury"]));
        var min_TI = d3.min(data, d => parseFloat(d["Tuberculosis Incidence"]));
        var max_TI = d3.max(data, d => parseFloat(d["Tuberculosis Incidence"]));
        var min_DP = d3.min(data, d => parseFloat(d["DPT Immunization"]));
        var max_DP = d3.max(data, d => parseFloat(d["DPT Immunization"]));
        var min_HI = d3.min(data, d => parseFloat(d["HepB3 Immunization"]));
        var max_HI = d3.max(data, d => parseFloat(d["HepB3 Immunization"]));
        var min_MI = d3.min(data, d => parseFloat(d["Measles Immunization"]));
        var max_MI = d3.max(data, d => parseFloat(d["Measles Immunization"]));
        var min_HB = d3.min(data, d => parseFloat(d["Hospital beds"]));
        var max_HB = d3.max(data, d => parseFloat(d["Hospital beds"]));
        var min_BS = d3.min(data, d => parseFloat(d["Basic sanitation services"]));
        var max_BS = d3.max(data, d => parseFloat(d["Basic sanitation services"]));
        var min_TT = d3.min(data, d => parseFloat(d["Tuberculosis treatment"]));
        var max_TT = d3.max(data, d => parseFloat(d["Tuberculosis treatment"]));
        var min_UP = d3.min(data, d => parseFloat(d["Urban population"]));
        var max_UP = d3.max(data, d => parseFloat(d["Urban population"]));
        var min_RP = d3.min(data, d => parseFloat(d["Rural population"]));
        var max_RP = d3.max(data, d => parseFloat(d["Rural population"]));
        var min_NC = d3.min(data, d => parseFloat(d["Non-communicable Mortality"]));
        var max_NC = d3.max(data, d => parseFloat(d["Non-communicable Mortality"]));
        var min_SR = d3.min(data, d => parseFloat(d["Sucide Rate"]));
        var max_SR = d3.max(data, d => parseFloat(d["Sucide Rate"]));
        ctx.min_max = {
            min_LE: min_LE,
            max_LE: max_LE,
            min_UE: min_UE,
            max_UE: max_UE,
            min_IM: min_IM,
            max_IM: max_IM,
            min_GD: min_GD,
            max_GD: max_GD,
            min_GN: min_GN,
            max_GN: max_GN,
            min_CF: min_CF,
            max_CF: max_CF,
            min_PC: min_PC,
            max_PC: max_PC,
            min_MC: min_MC,
            max_MC: max_MC,
            min_TI: min_TI,
            max_TI: max_TI,
            min_DP: min_DP,
            max_DP: max_DP,
            min_HI: min_HI,
            max_HI: max_HI,
            min_MI: min_MI,
            max_MI: max_MI,
            min_HB: min_HB,
            max_HB: max_HB,
            min_BS: min_BS,
            max_BS: max_BS,
            min_TT: min_TT,
            max_TT: max_TT,
            min_UP: min_UP,
            max_UP: max_UP,
            min_RP: min_RP,
            max_RP: max_RP,
            min_NC: min_NC,
            max_NC: max_NC,
            min_SR: min_SR,
            max_SR: max_SR,
        }
    }
    )
}


/*=================================for fig 2 now==================================*/
/* function to create initialization of the fig2 canvas */

function createViz2() {
    let svgE2 = d3.select("#f2").append("svg");
    svgE2.attr("width", MAP_W);
    svgE2.attr("height", MAP_H);
    ctx.myChart = echarts.init(document.getElementById('f2'));
}

/* function to draw and update the line plot in fig2, using echart */

function linePlot() {
    d = ctx.COUNTRY
    d3.select("#fig2_title")["_groups"][0][0].childNodes[0].data = "A line chart showing the trend of " + ctx.FACTOR+" and Year (2000 - 2019)";
    d3.csv("who_life_expectancy_all.csv").then(function (da) {
        if (ctx.FACTOR == "Life expectancy") {
            data = da;
            var colors = ['#7ab8cc', '#ff0000', '#808080'];
            var option = {
                color: colors,

                dataset: [
                    {
                        id: 'dataset_raw',
                        source: data
                    },
                    {
                        id: 'male',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Male' }
                                ]
                            }
                        }
                    },
                    {
                        id: 'female',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Female' }
                                ]
                            }
                        }
                    },
                ],

                title: {
                    text: d.properties.name,
                },
                legend: {
                    data: ['male', 'female'],
                    top: "6%"
                },
                xAxis: {
                    type: 'category',
                    nameLocation: 'middle'
                },

                yAxis: [
                    {
                        position: 'left',
                        type: 'category',
                        name: 'Life expectancy',
                        axisLine: {
                            lineStyle: {
                                type: 'dotted'
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                ],
                toolbox: {
                    show: true,
                    feature: {
                        magicType: { show: true, type: ['line', 'bar'] },
                    },

                },
                series: [
                    {
                        name: 'male',
                        datasetId: 'male',
                        type: 'line',
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                    {
                        name: 'female',
                        datasetId: 'female',
                        type: 'line',
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                ]
            };
        }
        else if (ctx.GENDER == 'all') {
            data = da;
            var colors = ['#7ab8cc', '#ff0000', '#808080'];
            var option = {
                color: colors,

                dataset: [
                    {
                        id: 'dataset_raw',
                        source: data
                    },
                    {
                        id: 'male',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Male' }
                                ]
                            }
                        }
                    },
                    {
                        id: 'female',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Female' }
                                ]
                            }
                        }
                    },
                ],

                title: {
                    text: d.properties.name
                },
                legend: {
                    data: ['male', 'female', ctx.FACTOR],
                    top: "6%"
                },
                xAxis: {
                    type: 'category',
                    nameLocation: 'middle'
                },

                yAxis: [
                    {
                        position: 'left',
                        type: 'category',
                        name: 'Life expectancy',
                        axisLine: {
                            lineStyle: {
                                type: 'dotted'
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        position: 'right',
                        type: 'value',
                        name: ctx.FACTOR,
                        axisLine: {
                            lineStyle: {
                                type: 'dotted'
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                ],
                toolbox: {
                    show: true,
                    feature: {
                        magicType: { show: true, type: ['line', 'bar'] },
                    },

                },
                series: [
                    {
                        name: 'male',
                        datasetId: 'male',
                        type: 'line',
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                    {
                        name: 'female',
                        datasetId: 'female',
                        type: 'line',
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                    {
                        name: ctx.FACTOR,
                        datasetId: 'female',
                        type: 'line',
                        yAxisIndex: '1',
                        encode: {
                            x: 'Year',
                            y: ctx.FACTOR
                        }
                    },
                ]
            };
        } else if (ctx.GENDER == "female") {
            data = da;
            var colors = ['#7ab8cc', '#ff0000', '#808080'];
            var option = {
                color: colors,

                dataset: [
                    {
                        id: 'dataset_raw',
                        source: data
                    },
                    {
                        id: 'male',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Male' }
                                ]
                            }
                        }
                    },
                    {
                        id: 'female',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Female' }
                                ]
                            }
                        }
                    },
                ],

                title: {
                    text: d.properties.name
                },
                legend: {
                    data: ['male', 'female', ctx.FACTOR],
                    top: "6%"
                },
                xAxis: {
                    type: 'category',
                    nameLocation: 'middle'
                },

                yAxis: [
                    {
                        position: 'left',
                        type: 'category',
                        name: 'Life expectancy',
                        axisLine: {
                            lineStyle: {
                                type: 'dotted'
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        position: 'right',
                        type: 'value',
                        name: ctx.FACTOR,
                        axisLine: {
                            lineStyle: {
                                type: 'dotted'
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                ],
                toolbox: {
                    show: true,
                    feature: {
                        magicType: { show: true, type: ['line', 'bar'] },
                    },

                },
                series: [
                    {
                        name: 'male',
                        datasetId: 'male',
                        type: 'line',
                        symbolSize: 0,
                        showSymbol: false,
                        lineStyle: {
                            width: 0, 
                        },
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                    {
                        name: 'female',
                        datasetId: 'female',
                        type: 'line',
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                    {
                        name: ctx.FACTOR,
                        datasetId: 'female',
                        type: 'line',
                        yAxisIndex: '1',
                        encode: {
                            x: 'Year',
                            y: ctx.FACTOR
                        }
                    },
                ]
            };
        } else if (ctx.GENDER == "male") {
            data = da;
            var colors = ['#7ab8cc', '#ff0000', '#808080'];
            var option = {
                color: colors,

                dataset: [
                    {
                        id: 'dataset_raw',
                        source: data
                    },
                    {
                        id: 'male',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Male' }
                                ]
                            }
                        }
                    },
                    {
                        id: 'female',
                        fromDatasetId: 'dataset_raw',
                        transform: {
                            type: 'filter',
                            config: {
                                and: [
                                    { dimension: 'Code', '=': d.properties.iso_a3_eh },
                                    { dimension: 'Gender', '=': 'Female' }
                                ]
                            }
                        }
                    },
                ],

                title: {
                    text: d.properties.name
                },
                legend: {
                    data: ['male', 'female', ctx.FACTOR],
                    top: "6%"
                },
                xAxis: {
                    type: 'category',
                    nameLocation: 'middle'
                },

                yAxis: [
                    {
                        position: 'left',
                        type: 'category',
                        name: 'Life expectancy',
                        axisLine: {
                            lineStyle: {
                                type: 'dotted'
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        position: 'right',
                        type: 'value',
                        name: ctx.FACTOR,
                        axisLine: {
                            lineStyle: {
                                type: 'dotted'
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                ],
                toolbox: {
                    show: true,
                    feature: {
                        magicType: { show: true, type: ['line', 'bar'] },
                    },

                },
                series: [
                    {
                        name: 'male',
                        datasetId: 'male',
                        type: 'line',
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                    {
                        name: 'female',
                        datasetId: 'female',
                        type: 'line',
                        symbolSize: 0,
                        showSymbol: false,
                        lineStyle: {
                            width: 0,
                            color: 'rgba(0, 0, 0, 0)'
                        },
                        label: {
                            normal: {
                                show: true,
                                position: 'top'
                            }
                        },
                        yAxisIndex: '0',
                        encode: {
                            x: 'Year',
                            y: 'Life expectancy'
                        }
                    },
                    {
                        name: ctx.FACTOR,
                        datasetId: 'female',
                        name: ctx.FACTOR,
                        datasetId: 'female',
                        type: 'line',
                        // label: {
                        //     normal: {
                        //         show: true,
                        //         position: 'top'
                        //     }
                        // },
                        yAxisIndex: '1',
                        encode: {
                            x: 'Year',
                            y: ctx.FACTOR
                        }
                    },
                ]
            };
        }

        ctx.myChart.setOption(option, true);

    })
}


/*=================================for fig 3 now==================================*/
/* function to create initialization of the fig3 canvas */

function createViz3() {
    let svgE3 = d3.select("#f3").append("svg");
    svgE3.attr("width", MAP_W);
    svgE3.attr("height", MAP_H).attr('viewBox', dimensions.viewBox);
    ctx.bounds = svgE3.append('g').style('transform', `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`);
    ctx.bounds.append('g').attr('class', 'scatter-wapper').attr("id", "group1");
    ctx.bounds.append('g').attr('class', 'scatter-wapper').attr("id", "group2");
}



/* function to update the fig3 scatterplot */

function ScatterChange() {

    d3.select("#fig3_title").text("A scatter plot of Life Expectanct versus " + ctx.FACTOR);
    xAxisGenerator = d3.axisBottom(ctx.fig3_scaler);
    ctx.bounds
        .select('#group1')
        .selectAll('circle')
        .transition()
        .duration(1000)
        .attr('cx', function (d) {
            // console.log(d)
            return ctx.fig3_scaler(getValue(d, ctx.YEAR, ctx.FACTOR, 'male'));
        })
        .attr('cy', function (d) {
            return ctx.y_scaler(getValue(d, ctx.YEAR, 'Life expectancy', 'male'));
        })
        .attr('r', 2).attr('fill', '#87cefa');
    ctx.bounds
        .select('#group2')
        .selectAll('circle')
        .transition()
        .duration(1000)
        .attr('cx', function (d) {
            // console.log(d)
            return ctx.fig3_scaler(getValue(d, ctx.YEAR, ctx.FACTOR, 'female'));
        })
        .attr('cy', function (d) {
            return ctx.y_scaler(getValue(d, ctx.YEAR, 'Life expectancy', 'female'));
        })
        .attr('r', 2).attr('fill', '#eaa9ac');
    ctx.xAxis
        .call(xAxisGenerator)
        .style('transform', `translate(0,${dimensions.boundedHeight}px)`)
        .select('text')
        .attr('x', dimensions.boundedWidth / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .style('font-size', '1em')
        .text(ctx.FACTOR)

    d3.select("#yearname")
        .text(ctx.YEAR)
}



/* functions to initialize the fig3 scatterplot */

function ScattorPlot() {

    if (ctx.FACTOR == 'Life expectancy') {
        return;
    }
    x_scaler = ctx.fig3_scaler;
    ctx.y_scaler = d3.scaleLinear().domain([30, ctx.min_max.max_LE]).range([dimensions.boundedHeight, 0]);

    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style('background-color', 'Gainsboro')
        .text("a simple tooltip");


    let colorGender = ctx.bounds.append('g')
        .attr("id", "colorGender")
        .attr("opacity", 1)
    colorGender.append("rect").attr("transform", "translate(525, 0)").attr("width", 40).attr("height", 15).attr("fill", "#A5C3D57E").attr("opacity", 0.5).attr("stroke", "black");
    colorGender.append("text").attr("id", "yearname").attr("transform", "translate(532, 10)").text(ctx.YEAR).attr("fill", "black").attr("font-size", 10);
    colorGender.append("rect").attr("transform", "translate(520, 20)").attr("width", 8).attr("height", 8).attr("fill", '#87cefa');
    colorGender.append("text").attr("transform", "translate(535, 26)").text("male").attr("fill", "black").attr("font-size", 8);
    colorGender.append("rect").attr("transform", "translate(520, 30)").attr("width", 8).attr("height", 8).attr("fill", '#eaa9ac');
    colorGender.append("text").attr("transform", "translate(535, 36)").text("female").attr("fill", "black").attr("font-size", 8);

    let scatterGroups = ctx.bounds
        .select('#group1')
        .selectAll('.scatter')
        .data(ctx.countries.features)
        .enter()
        .append('g').attr('class', 'scatter')
        .append('circle')
        .attr('cx', function (d) {
            return x_scaler(getValue(d, ctx.YEAR, ctx.FACTOR, 'male'));
        })
        .attr('cy', function (d) {
            return ctx.y_scaler(getValue(d, ctx.YEAR, 'Life expectancy', 'male'));
        })
        .attr('r', 2).attr('fill', '#87cefa')
        .on("mouseover", function (d, i) {
            d3.select(this).attr("r", 5).style("stoke", "black");
            return tooltip.style("visibility", "visible").html("<p>" + d.path[0]["__data__"].properties.formal_en + "<br>" + ctx.FACTOR + ": " + getValue(d.path[0]["__data__"], ctx.YEAR, ctx.FACTOR, ctx.GENDER) + "</p>");
        })
        .on('mousemove', function (d) {
            return tooltip.style('top', (event.pageY - 50) + 'px').style('left', (event.pageX + 50) + 'px');
        })
        .on("mouseout", function () { d3.select(this).attr("r", 2); return tooltip.style("visibility", "hidden"); })
        .on("click", d => { ctx.COUNTRY = d.path[0]["__data__"]; linePlot(ctx.COUNTRY); ctx.SHOW_FIG2 = true; });

    let scatterGroups2 =
        ctx.bounds
            .select('#group2')
            .selectAll('.scatter')
            .data(ctx.countries.features)
            .enter()
            .append('g').attr('class', 'scatter')
            .append('circle')
            .attr('cx', function (d) {
                return x_scaler(getValue(d, ctx.YEAR, ctx.FACTOR, 'female'));
            })
            .attr('cy', function (d) {
                return ctx.y_scaler(getValue(d, ctx.YEAR, 'Life expectancy', 'female'));
            })
            .attr('r', 2).attr('fill', '#eaa9ac')
            .on("mouseover", function (d, i) {
                d3.select(this).attr("r", 5).style("stoke", "black");
                return tooltip.style("visibility", "visible").html("<p>" + d.path[0]["__data__"].properties.formal_en + "<br>" + ctx.FACTOR + ": " + getValue(d.path[0]["__data__"], ctx.YEAR, ctx.FACTOR, ctx.GENDER) + "</p>");
            })
            .on('mousemove', function (d) {
                return tooltip.style('top', (event.pageY - 50) + 'px').style('left', (event.pageX + 50) + 'px');
            })
            .on("mouseout", function () { d3.select(this).attr("r", 2); return tooltip.style("visibility", "hidden"); })
            .on("click", d => { ctx.COUNTRY = d.path[0]["__data__"]; console.log(d); linePlot(ctx.COUNTRY); ctx.SHOW_FIG2 = true; });

    ctx.xAxis = ctx.bounds.append('g')
    ctx.xAxis.append('text')
    ctx.yAxis = ctx.bounds.append('g')
    ctx.yAxis.append('text')
    if (ctx.FACTOR == "GDP" || ctx.FACTOR == "GNI") {
        xAxisGenerator = d3.axisBottom(ctx.fig3_scaler)
    } else {
        xAxisGenerator = d3.axisBottom(ctx.fig3_scaler);
    }
    ctx.xAxis
        .call(xAxisGenerator)
        .style('transform', `translate(0,${dimensions.boundedHeight}px)`)
        .attr('stoke', 'grey')
        .select('text')
        .attr('x', dimensions.boundedWidth / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .style('font-size', '  1em')
        .text(ctx.FACTOR)
    const yAxisGenerator = d3.axisLeft(ctx.y_scaler).tickSize(-dimensions.boundedWidth)

    ctx.yAxis
        .call(yAxisGenerator)
        .call(g => g.select(".domain")
            .remove())
        .call(g => g.selectAll(".tick:not(:first-of-type) line")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "2,2"))

    d3.select("#f3").select("svg").append("g")
        .append("text")
        .attr("y", 0)
        .attr("x", 0)
        .attr("transform", `rotate(-90) translate(-180,-10)`)
        .attr('font-size', '0.6em')
        .text("Life Expectancy");



}

/* functions to realize fig3 animation */

function animation() {
    if (ctx.animation_button) {
        console.log(1)
        ctx.animation_year = ctx.YEAR;
        ctx.animation = setInterval(function () {
            if (ctx.YEAR == 2019) {
                ctx.YEAR = 2000
            }
            ctx.YEAR = parseInt(ctx.YEAR) + 1;
            ScatterChange();
        }
            , 1000)
        ctx.animation_button = false;
    } else {
        ctx.YEAR = ctx.animation_year
        clearInterval(ctx.animation);
        ScatterChange();
        ctx.animation_button = true
    }
}


/* Function to dynamically add the animate button on the Figure 3 Scare Plot*/

function createButton() {
    let btn = document.createElement("button");
    btn.innerHTML = "Animate";
    btn.id = "btn";
    btn.onclick = animation;
    document.getElementById("f3").appendChild(btn);
}




/*Visualization Loader Starts Here*/

function createViz() {
    console.log("Using D3 v" + d3.version);
    Object.keys(PROJECTIONS).forEach(function (k) {
        PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
    });
    let svgEl = d3.select("#f1").append("svg");
    svgEl.attr("width", MAP_W);
    svgEl.attr("height", MAP_H);
    loadData(svgEl);
    createNodes();
    loadContinents();
    createViz2();
    if (ctx.SHOW_FIG3) {
        createViz3();
    } else {
        createVizf32()
    }
};

/*Visualization Loader Ends Here*/