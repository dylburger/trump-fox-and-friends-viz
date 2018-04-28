const numSeconds = 10;
const barNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
// Placeholder data
const data = barNames.map(el => 1);

const trumpImageWidth = 30;
const trumpImageHeight = 39;

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

// We want to trace the path Trump takes from
// topic to topic. Given our transitions, we can generate
// an array of (x, y) coordinates traced by those
// transitions

// Then, generate a line function that draws
// the path

const bars = chartGroup
  .append('g')
  .selectAll('rect')
  .data(data)
  .enter()
  .append('rect')
  .classed('bar', true);

// Add images!
const images = chartGroup
  .selectAll('image')
  .data(data)
  .enter()
  .append('image');

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

  // Give our circle some attributes
  const imageAttrs = images
    .attr('x', (d, i) => xScale(barNames[i]) - trumpImageWidth / 2)
    .attr('y', 0)
    .attr('xlink:href', 'trump.jpg')
    .attr('width', trumpImageWidth)
    .attr('height', trumpImageHeight)
    .attr('opacity', 0);

  function runTransitions(transitionArray, transitionIndex) {
    // Continue running transitions until we hit our termination
    // condition (we reach the end of our transitions array)
    if (transitionIndex >= transitionArray.length) {
      return;
    }

    const t = transitionArray[transitionIndex];
    imageAttrs
      .attr('opacity', (d, i) => (i === t.topic ? 1 : 0))
      .transition()
      .ease(d3.easeLinear)
      .duration(1000 * (t.end - t.start))
      .attr('y', chartHeight - yScale(t.end))
      .on('end', () => runTransitions(transitionArray, transitionIndex + 1));
  }

  runTransitions(transitions, 0);
}

// Render chart once, the first time we load the page,
// passing in the width of the browser screen
renderChart(window.innerWidth);

// The "resize" event will not fire for specific elements,
// only when the browser itself is resized. Therefore, we have
// to add an event listener on the global "window" object.
//
// https://developer.mozilla.org/en-US/docs/Web/Events/resize
window.addEventListener('resize', () => {
  renderChart(window.innerWidth, window.innerHeight);
});
