class StepsVisualization {
    constructor() {
        this.tooltip = d3.select("#tooltip");
        this.container = d3.select('#grid-container');
        this.data = null;
        this.colorSteps = this.generateColorSteps();
        this.draw = () => this.drawGraph();
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

    setupEventListeners() {
        window.addEventListener('resize', this.draw);
    }

    async init() {
        this.setupEventListeners();
        try {
            await this.loadData();
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
        }
    }

    async loadData() {
        try {
            const response = await fetch('steps.csv');
            if (!response.ok) {
                this.showError(`HTTP error! status: ${response.status}`);
                return;
            }

            const data = d3.csvParse(
                await response.text(),
                d => ({
                    Date: d3.timeParse("%Y-%m-%d")(d.Date),
                    Steps: +d.Steps || 0
                })
            );

            if (!data?.length) {
                this.showError('No data found in CSV file');
                return;
            }

            this.data = data;
            this.drawGraph();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(error.message);
        }
    }

    showError(message) {
        this.container
            .html('')
            .append('div')
            .attr('class', 'error-message')
            .html(`
                <h3>Error Loading Data</h3>
                <p>${message}</p>
                <p>Please check that:</p>
                <ul>
                    <li>The steps.csv file exists in the correct location</li>
                    <li>The file is being served through a web server (not opened directly)</li>
                    <li>The CSV format is correct (Date,Steps)</li>
                </ul>
                <button onclick="location.reload()">Retry</button>
            `);
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

document.addEventListener('DOMContentLoaded', () => {
    const viz = new StepsVisualization();
    viz.init().catch(error => {
        console.error('Failed to initialize visualization:', error);
    });
});