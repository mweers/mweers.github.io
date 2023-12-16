document.addEventListener('DOMContentLoaded', () => {
    const parseDate = d3.timeParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%Y-%m-%d");
    const tooltip = d3.select("#tooltip");

    function determineColor(steps) {
        const stepColors = [
            { limit: 5000, color: '--color-step-1' },
            { limit: 10000, color: '--color-step-2' },
            { limit: 15000, color: '--color-step-3' },
            { limit: 20000, color: '--color-step-4' },
            { limit: 25000, color: '--color-step-5' },
            { limit: 30000, color: '--color-step-6' },
            { limit: 35000, color: '--color-step-7' },
            { limit: 40000, color: '--color-step-8' },
            { limit: 45000, color: '--color-step-9' },
            { limit: 50000, color: '--color-step-10' },
            { limit: 55000, color: '--color-step-11' },
            { limit: 60000, color: '--color-step-12' },
            { limit: 65000, color: '--color-step-13' },
            { limit: 70000, color: '--color-step-14' },
            { limit: 75000, color: '--color-step-15' },
            { limit: 80000, color: '--color-step-16' },
            { limit: 85000, color: '--color-step-17' },
            { limit: 90000, color: '--color-step-18' },
            { limit: 95000, color: '--color-step-19' },
            { limit: 100000, color: '--color-step-20' },
        ];
        const rootStyle = getComputedStyle(document.documentElement);
        let colorVar = '--color-step-20'; // default to the highest
        for (let i = 0; i < stepColors.length; i++) {
            if (steps <= stepColors[i].limit) {
                colorVar = stepColors[i].color;
                break; // exit the loop once the correct color is found
            }
        }
        return rootStyle.getPropertyValue(colorVar);
    }

    const drawGraph = () => {
        d3.csv('steps.csv').then(data => {
            data.forEach(d => {
                d.Date = parseDate(d.Date);
                d.Steps = +d.Steps;
            });

            const container = d3.select('#grid-container');
            container.selectAll('*').remove();

            container.selectAll('.day-square')
                .data(data)
                .enter()
                .append('div')
                .attr('class', 'day-square')
                .style('background-color', d => determineColor(d.Steps))
                .on('mouseover', function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                    tooltip.html('Date: ' + formatDate(d.Date) + '<br>Steps: ' + d.Steps)
                        .style('left', (event.pageX) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

        }).catch(error => {
            console.error('Error loading the data: ', error);
        });
    };

    window.addEventListener('resize', drawGraph);
    window.addEventListener('load', drawGraph);
});
