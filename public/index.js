const US_EDUCATION_DATA =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const US_COUNTY_DATA =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

const width = 900,
  height = 700,
  padding = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  };

const body = d3.select("body");

const heading = body.append("heading").attr("class", "heading");

const tooltip = body
  .append("div")
  .attr("id", "tooltip")
  .style("opacity", 0);

const color = d3
  .scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemePurples[9]);

heading
  .append("h1")
  .attr("id", "title")
  .text("United States Educational Attainment");

heading
  .append("h2")
  .attr("id", "description")
  .text(
    "Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)"
  );

const svg = body
  .append("svg")
  .attr("id", "viz")
  .attr("width", width + padding.left + padding.right)
  .attr("height", height + padding.top + padding.bottom);

const x = d3
  .scaleLinear()
  .domain([2.6, 75.1])
  .rangeRound([600, 860]);

const legend = d3
  .select("#viz")
  .append("g")
  .attr("id", "legend")
  .attr("width", 400)
  .attr("height", 200)
  .attr("transform", `translate(0, 40)`);

legend
  .selectAll("rect")
  .data(
    color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    })
  )
  .enter()
  .append("rect")
  .attr("height", 8)
  .attr("x", function(d) {
    return x(d[0]);
  })
  .attr("width", function(d) {
    return x(d[1]) - x(d[0]);
  })
  .attr("fill", function(d) {
    return color(d[0]);
  });

legend
  .append("text")
  .attr("class", "caption")
  .attr("x", x.range()[0])
  .attr("y", -6)
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr("font-weight", "bold");

legend
  .call(
    d3
      .axisBottom(x)
      .tickSize(13)
      .tickFormat(function(x) {
        return Math.round(x) + "%";
      })
      .tickValues(color.domain())
  )
  .select(".domain")
  .remove();

const PROMISES = [d3.json(US_EDUCATION_DATA), d3.json(US_COUNTY_DATA)];

var path = d3.geoPath();
const unemployment = d3.map();

Promise.all(PROMISES).then(([educData, countyData]) => {
  console.log(educData);
  console.log(countyData);

  const rating = educData.map(d => d.bachelorsOrHigher).sort((a, b) => a - b);
  console.log(rating);
  console.log(d3.extent(rating));

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(rating))
    .rangeRound([600, 860]);

  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(countyData, countyData.objects.counties).features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("data-fips", d => d.id)
    .attr("data-education", d => {
      const result = educData.filter(obj => obj.fips == d.id);

      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
    })
    .attr("fill", d => {
      const result = educData.filter(obj => obj.fips == d.id);

      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }

      return color(0);
    })
    .on("mouseover", d => {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0.9)
        .attr("data-education", () => {
          const result = educData.filter(obj => obj.fips == d.id);

          if (result[0]) {
            return result[0].bachelorsOrHigher;
          }

          return 0;
        });

      tooltip
        .html(() => {
          const result = educData.filter(obj => obj.fips == d.id);
          if (result[0]) {
            return `${result[0]["area_name"]} ${result[0]["state"]}: ${result[0].bachelorsOrHigher}%`;
          }
          return 0;
        })
        .style("left", `${d3.event.pageX + 10}px`)
        .style("top", `${d3.event.pageY - 28}px`);
    })

    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  svg
    .append("path")
    .datum(
      topojson.mesh(countyData, countyData.objects.states, (a, b) => {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("d", path);
});
