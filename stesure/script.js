var ganttSvg = d3.select("#gantt svg"),
    brushSvg = d3.select("#brush svg"),

    margin = { top: 20, right: 20, bottom: 110, left: 200 },
    margin2 = { top: 0, right: 0, bottom: 18, left: 0 },
    width = +ganttSvg.node().getBoundingClientRect().width - margin.left - margin.right,
    height = +ganttSvg.node().getBoundingClientRect().height - margin.top - margin.bottom,
    height2 = +brushSvg.node().getBoundingClientRect().height - margin2.top - margin2.bottom;

var x = d3.scaleTime().range([0, width]),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleBand().range([height, 0]).paddingInner(0.5),
    y2 = d3.scaleBand().range([height2, 0]);

var xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y);

var brush = d3.brushX()
    .extent([
        [0, 0],
        [width, height2]
    ])
    .on("brush end", brushed);

var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([
        [0, 0],
        [width, height]
    ])
    .extent([
        [0, 0],
        [width, height]
    ])
    .on("zoom", zoomed);

ganttSvg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

var focus = ganttSvg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = brushSvg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));

    focus.select(".axis--x").call(xAxis);
    focus.selectAll('.group line')
        .attr('x1', x(x.domain()[0]))
        .attr('x2', x(x.domain()[1]))

    focus.selectAll('.stesura')
        .attr('x', function(d) {
            if (d.start) {
                return x(d.start)
            } else {
                return 0;
            }
        })
        .attr('width', function(d) {
            let thisWidth = x(d.end) - x(d.start);
            if (thisWidth >= 0) {
                return thisWidth
            } else {
                return 0
            }
        })

    focus.selectAll('.symbol')
        .attr('transform', function(d) {
            return 'translate(' + x(d.publication) + ',' + y.bandwidth() / 2 + ')';
        })

    ganttSvg.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
}

function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());
    // focus.select(".area").attr("d", area);
    focus.select(".axis--x").call(xAxis);
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

function update(data) {
    // console.log(data);

    let gruppi = data.info.elements.filter(function(d) { return d.gruppo })

    let pubblicazioni = d3.nest()
        .key(function(d) { return d.pubblicazione })
        .rollup(function(v) {
            let newValues = []
            v.map(function(d) {
                if (d.tipologia != 'ibidem') {
                    newValues.push(d);
                }
            })
            return newValues
        })
        .entries(data.pubblicazioni.elements)

    let groups = pubblicazioni.filter(function(d) {
        let index = gruppi.map(function(e) { return e.id }).indexOf(d.key)
        return index > -1;
    })

    let xDomain = [];
    data.stesure.elements.forEach(function(d) {
        if (d.start) xDomain.push(d.start);
        if (d.end) xDomain.push(d.end);
    })
    data.pubblicazioni.elements.forEach(function(d) {
        if (d.publication) xDomain.push(d.publication);
    })
    x.domain(d3.extent(xDomain));

    y.domain(groups.map(function(d) { return d.key }));
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());





    let group = focus.selectAll('.group')

    group = group.data(groups, function(d) { d.key });

    group.exit().remove();

    group = group.enter().append('g')
        .attr('class', function(d) { return 'group ' + d.key })
        .merge(group)
        .attr('transform', function(d) { return 'translate(0,' + y(d.key) + ')' })
        .on('click', function(d){
          console.log(d);
        })

    group.append('line')
        .attr('y1', y.bandwidth() / 2)
        .attr('y2', y.bandwidth() / 2)
        .attr('x1', x(x.domain()[0]))
        .attr('x2', x(x.domain()[1]))

    group.append('path')
        .attr('class', 'symbol')
        .attr("d", function(d) {
            var symbol = d3.symbol().size(100);
            return symbol.type(d3['symbolCross'])();
        })
        .attr('transform', function(d) {
            if (!d.publication) {
                let thisPublication = data.pubblicazioni.elements.filter(function(e) {
                    return e.id == d.key;
                })[0]
                d.publication = thisPublication.publication;
            }
            return 'translate(' + x(d.publication) + ',' + y.bandwidth() / 2 + ')';
        })



    group.each(function(d, i) {

        let stesura = d3.select(this).selectAll('rect');

        let datiStesure = [];

        d.value.forEach(function(e) {
            let stesureComposizione = data.stesure.elements.filter(function(f) { return f.id == e.id; })
            stesureComposizione.forEach(function(g) { datiStesure.push(g); })
        })

        // console.log(datiStesure)

        stesura = stesura.data(datiStesure);

        stesura.exit().remove();

        stesura.enter().append('rect')
            .attr('class', 'stesura')
            .attr('height', y.bandwidth())
            .style('opacity', function(d){
              if (d.precision_start == 'day' && d.precision_end == 'day') {
                return .9
              } else {
                return .2
              }
            })
            .style('fill', '#FF5733')
            .attr('y', 0)
            .attr('x', function(d) {
                if (d.start) {
                    return x(d.start)
                } else {
                    return -10;
                }
            })
            .attr('width', function(d) {
                let thisWidth = x(d.end) - x(d.start);
                if (thisWidth >= 0) {
                    return thisWidth
                } else {
                    return 10
                }
            })

    })


    // // make scrollwheel zoom unactive
    // ganttSvg.append("rect")
    //     .attr("class", "zoom")
    //     .attr("width", width)
    //     .attr("height", height)
    //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    //     .call(zoom);
}

