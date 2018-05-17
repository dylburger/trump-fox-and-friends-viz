let userPausedAudio = false;
const numSeconds = 270;
const barNames = [
  'Comey',
  'Special Counsel',
  'Collusion',
  'Russia',
  'His Accomplishments',
  'CNN',
  'Democrats',
  'Double Standard',
  'Justice Department',
  'Witch Hunt',
  'FBI',
  'Paul Manafort',
  'Cohen',
];

// Generate empty bars for each topic Trump discusses
const timeOnTopics = barNames.map(topic => 0);
let topicBarTransitions = null;

const TIMER_INTERVAL_MS = 100;
let numSecondsElapsed = 0;
let numSecondsElapsedTimer = null;
let numSecondsElapsedSinceLastTransition = 0;
let numSecondsElapsedSinceLastTransitionTimer = null;

// We increment the tangent count for each new topic Trump talks about,
// but the first topic isn't a tangent (it's tied to the question).
// This has the effect of starting our count at 0.
let tangentCount = -1;
const tangentTallySpan = d3.select('#tangentTallyCountNum');

const trumpImageWidth = 80;
const trumpImageHeight = 104;
const trumpImage = 'trump.png';

const transitions = [
  {
    start: 0,
    end: 6,
    topic: 0,
  },
  {
    start: 6,
    end: 10,
    topic: 1,
  },
  {
    start: 10,
    end: 15,
    topic: 2,
  },
  {
    start: 15,
    end: 22,
    topic: 3,
  },
  {
    start: 22,
    end: 42,
    topic: 4,
  },
  {
    start: 42,
    end: 43,
    topic: 2,
  },
  {
    start: 43,
    end: 51,
    topic: 0,
  },
  {
    start: 51,
    end: 52,
    topic: 1,
  },
  {
    start: 52,
    end: 70,
    topic: 0,
  },
  {
    start: 70,
    end: 99,
    topic: 3,
  },
  {
    start: 99,
    end: 101,
    topic: 5,
  },
  {
    start: 101,
    end: 105,
    topic: 6,
  },
  {
    start: 105,
    end: 119,
    topic: 7,
  },
  {
    start: 119,
    end: 130,
    topic: 5,
  },
  {
    start: 130,
    end: 134,
    topic: 0,
  },
  {
    start: 134,
    end: 138,
    topic: 5,
  },
  {
    start: 138,
    end: 142,
    topic: 0,
  },
  {
    start: 142,
    end: 158,
    topic: 8,
  },
  {
    start: 158,
    end: 160,
    topic: 9,
  },
  {
    start: 160,
    end: 163,
    topic: 8,
  },
  {
    start: 163,
    end: 167,
    topic: 9,
  },
  {
    start: 167,
    end: 183,
    topic: 8,
  },
  {
    start: 183,
    end: 213,
    topic: 4,
  },
  {
    start: 213,
    end: 230,
    topic: 8,
  },
  {
    start: 230,
    end: 232,
    topic: 2,
  },
  {
    start: 232,
    end: 242,
    topic: 6,
  },
  {
    start: 242,
    end: 246,
    topic: 10,
  },
  {
    start: 246,
    end: 255,
    topic: 11,
  },
  {
    start: 255,
    end: 260,
    topic: 12,
  },
  {
    start: 260,
    end: 265,
    topic: 6,
  },
  {
    start: 265,
    end: 267,
    topic: 10,
  },
];

const arrayOfTopicTimes = barNames.map(topic => 0);
transitions.forEach(el => {
  arrayOfTopicTimes[el.topic] += el.end - el.start;
});

console.log('Array of topic times:', arrayOfTopicTimes);

const margin = {
  top: 70,
  right: 50,
  bottom: 50,
  left: 60,
};

// Main SVG
const svg = d3.select('#app').append('svg');
const chartGroup = svg.append('g');

const yScale = d3.scaleLinear().domain([0, numSeconds]);

const xScale = d3
  .scaleBand()
  .domain(barNames)
  .padding(0.1);

const formatTime = d3.timeFormat('%_M:%S');
// We only care about the minutes and seconds part of our datetime object
const formatSeconds = s => formatTime(new Date(2018, 1, 1, 0, 0, s));

const yAxis = d3
  .axisLeft(yScale)
  .tickSize(0)
  .tickFormat(formatSeconds)
  .ticks(numSeconds / 10);

const yAxisGroup = chartGroup.append('g').attr('class', 'axis');

// Bar chart SVG to show time spent on topics
const barChartSVG = d3.select('#barChart').append('svg');
const barChartGroup = barChartSVG.append('g');

const barChartYScale = d3
  .scaleBand()
  .domain(barNames)
  .padding(0.2);

const barChartXScale = d3.scaleLinear().domain([0, d3.max(arrayOfTopicTimes)]);

const barChartYAxis = d3
  .axisLeft(barChartYScale)
  .tickSize(0)
  .tickValues(barNames.filter((el, i) => timeOnTopics[i] > 0));

