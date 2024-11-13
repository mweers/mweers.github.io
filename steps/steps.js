// Constants and configurations
const CONFIG = {
    parseDate: d3.timeParse("%Y-%m-%d"),
    formatDate: d3.timeFormat("%Y-%m-%d"),
    csvPath: 'steps.csv',
    tooltipDuration: {
        fadeIn: 200,
        fadeOut: 500
    },
    colorSteps: {
        start: '--color-step-start',    // lightest
        middle: '--color-step-middle',   // middle
        end: '--color-step-end'      // darkest
    }
};

class StepsVisualization {
    constructor() {
        this.tooltip = d3.select("#tooltip");
        this.container = d3.select('#grid-container');
        this.data = null;
        this.colorSteps = this.generateColorSteps();
    }

    generateColorSteps() {
        const firstHalf = d3.scaleLinear()
            .domain([0, 9])
            .range([1, 10]);

        const secondHalf = d3.scaleLinear()
            .domain([10, 19])
            .range([11, 20]);

        return Array.from({ length: 20 }, (_, i) => {
            const stepNumber = i < 10 ? Math.round(firstHalf(i)) : Math.round(secondHalf(i));
            return {
                limit: (i + 1) * 5000,
                color: `--color-step-${stepNumber}`
            };
        });
    }

    async init() {
        this.setupEventListeners();
        try {
            await this.loadData();
        } catch (error) {
            console.error('Failed to initialize visualization:', error);
        }
    }

    setupEventListeners() {
        const debouncedDraw = _.debounce(() => this.drawGraph(), 250);
        window.addEventListener('resize', debouncedDraw);
    }

    async loadData() {
        try {
            const response = await fetch('steps.csv');
            if (!response.ok) {
                this.showError(`HTTP error! status: ${response.status}`);
                return;
            }

            const csvText = await response.text();
            const data = d3.csvParse(csvText, d => ({
                Date: CONFIG.parseDate(d.Date),
                Steps: +d.Steps
            }));

            if (!data || data.length === 0) {
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
        const rootStyle = getComputedStyle(document.documentElement);
        const range = this.colorSteps.find(step => steps <= step.limit)
            || this.colorSteps[this.colorSteps.length - 1];
        return rootStyle.getPropertyValue(range.color);
    }

    handleTooltip(event, d) {
        const tooltipContent = `
            <div class="tooltip-content">
                <strong>Date:</strong> ${CONFIG.formatDate(d.Date)}<br>
                <strong>Steps:</strong> ${d.Steps.toLocaleString()}
            </div>
        `;

        this.tooltip
            .html(tooltipContent)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`)
            .transition()
            .duration(CONFIG.tooltipDuration.fadeIn)
            .style('opacity', 1);
    }

    drawGraph() {
        if (!this.data) return;

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
                    .duration(CONFIG.tooltipDuration.fadeOut)
                    .style('opacity', 0);
            });
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const viz = new StepsVisualization();
    viz.init().catch(error => {
        console.error('Failed to initialize visualization:', error);
    });
});