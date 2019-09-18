
function calculate_jellyfishes_offset(jellyfish1, jellyfish2)
{
  if(jellyfish1.children.length == 0 || jellyfish2.children.length == 0) return 0;

  let border_map1 = calculate_jellyfish_border_map(jellyfish1);
  let border_map2 = calculate_jellyfish_border_map(jellyfish2);

  let shared_levels = Math.min(border_map1.length, border_map2.length);

  let min_offset_found = 0;

  for(let i = 0; i < shared_levels; ++i)
  {
    let border1 = border_map1[i];
    let border2 = border_map2[i];

    min_offset_found = Math.max(min_offset_found, border1.right + Math.abs(border2.left));
  }

  return min_offset_found;
}

function calculate_width(hierarchy)
{
  if(hierarchy.children.length == 0) return 1;
  else
  {
    let children_total = 0;

    for(let i = 0; i < hierarchy.children.length; ++i)
    {
      children_total += calculate_width(hierarchy.children[i]);
    }

    return children_total;
  }
}

function calculate_continuous_extension(hierarchy)
{
  let direct_child_gap = 1;
  let hierarchy_gap = 1;

  if(hierarchy.children.length == 0) return 0;
  else if(hierarchy.children.every(d => d.children.length == 0)) return (hierarchy.children.length - direct_child_gap);
  else
  {
    let total = 0;

    for(let i = 0; i < hierarchy.children.length; ++i)
    {
      total += calculate_continuous_extension(hierarchy.children[i]);
    }

    total += hierarchy_gap * (hierarchy.children.length - 1);

    return total;
  }
}

function process_hierarchy(hierarchy, x, y)
{
  let jellyfish = {
    caption : hierarchy.caption,
    type : hierarchy.type,
    position : { x : x, y : y },
    children : []
  };

  switch(hierarchy.type)
  {
      case "generico_terrestre"     : jellyfish.color = "orange";   break;
      case "generico_non_terrestre" : jellyfish.color = "red";  break;
      case "nominato_terrestre"     : jellyfish.color = "dodgerblue"; break;
      case "nominato_non_terrestre" : jellyfish.color = "blue";  break;
      case "inventato"              : jellyfish.color = "fuchsia"; break;
      case "no_ambientazione"       : jellyfish.color = "darkgrey";  break;
  }

  let progressive_x = x;
  hierarchy.children.forEach(d => {
    jellyfish.children.push(process_hierarchy(d, progressive_x, y + 1))
    progressive_x = progressive_x + calculate_width(d);
  });

  return jellyfish;
}

function process_hierarchy_continuously(hierarchy, x, y)
{
  let jellyfish = {
    text_id : hierarchy.text_id,
    node_id : hierarchy.node_id,
    caption : hierarchy.caption,
    level : hierarchy.level,
    basal_type : hierarchy.basal_type,
    local_type : hierarchy.local_type,
    logical_position : { x : x, y : y },
    stripe_position : { x : 0, y : 0 },
    circle_position : { x : 0, y : 0 },
    children : []
  };

  switch(hierarchy.basal_type)
  {
      case "generico_terrestre"     : jellyfish.color = "orange";   break;
      case "generico_non_terrestre" : jellyfish.color = "red";  break;
      case "nominato_terrestre"     : jellyfish.color = "dodgerblue"; break;
      case "nominato_non_terrestre" : jellyfish.color = "blue";  break;
      case "inventato"              : jellyfish.color = "fuchsia"; break;
      case "no_ambientazione"       : jellyfish.color = "darkgrey";  break;
  }

  let hierarchy_gap = 1;
  let absolute_progressive_x = x;
  let relative_progressive_x = 0;

  for(let i = 0; i < hierarchy.children.length; ++i)
  {
    jellyfish.children.push(process_hierarchy_continuously(hierarchy.children[i], absolute_progressive_x, y + 1));

    let delta = 0;

    if(i < hierarchy.children.length - 1) delta += hierarchy_gap;

    delta += calculate_continuous_extension(hierarchy.children[i]);

    relative_progressive_x += delta;
    absolute_progressive_x += delta;
  }

  jellyfish.logical_position.x = x + relative_progressive_x / 2;

  return jellyfish;
}

function visit(hierarchy, status, processItem)
{
  processItem(hierarchy, status);

  hierarchy.children.forEach(d => visit(d, status, processItem));
}

function visit_level(hierarchy, level, status, processItem)
{
  if(+hierarchy.level > level) return;
  else if(+hierarchy.level == level) processItem(hierarchy, level, status);
  else hierarchy.children.forEach(d => visit_level(d, level, status, processItem));
}

