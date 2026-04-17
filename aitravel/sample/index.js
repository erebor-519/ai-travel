var map, route, marker;
map = new AMap.Map("container", {
    resizeEnable: true
});
var path = [];
path.push([116.303843, 39.983412]);
path.push([116.321354, 39.896436]);
path.push([116.407012, 39.992093]);
map.plugin("AMap.DragRoute", function() {
    route = new AMap.DragRoute(map, path, AMap.DrivingPolicy.LEAST_FEE);
    route.search();
});
