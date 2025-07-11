class StepsVisualization {
    constructor() {
        this.tooltip = d3.select("#tooltip");
        this.container = d3.select('#grid-container');
        this.data = null;
        this.colorSteps = this.generateColorSteps();
        this.handleTooltip = this.handleTooltip.bind(this);
    }

    generateColorSteps() {
        const rootStyle = getComputedStyle(document.documentElement);
        const startColor = rootStyle.getPropertyValue('--color-step-start').trim();
        const middleColor = rootStyle.getPropertyValue('--color-step-middle').trim();
        const endColor = rootStyle.getPropertyValue('--color-step-end').trim();

        const firstHalf = d3.scaleLinear()
            .domain([0, 9])
            .range([startColor, middleColor]);

        const secondHalf = d3.scaleLinear()
            .domain([10, 19])
            .range([middleColor, endColor]);

        return Array.from({ length: 20 }, (_, i) => ({
            limit: (i + 1) * 5000,
            color: i < 10 ? firstHalf(i) : secondHalf(i)
        }));
    }

    async init() {
        try {
            await this.loadData();
            this.drawGraph();
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
        }
    }

    async loadData() {
        try {
            const data = await d3.csv("https://raw.githubusercontent.com/mweers/mweers.github.io/refs/heads/master/steps/steps.csv", d => ({
                Date: d3.timeParse("%Y-%m-%d")(d.Date),
                Steps: +d.Steps || 0
            }));

            if (!data?.length) {
                console.error('No data found in CSV file');
                return;
            }

            this.data = data;
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    determineColor(steps) {
        const range = this.colorSteps.find(step => steps <= step.limit)
            || this.colorSteps[this.colorSteps.length - 1];
        return range.color;
    }

    handleTooltip(event, d) {
        if (!d?.Date || !d?.Steps) return;

        const tooltipContent = `
            <div class="tooltip-content">
                <strong>Date:</strong> ${d3.timeFormat("%Y-%m-%d")(d.Date)}<br>
                <strong>Steps:</strong> ${d.Steps.toLocaleString()}
            </div>
        `;

        this.tooltip
            .html(tooltipContent)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`)
            .transition()
            .duration(200)
            .style('opacity', 1);
    }

    drawGraph() {
        if (!this.data?.length) return;

        this.container.selectAll('*').remove();

        this.container
            .selectAll('.day-square')
            .data(this.data)
            .enter()
            .append('div')
            .attr('class', 'day-square')
            .style('background-color', d => this.determineColor(d.Steps))
            .on('mouseover', (event, d) => this.handleTooltip(event, d))
            .on('mouseout', () => {
                this.tooltip
                    .transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }
}

window.addEventListener('load', () => {
    const viz = new StepsVisualization();
    viz.init().catch(error => {
        console.error('Failed to initialize visualization:', error);
    });
});