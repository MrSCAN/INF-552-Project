


function createViz2(){
    let svgEl = d3.select("#f1").append("svg");
    svgEl.attr("width", MAP_W);
    svgEl.attr("height", MAP_H);
    loadData(svgEl);

}


function linePlot(d){
    var dataSet = anychart.data.set(d.path[0]["__data__"].properties.data_full);
    // 映射所有系列
    
    var firstSeriesData = dataSet.mapAs({x: 0, value: 1});
    var secondSeriesData = dataSet.mapAs({x: 0, value: 2});
    var thirdSeriesData = dataSet.mapAs({x: 0, value: 3});
}