function get_max_level(hierarchy)
{
  var max_level = 0;

  visit(
    hierarchy,
    max_level,
    d => {
      max_level = Math.max(max_level, +d.level);
    });

  return max_level;
}

function visit_levels(hierarchy, status, processItem)
{
  let max_level = get_max_level(hierarchy);

  for(let level = 0; level <= max_level; ++level)
  {
    visit_level(
      hierarchy,
      level,
      status,
      processItem);
  }
}

function prepare_for_graphics(jellyfish)
{
  switch(jellyfish.basal_type)
  {
      case "generico_terrestre"     : jellyfish.color = "orange";   break;
      case "generico_non_terrestre" : jellyfish.color = "red";  break;
      case "nominato_terrestre"     : jellyfish.color = "dodgerblue"; break;
      case "nominato_non_terrestre" : jellyfish.color = "blue";  break;
      case "inventato"              : jellyfish.color = "fuchsia"; break;
      case "no_ambientazione"       : jellyfish.color = "darkgrey";  break;
  }

  jellyfish.stripe_position.x = jellyfish.logical_position.x * 20 + 10;
  jellyfish.stripe_position.y = jellyfish.logical_position.y * 20 + 10;

  jellyfish.children.forEach(d => prepare_for_graphics(d));
}

function draw_jellyfish_stripe(graphicsContainer, jellyfish, text_id)
{
  if(jellyfish.children.length > 0)
  {
    let target_point = { x : jellyfish.stripe_position.x, y : jellyfish.children[0].stripe_position.y };

    draw_line(
        graphicsContainer,
        {
            point1 : jellyfish.stripe_position,
            point2 : target_point
        },
        jellyfish.color);

    for(let i = 1; i < jellyfish.children.length; ++i)
    {
      draw_line(
          graphicsContainer,
          {
              point1 : jellyfish.children[i - 1].stripe_position,
              point2 : jellyfish.children[i].stripe_position
          },
          jellyfish.children[i - 1].color);
    }
  }

  draw_point(graphicsContainer, jellyfish.stripe_position, jellyfish.color, text_id);

  jellyfish.children.forEach(d => draw_jellyfish_stripe(graphicsContainer, d));
}

function getProgressiveSumMap(valueMap)
{
  let orderedKeys = Array.from(valueMap.keys()).sort();
  let values = orderedKeys.map(d => valueMap.get(d));

  var result = values.reduce((r, a) => {
    r.push((r.length && r[r.length - 1] || 0) + a);
    return r;
  }, []);

  var progressiveSum = new Map();

  for(let i = 0; i < orderedKeys.length; ++i)
  {
    progressiveSum.set(orderedKeys[i], result[i]);
  }

  return progressiveSum;
}

function MapToMap(map, f)
{
  let map2 = new Map();

  for([key, value] of map)
  {
    map2.set(key, f(value));
  }

  return map2;
}

