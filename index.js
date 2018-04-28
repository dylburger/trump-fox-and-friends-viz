const numSeconds = 10;
const barNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
// Placeholder data
const data = barNames.map(el => 1);

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

// Add circles!
const circles = chartGroup
  .selectAll('circle')
  .data(data)
  .enter()
  .append('circle');

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
  const circleAttrs = circles
    .attr('cx', (d, i) => xScale(barNames[i]))
    .attr('cy', 0)
    .attr('r', 30)
    .attr('fill', 'red')
    .attr('fill-opacity', (d, i) => (i === 0 ? 1 : 0))
    .transition()
    .ease(d3.easeLinear)
    .duration(1000 * numSeconds)
    .attr('cy', chartHeight);
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