var parseDate = d3.timeParse("%Y-%m-%d");

function init() {
    Tabletop.init({
        key: 'https://docs.google.com/spreadsheets/d/1scAZdBWZjjboRtQlpvsWUDP52wydzxo1bLKIV07j-_Q/edit?usp=sharing',
        callback: function(data, tabletop) {

            data.stesure.elements.forEach(function(d) {
                // start
                d.precision_start = 'none';
                if (d.start_year) {
                    d.precision_start = 'year';
                    if (d.start_month) {
                        d.precision_start = 'month';
                        if (d.start_month.length < 2) {
                            d.start_month = '0' + d.start_month
                        }
                        if (d.start_day) {
                            d.precision_start = 'day';
                            if (d.start_day.length < 2) {
                                d.start_day = '0' + d.start_day
                            }
                            var dateString = d.start_year + '-' + d.start_month + '-' + d.start_day;
                            d.start = parseDate(dateString);
                        } else {
                            var dateString = d.start_year + '-' + d.start_month + '-01';
                            d.start = parseDate(dateString);
                        }
                    } else {
                        var dateString = d.start_year + '-01-01';
                        d.start = parseDate(dateString);
                    }
                } else {
                    d.start = undefined;
                }
                // end
                d.precision_end = 'none';
                if (d.end_year) {
                    d.precision_end = 'year';
                    if (d.end_month) {
                        d.precision_end = 'month';
                        if (d.end_month.length < 2) {
                            d.end_month = '0' + d.end_month
                        }
                        if (d.end_day) {
                            d.precision_end = 'day';
                            if (d.end_day.length < 2) {
                                d.end_day = '0' + d.end_day
                            }
                            var dateString = d.end_year + '-' + d.end_month + '-' + d.end_day;
                            d.end = parseDate(dateString);
                        } else {
                            var dateString = d.end_year + '-' + d.end_month + '-28';
                            d.end = parseDate(dateString);
                        }
                    } else {
                        var dateString = d.end_year + '-12-28';
                        d.end = parseDate(dateString);
                    }
                } else {
                    d.end = undefined;
                }
                // console.log(d.end);
            })

            data.pubblicazioni.elements.forEach(function(d) {
                d.precision_publication = 'none';
                d.publication = undefined;
                if (d.year) {
                    d.precision_publication = 'year';
                    if (d.month) {
                        d.precision_publication = 'month';
                        if (d.day) {
                            d.precision_publication = 'day';
                            var dateString = d.year + '-' + d.month + '-' + d.day;
                            d.publication = parseDate(dateString);
                        } else {
                            var dateString = d.year + '-' + d.month + '-28';
                            d.publication = parseDate(dateString);
                        }
                    } else {
                        var dateString = d.year + '-12-31';
                        d.publication = parseDate(dateString);
                    }
                }
                // console.info(d.publication);
            })
            // console.table(data.info.elements);
            // console.table(data.stesure.elements);
            // console.table(data.pubblicazioni.elements);
            update(data);
        },
        simpleSheet: false
    })
}
window.addEventListener('DOMContentLoaded', init)