function prepare_jellyfish_data(hierarchy, center, radiusScaleFactor)
{
  let jellyfish = process_hierarchy_continuously(hierarchy, 0, 0);

  let status2 = { extremes : { min_x : 1000000, max_x : 0 } };

  visit(
    jellyfish,
    status2,
    d => {
      status2 = { extremes : {
        min_x : Math.min(status2.extremes.min_x, d.logical_position.x),
        max_x : Math.max(status2.extremes.max_x, d.logical_position.x) } };
    });

  var min_x_value2 = 0; //status2.extremes.min_x;
  var max_x_value2 = status2.extremes.max_x;



  prepare_for_graphics(jellyfish);

  let status = { extremes : { min_x : 1000000, max_x : 0 } };

  visit(
    jellyfish,
    status,
    d => {
      status = { extremes : {
        min_x : Math.min(status.extremes.min_x, d.stripe_position.x),
        max_x : Math.max(status.extremes.max_x, d.stripe_position.x) } };
    });

  var min_x_value = status.extremes.min_x;
  var max_x_value = status.extremes.max_x;
  var delta = max_x_value - min_x_value;

  var scalingCoefficient = max_x_value2 == 0 ? 1 : delta * (max_x_value2 + 1) / max_x_value2;

  visit(
    jellyfish,
    {},
    (d, status) => {
      d.angle = d.stripe_position.x / scalingCoefficient * 2 * Math.PI;
    });

  visit(
    jellyfish,
    {},
    (d, status) => {
      if(d.level > 0 && d.children.length > 1 && d.children.every(dd => dd.children.length == 0))
      {
        let childrenAngles = d.children.map(d => d.angle);

        var averageChildrenAngle = childrenAngles
          .reduce((sum, num) => sum + num, 0) / d.children.length;

        let angleDeltas = childrenAngles.map(d => algebraicShortestAngleDifference(averageChildrenAngle, d));

        let scaling = 0.3;
        let modifiedAngleDeltas = angleDeltas.map(d => d * scaling);

        let modifiedChildrenAngles = modifiedAngleDeltas.map(d => averageChildrenAngle + d);

        for(let i = 0; i < d.children.length; ++i)
        {
          d.children[i].angle = modifiedChildrenAngles[i];
        }
      }
    });

  var level_maxTextLen_map = new Map();

  visit_levels(
    jellyfish,
    level_maxTextLen_map,
    (d, level) => {
      let maxTextLen = level_maxTextLen_map.get(level) || 0;
      level_maxTextLen_map.set(level, Math.max(maxTextLen, d.caption.length));
    });

  // set level 0 at length 0
  level_maxTextLen_map.set(0, 0);
/*
  // force first item to the hill radius, scaled
  level_maxTextLen_map.set(1, jellyfish.children[0].stripe_position.y * radiusScaleFactor);

  let level_deltaRadius_map = MapToMap(
    level_maxTextLen_map,
    d => 1 * d);
*/

  let textLenScaleFactor = 15;

  // force first item to the hill radius, scaled
  level_maxTextLen_map.set(0, jellyfish.children[0].stripe_position.y * radiusScaleFactor / textLenScaleFactor);

  let level_deltaRadius_map = MapToMap(
    level_maxTextLen_map,
    d => d * textLenScaleFactor);

  let level_progressiveRadius_map = getProgressiveSumMap(level_deltaRadius_map);

  visit(
    jellyfish,
    {},
    (d, status) => {
      if(d.level == 0)
      {
        d.circle_position.x = center.x;
        d.circle_position.y = center.y;
        d.radius = 0;
        d.angle = 0;
      }
/*
      if(+d.level == 1)
      {
        d.angle = d.angle;
        d.radius = d.stripe_position.y * radiusScaleFactor;
//        d.radius = level_progressiveRadius_map.get(+d.level - 1) * radiusScaleFactor / 5;
console.log("d.stripe_position.y * radiusScaleFactor : " + d.stripe_position.y * radiusScaleFactor);
console.log("d.radius : " + d.radius);

        let x = Math.cos(d.angle) * d.radius + center.x;
        let y = Math.sin(d.angle) * d.radius + center.y;

        d.circle_position.x = x;
        d.circle_position.y = y;
      }
*/
      if(+d.level > 0)
      {
        d.angle = d.angle;
//        d.radius = d.stripe_position.y * radiusScaleFactor;
//        d.radius = level_progressiveRadius_map.get(+d.level - 1) * radiusScaleFactor / 5;
        d.radius = level_progressiveRadius_map.get(+d.level - 1);

        let x = Math.cos(d.angle) * d.radius + center.x;
        let y = Math.sin(d.angle) * d.radius + center.y;

        d.circle_position.x = x;
        d.circle_position.y = y;
      }
    });

  return jellyfish;
}

