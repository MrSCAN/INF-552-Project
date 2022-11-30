const MAP_W = 0.5 * window.innerWidth;
const MAP_H = 0.5 * window.innerHeight;

const PROJECTIONS = {
    ER: d3.geoEquirectangular().scale(MAP_H / Math.PI),
    IM: d3.geoInterrupt(d3.geoMollweideRaw,
         [[ // northern hemisphere
           [[-180,   0], [-100,  90], [ -40,   0]],
           [[ -40,   0], [  30,  90], [ 180,   0]]
         ], [ // southern hemisphere
           [[-180,   0], [-160, -90], [-100,   0]],
           [[-100,   0], [ -60, -90], [ -20,   0]],
           [[ -20,   0], [  20, -90], [  80,   0]],
           [[  80,   0], [ 140, -90], [ 180,   0]]
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
    countries:[],
    SHOW_FIG2: false,
    min_max: {},
};

dwScale4color = 0;

function makeMap(svgEl){


    dwScale4color = d3.scaleLinear().domain([ctx.min_max.min_LE, ctx.min_max.max_LE]).range([1,0]);
    let legendG = svgEl.append("g")
                        .attr("id", "colorLegend")
                        .attr("opacity", 1)
                        .attr("transform", "translate(0,100)");

    ctx.rangeOverAll = [ctx.min_max.min_LE, ctx.min_max.max_LE];
    let range = d3.range(ctx.min_max.min_LE, ctx.min_max.max_LE, (ctx.min_max.max_LE - ctx.min_max.min_LE) / 50).reverse()
    let scale4colorLegend = d3.scaleLinear()
                    .domain(ctx.rangeOverAll)
                    .rangeRound([250,0]);
    legendG.selectAll("line")
           .data(range)
           .enter()
           .append("line")
           .attr("x1", 0)
           .attr("y1", (d,j) => (j * 5))
           .attr("x2", 20)
           .attr("y2", (d,j) => (j * 5))
           .attr("stroke-width", 5)
           .attr("stroke", (d) => d3.interpolateGnBu(dwScale4color(d)));
    legendG.append("g")
           .attr("transform", `translate(25,-2.5)`)
           .call(d3.axisRight(scale4colorLegend).ticks(5));
    legendG.append("text")
           .attr("x", 0)
           .attr("y", 250+12)
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
        if (ctx.panZoomMode){
            ctx.mapG.attr("transform", event.transform);
        }
    }
};


function addCountries(){

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
    .style("fill", getColor)
    .style("pointer-events", "all")
    .on("mouseover", function(d, i){
        d3.select(this).style("fill", "red").style("stoke", "black");
        console.log(d.path[0]["__data__"]);
        return tooltip.style("visibility", "visible").html("<p>" + d.path[0]["__data__"].properties.formal_en  + "<br>" + ctx.FACTOR + ": " + getValue(d.path[0]["__data__"]) + "</p>"); 
    })
    .on('mousemove', function (d) {
        return tooltip.style('top', (event.pageY - 50)+'px').style('left',(event.pageX+50)+'px');
    })
    .on("mouseout", function(){d3.select(this).style("fill", getColor); return tooltip.style("visibility", "hidden");})
    // .on("click", linePlot(d));
    ;
};

function getValue(d){
    if(ctx.GENDER == "all"){
        if(JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[ctx.YEAR] && d.properties.data_full.male[ctx.YEAR][ctx.FACTOR]
        && JSON.stringify(d.properties.data_full.female) != "{}" && d.properties.data_full.female[ctx.YEAR] && d.properties.data_full.female[ctx.YEAR][ctx.FACTOR]){
            return ((parseFloat(d.properties.data_full["female"][ctx.YEAR][ctx.FACTOR]) + parseFloat(d.properties.data_full["male"][ctx.YEAR][ctx.FACTOR])) / 2).toFixed(3);
        }
    }else{
        if(JSON.stringify(d.properties.data_full[ctx.GENDER]) != "{}" && d.properties.data_full[ctx.GENDER][ctx.YEAR] && d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]){
            return d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR];
        }
    }
    return "not recorded"
}

