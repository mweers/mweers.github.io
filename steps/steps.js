// Constants and configurations
const CONFIG = {
    parseDate: d3.timeParse("%Y-%m-%d"),
    formatDate: d3.timeFormat("%Y-%m-%d"),
    csvPath: 'steps.csv',
    tooltipDuration: {
        fadeIn: 200,
        fadeOut: 500
    },
    stepRanges: [
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
        { limit: 100000, color: '--color-step-20' }
    ]
};

class StepsVisualization {
    constructor() {
        this.tooltip = d3.select("#tooltip");
        this.container = d3.select('#grid-container');
        this.data = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        const debouncedDraw = _.debounce(() => this.drawGraph(), 250);
        window.addEventListener('resize', debouncedDraw);
    }

    async loadData() {
        try {
            const response = await fetch('steps.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const csvText = await response.text();
            const data = d3.csvParse(csvText, d => ({
                Date: CONFIG.parseDate(d.Date),
                Steps: +d.Steps
            }));

            if (!data || data.length === 0) {
                throw new Error('No data found in CSV file');
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
        const range = CONFIG.stepRanges.find(range => steps <= range.limit)
            || CONFIG.stepRanges[CONFIG.stepRanges.length - 1];
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
    new StepsVisualization();
});