function draw_jellyfish_node(graphicsContainer, d, status, center, text_id)
{
  let inLeftEmicircle = Math.PI / 2 < d.angle && d.angle < 3 * Math.PI / 2;
  let textDistanceFactor = 1; //1.5;
  let textDistanceFactor2 = 1.15;
  let textDistance1 = 30;
  let textDistance2 = 0;

  let textColor;

  switch(d.local_type)
  {
      case "generico_terrestre"     : textColor = "orange";   break;
      case "generico_non_terrestre" : textColor = "red";  break;
      case "nominato_terrestre"     : textColor = "dodgerblue"; break;
      case "nominato_non_terrestre" : textColor = "blue";  break;
      case "inventato"              : textColor = "fuchsia"; break;
      case "no_ambientazione"       : textColor = "darkgrey";  break;
  }

  let text_info = {
    node_id : d.node_id,
    angle : inLeftEmicircle ? d.angle + Math.PI : d.angle,
    textColor : textColor,
    textAnchor : inLeftEmicircle ? "end" : "start",
    tx : center.x + (d.radius + (inLeftEmicircle ? textDistance1 : textDistance2)) * Math.cos(d.angle),
    ty : center.y + (d.radius + (inLeftEmicircle ? textDistance1 : textDistance2)) * Math.sin(d.angle),
    caption : d.caption
  };

  if(d.level > 0) draw_point(graphicsContainer, d.circle_position, textColor, text_id);

  if(d.level > 0) draw_text(graphicsContainer, text_info, text_id);

  if(d.children.length > 0)
  {
    let line_angle = d.angle;

    let captionLenSaturationValue = 35;

    let diagonal = d.bbox ? Math.sqrt(d.bbox.width * d.bbox.width + d.bbox.height * d.bbox.height) : 0;
    let diagonalScaleFactor = 1.4;

    let radiusProposedValue = d.bbox ?
      d.radius + diagonal * diagonalScaleFactor:
      d.radius + 20 * Math.min(text_info.caption.length, captionLenSaturationValue);

    let start_point = {
      angle : line_angle,
      radius : Math.min(
        radiusProposedValue,
        d.children[0].radius - 10)
    };

    start_point.x = center.x + start_point.radius * Math.cos(start_point.angle);
    start_point.y = center.y + start_point.radius * Math.sin(start_point.angle);

    let target_point = {
      angle : line_angle,
      radius : d.children[0].radius
    };

    target_point.x = center.x + target_point.radius * Math.cos(target_point.angle);
    target_point.y = center.y + target_point.radius * Math.sin(target_point.angle);

    draw_line(
      graphicsContainer,
      {
          point1 : start_point,
          point2 : target_point
      },
      d.color,
      text_id);

    if(d.level == 0 || d.children.length > 1)
    {
      let arcWidth = 2;

      if(d.level == 0)
      {
        for(let i = 0; i < d.children.length; ++i)
        {
          let startAngle = calculate_startAngle(d.children, i);
          let endAngle = calculate_endAngle(d.children, i);

          let arc = {
            center : center,
            radius : d.children[0].radius,
            width : arcWidth,
            startAngle : startAngle,
            endAngle : endAngle
          };

//          draw_arc(graphicsContainer, arc, d.children[i].color, text_id);
        }
      }
      else
      {
        let arc = {
          center : center,
          radius : d.children[0].radius,
          width : arcWidth,
          startAngle : (d.children[0].angle + Math.PI / 2),
          endAngle : (d.children[d.children.length - 1].angle + Math.PI / 2)
        };

        draw_arc(graphicsContainer, arc, d.color, text_id);
      }
    }
  }
}

function draw_jellyfish(graphicsContainer, jellyfish, center, text_id)
{
  visit(
    jellyfish,
    {},
    (d, status) => draw_jellyfish_node(graphicsContainer, d, status, center, text_id));
}

function prepare_jellyfish_data_2(jellyfish, center, radiusScaleFactor)
{
  var level_maxTextLen_map = new Map();

  visit_levels(
    jellyfish,
    level_maxTextLen_map,
    (d, level) => {
      let maxTextLen = level_maxTextLen_map.get(level) || 0;

      if(+d.level > 0)
      {
        let diagonal = Math.sqrt(d.bbox.width * d.bbox.width + d.bbox.height * d.bbox.height);
        level_maxTextLen_map.set(level, Math.max(maxTextLen, diagonal));
      }

//      level_maxTextLen_map.set(level, Math.max(maxTextLen, d.caption.length));
    });

  // set level 0 at length 0
  level_maxTextLen_map.set(0, 0);

  let textLenScaleFactor = 15;

  // force first item to the hill radius, scaled
//  level_maxTextLen_map.set(0, jellyfish.children[0].stripe_position.y * radiusScaleFactor / textLenScaleFactor);

  let level_deltaRadius_map = MapToMap(
    level_maxTextLen_map,
    d => d * 1.25);
//    d => d * textLenScaleFactor);

//   // force first item to the hill radius, scaled
  level_deltaRadius_map.set(0, jellyfish.children[0].stripe_position.y * radiusScaleFactor /* / textLenScaleFactor*/);

  let level_progressiveRadius_map = getProgressiveSumMap(level_deltaRadius_map);

console.log(jellyfish.text_id);
console.log(jellyfish.children[0].stripe_position.y * radiusScaleFactor);
console.log(level_progressiveRadius_map);

  visit(
    jellyfish,
    {},
    (d, status) => {
      if(d.level == 0)
      {
        d.circle_position.x = center.x;
        d.circle_position.y = center.y;
        d.radius = 0;
        d.angle = 0;
      }

      if(+d.level > 0)
      {
        d.angle = d.angle;
//        d.radius = d.stripe_position.y * radiusScaleFactor;
//        d.radius = level_progressiveRadius_map.get(+d.level - 1) * radiusScaleFactor / 5;
        d.radius = level_progressiveRadius_map.get(+d.level - 1);

        let x = Math.cos(d.angle) * d.radius + center.x;
        let y = Math.sin(d.angle) * d.radius + center.y;

        d.circle_position.x = x;
        d.circle_position.y = y;
      }
    });
}