function getColor(d){
    if(ctx.GENDER == "all"){
        if(JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[ctx.YEAR] && d.properties.data_full.male[ctx.YEAR][ctx.FACTOR]
        && JSON.stringify(d.properties.data_full.female) != "{}" && d.properties.data_full.female[ctx.YEAR] && d.properties.data_full.female[ctx.YEAR][ctx.FACTOR]){
            return d3.interpolateGnBu(dwScale4color((parseFloat(d.properties.data_full["female"][ctx.YEAR][ctx.FACTOR]) + parseFloat(d.properties.data_full["male"][ctx.YEAR][ctx.FACTOR])) / 2));
        }
    }else{
        if(JSON.stringify(d.properties.data_full[ctx.GENDER]) != "{}" && d.properties.data_full[ctx.GENDER][ctx.YEAR] && d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]){
            return d3.interpolateGnBu(dwScale4color(d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]));
        }
    }
    return ctx.undefinedColor;
}

function getGlobalView(){
    // ...
    d3.select("#map")
    .transition()
    .duration(ctx.TRANSITION_DURATION)
    .attr("transform", "scale(1,1)");
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    Object.keys(PROJECTIONS).forEach(function(k) {
        PROJECTIONS[k].rotate([0, 0]).center([0, 0]);
    });
    let svgEl = d3.select("#f1").append("svg");
    svgEl.attr("width", MAP_W);
    svgEl.attr("height", MAP_H);
    loadData(svgEl);
};


function initializeSelectBox(){
    d3.select("#year")
    .on('change', function () {
        fig1Year(this.value);
    });
    d3.select("#gender")
    .on('change', function () {
        fig1Gender(this.value);
    });
    d3.select("#factor")
    .on('change', function () {
        fig1Factor(this.value);
    });
}


function fig1Year(year){
    ctx.YEAR = year;
    updateMap();
}

function fig1Gender(gender){
    ctx.GENDER = gender;
    updateMap();
}

function fig1Factor(factor){
    let min = 0;
    let max = 0;
    switch(factor){
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
    dwScale4color = d3.scalePow().domain([min, max]).range([1,0]);
    ctx.rangeOverAll = [min, max];
    ctx.FACTOR = factor;
    updateMap();
}

function updateMap(){

    let scale4colorLegend = d3.scaleLinear()
    .domain(ctx.rangeOverAll)
    .rangeRound([250,0]);
    d3.select("#colorLegend>g")
           .attr("transform", `translate(25,-2.5)`)
           .call(d3.axisRight(scale4colorLegend).ticks(5));
    d3.select("#colorLegend>text")
           .attr("x", 0)
           .attr("y", 250+12)
           .text(ctx.FACTOR);

    ctx.mapG.selectAll("path.country")
    .transition()
    .duration(500)
    .style("fill", function(d){
        if(ctx.GENDER == "all"){
            if(JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[ctx.YEAR] && d.properties.data_full.male[ctx.YEAR][ctx.FACTOR]
            && JSON.stringify(d.properties.data_full.female) != "{}" && d.properties.data_full.female[ctx.YEAR] && d.properties.data_full.female[ctx.YEAR][ctx.FACTOR]){
                return d3.interpolateGnBu(dwScale4color((parseFloat(d.properties.data_full["female"][ctx.YEAR][ctx.FACTOR]) + parseFloat(d.properties.data_full["male"][ctx.YEAR][ctx.FACTOR])) / 2));
            }
        }else{
            if(JSON.stringify(d.properties.data_full[ctx.GENDER]) != "{}" && d.properties.data_full[ctx.GENDER][ctx.YEAR] && d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]){
                return d3.interpolateGnBu(dwScale4color(d.properties.data_full[ctx.GENDER][ctx.YEAR][ctx.FACTOR]));
            }
        }
        return ctx.undefinedColor;
    })
}

function loadData(svgEl){
    // ... load data, transform it, store it in ctx
    // ... then call makeMap(svgEl)
    initializeSelectBox();
    promise1 = d3.json("custom.geo.json");
    promise2 = d3.csv("who_life_expectancy_all.csv");

    getDataRange();
    Promise.all([promise1, promise2])
    .then(function(data){
        let temp = {};
        data[0].features.forEach(
            function(d){
                male = {};
                female = {};
                for(i = 0; i< data[1].length; i++){
                    if(data[1][i].Code === d.properties["iso_a3_eh"]){
                        let year = data[1][i].Year;
                        if(data[1][i].Gender == "Male"){
                            male[year] = data[1][i];
                        }else{
                            female[year] = data[1][i];
                        }
                    }
                }
                d.properties['data_full'] = {male: male, female: female,};
            }
        )
        ctx.countries = data[0];
        makeMap(svgEl);
    });
};

function getDataRange(data){
    d3.csv("who_life_expectancy_all.csv").then(function(data){
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

// function togglePZMode(){
//     ctx.panZoomMode = !ctx.panZoomMode;
//     switchProjection(ctx.panZoomMode);
// };
