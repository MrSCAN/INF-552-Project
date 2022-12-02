const MAP_W = 0.5 * window.innerWidth;
const MAP_H = 0.5 * window.innerHeight;


// for figure 3
const dimensions = {
    viewBox: '0, 0, 600,300',
    margin: {
        top: 10,
        right: 10,
        bottom: 50,
        left: 50,
    },
    boundedWidth: 540,
    boundedHeight: 240,
}


const PROJECTIONS = {
    ER: d3.geoEquirectangular().scale(MAP_H/ Math.PI),
    IM: d3.geoInterrupt(d3.geoMollweideRaw,
        [[ // northern hemisphere
            [[-180, 0], [-100, 90], [-40, 0]],
            [[-40, 0], [30, 90], [180, 0]]
        ], [ // southern hemisphere
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
    YEAR: "2015",
    panZoomMode: true,
    TRANSITION_DURATION: 3000,
    GENDER: "all",
    FACTOR: "Life expectancy",
    countries: [],
    SHOW_FIG3: false,
    SHOW_FIG2: false,
    min_max: {},
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
        .style("fill", d => { return getColor(d)})
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

function createViz() {
    console.log("Using D3 v" + d3.version);
    Object.keys(PROJECTIONS).forEach(function (k) {
        PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
    });
    let svgEl = d3.select("#f1").append("svg");
    svgEl.attr("width", MAP_W);
    svgEl.attr("height", MAP_H);
    createViz2();
    createViz3()
    loadData(svgEl);
};


function initializeSelectBox() {
    d3.select("#year")
        .on('change', function () {
            fig1Year(this.value);
            if (!ctx.SHOW_FIG3) {
                ScattorPlot();
                ctx.SHOW_FIG3 = true;
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
                    .duration(500)
                    .style("fill-opacity", 0)
                d3.select('#group2')
                    .selectAll('circle')
                    .transition()
                    .duration(500)
                    .style("fill-opacity", 1)
            } else if (ctx.GENDER == 'female') {
                d3.select('#group1')
                    .selectAll('circle')
                    .transition()
                    .duration(500)
                    .style("fill-opacity", 1)
                d3.select('#group2')
                    .selectAll('circle')
                    .transition()
                    .duration(500)
                    .style("fill-opacity", 0)
            } else {
                d3.select('#group1')
                    .selectAll('circle')
                    .transition()
                    .duration(500)
                    .style("fill-opacity", 1)
                d3.select('#group2')
                    .selectAll('circle')
                    .transition()
                    .duration(500)
                    .style("fill-opacity", 1)
            }
            if(ctx.SHOW_FIG2){
                linePlot();
            }
        });
    d3.select("#factor")
        .on('change', function () {
            fig1Factor(this.value);
            if(ctx.SHOW_FIG2){
                linePlot();
            }
            if (!ctx.SHOW_FIG3) {
                ScattorPlot();
                ctx.SHOW_FIG3 = true;
            } else {
                ScatterChange();
            }
        });
}


function fig1Year(year) {
    ctx.YEAR = year;
    updateMap();
}

function fig1Gender(gender) {
    ctx.GENDER = gender;
    updateMap();
}

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
    ctx.dwScale4color = d3.scaleLinear().domain([min, max]).range([1, 0]);
    ctx.fig3_scaler = d3.scaleLinear().domain([min, max]).range([0, dimensions.boundedWidth]);
    ctx.rangeOverAll = [min, max];
    ctx.FACTOR = factor;
    updateMap();
}

function updateMap() {
    let scale4colorLegend = d3.scaleLinear()
        .domain(ctx.rangeOverAll)
        .rangeRound([250, 0]);
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

// below for line chart
// stop
// stop
// stop
// stop
// stop
// stop
// stop
// stop
// stop
// stop
// stop


function createViz2() {
    let svgE2 = d3.select("#f2").append("svg");
    svgE2.attr("width", MAP_W);
    svgE2.attr("height", MAP_H);
    ctx.myChart = echarts.init(document.getElementById('f2'));
}


function linePlot() {
    d = ctx.COUNTRY
    // ctx.myChart.clear();
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
                    text: d.properties.name
                },
                legend: {
                    data: ['male', 'female'],
                },
                tooltip: {
                    trigger: 'item',
                    axisPointer: {
                        type: 'cross',
                        axis: 'auto',
                        snap: true,
                    },
                    showContent: false
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
                },
                tooltip: {
                    trigger: 'item',
                    axisPointer: {
                        type: 'cross',
                        axis: 'auto',
                        snap: true,
                    },
                    showContent: false
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
                        type: 'bar',
                        barMaxWidth: '20%',
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
                },
                tooltip: {
                    trigger: 'item',
                    axisPointer: {
                        type: 'cross',
                        axis: 'auto',
                        snap: true,
                    },
                    showContent: false
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
                        symbolSize: 0, // symbol的大小设置为0让线的小圆点不显示
                        showSymbol: false, // 不显示symbol不显示
                        lineStyle: {
                            width: 0, // 线宽是0不显示线
                            color: 'rgba(0, 0, 0, 0)' // 线的颜色是透明的
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
                        type: 'bar',
                        barMaxWidth: '20%',
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
                },
                tooltip: {
                    trigger: 'item',
                    axisPointer: {
                        type: 'cross',
                        axis: 'auto',
                        snap: true,
                    },
                    showContent: false
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
                        type: 'bar',
                        barMaxWidth: '20%',
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



//scatter plot
//stop
//stop
//stop
//stop
//stop
//stop
//stop
//stop
//stop
//stop
//stop
function createViz3() {
    let svgE3 = d3.select("#f3").append("svg");
    svgE3.attr("width", MAP_W);
    svgE3.attr("height", MAP_H).attr('viewBox', dimensions.viewBox);
    ctx.bounds = svgE3.append('g').style('transform', `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`);
    ctx.bounds.append('g').attr('class', 'scatter-wapper').attr("id", "group1");
    ctx.bounds.append('g').attr('class', 'scatter-wapper').attr("id", "group2");
}


function ScatterChange() {
    if (ctx.FACTOR == "GDP" || ctx.FACTOR == "GNI") {
        xAxisGenerator = d3.axisBottom(ctx.fig3_scaler).ticks(4);
    } else {
        xAxisGenerator = d3.axisBottom(ctx.fig3_scaler);
    }
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
        .attr('r', 1).attr('fill', 'blue');
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
        .attr('r', 1).attr('fill', 'red');
    ctx.xAxis
        .call(xAxisGenerator)
        .style('transform', `translate(0,${dimensions.boundedHeight}px)`)
        .select('text')
        .attr('x', dimensions.boundedWidth / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .style('font-size', '1.4em')
        .text(ctx.FACTOR)
}



function ScattorPlot() {
    // if(ctx.FACTOR == 'Life expectancy'){
    //     return;
    // }
    x_scaler = ctx.fig3_scaler;
    ctx.y_scaler = d3.scaleLinear().domain([ctx.min_max.min_LE, ctx.min_max.max_LE]).range([dimensions.boundedHeight, 0]);

    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style('background-color', 'Gainsboro')
        .text("a simple tooltip");

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
        .attr('r', 1).attr('fill', 'blue')
        .on("mouseover", function (d, i) {
            d3.select(this).attr("r", 5).style("stoke", "black");
            return tooltip.style("visibility", "visible").html("<p>" + d.path[0]["__data__"].properties.formal_en + "<br>" + ctx.FACTOR + ": " + getValue(d.path[0]["__data__"], ctx.YEAR, ctx.FACTOR, ctx.GENDER) + "</p>");
        })
        .on('mousemove', function (d) {
            return tooltip.style('top', (event.pageY - 50) + 'px').style('left', (event.pageX + 50) + 'px');
        })
        .on("mouseout", function () { d3.select(this).attr("r", 1); return tooltip.style("visibility", "hidden"); })
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
            .attr('r', 1).attr('fill', 'red')
            .on("mouseover", function (d, i) {
                d3.select(this).attr("r", 5).style("stoke", "black");
                return tooltip.style("visibility", "visible").html("<p>" + d.path[0]["__data__"].properties.formal_en + "<br>" + ctx.FACTOR + ": " + getValue(d.path[0]["__data__"], ctx.YEAR, ctx.FACTOR, ctx.GENDER) + "</p>");
            })
            .on('mousemove', function (d) {
                return tooltip.style('top', (event.pageY - 50) + 'px').style('left', (event.pageX + 50) + 'px');
            })
            .on("mouseout", function () { d3.select(this).attr("r", 1); return tooltip.style("visibility", "hidden"); })
            .on("click", d => { ctx.COUNTRY = d.path[0]["__data__"]; linePlot(ctx.COUNTRY); ctx.SHOW_FIG2 = true; });

    ctx.xAxis = ctx.bounds.append('g')
    ctx.xAxis.append('text')
    ctx.yAxis = ctx.bounds.append('g')
    ctx.yAxis.append('text')
    if (ctx.FACTOR == "GDP" || ctx.FACTOR == "GNI") {
        xAxisGenerator = d3.axisBottom(ctx.fig3_scaler).ticks(4);
    } else {
        xAxisGenerator = d3.axisBottom(ctx.fig3_scaler);
    }
    ctx.xAxis
        .call(xAxisGenerator)
        .style('transform', `translate(0,${dimensions.boundedHeight}px)`)
        .select('text')
        .attr('x', dimensions.boundedWidth / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('fill', 'black')
        .style('font-size', '1.4em')
        .text(ctx.FACTOR)
    const yAxisGenerator = d3.axisLeft(ctx.y_scaler).ticks(4)
    ctx.yAxis
        .call(yAxisGenerator)
        .select('text')
        .attr('x', -dimensions.boundedHeight / 2)
        .attr('y', -dimensions.margin.left + 10)
        .attr('fill', 'black')
        .style('font-size', '1.4em')
        .text('Life Expectancy')
        .style('transform', 'rotate(-90deg)')
        .style('text-anchor', 'middle')

    // ctx.myChart2 = echarts.init(document.getElementById('f3'));
    // d3.csv("who_life_expectancy_all.csv").then(function (da) {
    //     data = da;
    //     var colors = ['#0000ff', '#ff0000', '#808080'];
    //     var option = {
    //         color: colors,
    //         tooltip: {
    //             trigger: 'axis',
    //             axisPointer: {
    //                 type: 'cross'
    //             }
    //         },
    //         title: {
    //             text: 'All coutries Life Expectancy versus' + ctx.FACTOR,
    //             left: 'center',
    //             top: 16
    //         },
    //         dataset: [
    //             {
    //                 id: 'dataset_raw',
    //                 source: data
    //             },
    //             {
    //                 id: 'male',
    //                 fromDatasetId: 'dataset_raw',
    //                 transform: {
    //                     type: 'filter',
    //                     config: {
    //                         and: [
    //                             { dimension: 'Year', '=': ctx.YEAR },
    //                             { dimension: 'Gender', '=': 'Male' }
    //                         ]
    //                     }
    //                 }
    //             },
    //         ],
    //         legend: {
    //             data: ['male', 'female'],
    //         },
    //         xAxis: {
    //             splitLine: {
    //                 lineStyle: {
    //                     type: 'dashed'
    //                 }
    //             },
    //         },

    //         yAxis: {
    //             min: 30,
    //             splitLine: {
    //                 lineStyle: {
    //                     type: 'dashed'
    //                 }
    //             }
    //         },
    //         series:
    //         {
    //             name: 'male',
    //             datasetId: 'male',
    //             type: 'scatter',
    //             symbolSize: 3,
    //             symbol: 'circle',
    //             label: {
    //                 normal: {
    //                     position: 'top'
    //                 }
    //             },
    //             yAxisIndex: '0',
    //             encode: {
    //                 x: ctx.FACTOR,
    //                 y: 'Life expectancy'
    //             }
    //         },
    //     };
    //     ctx.myChart2.setOption(option, true);
    // })


};


// function show_animation() {
//     if (ctx.FACTOR == "GDP" || ctx.FACTOR == "GNI") {
//         xAxisGenerator = d3.axisBottom(ctx.fig3_scaler).ticks(4);
//     } else {
//         xAxisGenerator = d3.axisBottom(ctx.fig3_scaler);
//     }
//     console.log(i)
//     console.log(ctx.YEAR)
//     console.log(i == ctx.YEAR)
//     ctx.bounds
//         .select('#group1')
//         .selectAll('circle')
//         .transition()
//         .duration(1000)(o)
//         .attr('cx', function (d) {
//             return ctx.fig3_scaler(getValue(d, i, ctx.FACTOR, 'male'));
//         })
//         .attr('cy', function (d) {
//             return ctx.y_scaler(getValue(d, i, 'Life expectancy', 'male'));
//         })
//         .attr('r', 1).attr('fill', 'blue');
//     ctx.bounds
//         .select('#group2')
//         .selectAll('circle')
//         .transition()
//         .duration(1000)
//         .attr('cx', function (d) {
//             // console.log(d)
//             return ctx.fig3_scaler(getValue(d, i, ctx.FACTOR, 'female'));
//         })
//         .attr('cy', function (d) {
//             return ctx.y_scaler(getValue(d, i, 'Life expectancy', 'female'));
//         })
//         .attr('r', 1).attr('fill', 'red');
// }

function animation(){
    if(ctx.YEAR == 2020){
        ctx.YEAR = 2000
    }
    ctx.YEAR = parseInt(ctx.YEAR) + 1;
    ScatterChange();
}