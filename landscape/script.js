
let data = {

  allowedCollections: "all", // all : all collections; undefined for texts with undefined collection; V002,V014 (no spaces) for setting some collection ids for filtering (you can also put undefined in this list)
  timeline_x: 0,
  timeline_y: 0,
  timeline_dot: null,
  keyboardCommandsOn: true
};

// Warn if overriding existing method
if(Array.prototype.equals)
console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
  return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length)
  return false;

  for (var i = 0, l=this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
      return false;
    }
    else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

Array.prototype.includesArray = function(array)
{
  if(!array) return false;

  for(let i = 0, l=this.length; i < l; ++i)
  {
    if(this[i].equals(array)) return true;
  }

  return false;
}

Object.defineProperty(Array.prototype, "includesArray", {enumerable: false});

d3
.csv("donuts_data.csv")
.then(
  function(csv)
  {
    data.x_csv2 = csv.reduce(
      function(map, obj)
      {
        map[obj.id] = calculate_item_data(obj);

        return map;
      },
      {});

      d3
      .json("data.json")
      .then(treat_json);
    });

    function treat_json(json)
    {

      //Firstly let svg appear

      d3.select('svg#landscape').classed('hidden', false);

      let collections = getCollections();
      let allowedCollections = data.allowedCollections.split(",");

      let json_nodes = json.nodes.filter(function(item) {

        return (
          data.allowedCollections == "all" ||
          (allowedCollections.includes("undefined") && item.attributes.collections == undefined) ||
          array_intersection(allowedCollections, item.attributes.collections).length > 0
        );
      });

      json_nodes.forEach(
        function(n)
        {
          // fix orientation of the viz
          n.y*=-1;
          // n.x*=-1;
          // handle collections
          if (n.attributes.collections){
            n.attributes.collections = n.attributes.collections.split(';')
            // remove last element which is always empty due to the fat that all records end with a ";"
            n.attributes.collections.pop()
          } else {
            n.attributes.collections = []
          }
        });

        // sort node so to have the upper in the background and not covering the ones in the foreground
        json_nodes = json_nodes.sort(function(a, b){return a.y - b.y});

        let size_ext = d3.extent(json.nodes, function(d){return d.size});
        data.min_size = size_ext[0]/8;

        json_nodes.forEach(create_item_steps);

        json_nodes.forEach(node =>
          node.steps.forEach(step =>
            collections.forEach(coll => {
              checkMapAndInsert(step, "metaballCorner", coll.id, false)
              let x = 6;
            })));

            // collections
            //   .filter(coll => data.allowedCollections == "all" || allowedCollections.includes(coll.id))
            //   .forEach(coll => prepareMetaballData(json_nodes, coll.id, coll.c));

            let boundaries = {
              top: d3.min(json_nodes, function(d){ return d.y }),
              right: d3.max(json_nodes, function(d){ return d.x }),
              bottom: d3.max(json_nodes, function(d){ return d.y }),
              left: d3.min(json_nodes, function(d){ return d.x })
            };

            // console.log(boundaries);

            let center = {
              x: (boundaries.left + boundaries.right) / 2,
              y: (boundaries.bottom + boundaries.top) / 2
            };

            // console.log(center);

            let colour = d3
            .scaleLinear()
            .domain(d3.extent(json_nodes, function(d){ return d.attributes.first_publication; }))
            .range(['#ff6347','#455A64']);

            let col_collections = d3
            .scaleOrdinal()
            .domain(collections.map(function(d){return d.id}))
            .range(collections.map(function(d){return d.c}))
            .unknown('transparent');

            let w = window.innerWidth;
            let h = window.innerHeight - 6;
            let svg = d3
            .select('svg')
            .attr('width', w)
            .attr('height', h)
            .style('background','var(--main-bg-color)');

            let radialGradient = svg
            .append("defs")
            .append("radialGradient")
            .attr("id", "radial-gradient");

            radialGradient
            .append("stop")
            .attr("offset", "30%")
            .attr("stop-color", "green");

            radialGradient
            .append("stop")
            .attr("offset", "97%")
            .attr("stop-color", "#EFEBE9");

            let svg_main_group = svg
            .append('g');

            // let metaball_group = svg_main_group
            //   .append("g")
            //   .attr("class", "metaball_nodes");
            //
            // let metaball_nodes = metaball_group
            //   .selectAll(".metaball_node")
            //   .data(json_nodes)
            //   .enter()
            //     .append("g")
            //     .attr("class", "metaball_node")
            //     .attr("transform", function(d) {
            //       return 'scale(1,0.5773) translate('+ (d.x - center.x)  +','+ (d.y - center.y) +')'
            //     });

            // let metaballs = metaball_nodes
            //   .selectAll(".metaball")
            //   .data((d, i) => {
            //     return d.steps;
            //   })
            //   .enter();
            //
            // collections.forEach(coll =>
            //   metaballs
            //     .filter(function(d) {
            //       return d.metaballCorner[coll.id];
            //     })
            //     .append("svg:path")
            //     .attr("class", function(d) {
            //       return "metaball collection_" + coll.id;
            //     })
            //     .attr("d", function(d) {
            //       return d.lobe[coll.id];
            //     })
            //     .attr("fill", "none")
            //     .attr("stroke", function(d) {
            //       return d.lobeColor[coll.id];
            //     })
            //     .attr("stroke-opacity", 0)
            //     .attr("stroke-width", 30)
            //     .attr('transform',function(d){
            //       let delta_x = -(+d.x);
            //       let delta_y = -(+d.y);
            //       return 'translate(' + delta_x + ', ' + delta_y + ')'
            //     }));

            let g = svg_main_group
            .append('g')
            .attr('class','nodes');

            // Text nodes (single text-related features such as hills, donuts, ...)
            let text_nodes = g
            .selectAll('.node')
            .data(json_nodes)
            .enter()
            .append('g')
            .attr('class','node')
            .attr('transform',function(d){
              return 'scale(1,0.5773) translate('+(d.x - center.x)+','+(d.y - center.y)+')'
            })
            .on('click', function(d){
              console.log(d);
            })

            // calculate the size of steps for hills
            let step_increment = -23;

            let steps = text_nodes
            .selectAll('circle')
            .data((d, i) => {
              return d.steps;
            })
            .enter();

            steps
            .filter(function(d) { return d.first_elem; })
            .append('circle')
            .attr('fill','url(#radial-gradient)')
            .attr('r',function(d){ return d.r * 1.5 })
            .attr("class", "halo")
            .style('fill-opacity',0)
            .style('stroke-opacity',0)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            });

            steps
            .append('circle')
            .attr('stroke','#444')
            .attr('stroke-width',1.5)
            .attr('fill',function(d){
              // return col_collections(d.collection);
              return colour(d.first_publication);
            })
            .attr('r',function(d){ return d.r })
            .attr('first_elem',function(d){ return d.first_elem })
            .attr("class", "hill" )
            .style('fill-opacity',1e-16)
            .style('stroke-opacity',1e-16)
            .transition()
            .duration(1000)
            .delay(function(d){return (d.first_publication - 1940)*100})
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',1)
            .style('stroke-opacity',.5);

            let PI = Math.PI;
            let arcMin = 75; // inner radius of the first arc
            let arcWidth = 15;
            let arcPad = 1; // padding between arcs
            let drawMode = 1; // 1 : hills; 2 : hills with halo; 3 : places; 4 : dubitative phenomena;
            let metaballsVisible = new Map();

            ///////////////////////////////////////////

            let drawPlacesArc1 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(0 * 2 * PI)
            .endAngle(function(d, i) {
              return d.generico_non_terrestre * 2 * PI;
            });

            let drawPlacesArc2 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.generico_non_terrestre * 2 * PI;
            })
            .endAngle(function(d, i) {
              return d.generico_terrestre * 2 * PI;
            });

            let drawPlacesArc3 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.generico_terrestre * 2 * PI;
            })
            .endAngle(function(d, i) {
              return d.inventato * 2 * PI;
            });

            let drawPlacesArc4 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.inventato * 2 * PI;
            })
            .endAngle(function(d, i) {
              return d.no_ambientazione * 2 * PI;
            });

            let drawPlacesArc5 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.no_ambientazione * 2 * PI;
            })
            .endAngle(function(d, i) {
              return d.nominato_non_terrestre * 2 * PI;
            });

            let drawPlacesArc6 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.nominato_non_terrestre * 2 * PI;
            })
            .endAngle(function(d, i) {
              return d.nominato_terrestre * 2 * PI;
            });

            let drawPlacesArc7 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.nominato_terrestre * 2 * PI;
            })
            .endAngle(function(d, i) {
              return 2 * PI;
            });

            ///////////////////////////////////////////

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "red")
            .attr("class", "places")
            .attr("d", drawPlacesArc1)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "orange")
            .attr("class", "places")
            .attr("d", drawPlacesArc2)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "fuchsia")
            .attr("class", "places")
            .attr("d", drawPlacesArc3)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "darkgrey")
            .attr("class", "places")
            .attr("d", drawPlacesArc4)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "blue")
            .attr("class", "places")
            .attr("d", drawPlacesArc5)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "dodgerblue")
            .attr("class", "places")
            .attr("d", drawPlacesArc6)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "white")
            .attr("class", "places")
            .attr("d", drawPlacesArc7)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            ///////////////////////////////////////////

            let drawDubitativePhenomenaArc1 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(0 * 2 * PI)
            .endAngle(function(d, i) {
              return d.nebbia * 2 * PI;
            });

            let drawDubitativePhenomenaArc2 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.nebbia * 2 * PI;
            })
            .endAngle(function(d, i) {
              return d.cancellazione * 2 * PI;
            });

            let drawDubitativePhenomenaArc3 = d3
            .arc()
            .innerRadius(function(d, i) {
              return d.r - (i+1) * arcWidth + arcPad;
            })
            .outerRadius(function(d, i) {
              return d.r - i * arcWidth;
            })
            .startAngle(function(d, i) {
              return d.cancellazione * 2 * PI;
            })
            .endAngle(function(d, i) {
              return 2 * PI;
            });

            ///////////////////////////////////////////

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "blue")
            .attr("class", "dubitativePhenomena")
            .attr("d", drawDubitativePhenomenaArc1)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "red")
            .attr("class", "dubitativePhenomena")
            .attr("d", drawDubitativePhenomenaArc2)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            steps
            .filter(function(d) { return d.first_elem } )
            .append("svg:path")
            .attr("fill", "white")
            .attr("class", "dubitativePhenomena")
            .attr("d", drawDubitativePhenomenaArc3)
            .attr('transform', function(d,i){
              i = i*step_increment
              return 'translate(0,'+i+')'
            })
            .style('fill-opacity',0);

            ///////////////////////////////////////////

            text_nodes
            .on("Xmouseenter", function(){
              d3.selectAll('.node')
              .transition()
              .duration(350)
              .style('opacity',.4)

              d3.select(this)
              .selectAll('circle')
              .transition()
              .duration(350)
              .attr('transform', function(d,i){
                i = i*step_increment*1.5
                return 'translate(0,'+i+')'
              });
            })
            .on("Xmouseleave", function(){
              d3.selectAll('.node')
              .transition()
              .duration(350)
              .style('opacity',1);

              d3.select(this).selectAll('circle')
              .transition()
              .duration(350)
              .style('opacity',1)
              .attr('transform', function(d,i){
                i = i*step_increment
                return 'translate(0,'+i+')'
              });
            });

            let label = text_nodes
            .selectAll('.label')
            .data(function(d){ return [d] })
            .enter()
            .append('text')
            .attr('class','label')
            .attr('fill','black')
            .attr('font-size','5rem')
            .attr('text-anchor','middle')
            .attr('transform',function(d){
              return 'translate(0,'+(d.steps.length+2)*step_increment+') scale(1,'+1/0.5773+')'
            })
            .text(function(d){
              return d.attributes.title//+'-'+d.attributes.first_publication;
            });

            //add zoom capabilities
            var zoom_handler = d3.zoom()
            .on("zoom", zoom_actions);

            zoom_handler(svg);

            let scale = (w / (boundaries.right - boundaries.left))*0.9;

            centerTerritory(scale, 0, 0, 0);

            //Zoom functions
            function zoom_actions(){
              g.attr("transform", d3.event.transform);
              // metaball_group.attr("transform", d3.event.transform);
              // console.log(d3.event.transform);
              label.style("font-size", () => {
                return ( 0.85 / d3.event.transform.k ) + "rem";
              })
            }

            // Handle interface interactions
            function centerTerritory(scale, x, y, duration) {
              svg.transition()
              .duration(duration)
              .call( zoom_handler.transform, d3.zoomIdentity
                .translate((w/2) + x, (h/2) + y)
                .scale(scale*0.65)
              );
            }

            d3.selectAll('.dropdown-menu li a').on('click', function(d){
              setHillsColours(d3.select(this).attr('colour-by'));
            })

            $(".dropdown-menu li a").click(function(){
              $(this).parents(".dropdown").find('._btn').html($(this).text() + ' <span class="caret"></span>');
              $(this).parents(".dropdown").find('._btn').val($(this).data('value'));
            });

            function setHillsColours(coloursBy) {
              switch (coloursBy) {
                case 'years':
                text_nodes.selectAll('circle')
                .transition()
                .duration(350)
                .attr('fill',function(d){
                  return colour(d.first_publication);
                });
                break;
                case 'collections':
                text_nodes.selectAll('circle')
                .transition().duration(350)
                .attr('fill',function(d){
                  console.log(d.collection, col_collections(d.collection));
                  return col_collections(d.collection);
                })
                break;
              }
            }

            prepareTimeline(json_nodes, col_collections);

            d3.selectAll('.toggle-timeline').on('click', function(d){
              toggleTimeline();
              d3.select(this).classed('active', d3.select(this).classed("active") ? false : true)
            })

            function toggleTimeline() {
              d3.select('#interface').classed("timeline-visible", d3.select('#interface').classed("timeline-visible") ? false : true);
            }

            d3.selectAll('.toggle-legend').on('click', function(d){
              toggleLegend();
              d3.select(this).classed('active', d3.select(this).classed("active") ? false : true)
            })

            function toggleLegend() {
              d3.select('#interface').classed("legend-visible", d3.select('#interface').classed("legend-visible") ? false : true);
            }

            d3.selectAll('.toggle-tutorial').on('click', function(d){
              toggleTutorial();
            })

            function toggleTutorial() {
              d3.select('.scrollitelling-box').classed("scrollitelling-visible", d3.select('.scrollitelling-box').classed("scrollitelling-visible") ? false : true);
            }

            d3.selectAll('.toggle-search').on('click', function(d){
              toggleSearch();
            })

            function toggleSearch() {
              d3.select('#searchbox-box').classed("searchbox-visible", d3.select('#searchbox-box').classed("searchbox-visible") ? false : true);
            }

            d3
            .select("#searchbox")
            .on("focus",
            function()
            {
              data.keyboardCommandsOn = false;
            })
            .on("focusout",
            function()
            {
              data.keyboardCommandsOn = true;
            });

            d3
            .select('body')
            .on("keyup",
            function(d)
            {
              if(!data.keyboardCommandsOn) return;
              //      console.log(d3.event.key)

              let eventKey = d3.event.key.toLowerCase();

              if (eventKey == "c") {
                text_nodes.selectAll('circle')
                .transition().duration(350)
                .attr('fill',function(d){
                  return col_collections(d.collection)
                })
              } else if (eventKey == "y") {
                text_nodes.selectAll('circle')
                .transition()
                .duration(350)
                .attr('fill',function(d){
                  return colour(d.first_publication)
                })
              } else if (eventKey == "n") {
                text_nodes.style('display','none')
                text_nodes.filter(function(d){
                  console.log(d)
                  return d.attributes.nebbia
                })
                .style('display','block')
              } else if (eventKey == "m") {
                text_nodes.style('display','none')
                text_nodes.filter(function(d){
                  console.log(d)
                  return d.attributes.cancellazione
                })
                .style('display','block')
              } else if (eventKey == "p") {

                drawMode = incrementDrawMode(drawMode);
                console.log(drawMode);

                switch(drawMode)
                {
                  case 1 : // hills
                  text_nodes
                  .selectAll('path')
                  .transition()
                  .duration(450)
                  .style('fill-opacity',0)
                  .style('stroke-opacity',0);

                  text_nodes
                  .selectAll('.halo')
                  .transition()
                  .duration(450)
                  .style('fill-opacity',0)
                  .style('stroke-opacity',0);

                  text_nodes
                  .selectAll('.hill')
                  .transition()
                  .duration(450)
                  .style('fill-opacity',1)
                  .style('stroke-opacity',1);

                  text_nodes
                  .selectAll('circle')
                  .filter(function(d) { return d.first_elem && !this.classList.contains('halo'); } )
                  .transition()
                  .duration(450)
                  .style('fill-opacity',1)
                  .style('stroke-opacity',1)
                  .style('fill', function(d)
                  {
                    return colour(d.first_publication);
                  });

                  break;

                  case 2 : // hills with halos

                  text_nodes
                  .selectAll('path')
                  .transition()
                  .duration(450)
                  .style('fill-opacity',0)
                  .style('stroke-opacity',0);

                  text_nodes
                  .selectAll('circle')
                  .transition()
                  .duration(450)
                  .style('fill-opacity',1)
                  .style('stroke-opacity',1);

                  break;

                  case 3 : // places

                  text_nodes
                  .selectAll('.places')
                  .style('fill-opacity',1)
                  .style('stroke-opacity',1);

                  text_nodes
                  .selectAll("circle:not(.places)")
                  .transition()
                  .duration(450)
                  .style('fill-opacity',0)
                  .style('stroke-opacity',0);

                  text_nodes
                  .selectAll('circle')
                  .filter(function(d) { return d.first_elem && !this.classList.contains('halo'); } )
                  .transition()
                  .duration(450)
                  .style('fill-opacity',0.2)
                  .style('stroke-opacity',0);

                  break;

                  case 4 : // dubitative phenomena

                  text_nodes
                  .selectAll('.places')
                  .style('fill-opacity',0)
                  .style('stroke-opacity',0);

                  text_nodes
                  .selectAll('.dubitativePhenomena')
                  .style('fill-opacity',1)
                  .style('stroke-opacity',1);

                  text_nodes
                  .selectAll("circle:not(.dubitativePhenomena)")
                  .transition()
                  .duration(450)
                  .style('fill-opacity',0)
                  .style('stroke-opacity',0);

                  text_nodes
                  .selectAll('circle')
                  .filter(function(d) { return d.first_elem && !this.classList.contains('halo'); } )
                  .transition()
                  .duration(450)
                  .style('fill-opacity', d => sample(d.norma_pct_caratteri_nebbia_cancellazione, 0, 1, 10))
                  .style('stroke-opacity',0)
                  .style('fill', '#9900FF');

                  break;
                }
              }
              else if(eventKey == "x")
              {
                collections.forEach(coll => metaballsVisible[coll.id] = !metaballsVisible[coll.id]);

                metaballs
                .selectAll(".metaball")
                .transition()
                .duration(450)
                .style("stroke-opacity", function(d) { return metaballsVisible[d.collection] ? 1 : 0; });
              }
              else if("0123456789".includes(eventKey))
              {
                let collectionId = collections[+eventKey].id;

                let collectionClass = "collection_" + collectionId;

                metaballsVisible[collectionId] = !metaballsVisible[collectionId];

                if(metaballsVisible[collectionId])
                {
                  metaballs
                  .selectAll(".metaball." + collectionClass)
                  .transition()
                  .duration(450)
                  .style("stroke-opacity", 1);
                }
                else
                {
                  metaballs
                  .selectAll(".metaball." + collectionClass)
                  .transition()
                  .duration(450)
                  .style("stroke-opacity", 0);
                }
              }
              else if(eventKey == "f") {
                // d3.select('#searchbox').node().value = '';
                // label.classed('visible', false);
                // d3.select('#searchbox').style('min-width', '10ch');
                // d3.select('#searchbox-box').classed('searchbox-visible', false);
                // applyBeeSwarmFilter();
                resetSearchBox();
              }
              else if (eventKey == " ") {
                text_nodes.style('display','block')
              }
            });

            let titles = json_nodes.map(d => {
              // console.log(d);
              return d.attributes.title;
            });
            let title_id_map = new Map();

            json_nodes.forEach(d => title_id_map[d.attributes.title] = d.id);

            $("#searchbox")
            .autocomplete({
              appendTo: '#searchbox-results',
              source: titles,
              minLength: 3,
              position: {
                collision: 'flip',
              },
              close: function( event, ui ) {
                //alert('closed')
              },
              change: function( event, ui ) {
                console.log('change');
              },
              source: function(req, response) {
                console.log(req.term.length);
                let searchedText = req.term;
                var results = $.ui.autocomplete.filter(titles, req.term);

                text_nodes.style("opacity", .35);
                label.classed('visible', false);

                results.forEach(d=>{
                  let id = title_id_map[d];

                  text_nodes
                    .filter(d => d.id == id)
                    .style("opacity", 1);

                  label
                    .filter(d => d.id == id)
                    .classed('visible', true);

                });

                d3.select('#clear-search').classed('d-inline-block', true);

                response(results);
              },
              select: function(event, ui) {

                let id = title_id_map[ui.item.value];

                text_nodes
                  .filter(d => d.id == id)
                  .style("opacity", 1);

                label
                  .classed('visible', false)
                  .filter(d => d.id == id)
                    .classed('visible', true);

                text_nodes
                  .filter(d => d.id != id)
                  .style("opacity", .35);

                d3.select('#clear-search').classed('d-inline-block', true);

              } });

              d3.select('#clear-search').on('click', function(){
                resetSearchBox();
              })

              function resetSearchBox()
              {
                d3.select('#searchbox').node().value = '';
                label.classed('visible', false);
                d3.select('#searchbox').style('min-width', '10ch');
                d3.select('#searchbox-box').classed('searchbox-visible', false);
                d3.select('#clear-search').classed('d-inline-block', false);
                applyBeeSwarmFilter();
              }
            }

            function convertRatioToColorComponent(r)
            {
              // r is assumed to be in [0, 1]
              let s = "00" + Math.trunc(r * 255).toString(16);

              let s2 = s.substring(s.length - 2, s.length);

              return s2;
            }

            function sample(value, min, max, nIntervals)
            {
              const delta = max - min;
              const step = delta / nIntervals;

              let stepSum = 0;

              while(stepSum < value)
              {
                stepSum += step;
              }

              return stepSum;
            }

            function flatten_items_steps(nodes)
            {
              let flattened_steps = [];

              for(let i = 0; i < nodes.length; ++i)
              {
                let node = nodes[i];

                for(let j = 0; j < node.steps.length; ++j)
                {
                  let step = node.steps[j];

                  let item =
                  {
                    id: step.id,
                    x: node.x,
                    y: node.y,

                    r: step.r,
                    steps_length: node.steps.length,
                    step: step,

                    collections: node.attributes.collections,
                    first_elem: step.first_elem,
                    first_publication: step.first_publication,
                    generico_non_terrestre: step.generico_non_terrestre,
                    generico_terrestre: step.generico_terrestre,
                    inventato: step.inventato,
                    no_ambientazione: step.no_ambientazione,
                    nominato_non_terrestre: step.nominato_non_terrestre,
                    nominato_terrestre: step.nominato_terrestre,

                    nebbia_normalizzata: step.nebbia_normalizzata,
                    cancellazione_normalizzata: step.cancellazione_normalizzata,

                    nebbia: step.nebbia,
                    cancellazione: step.cancellazione,

                    norma_pct_caratteri_nebbia_cancellazione: step.norma_pct_caratteri_nebbia_cancellazione
                  };

                  flattened_steps.push(item);
                }
              }

              return flattened_steps;
            }

            function calculate_item_data(obj)
            {
              let item_data =
              {
                generico_non_terrestre: (+obj.generico_non_terrestre),
                generico_terrestre:     (+obj.generico_non_terrestre) + (+obj.generico_terrestre),
                inventato:              (+obj.generico_non_terrestre) + (+obj.generico_terrestre) + (+obj.inventato),
                no_ambientazione:       (+obj.generico_non_terrestre) + (+obj.generico_terrestre) + (+obj.inventato) + (+obj.no_ambientazione),
                nominato_non_terrestre: (+obj.generico_non_terrestre) + (+obj.generico_terrestre) + (+obj.inventato) + (+obj.no_ambientazione) + (+obj.nominato_non_terrestre),
                nominato_terrestre:     (+obj.generico_non_terrestre) + (+obj.generico_terrestre) + (+obj.inventato) + (+obj.no_ambientazione) + (+obj.nominato_non_terrestre) + (+obj.nominato_terrestre),

                nebbia_normalizzata:        (+obj.pct_nebbia_normalizzata),
                cancellazione_normalizzata: (+obj.pct_cancellazione_normalizzata),

                nebbia:                     (+obj.pct_nebbia / 100),
                cancellazione:              (+obj.pct_nebbia / 100) + (+obj.pct_cancellazione / 100),

                norma_pct_caratteri_nebbia_cancellazione: (+obj.norma_pct_caratteri_nebbia_cancellazione)
              };

              return item_data;
            }

            function create_item_steps(d)
            {
              // reverse the order of collections, so to have the older ones at the bottom of the hills
              d.attributes.collections = d.attributes.collections.reverse()

              d.steps = [];
              // get different radii
              for (var jj = (data.min_size); jj<= d.size; jj+=data.min_size) {
                let new_step_size = jj;
                let ratio = new_step_size / d.size;
                new_step_size = d.size * interpolateSpline(ratio);
                d.steps.push(new_step_size);
              }

              // get colors
              d.steps = d.steps.map((s,i) => {

                // assign to each step a collection
                let pos_1 = i/d.steps.length;
                let pos_2 = pos_1 * d.attributes.collections.length;
                let collection_here = d.attributes.collections[Math.floor(pos_2)]
                let first_elem = (i == (d.steps.length-1))

                let csv_item = data.x_csv2[d.id];

                return {
                  'r': s,
                  'collection': collection_here,
                  'first_publication': d.attributes.first_publication,
                  'id': d.id,
                  'first_elem': first_elem,
                  'generico_non_terrestre': csv_item == undefined ? 0 : csv_item.generico_non_terrestre,
                  'generico_terrestre':  csv_item == undefined ? 0 : csv_item.generico_terrestre,
                  'inventato':  csv_item == undefined ? 0 : csv_item.inventato,
                  'no_ambientazione':  csv_item == undefined ? 0 : csv_item.no_ambientazione,
                  'nominato_non_terrestre':  csv_item == undefined ? 0 : csv_item.nominato_non_terrestre,
                  'nominato_terrestre':  csv_item == undefined ? 0 : csv_item.nominato_terrestre,
                  'nebbia_normalizzata': csv_item == undefined ? 0 : csv_item.nebbia_normalizzata,
                  'cancellazione_normalizzata': csv_item == undefined ? 0 : csv_item.cancellazione_normalizzata,
                  'nebbia': csv_item == undefined ? 0 : csv_item.nebbia,
                  'cancellazione': csv_item == undefined ? 0 : csv_item.cancellazione,
                  'norma_pct_caratteri_nebbia_cancellazione': csv_item == undefined ? 0 : csv_item.norma_pct_caratteri_nebbia_cancellazione
                };
              });

              // sort array so to have little circles on top, big at bottom
              d.steps = d.steps.reverse();

              return d.steps;
            }

            function interpolateSpline(x) {
              let y;

              // The cubic spline interpolation has been calculated "heuristically" by using this service:
              // https://tools.timodenk.com/cubic-spline-interpolation

              // Inserted values are:
              // x, y
              // 0, 0
              // 0.1, 0.2
              // 0.55, 0.65
              // 0.8, 0.8
              // 1, 1

              if (x>=0 && x<=0.1) {
                y = (-8.7269*Math.pow(x,3)) + (1.1764*Math.pow(10,-60)*Math.pow(x,2)) + (2.0873*x) + (0);
              } else if (x>0.1 && x<=0.55) {
                y = (1.7416*Math.pow(x,3)) + (-3.1405*Math.pow(x,2)) + (2.4013*x) + (-1.0468*Math.pow(10,-2))
              } else if (x>0.55 && x<=0.8) {
                y = (2.2326*Math.pow(x,3)) + (-3.9507*Math.pow(x,2)) + (2.8469*x) + (-9.2166*Math.pow(10,-2))
              } else if (x>0.8 && x<=1) {
                y = (-2.3458*Math.pow(x,3)) + (7.0374*Math.pow(x,2)) + (-5.9436*x) + (2.2520)
              } else {
                y=x
              }

              return y
            }

            function getCollections() {
              let collections = [
                {
                  'n': 'Ultimo viene il corvo',
                  'id': 'V002',
                  'c': '#e9d05d'
                },
                {
                  'n': 'L\'entrata in guerra',
                  'id': 'V004',
                  'c': '#12b259'
                },
                {
                  'n': 'I racconti',
                  'id': 'V006',
                  'c': '#476a70'
                },
                {
                  'n': 'Marcovaldo',
                  'id': 'V011',
                  'c': '#9f73b2'
                },
                {
                  'n': 'Le cosmicomiche',
                  'id': 'V013',
                  'c': '#e89fc0'
                },
                {
                  'n': 'Ti con zero',
                  'id': 'V014',
                  'c': '#581745'
                },
                {
                  'n': 'La memoria del mondo',
                  'id': 'V015',
                  'c': '#00b1b3'
                },
                {
                  'n': 'Gli amori difficili',
                  'id': 'V017',
                  'c': '#f0be96'
                },
                {
                  'n': 'Palomar',
                  'id': 'V022',
                  'c': '#94d2ba'
                },
                {
                  'n': 'Cosmicomiche vecchie e nuove',
                  'id': 'V023',
                  'c': '#f1634b'
                }
              ]


              // with all the volumes
              collections = [
                {
                  'n': 'Il sentiero dei nidi di ragno',
                  'id': 'V001',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Ultimo viene il corvo',
                  'id': 'V002',
                  'c': '#e9d05d'
                },
                {
                  'n': 'Il visconte dimezzato',
                  'id': 'V003',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'L\'entrata in guerra',
                  'id': 'V004',
                  'c': '#12b259'
                },
                {
                  'n': 'Il barone rampante',
                  'id': 'V005',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'I racconti',
                  'id': 'V006',
                  'c': '#476a70'
                },
                {
                  'n': 'La formica argentina',
                  'id': 'V007',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Il cavaliere inesistente',
                  'id': 'V008',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'La giornata di uno scrutatore',
                  'id': 'V009',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'La speculazione edilizia',
                  'id': 'V010',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Marcovaldo',
                  'id': 'V011',
                  'c': '#9f73b2'
                },
                {
                  'n': 'La nuvola di smog e la formica argentina',
                  'id': 'V012',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Le cosmicomiche',
                  'id': 'V013',
                  'c': '#e89fc0'
                },
                {
                  'n': 'Ti con zero',
                  'id': 'V014',
                  'c': '#581745'
                },
                {
                  'n': 'La memoria del mondo',
                  'id': 'V015',
                  'c': '#00b1b3'
                },
                {
                  'n': 'Il castello dei destini incrociati',
                  'id': 'V016',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Gli amori difficili',
                  'id': 'V017',
                  'c': '#f0be96'
                },
                {
                  'n': 'Le città invisibili',
                  'id': 'V018',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Il castello dei destini incrociati (riedizione)',
                  'id': 'V019',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Eremita a Parigi',
                  'id': 'V020',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Se una notte d\'inverno un viaggiatore',
                  'id': 'V021',
                  'c': '#D6DBDF'
                },
                {
                  'n': 'Palomar',
                  'id': 'V022',
                  'c': '#94d2ba'
                },
                {
                  'n': 'Cosmicomiche vecchie e nuove',
                  'id': 'V023',
                  'c': '#f1634b'
                }
              ]

              return collections
            }

            function incrementDrawMode(drawMode)
            {
              if(drawMode >= 4)
              {
                return 1;
              }
              else return drawMode + 1;
            }

            function prepareMetaballData(json_nodes, collection, lineColor)
            {
              let flattened_steps = flatten_items_steps(json_nodes);

              let hillBases = flattened_steps
              .filter(function(d) {
                return d.first_elem && d.collections.includes(collection);
              });

              let hillBase_circles = hillBases.map(hillBase => ({
                p: { x: hillBase.x, y: hillBase.y },
                r: hillBase.r * 1.2,
                color: "blue",
                step: hillBase.step,
                id: hillBase.id }));

                let vertex_array = circles_to_vector_points(hillBase_circles);

                let alpha = 1000000;//150 * scale;
                let asq = alpha * alpha;

                var w = window.innerWidth;
                let h = window.innerHeight;

                let voronoi = d3.voronoi();

                let mesh = voronoi
                .triangles(vertex_array)
                .filter(
                  function(t)
                  {
                    return (
                      dsq(t[0], t[1]) < asq &&
                      dsq(t[0], t[2]) < asq &&
                      dsq(t[1], t[2]) < asq);
                    });

                    let boundary_points = boundary2(mesh);

                    if(!borderOrientationIsCounterclockwise(boundary_points[0]))
                    {
                      boundary_points[0] = boundary_points[0].reverse();
                    }

                    boundary_points = addWantedCoves(vertex_array, boundary_points);

                    if(boundary_points.length == 0) return;

                    let point_circle_map = new Map();

                    for(let i = 0; i < hillBase_circles.length; ++i)
                    {
                      point_circle_map[vertex_array[i]] = hillBase_circles[i];
                    }

                    let ordered_boundary_circles = boundary_points[0]
                    .slice(0, boundary_points_count(boundary_points))
                    .map((point) => {
                      return point_circle_map[point];
                    });

                    let nCirclesToBeDrawn = ordered_boundary_circles.length;
                    //      let nCirclesToBeDrawn = 1;

                    renderMetaballLogically(collection, ordered_boundary_circles, nCirclesToBeDrawn, lineColor);
                  }

                  function addWantedCoves(vertex_array, boundary_points)
                  {
                    if(boundary_points.length == 0) return [];

                    if(boundary_points_count(boundary_points) <= 3) return boundary_points;

                    let internal_points = arr_diff(vertex_array, boundary_points[0]);

                    let new_boundary_points = [];

                    for(let i = 0; i < boundary_points[0].length; ++i)
                    {
                      let next_index = i == boundary_points[0].length - 1 ? 0 : i + 1;

                      let p1 = boundary_points[0][i];
                      new_boundary_points.push(p1);

                      let p2 = boundary_points[0][next_index];

                      let boundary_dist = Math.sqrt(dsq(p1, p2));

                      let cove_points = [];

                      for(let i = 0; i < internal_points.length; ++i)
                      {
                        let ip = internal_points[i];

                        let distSum = Math.sqrt(dsq(p1, ip)) + Math.sqrt(dsq(p2, ip));

                        if(distSum / boundary_dist <= 1.2)
                        {
                          cove_points.push(ip);
                        }
                      }

                      let pointsToBeAdded = findShortestPointsPath(p1, cove_points, p2);

                      new_boundary_points = new_boundary_points.concat(pointsToBeAdded);
                    }

                    let result = [ new_boundary_points ];

                    return result;
                  }

                  function findShortestPointsPath(p1, points, p2)
                  {
                    let leftShortestPath = [];
                    let rightShortestPath = [];
                    const nPoints = points.length;

                    for(let i = 0; i < nPoints; ++i)
                    {
                      let distances = [];

                      points.forEach(point =>
                        {
                          distances.push({
                            point: point,
                            target: p1,
                            distance: Math.sqrt(dsq(p1, point))
                          });

                          distances.push({
                            point: point,
                            target: p2,
                            distance: Math.sqrt(dsq(point, p2))
                          });
                        });

                        const nearest_point = distances.reduce(function(prev, current) {
                          return (prev.distance < current.distance) ? prev : current;
                        });

                        if(nearest_point.target == p1)
                        {
                          leftShortestPath.push(nearest_point.point);
                          p1 = nearest_point.point;
                        }
                        else
                        {
                          rightShortestPath.unshift(nearest_point.point);
                          p2 = nearest_point.point;
                        }

                        points.splice(points.indexOf(nearest_point.point), 1);
                      }

                      let shortestPath = leftShortestPath.concat(rightShortestPath);

                      return shortestPath;
                    }

                    function renderMetaballLogically(collection, hillBaseCircles, nCirclesToBeDrawn, lineColor)
                    {
                      let nCircles = hillBaseCircles.length;

                      for(let i = 0; i < nCirclesToBeDrawn; ++i)
                      {
                        let predecessorCircle = hillBaseCircles[i == 0 ? nCircles - 1 : i - 1];

                        let centralCircle = hillBaseCircles[i];

                        let successorCircle = hillBaseCircles[i < nCircles-1 ? i + 1 : 0];

                        let lobe = metaball(predecessorCircle, centralCircle, successorCircle);

                        checkMapAndInsert(centralCircle.step, "metaballCorner", collection, true);
                        checkMapAndInsert(centralCircle.step, "lobe", collection, lobe);
                        checkMapAndInsert(centralCircle.step, "lobeColor", collection, lineColor);
                        centralCircle.step.x = centralCircle.p.x;
                        centralCircle.step.y = centralCircle.p.y;

                        let a = 6;
                      }
                    }

                    function checkMapAndInsert(obj, mapName, key, value)
                    {
                      if(obj[mapName] == undefined) obj[mapName] = new Map();

                      obj[mapName][key] = value;
                    }

                    function arr_diff(a1, a2)
                    {
                      let diff = [];

                      for(let i = 0; i < a1.length; ++i)
                      {
                        let elem = a1[i];

                        if(!a2.includesArray(elem))
                        {
                          diff.push(elem);
                        }
                      }

                      return diff;
                    }

                    function array_intersection(a1, a2)
                    {
                      let result = [];

                      if(a1 == undefined || a1.length == 0 || a2 == undefined || a2.length == 0) return result;

                      for(let i = 0; i < a1.length; ++i)
                      {
                        let item = a1[i];

                        if(a2.includes(item))
                        result.push(item);
                      }

                      return result;
                    }

                    function render(hillBases, hillBaseCircles, nCirclesToBeDrawn)
                    {
                      let nCircles = hillBaseCircles.length;

                      let svgContainer = d3.select("svg");

                      for(let i = 0; i < nCirclesToBeDrawn; ++i)
                      {
                        let predecessorCircle = hillBaseCircles[i == 0 ? nCircles - 1 : i - 1];

                        let centralCircle = hillBaseCircles[i];

                        let successorCircle = hillBaseCircles[i < nCircles-1 ? i + 1 : 0];

                        hillBases
                        .enter()
                        .append("circle")
                        .attr("cx", centralCircle.p.x)
                        .attr("cy", centralCircle.p.y)
                        .attr("r", 4)
                        .attr("fill", centralCircle.color);

                        let lobe = metaball(predecessorCircle, centralCircle, successorCircle);

                        hillBases
                        .enter()
                        .append("svg:path")
                        .attr("d", lobe)
                        .attr("fill", "none")
                        .attr("stroke", "red");
                      }
                    }

                    function angle(p1, p2)
                    {
                      let x = Math.atan2(p1.y - p2.y, p2.x - p1.x);

                      return x;
                    }

                    function dist(p1, p2)
                    {
                      return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
                    }

                    function normalizeNegativeAngle(angle)
                    {
                      while(angle < -Math.PI * 2)
                      {
                        angle += Math.PI;
                      }

                      return 2 * Math.PI + angle;
                    }

                    function normalizePositiveAngle(angle)
                    {
                      while(2 * Math.PI < angle)
                      {
                        angle -= 2 * Math.PI;
                      }

                      return angle;
                    }

                    function normalizeAngle(angle)
                    {
                      if(angle < 0) return normalizeNegativeAngle(angle);
                      else return normalizePositiveAngle(angle);
                    }

                    function getCirclePoint(center, angle, radius)
                    {
                      return {
                        x: center.x + Math.cos(angle) * radius,
                        y: center.y - Math.sin(angle) * radius,
                        center: center,
                        angle: normalizeAngle(angle),
                        radius: radius
                      };
                    }

                    function getCircleJoint(
                      circle1,
                      circle2,
                      v)
                      {
                        const center1 = circle1.p;
                        const radius1 = circle1.r;
                        const center2 = circle2.p;
                        const radius2 = circle2.r;

                        const d = dist(center1, center2);

                        let u1;

                        if (d < radius1 + radius2) {
                          u1 = Math.acos(
                            (radius1 * radius1 + d * d - radius2 * radius2) / (2 * radius1 * d),
                          );
                        } else { // Else set u1 and u2 to zero
                          u1 = 0;
                        }

                        const angleBetweenCenters = angle(center1, center2);
                        const maxSpread = Math.acos((radius1 - radius2) / d);

                        const angle1 = angleBetweenCenters + u1 + (maxSpread - u1) * v;

                        const p1 = getVector(center1, angle1, radius1);

                        return p1;
                      }

                      function getCircleJoint2(
                        circle1,
                        circle2,
                        v)
                        {
                          const angleBetweenCenters = angle(circle1.p, circle2.p);
                          const distanceBetweenCenters = dist(circle1.p, circle2.p);

                          const maxSpreadCalculated = Math.acos((circle1.r - circle2.r) / distanceBetweenCenters);
                          const maxSpread = normalizeAngle(maxSpreadCalculated);
                          const spread = maxSpread * circle1.r / (circle1.r + circle2.r) * 1.5;

                          const jointAngle = normalizeAngle(angleBetweenCenters - spread);

                          const joint = getCirclePoint(circle1.p, jointAngle, circle1.r);

                          return joint;
                        }

                        function getCircleJoint3(
                          circle1,
                          circle2,
                          v)
                          {
                            const angleBetweenCenters = angle(circle1.p, circle2.p);
                            const distanceBetweenCenters = dist(circle1.p, circle2.p);

                            const maxSpreadCalculated = Math.acos((circle1.r - circle2.r) / distanceBetweenCenters);
                            const maxSpread = normalizeAngle(maxSpreadCalculated);
                            const spread = maxSpread * circle1.r / (circle1.r + circle2.r) * 1.5;

                            const jointAngle = normalizeAngle(angleBetweenCenters + spread);

                            const joint = getCirclePoint(circle1.p, jointAngle, circle1.r);

                            return joint;
                          }

                          function calculate_u(circle1, circle2)
                          {
                            const center1 = circle1.p;
                            const radius1 = circle1.r;

                            const center2 = circle2.p;
                            const radius2 = circle2.r;

                            const HALF_PI = Math.PI / 2;
                            const d = dist(center1, center2);
                            const maxDistFactor = 50; // 2.5
                            const maxDist = (radius1 + radius2) * maxDistFactor;
                            let u1, u2;

                            // No blob if a radius is 0
                            // or if distance between the circles is larger than max-dist
                            // or if circle2 is completely inside circle1
                            if (radius1 === 0 || radius2 === 0 || d > maxDist || d <= Math.abs(radius1 - radius2)) {
                              return [0, 0];
                            }

                            // Calculate u1 and u2 if the circles are overlapping
                            if (d < radius1 + radius2) {
                              let u1Calculated = Math.acos(
                                (radius1 * radius1 + d * d - radius2 * radius2) / (2 * radius1 * d),
                              );
                              u1 = normalizeAngle(u1Calculated);
                              let u2Calculated = Math.acos(
                                (radius2 * radius2 + d * d - radius1 * radius1) / (2 * radius2 * d),
                              );
                              u2 = normalizeAngle(u2Calculated);
                            } else { // Else set u1 and u2 to zero
                              u1 = 0;
                              u2 = 0;
                            }

                            return [u1, u2];
                          }

                          function metaball(
                            predecessorCircle,
                            centralCircle,
                            successorCircle,
                            handleSize = 2.4,
                            v = 0.5)
                            {
                              const predecessorCentralCenterDistance = dist(predecessorCircle.p, centralCircle.p);

                              const maxSpread = Math.cos((predecessorCircle.r - centralCircle.r) / predecessorCentralCenterDistance);

                              let predecessorCentral_u_values = calculate_u(predecessorCircle, centralCircle);

                              let u1 = predecessorCentral_u_values[0];

                              const angleBetweenPredecessorCentralCenters = angle(predecessorCircle.p, centralCircle.p);

                              // Angles for the points
                              const angle1 = angleBetweenPredecessorCentralCenters + u1 + (maxSpread - u1) * v;

                              let centralSuccessor_u_values = calculate_u(centralCircle, successorCircle);

                              let u2 = predecessorCentral_u_values[1];

                              const angleBetweenCentralSuccessorCenters = angle(centralCircle.p, successorCircle.p);

                              const angle3 = normalizeAngle(-(angleBetweenPredecessorCentralCenters + Math.PI - u2 - (Math.PI - u2 - maxSpread) * v));


                              let svgContainer = d3.select("svg");

                              // Point locations
                              const p1 = getCircleJoint2(predecessorCircle, centralCircle, v);

                              const p3 = getCircleJoint3(centralCircle, predecessorCircle, v);

                              const p4 = getCircleJoint2(centralCircle, successorCircle, v);

                              // Define handle length by the distance between both ends of the curve
                              const totalRadius = predecessorCircle.r + centralCircle.r;

                              const d2Base = Math.min(v * handleSize, dist(p1, p3) / totalRadius);


                              const HALF_PI = Math.PI / 2;

                              // Handle locations
                              const h1 = getCirclePoint(p1, HALF_PI + p1.angle, predecessorCircle.r);

                              const h3 = getCirclePoint(p3, p3.angle - HALF_PI, centralCircle.r);

                              const p3_p4_angle = normalizeAngle(p4.angle - p3.angle);

                              return metaballArc(p1, p3, p4, h1, h3, p3_p4_angle > Math.PI, centralCircle.r);
                            }

                            function metaballToPath(p1, p2, p3, p4, h1, h2, h3, h4, escaped, r)
                            {
                              let s =
                              'M' + p1.x + ' ' + p1.y + ' ' +
                              cubic1Path(p3, h1, h3) +
                              circleArcPath(p4, escaped, r) +
                              cubic2Path(p2, h2, h4);

                              return s;
                            }

                            function metaballArc(p1, p3, p4, h1, h3, largeArc, r)
                            {
                              let s =
                              'M' + p1.x + ' ' + p1.y + ' ' +
                              cubic1Path(p3, h1, h3)

                              +
                              circleArcPath(p4, largeArc, r);

                              return s;
                            }

                            function cubic1Path(p3, h1, h3)
                            {
                              return 'C' + h1.x + ' ' + h1.y + ', ' + h3.x + ' ' + h3.y + ', ' + p3.x + ' ' + p3.y + ' ';
                            }

                            function circleArcPath(p4, escaped, r)
                            {
                              return 'A' + r + ' ' + r + ' ' + 0 + ' ' + (escaped ? 1 : 0) + 0 + ' ' + p4.x + ' ' + p4.y + ' ';
                            }

                            function circleArcPath2(p4, largeArc, r)
                            {
                              return 'A' + r + ' ' + r + ' ' + 0 + ' ' + (largeArc ? 1 : 0) + ' ' + 0 + ' ' + p4.x + ' ' + p4.y + ' ';
                            }

                            function cubic2Path(p2, h2, h4)
                            {
                              return 'C' + h4.x + ' ' + h4.y + ', ' + h2.x + ' ' + h2.y + ', ' + p2.x + ' ' + p2.y;
                            }

                            function offset_circles(circles, dx, dy)
                            {
                              return circles.map((circle) => { return { p: { x: circle.p.x + dx, y: circle.p.y + dy }, r: circle.r, color: circle.color }; });
                            }

                            function circles_to_vector_points(circles)
                            {
                              return circles.map((circle) => {
                                let coords = [ circle.p.x, circle.p.y ];
                                coords.id = circle.id;
                                return coords;
                              });
                            }

                            function vectorPoint_to_namedCoordPoint(point)
                            {
                              return { x: point[0], y: point[1] };
                            }

                            function ascendingCoords(a, b)
                            {
                              return a[0] === b[0] ? b[1] - a[1] : b[0] - a[0];
                            }

                            function offset_vector_points(vector_points, dx, dy)
                            {
                              return vector_points.map((vector_point) => { return [vector_point[0] + dx, vector_point[1] + dy]; });
                            }

                            function dsq(a, b)
                            {
                              const dx = a[0] - b[0];
                              const dy = a[1] - b[1];

                              return dx * dx + dy * dy;
                            }

                            function boundary(mesh)
                            {
                              let counts = {};
                              let edges = {};
                              let r;
                              let result = [];

                              mesh.forEach(
                                function(triangle)
                                {
                                  for(let i = 0; i < 3; ++i)
                                  {
                                    let edge = [ triangle[i], triangle[(i + 1) % 3]].sort(ascendingCoords).map(String);
                                    (edges[edge[0]] = (edges[edge[0]] || [])).push(edge[1]);
                                    (edges[edge[1]] = (edges[edge[1]] || [])).push(edge[0]);
                                    let k = edge.join(":");
                                    if(counts[k]) delete counts[k];
                                    else counts[k] = 1;
                                  }
                                });

                                while(1)
                                {
                                  let k = null;

                                  for(k in counts) break;

                                  if(k == null) break;

                                  result.push(r = k.split(":").map(function(d) { return d.split(",").map(Number); }));
                                  delete counts[k];

                                  let q = r[1];

                                  while(q[0] !== r[0][0] || q[1] !== r[0][1])
                                  {
                                    let p = q;
                                    let qs = edges[p.join(",")];
                                    let n = qs.length;

                                    for(let i = 0; i < n; ++i)
                                    {
                                      q = qs[i].split(",").map(Number);

                                      let edge = [p, q].sort(ascendingCoords).join(":");

                                      if(counts[edge])
                                      {
                                        delete counts[edge];
                                        r.push(q);

                                        break;
                                      }
                                    }
                                  }
                                }

                                return result;
                              }

                              function boundary2(mesh)
                              {
                                let counts = {};
                                let edges = {};
                                let r;
                                let result = [];
                                let pointMap = new Map();

                                mesh.forEach(
                                  function(triangle)
                                  {
                                    for(let i = 0; i < 3; ++i)
                                    {
                                      let edge = [ triangle[i], triangle[(i + 1) % 3]].sort(ascendingCoords).map(point => { pointMap[point.id] = point; return point.id; });

                                      edges[edge[0]] = (edges[edge[0]] || []);

                                      if(!edges[edge[0]].includes(edge[1]))
                                      edges[edge[0]].push(edge[1]);

                                      edges[edge[1]] = (edges[edge[1]] || []);

                                      if(!edges[edge[1]].includes(edge[0]))
                                      edges[edge[1]].push(edge[0]);

                                      let k = edge.sort().join(":");
                                      if(counts[k]) delete counts[k];
                                      else counts[k] = 1;
                                    }
                                  });

                                  while(1)
                                  {
                                    let k = null;

                                    for(k in counts) break;

                                    if(k == null) break;

                                    result.push(r = k.split(":"));
                                    delete counts[k];

                                    let q = r[1];

                                    while(q !== r[0])
                                    {
                                      let p = q;
                                      let qs = edges[p];
                                      let n = qs.length;

                                      for(let i = 0; i < n; ++i)
                                      {
                                        q = qs[i];

                                        let edge = [p, q].sort().join(":");

                                        if(counts[edge])
                                        {
                                          delete counts[edge];
                                          r.push(q);

                                          break;
                                        }
                                      }
                                    }
                                  }

                                  let transformed_array = r.map(id => pointMap[id]);

                                  return [ transformed_array ];
                                }

                                function boundary_points_count(boundary_points)
                                {
                                  return boundary_points[0].length - 1;
                                }

                                function pointsBarycenter(points)
                                {
                                  const barycenter =
                                  {
                                    x: points.reduce((p1, p2) => ({ x: p1.x + p2.x })).x / points.length,
                                    y: points.reduce((p1, p2) => ({ y: p1.y + p2.y })).y / points.length
                                  };

                                  return barycenter;
                                }

                                // returns true for counterclockwise, false for clockwise
                                function borderOrientationIsCounterclockwise(points)
                                {
                                  const namedCoordPoints = points.map(vectorPoint_to_namedCoordPoint);

                                  const barycenter = pointsBarycenter(namedCoordPoints);

                                  const angles = namedCoordPoints.map(point => normalizeAngle(angle(barycenter, point)));

                                  const minAngle = Math.min(...angles);

                                  const indexOfMin = angles.indexOf(minAngle);

                                  //      let angles2 = angles.rotate(-indexOfMin);
                                  angles.unshift(angles.splice(-indexOfMin, this.length));

                                  return angles[2] > angles[1];
                                }
                                /*
                                function getDataRelativeYear(d)
                                {
                                const startYear = 1943;

                                const relativeYear = +(d.attributes.first_publication) - startYear;

                                return relativeYear;
                              }
                              */
                              function prepareTimeline(json_nodes, col_collections)
                              {

                                let margin = { top: 10, right: 5, bottom: 30, left: 10 };

                                data.timeline_width = d3.select('#timeline').node().getBoundingClientRect().width - margin.left - margin.right;
                                data.timeline_height = d3.select('#timeline').node().getBoundingClientRect().height - margin.top - margin.bottom;

                                let timelineSvg = d3
                                .select("#timeline")
                                .attr("width", data.timeline_width + margin.left + margin.right)
                                .attr("height", data.timeline_height + margin.top + margin.bottom);

                                let cell_group = timelineSvg.append("g")
                                .attr("class", "cell_group")
                                .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

                                let brushGroup = timelineSvg.append("g").attr("transform", "translate("+margin.left+"," + 0 + ")")

                                let x_time_ext = d3.extent(json_nodes, d => d.attributes.first_publication);
                                x_time_ext[0] = +x_time_ext[0]-1;
                                x_time_ext[1] = +x_time_ext[1]+1;

                                data.timeline_x = d3
                                .scaleLinear()
                                .rangeRound([0, (data.timeline_width - margin.left - margin.right)])
                                .domain(x_time_ext);

                                // data.timeline_y = d3
                                //   .scaleLinear()
                                //   .range([data.timeline_height, 0]);

                                let minCircleRadius = 3;
                                let maxCircleRadius = 20;

                                let dmax = d3.max(json_nodes, d => +d.attributes.txt_length);

                                let rscale = d3
                                .scaleLinear()
                                .range([minCircleRadius, maxCircleRadius])
                                .domain([0, dmax]);

                                let simulation = d3
                                .forceSimulation(json_nodes)
                                .force("x", d3.forceX(d => data.timeline_x(d.attributes.first_publication)).strength(1))
                                .force("y", d3.forceY(data.timeline_height / 2))
                                .force("collide", d3.forceCollide(d => rscale(d.attributes.txt_length) + 1))
                                .stop();

                                for(let i = 0; i < 120; ++i) simulation.tick();

                                timelineSvg
                                .append("g")
                                .attr("class", "axis axis--x")
                                .attr("transform", "translate("+margin.left+"," + (data.timeline_height) + ")")
                                .call(d3
                                  .axisBottom(data.timeline_x)
                                  .ticks(41, "0")
                                );

                                let cell = cell_group
                                .append("g")
                                .attr("class", "cells")
                                .selectAll(".cell_node")
                                .data(d3
                                  .voronoi()
                                  .extent([[0, 0], [data.timeline_width, data.timeline_height]])
                                  .x(d => d.x)
                                  .y(d => d.y)
                                  .polygons(json_nodes))
                                  .enter()
                                  .append("g");
                                  /*
                                  const yearPointStep = 20;

                                  const height = 200;

                                  cell
                                  .append("circle")
                                  .attr("r", 3)
                                  .attr("cx", d => {
                                  let relative_year = +(d.attributes.first_publication) - startYear;

                                  return relative_year * yearPointStep;
                                })
                                .attr("cy", d => height / 2);
                                */

                                let colls = getCollections().map(c => c.id);

                                data.timeline_dot = cell
                                .append("circle")
                                .attr("r", d => {
                                  d.data.attributes.collections = d.data.attributes.collections.reverse();
                                  return rscale(+d.data.attributes.txt_length);
                                })
                                .attr("cx", d => d.data.x)
                                .attr("cy", d => d.data.y)
                                .attr("fill", d => d.data.attributes.collections.length ? col_collections(d.data.attributes.collections[0]) : "#FFFFFF")
                                .attr("stroke", d => { if(d.data.attributes.collections.length) {
                                  if(colls.includes(d.data.attributes.collections[0])) {
                                    return "none";
                                  }
                                  else return "#000000";
                                }
                                else return "#000000" });

                                data.brush = d3
                                .brushX()
                                .extent([[0, 5], [data.timeline_width-margin.left-margin.right, data.timeline_height-5]])
                                .on("start brush", brushed);

                                brushGroup
                                .call(data.brush)
                                .call(data.brush.move, [data.timeline_x.domain()[0], data.timeline_x.domain()[1]].map(data.timeline_x))
                                .selectAll(".overlay")
                                .each(d => d.type = "selection")
                                .on("mousedown touchstart", brushcentered);

                                d3.select('.handle--e').style('stroke-dasharray',`0,6,${data.timeline_height-4},117`)
                                d3.select('.handle--w').style('stroke-dasharray',`0,${data.timeline_height+6+6},0`)

                                /*
                                cell
                                .append("path")
                                .attr("d", d => "M" + d.join("L") + "Z");
                                */
                                cell
                                .append("title")
                                .text(d => d.data.id + "\n" + d.data.first_publication);
                              }

                              function brushcentered()
                              {
                                let dx = data.timeline_x(1) - data.timeline_x(0);
                                let cx = d3.mouse(this)[0];
                                let x0 = cx - dx / 2;
                                let x1 = cx + dx / 2;

                                d3
                                .select(this.parentNode)
                                .call(data.brush.move, x1 > data.timeline_width ? [data.timeline_width - dx, data.timeline_width] : x0 < 0 ? [0, dx] : [x0, x1]);
                              }

                              function brushed()
                              {
                                data.extent = d3.event.selection.map(data.timeline_x.invert, data.timeline_x);
                                //console.log(extent);

                                applyBeeSwarmFilter();
                              }

                              function applyBeeSwarmFilter()
                              {
                                d3
                                .selectAll('g.node')
                                .each(function(d)
                                {
                                  if(+d.attributes.first_publication >= data.extent[0] && +d.attributes.first_publication <= data.extent[1])
                                  {
                                    d3.select(this).style("opacity", 1);
                                  }
                                  else
                                  {
                                    d3.select(this).style("opacity", 0.3);
                                  }
                                });
                              }
