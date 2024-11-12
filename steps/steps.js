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
        { limit: 5000, color: '--color-step-1', label: '0-5k' },
        { limit: 10000, color: '--color-step-2', label: '5k-10k' },
        { limit: 15000, color: '--color-step-3', label: '10k-15k' },
        { limit: 20000, color: '--color-step-4', label: '15k-20k' },
        { limit: 25000, color: '--color-step-5', label: '20k-25k' },
        { limit: 30000, color: '--color-step-6', label: '25k-30k' },
        { limit: 35000, color: '--color-step-7', label: '30k-35k' },
        { limit: 40000, color: '--color-step-8', label: '35k-40k' },
        { limit: 45000, color: '--color-step-9', label: '40k-45k' },
        { limit: 50000, color: '--color-step-10', label: '45k-50k' },
        { limit: 55000, color: '--color-step-11', label: '50k-55k' },
        { limit: 60000, color: '--color-step-12', label: '55k-60k' },
        { limit: 65000, color: '--color-step-13', label: '60k-65k' },
        { limit: 70000, color: '--color-step-14', label: '65k-70k' },
        { limit: 75000, color: '--color-step-15', label: '70k-75k' },
        { limit: 80000, color: '--color-step-16', label: '75k-80k' },
        { limit: 85000, color: '--color-step-17', label: '80k-85k' },
        { limit: 90000, color: '--color-step-18', label: '85k-90k' },
        { limit: 95000, color: '--color-step-19', label: '90k-95k' },
        { limit: 100000, color: '--color-step-20', label: '95k-100k' }
    ]
};

class StepsVisualization {
    constructor() {
        this.tooltip = d3.select("#tooltip");
        this.container = d3.select('#grid-container');
        this.data = null;
        this.stats = {
            total: 0,
            average: 0,
            max: 0,
            min: Infinity
        };

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
            // First, check if the file exists
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
            this.calculateStats();
            this.drawGraph();
            this.drawLegend();
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

    calculateStats() {
        if (!this.data || !this.data.length) return;

        this.stats.total = d3.sum(this.data, d => d.Steps);
        this.stats.average = d3.mean(this.data, d => d.Steps);
        this.stats.max = d3.max(this.data, d => d.Steps);
        this.stats.min = d3.min(this.data, d => d.Steps);
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
                <strong>Steps:</strong> ${d.Steps.toLocaleString()}<br>
                <strong>% of Goal:</strong> ${((d.Steps / 10000) * 100).toFixed(1)}%
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

        const squares = this.container
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

        this.updateStatsDisplay();
    }

    drawLegend() {
        if (!this.data) return;

        const legend = d3.select('#legend')
            .html('')
            .append('div')
            .attr('class', 'legend-container');

        CONFIG.stepRanges.forEach(range => {
            const legendItem = legend
                .append('div')
                .attr('class', 'legend-item');

            legendItem
                .append('div')
                .attr('class', 'legend-color')
                .style('background-color',
                    getComputedStyle(document.documentElement)
                        .getPropertyValue(range.color)
                );

            legendItem
                .append('span')
                .text(range.label);
        });
    }

    updateStatsDisplay() {
        if (!this.data) return;

        const statsContainer = d3.select('#stats');
        statsContainer.html(`
            <div class="stats-container">
                <div>Total Steps: ${this.stats.total.toLocaleString()}</div>
                <div>Daily Average: ${Math.round(this.stats.average).toLocaleString()}</div>
                <div>Best Day: ${this.stats.max.toLocaleString()}</div>
                <div>Target Days: ${this.data.filter(d => d.Steps >= 10000).length}</div>
            </div>
        `);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new StepsVisualization();
});