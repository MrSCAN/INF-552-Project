const MAP_W = 960 * 0.75;
const MAP_H = 484 * 0.75;

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
    // YEAR: "2015",
    panZoomMode: true,
    TRANSITION_DURATION: 3000,
    rivers: [],
    lakes: [],
    countries:[],
};

function makeMap(svgEl){
    ctx.mapG = svgEl.append("g")
                    .attr("id", "map")
                    .attr("clip-path", "url(#clip)");
    // bind and draw geographical features to <path> elements
    addCountries();
    // panning and zooming
    svgEl.append("rect")
         .attr("id", "pz")
         .attr("width", MAP_W)
         .attr("height", MAP_H)
         .style("fill", "none")
         .style("pointer-events", "all")
         .call(d3.zoom()
                 .scaleExtent([1, 8])
                 .on("zoom", zoomed)
         );
    function zoomed(event, d) {
        if (ctx.panZoomMode){
            ctx.mapG.attr("transform", event.transform);
        }
    }
};


const dwScale4color = d3.scaleLinear().domain([30,90]).range([0,1]);

function addCountries(){
    // console.log(ctx.countries);
    let geoGenrator = d3.geoPath().projection(ctx.currentProj);
    ctx.mapG.selectAll("path.country")
    .data(ctx.countries.features)
    .enter()
    .append("path")
    // .attr('pointer-events', 'visibleStroke')
    .attr("class", "country")
    .attr("d", geoGenrator)
    .style("fill", function(d){
        if(JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[2000] && d.properties.data_full.male[2000]["Life expectancy"]){
            return d3.interpolateOrRd(dwScale4color(d.properties.data_full.male[2000]["Life expectancy"]));
        }
        return ctx.undefinedColor;
    })


    ctx.mapG.selectAll("path.country")
    .on("click", (d, i) => { // 使用on 关键函数绑定, 后面回调函数参数d 当前数据 i 索引
        console.log(d, i, 'data'); // 输出的是前面绑定的每一项 也就是点击到得数据{}
    })
    // .append("svg:title")
    // .text(function(d){
    //     if(JSON.stringify(d.properties.data_full.male) != "{}" && d.properties.data_full.male[2000] && d.properties.data_full.male[2000]["Life expectancy"]){
    //         return dwScale4color(d.properties.data_full.male[2000]["Life expectancy"]);
    //     }
    // })
};


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

function loadData(svgEl){
    // ... load data, transform it, store it in ctx
    // ... then call makeMap(svgEl)
    promise1 = d3.json("custom.geo.json")
    promise2 = d3.csv("who_life_expectancy_all.csv")
    Promise.all([promise1, promise2])
    .then(function(data){
        let temp = {};
        data[0].features.forEach(
            function(d){
                male = {};
                female = {};
                for(i = 0; i< data[1].length; i++){
                    if(data[1][i].Code === d.properties["iso_a3"]){
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

function togglePZMode(){
    ctx.panZoomMode = !ctx.panZoomMode;
    switchProjection(ctx.panZoomMode);
};
