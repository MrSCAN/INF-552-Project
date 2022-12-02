// const continents = [
//     "Africa",
//     "Americas",
//     "Asia",
//     "Europe",
//     "Latin America and the Caribbean",
//     "Northern America",
//     "Oceania"
// ];


// function loadDataViz4() {
//     d3.csv("continent.csv").then(function (data) {
//         console.log(data[0])
//         for (let i = 0; data.length; i++) {
//             dataSets.push({
//                 date: data[i].year,
//                 dataSet: continents.map((continent) => ({
//                     name: continent,
//                     value: 44
//                 }))
//             });
//         }
//     });
// }

// function generateDataSets({ size = 1 }) {
//     const dataSets = [];
//     const currentYear = +timeFormat("%Y")(new Date());
//     const maxLimitForValue = 79.224;
//     const minLimitForValue = 26.4;
//     for (let i = 0; i < size; i++) {
//         dataSets.push({
//             date: currentYear - (size - (i + 1)),
//             dataSet: continents.map((continent) => ({
//                 name: continent,
//                 value:
//                     Math.random() * (maxLimitForValue - minLimitForValue) +
//                     minLimitForValue
//             }))
//         });
//     }
//     return dataSets;
// }
