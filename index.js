const numSeconds = 96;
const barNames = [
  'Comey',
  'Special Counsel',
  'Collusion',
  'Russia',
  'His Accomplishments',
  'CNN',
  'Democrats',
  'Unfairness',
  'Justice Department',
  'FBI',
  'Paul Manafort',
  'Michael Cohen',
];

// Placeholder data
const data = barNames.map(el => 1);

const trumpImageWidth = 60;
const trumpImageHeight = 78;
const trumpImage = 'trump.png';

const transitions = [
  {
    start: 0,
    end: 33,
    topic: 0,
  },
  {
    start: 33,
    end: 37,
    topic: 1,
  },
  {
    start: 37,
    end: 42,
    topic: 2,
  },
  {
    start: 42,
    end: 49,
    topic: 3,
  },
  {
    start: 49,
    end: 69,
    topic: 4,
  },
  {
    start: 69,
    end: 70,
    topic: 2,
  },
  {
    start: 70,
    end: 78,
    topic: 0,
  },
  {
    start: 78,
    end: 79,
    topic: 1,
  },
  {
    start: 79,
    end: 96,
    topic: 0,
  },
];

const margin = {
  top: 200,
  right: 50,
  bottom: 50,
  left: 30,
};

const svg = d3.select('#app').append('svg');
const chartGroup = svg.append('g');

const yScale = d3.scaleLinear().domain([0, numSeconds]);

const xScale = d3
  .scaleBand()
  .domain(barNames)
  .padding(0.1);

yAxis = d3.axisLeft(yScale).tickSize(0);
xAxis = d3.axisBottom(xScale).tickSize(0);
yAxisGroup = chartGroup.append('g').attr('class', 'axis');
xAxisGroup = chartGroup.append('g').attr('class', 'axis');

const bars = chartGroup
  .append('g')
  .selectAll('rect')
  .data(data)
  .enter()
  .append('rect')
  .classed('bar', true);

function scrollTween(offset) {
  return () => {
    const i = d3.interpolateNumber(
      window.pageYOffset || document.documentElement.scrollTop,
      offset,
    );
    return t => scrollTo(0, i(t));
  };
}

// Add a pause button to the screen,
// adding an event listener on this button
// to pause the audio
const pausePlayButton = d3
  .select('#pausePlayButton')
  .append('img')
  .attr('src', 'play.png')
  .attr('data-button-type', 'play');

function renderChart(width) {
  // This has the effect of always keeping the ratio between height
  // and width the same
  const height = 5 * width * 0.7;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  svg.attr('width', width).attr('height', height);
  chartGroup
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  yScale.range([0, chartHeight]);
  xScale.range([0, chartWidth]);

  yAxisGroup.call(yAxis);
  xAxisGroup
    .call(xAxis)
    .attr('transform', `translate(0, -${margin.top / 2})`)
    .selectAll('text')
    .attr('transform', 'rotate(-45)');

  // Remove the line on our axes, leaving just axis labels
  xAxisGroup.select('path').attr('stroke', '#fff');
  yAxisGroup.select('path').attr('stroke', '#fff');

  //
  const lineWidth = 3;
  bars
    .attr('height', chartHeight)
    .attr('x', (d, i) => xScale(barNames[i]) + xScale.bandwidth() / 2)
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
        x: xScale(barNames[t.topic]) + xScale.bandwidth() / 2,
        y: yScale(t.start),
      },
      {
        x: xScale(barNames[t.topic]) + xScale.bandwidth() / 2,
        y: yScale(t.end),
      },
    ];

    const lineHeight = yScale(t.end) - yScale(t.start);

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
        x: xScale(barNames[t.topic]) + xScale.bandwidth() / 2,
        y: yScale(t.end),
      },
      {
        x: xScale(barNames[transitions[i + 1].topic]) + xScale.bandwidth() / 2,
        y: yScale(transitions[i + 1].start),
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
    .attr(
      'x',
      (d, i) =>
        xScale(barNames[i]) + xScale.bandwidth() / 2 - trumpImageWidth / 2,
    )
    .attr('y', -(trumpImageHeight / 2))
    .attr('xlink:href', trumpImage)
    .attr('width', trumpImageWidth)
    .attr('height', trumpImageHeight)
    .attr('opacity', (d, i) => (i === 0 ? 1 : 0));

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
      .attr('y', yScale(t.end) - trumpImageHeight / 2);

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
  pausePlayButton.on('click', () => {
    const scrollTransition = d3
      .transition('scroll')
      .ease(d3.easeLinear)
      .delay(1500)
      .duration(numSeconds * 1000)
      .tween(
        'scroll',
        scrollTween(
          document.body.getBoundingClientRect().height - window.innerHeight,
        ),
      );

    const audioNode = d3.select('#player').node();

    const buttonType = pausePlayButton.attr('data-button-type');
    if (buttonType === 'pause') {
      audioNode.pause();

      // Swap the pause and play button
      pausePlayButton.attr('src', 'play.png').attr('data-button-type', 'play');

      // Interrupt the scroll and x axis transition
      // we put into place earlier
      d3.interrupt(scrollTransition.node(), 'scroll');

      // Interrupt transitions on our paths and images
      imageAttrs.nodes().forEach(node => d3.interrupt(node));
      paths.forEach(path => d3.interrupt(path.node()));
      linesBetweenTopics.forEach(line => d3.interrupt(line.node()));
    } else {
      audioNode.play();
      pausePlayButton
        .attr('src', 'pause.png')
        .attr('data-button-type', 'pause');
      runTransitions(transitions, 0);
    }
  });
}

renderChart(window.innerWidth);

window.addEventListener('resize', () => {
  renderChart(window.innerWidth, window.innerHeight);
});
