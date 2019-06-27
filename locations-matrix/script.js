var container = d3.select('#matrix-container');
var svg = d3.select('#matrix');
var g = svg.append('g');
var link = g.append('g').classed('links', true).selectAll('.link');
var node = g.append('g').classed('nodes', true).selectAll('.node');

var categories = [
	'generico_non_terrestre',
	'nominato_non_terrestre',
	'nominato_terrestre',
	'generico_terrestre',
	'inventato',
	'no_ambientazione'
]
var minRadius = 3;

var w = container.node().getBoundingClientRect().width;
var h = container.node().getBoundingClientRect().height;
var margin = {
	'top': 50,
	'right': 50,
	'bottom': 50,
	'left': 50
}

svg.attr('width', w)
	.attr('height', h);

var x = d3.scaleLinear()
	.range([0 + margin.left, w - margin.right]);

var y = d3.scalePoint()
	.range([0 + margin.top, h - margin.bottom]);

var r = d3.scalePow().exponent(0.5)
	.domain([0, 82])
	.range([0, 82]);

var color = d3.scaleOrdinal()
	.domain(categories)
	.range(d3.schemeCategory10)

var nodes = [],
	links = [];

var simulation = d3.forceSimulation(nodes)
	// .force("charge", d3.forceManyBody().strength(-0.5))
	.force("link", d3.forceLink(links).strength(function(d) {
		// console.log(d)
		return d.kind == 'same_text' ? 0 : .2;
	}).distance(10).id(function(d) { return d.id; }))
	.force("x", d3.forceX(function(d) { return d.x }).strength(function(d) {
		return d.part_of == '' ? 0.3 : 0;
	}))
	.force("y", d3.forceY(function(d) { return d.y }).strength(function(d) {
		return d.part_of == '' ? 0.3 : 0;
	}))
	.force("collision", d3.forceCollide(minRadius + 1).iterations(4).strength(0))
	.on("tick", ticked);

function restart() {
	// Apply the general update pattern to the nodes.
	node = node.data(nodes, function(d) { return d.id; });
	node.exit().remove();
	node = node.enter().append("circle")
		.classed('node', true)
		.attr("fill", function(d) { return color(d.category) })
		.attr('stroke', function(d) { if(d.part_of) return 'black' })
		.attr("r", minRadius)
		.attr("cx", function(d) { return d.x })
		.attr("cy", function(d) { return d.y })
		.on('click', d => console.log(d))
		.merge(node);

	// Apply the general update pattern to the links.
	link = link.data(links, function(d) {
		return d.source.id + "-" + d.target.id;
	});
	link.exit().remove();
	link = link.enter().append("line")
		.classed('link', function(d) { return d.kind == 'part_of' })
		.on('click', d => console.log(d))
		.merge(link);

	// Update and restart the simulation.
	simulation.nodes(nodes);
	simulation.force("link").links(links);
	simulation.alpha(1).restart();
}

function ticked() {
	node.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

    if (simulation.alpha() < 0.5 && simulation.force('collision').strength() == 0) {
        console.log('ye')
        simulation.force('collision').strength(0.5)
    }
}

Promise.all([
	d3.tsv('data.tsv')
]).then(function(data) {
	var locations = data[0]//.filter(function(d) { return d.year == '1972' });

	locations.forEach(function(d) {
		if(!d.id) { d.id = d['data.id'] }
	})

	x.domain(d3.extent(locations, function(d) { return d.year }));
	y.domain(categories);

	console.log(locations[90]);

	let graph = calculateNetwork(locations);

	nodes = graph.nodes;
	links = graph.edges;
	restart();
})

function calculateNetwork(data) {
	var nodes = data.map(function(d) {
		var obj = {
			'id': d.id,
			'label': d['Occorrenza'],
			'part_of': d['Parte di ID'],
			'source': d['Fonte'],
			'year': +d.year,
			'category': d['Categoria'],
			// set x and y to make nodes appera in the precise position
			'x': x(d.year),
			'y': y(d['Categoria'])
		}
		return obj
	})

	// create the array of edges
	var edges = []
	// base edges on works co-occurrences of places
	var sources = d3.nest()
		.key(function(d) { return d.source })
		.entries(nodes)
		.forEach((d) => {

            //removing links that are not hierarchical increase performance A LOT

			// d.values.filter(function(e) {
			// 	return e.part_of == '';
			// }).forEach((n, i) => {
			// 	if(i < d.values.length - 1) {
			// 		for(var k = i + 1; k <= d.values.length - 1; k++) {
			// 			var obj = {}
			// 			obj = {
			// 				'source': n.id,
			// 				'target': d.values[k].id,
			// 				'volume': d.key,
			// 				// 'year': n.year,
			// 				'source_part_of': n.part_of,
			// 				'kind': 'same_text'
			// 			}
			// 			edges.push(obj);
			// 		}
			// 	}
			// })

			d.values.filter(function(e) {
				return e.part_of != '';
			}).forEach((n, i) => {
				var obj = {}
				obj = {
					'source': n.id,
					'target': n.part_of,
					'volume': d.key,
					// 'year': n.year,
					'source_part_of': n.part_of,
					'kind': 'part_of'
				}
				edges.push(obj);
			})
		})
	return { 'nodes': nodes, 'edges': edges }
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}