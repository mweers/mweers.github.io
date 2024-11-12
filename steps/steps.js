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