const barChartYAxisGroup = barChartGroup.append('g').attr('class', 'axis');

function scrollTween(offset) {
  return () => {
    const i = d3.interpolateNumber(
      window.pageYOffset || document.documentElement.scrollTop,
      offset,
    );
    return t => scrollTo(0, i(t));
  };
}

function isAudioPlaying() {
  const audioNode = d3.select('#player');
  return audioNode.duration > 0 && !audioNode.paused;
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
  const height = 10 * width;
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

  // Remove the line on our axes, leaving just axis labels
  yAxisGroup.select('path').attr('stroke', '#fff');

  // Render the bar chart
  const barChartWidth = chartWidth / 2;
  const barChartHeight = '400';
  const barChartLeftMargin = barChartWidth / 2;
  const barChartXPadding = 10;

  barChartSVG.attr('width', barChartWidth).attr('height', barChartHeight);
  barChartGroup
    .attr('width', barChartWidth)
    .attr('height', barChartHeight)
    .attr('transform', `translate(${barChartLeftMargin})`);

  barChartYScale.range([0, barChartHeight]);
  barChartXScale.range([0, barChartLeftMargin - barChartXPadding]);

  barChartYAxisGroup.call(barChartYAxis);
  barChartYAxisGroup.select('path').attr('stroke', '#fff');

  // Define the line width for our paths
  const lineWidth = 3;

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
      .attr('stroke', 'red')
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
        .attr('stroke', 'red')
        .attr('stroke-width', lineWidth)
        .attr('fill', 'none')
        .attr('d', lineFunc(pathPoints))
        .attr('opacity', 0),
    );
  }

  // Add images!
  const images = chartGroup
    .selectAll('image')
    .data([1])
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
    .attr('height', trumpImageHeight);

  // Create our initial bars for our time on topic bar chart
  const timeOnTopicBarGroup = barChartGroup.append('g');

  function runTransitions(transitionArray, transitionIndex) {
    // Continue running transitions until we hit our termination
    // condition (we reach the end of our transitions array)
    if (transitionIndex >= transitionArray.length) {
      return;
    }

    const t = transitionArray[transitionIndex];

    // In this condition, we've paused and restarted our
    // transitions, and we need to pick up where we left off
    // (with the transition and tangent count where we ended)
    if (numSecondsElapsed > t.end) {
      tangentCount = transitionIndex + 1;
      runTransitions(transitionArray, transitionIndex + 1);
      return;
    }

    console.log('USER PAUSED AUDIO:', userPausedAudio);
    console.log('Tangent count:', tangentCount);

    if (userPausedAudio === false) {
      numSecondsElapsedSinceLastTransition = 0;
      console.log('Transition index:', transitionIndex);
      tangentCount += 1;
      tangentTallySpan.text(tangentCount);

      // Calculate the time Trump has spent so far on all previous topics
      const previousTransitionData =
        transitionIndex > 0
          ? transitionArray[transitionIndex - 1]
          : {start: 0, end: 0, topic: 0};
      timeOnTopics[previousTransitionData.topic] +=
        previousTransitionData.end - previousTransitionData.start;

      // And for brand new topics, start him with a little bit of time
      // so that we reveal the topic name on the y axis below (revealing
      // the name requires we have some data attached to the bar)
      if (timeOnTopics[t.topic] === 0) {
        timeOnTopics[t.topic] += 0.01;
      }

      // Show any new y axis labels
      barChartYAxis.tickValues(barNames.filter((el, i) => timeOnTopics[i] > 0));
      barChartYAxisGroup.call(barChartYAxis);

      // Add text for the topic Trump just moved to
      chartGroup
        .append('text')
        .text(barNames[t.topic])
        .attr('y', yScale(t.start) - 40)
        .attr('x', xScale(barNames[t.topic]))
        .attr('text-anchor', 'start')
        .classed('topics', true);

      if (transitionIndex >= 1) {
        // Make the tangent tally "pop" on changes
        tangentTallySpan
          .transition()
          .duration(250)
          .styleTween('font-size', () =>
            d3.interpolate(tangentTallySpan.style('font-size'), '60px'),
          )
          .transition()
          .styleTween('font-size', () =>
            d3.interpolate(tangentTallySpan.style('font-size'), '30px'),
          )
          .duration(250);

        // Reveal our lines between topics as soon as we've moved onto the
        // next topic
        linesBetweenTopics[transitionIndex - 1].attr('opacity', 1);
      }
    } else {
      // The user just played the audio again, so
      console.log('User just started playing audio again!');
      userPausedAudio = false;
    }

    imageAttrs
      .attr(
        'x',
        (d, i) =>
          xScale(barNames[t.topic]) +
          xScale.bandwidth() / 2 -
          trumpImageWidth / 2,
      )
      .attr('y', yScale(numSecondsElapsed) - trumpImageHeight / 2)
      .transition()
      .ease(d3.easeLinear)
      .duration(1000 * (t.end - numSecondsElapsed))
      .attr('y', yScale(t.end) - trumpImageHeight / 2);

    // For each of the paths we created earlier, create a transition that
    // slowly exposes the line over the duration of the topic
    // Again, see https://jaketrent.com/post/animating-d3-line/ for how
    // we use the stroke-dashoffset attribute to accomplish this.
    paths[transitionIndex]
      .transition()
      .ease(d3.easeLinear)
      .duration(1000 * (t.end - numSecondsElapsed))
      .attr('stroke-dashoffset', 0)
      .on('end', () => runTransitions(transitionArray, transitionIndex + 1));

    // Update the data in our bar chart
    const topicBars = timeOnTopicBarGroup.selectAll('rect').data(timeOnTopics);

    console.log(
      'Num seconds since last transition:',
      numSecondsElapsedSinceLastTransition,
    );

    console.log('Time on topics:', timeOnTopics);

    topicBarTransitions = topicBars
      .enter()
      .append('rect')
      .classed('bar', true)
      .merge(topicBars)
      .attr(
        'width',
        (d, i) =>
          i === t.topic
            ? barChartXScale(d + numSecondsElapsedSinceLastTransition)
            : barChartXScale(d),
      )
      .attr('height', barChartYScale.bandwidth())
      .attr('y', (d, i) => barChartYScale(barNames[i]))
      .attr('x', barChartXPadding)
      .classed('currentTopic', (d, i) => (i === t.topic ? true : false))
      .transition()
      .ease(d3.easeLinear)
      .duration(
        (d, i) =>
          1000 * (t.end - t.start - numSecondsElapsedSinceLastTransition),
      )
      .attr(
        'width',
        (d, i) =>
          i === t.topic
            ? barChartXScale(d + t.end - t.start)
            : barChartXScale(d),
      );

    topicBars.exit().remove();
  }

  function pauseTransitions(transitionArray, transitionIndex) {
    userPausedAudio = true;
    if (transitionIndex >= transitionArray.length) {
      return;
    }

    if (transitionIndex >= 1) {
      linesBetweenTopics[transitionIndex - 1].transition().duration(0);
    }

    imageAttrs.transition().duration(0);
    paths[transitionIndex].transition().duration(0);

    pauseTransitions(transitionArray, transitionIndex + 1);

    // Pause transitions for bars in bar chart
    topicBarTransitions.nodes().forEach(node => d3.interrupt(node));
  }

  // Should we pause or play?
  const shouldWePlay = eventType => {
    let play = false;
    if (eventType === 'pausePlayButtonClick') {
      const buttonType = pausePlayButton.attr('data-button-type');
      switch (buttonType) {
        case 'pause':
          break;
        case 'play':
          play = true;
          break;
        default:
          break;
      }
    }

    // We need no explicit logic for handling visibility changes,
    // since we default to the paused state here

    return play;
  };

  const handlePlayOrPauseStateChanges = eventType => {
    const scrollTransition = d3
      .transition('scroll')
      .ease(d3.easeLinear)
      .duration((numSeconds - numSecondsElapsed) * 1000)
      .tween('scroll', scrollTween(chartHeight));

    const audioNode = d3.select('#player').node();
    const buttonType = pausePlayButton.attr('data-button-type');

    if (shouldWePlay(eventType)) {
      audioNode.play();

      // Increment the number of seconds that have elapsed since clicking play
      numSecondsElapsedTimer = window.setInterval(() => {
        numSecondsElapsed += 0.1;
      }, TIMER_INTERVAL_MS);

      // Increment the number of seconds that have elapsed since the last transition
      numSecondsElapsedSinceLastTransitionTimer = window.setInterval(() => {
        numSecondsElapsedSinceLastTransition += 0.1;
      }, TIMER_INTERVAL_MS);

      pausePlayButton
        .attr('src', 'pause.png')
        .attr('data-button-type', 'pause');
      runTransitions(transitions, 0);
    } else {
      window.clearInterval(numSecondsElapsedTimer);
      window.clearInterval(numSecondsElapsedSinceLastTransitionTimer);

      audioNode.pause();

      // Swap the pause and play button
      pausePlayButton.attr('src', 'play.png').attr('data-button-type', 'play');

      // Interrupt the scroll and x axis transition
      // we put into place earlier
      d3.interrupt(scrollTransition.node(), 'scroll');

      // Interrupt transitions on our paths and images
      pauseTransitions(transitions, 0);
    }
  };

  // Start our transitions when the user hits play and
  // pause transition when the user pauses audio
  pausePlayButton.on('click', () => {
    handlePlayOrPauseStateChanges('pausePlayButtonClick');
  });

  // Pause audio and transitions when the user leaves the page
  d3.select(document).on('visibilitychange', () => {
    handlePlayOrPauseStateChanges('visibilityChange');
  });
}

renderChart(window.innerWidth);

window.addEventListener('resize', () => {
  renderChart(window.innerWidth, window.innerHeight);
});
