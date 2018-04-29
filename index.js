const numSeconds = 10;
const barNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
// Placeholder data
const data = barNames.map(el => 1);

const trumpImageWidth = 60;
const trumpImageHeight = 78;
const trumpImage = 'trump.png';

const transitions = [
  {
    start: 0,
    end: 2,
    topic: 0,
  },
  {
    start: 2,
    end: 4,
    topic: 1,
  },
  {
    start: 4,
    end: 10,
    topic: 2,
  },
];

const margin = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};

const svg = d3.select('#app').append('svg');
const chartGroup = svg.append('g');

const yScale = d3.scaleLinear().domain([0, numSeconds]);

const xScale = d3
  .scaleBand()
  .domain(barNames)
  .padding(0.1);

yAxis = d3.axisLeft(yScale);
xAxis = d3.axisBottom(xScale);
yAxisGroup = chartGroup.append('g');
xAxisGroup = chartGroup.append('g');

const bars = chartGroup
  .append('g')
  .selectAll('rect')
  .data(data)
  .enter()
  .append('rect')
  .classed('bar', true);

function renderChart(width) {
  const height = width;
  svg.attr('width', width).attr('height', height);

  const chartWidth = width - margin.left - margin.right;

  // This has the effect of always keeping the ratio between height
  // and width the same
  const chartHeight = height * 0.7;

  chartGroup
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  yScale.range([chartHeight, 0]);
  xScale.range([0, chartWidth]);

  yAxisGroup.call(yAxis);

  const lineWidth = 3;
  bars
    .attr('width', lineWidth)
    .attr('height', chartHeight)
    .attr('x', (d, i) => xScale(barNames[i]))
    .attr('y', 0);

  // Then, generate a line function that will draw our path
  const lineFunc = d3
    .line()
    .x(d => d.x)
    .y(d => d.y);

  // There's no z-index for SVG that allow us to define
  // how elements are stacked, so we must write our path
  // elements to the DOM before the image of Trump so
  // the path doesn't cover the image
  //
  // Because of the way we manage path transitions below,
  // we must also create a path element for every state
  // transition. Store each of these paths in an array
  // for future maniplation / transition.

  const paths = transitions.map(t => {
    // We want to trace the path Trump takes from
    // topic to topic. Given our transitions, we can generate
    // (x, y) coordinates traced by those
    // transitions (one transition yields two points)
    const pathPoints = [
      {
        x: xScale(barNames[t.topic]),
        y: chartHeight - yScale(t.start),
      },
      {
        x: xScale(barNames[t.topic]),
        y: chartHeight - yScale(t.end),
      },
    ];

    const lineHeight = yScale(t.start) - yScale(t.end);

    // See https://jaketrent.com/post/animating-d3-line/ for how
    // we use the stroke-dashoffset attribute to make our line
    // invisible (below, we slowly reveal the line with a D3 transition)
    return chartGroup
      .append('path')
      .attr('stroke', 'blue')
      .attr('stroke-width', lineWidth)
      .attr('fill', 'none')
      .attr('d', lineFunc(pathPoints))
      .attr('stroke-dasharray', `${lineHeight} ${lineHeight}`)
      .attr('stroke-dashoffset', lineHeight);
  });

  // We must also draw lines from the end of one state to the start
  // of another, to close the path
  const linesBetweenTopics = [];
  for (i = 0; i < transitions.length - 1; i++) {
    t = transitions[i];

    // Get the (x, y) coordinates of the end of the current state,
    // and the (x, y) coordinates of the start of the next state
    const pathPoints = [
      {
        x: xScale(barNames[t.topic]),
        y: chartHeight - yScale(t.end),
      },
      {
        x: xScale(barNames[transitions[i + 1].topic]),
        y: chartHeight - yScale(transitions[i + 1].start),
      },
    ];

    linesBetweenTopics.push(
      chartGroup
        .append('path')
        .attr('stroke', 'blue')
        .attr('stroke-width', lineWidth)
        .attr('fill', 'none')
        .attr('d', lineFunc(pathPoints))
        .attr('opacity', 0),
    );
  }

  // Add images!
  const images = chartGroup
    .selectAll('image')
    .data(data)
    .enter()
    .append('image');

  // Give our image some attributes
  const imageAttrs = images
    .attr('x', (d, i) => xScale(barNames[i]) - trumpImageWidth / 2)
    .attr('y', -(trumpImageHeight / 2))
    .attr('xlink:href', trumpImage)
    .attr('width', trumpImageWidth)
    .attr('height', trumpImageHeight)
    .attr('opacity', 0);

  function runTransitions(transitionArray, transitionIndex) {
    // Continue running transitions until we hit our termination
    // condition (we reach the end of our transitions array)
    if (transitionIndex >= transitionArray.length) {
      return;
    }

    // Reveal our lines between topics as soon as we've moved onto the
    // next topic
    if (transitionIndex >= 1) {
      linesBetweenTopics[transitionIndex - 1].attr('opacity', 1);
    }

    const t = transitionArray[transitionIndex];
    imageAttrs
      .attr('opacity', (d, i) => (i === t.topic ? 1 : 0))
      .transition()
      .ease(d3.easeLinear)
      .duration(1000 * (t.end - t.start))
      .attr('y', chartHeight - yScale(t.end) - trumpImageHeight / 2);

    // For each of the paths we created earlier, create a transition that
    // slowly exposes the line over the duration of the topic
    // Again, see https://jaketrent.com/post/animating-d3-line/ for how
    // we use the stroke-dashoffset attribute to accomplish this.
    paths[transitionIndex]
      .transition()
      .ease(d3.easeLinear)
      .duration(1000 * (t.end - t.start))
      .attr('stroke-dashoffset', 0)
      .on('end', () => runTransitions(transitionArray, transitionIndex + 1));
  }

  // Start our transitions when the user hits play so the audio
  // and transitions are synced
  d3.select('#player').on('play', () => runTransitions(transitions, 0));
}

renderChart(window.innerWidth);

window.addEventListener('resize', () => {
  renderChart(window.innerWidth, window.innerHeight);
});
