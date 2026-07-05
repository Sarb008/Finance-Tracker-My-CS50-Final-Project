document.addEventListener('DOMContentLoaded', () => {

    // Buttons and modal used to edit financial targets
    const editBtn = document.getElementById('edit_targets_btn');
    const editModal = document.getElementById('editTargetsModal');
    const cancelTargetsBtn = document.getElementById('cancel_targets_btn');
    const editForm = document.getElementById('edit_targets_form');

    // Inputs inside the edit modal
    const inpNet = document.getElementById('inp_target_net');
    const inpIncome = document.getElementById('inp_target_income');
    const inpExpense = document.getElementById('inp_target_expense');
    const inpStarting = document.getElementById('inp_starting_capital');

    // Displayed target values on dashboard
    const targetNetValue = document.getElementById('target_net_value');
    const targetIncomeValue = document.getElementById('target_income_value');
    const targetExpenseValue = document.getElementById('target_expense_value');

    // Text showing actual values and percentages
    const netActualText = document.getElementById('net_actual_text');
    const netPctText = document.getElementById('net_pct_text');
    const incomeActualText = document.getElementById('income_actual_text');
    const incomePctText = document.getElementById('income_pct_text');
    const expenseActualText = document.getElementById('expense_actual_text');
    const expensePctText = document.getElementById('expense_pct_text');

    // Progress bar elements
    const netProgress = document.getElementById('net_progress');
    const incomeProgress = document.getElementById('income_progress');
    const expenseProgress = document.getElementById('expense_progress');

    // Chart.js instances (initialized later)
    let incomeBarChart, expenseBarChart, netDonutChart;

    // Calculates a safe Y-axis max so charts don’t feel cramped
    function getChartMax(actualSeries, targetValue) {
        const actualMax = Math.max(...actualSeries, 0);
        const targetMax = targetValue || 0;
        return Math.ceil(Math.max(actualMax, targetMax) * 1.1);
    }

    // Converts formatted currency strings into usable numbers
    function parseAmount(v) {
        if (v === null || v === undefined) return 0;
        const n = Number(String(v).replace(/[₹,\s]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }

    // Fetch saved targets (net, income, expense, starting capital)
    const fetchTargets = async () => (await fetch('/api/targets')).json();

    // Fetch actual income/expense summary data
    const fetchSummary = async () => (await fetch('/api/summary')).json();

    // Main UI refresh — syncs numbers, progress bars, and charts
    // AI assistance (ChatGPT) suggested safe percentage calculations and min/max handling
    async function refreshAllUI() {
        const targets = await fetchTargets();
        const summary = await fetchSummary();

        const netCapital =
            parseAmount(targets.startingCapital) +
            parseAmount(summary.net_capital);

        const actualIncomeThisMonth = parseAmount(summary.monthly_income);
        const actualExpenseThisMonth = parseAmount(summary.monthly_expense);

        // Update target labels
        targetNetValue.textContent =
            `₹${parseAmount(targets.targetNet).toLocaleString('en-IN')}`;
        targetIncomeValue.textContent =
            `₹${parseAmount(targets.monthlyIncomeTarget).toLocaleString('en-IN')}`;
        targetExpenseValue.textContent =
            `₹${parseAmount(targets.monthlyExpenseLimit).toLocaleString('en-IN')}`;

        // Update actual values
        netActualText.textContent =
            `Actual: ₹${netCapital.toLocaleString('en-IN')}`;
        incomeActualText.textContent =
            `Actual: ₹${actualIncomeThisMonth.toLocaleString('en-IN')}`;
        expenseActualText.textContent =
            `Actual: ₹${actualExpenseThisMonth.toLocaleString('en-IN')}`;

        // Calculate progress percentages safely
        const netPct = targets.targetNet ?
            Math.round((netCapital / targets.targetNet) * 100) :
            0;

        const incomePct = targets.monthlyIncomeTarget ?
            Math.round((actualIncomeThisMonth / targets.monthlyIncomeTarget) * 100) :
            0;

        const expensePct = targets.monthlyExpenseLimit ?
            Math.round((actualExpenseThisMonth / targets.monthlyExpenseLimit) * 100) :
            0;

        netPctText.textContent = ` · ${Math.min(100, netPct)}%`;
        incomePctText.textContent = ` · ${Math.min(100, incomePct)}%`;
        expensePctText.textContent = ` · ${expensePct}%`;

        // Reflect percentages visually
        netProgress.style.width = `${Math.min(100, netPct)}%`;
        incomeProgress.style.width = `${Math.min(100, incomePct)}%`;
        expenseProgress.style.width = `${Math.min(100, expensePct)}%`;

        updateCharts(
            summary.monthly_income_series || [],
            summary.monthly_expense_series || [],
            targets.monthlyIncomeTarget,
            targets.monthlyExpenseLimit,
            netCapital,
            targets.targetNet
        );
    }

    // Creates all charts once during page load
    // AI assistance (ChatGPT) suggested clean Chart.js initialization pattern
    function createCharts() {
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        incomeBarChart = new Chart(document.getElementById('incomeBarChart'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                        label: 'Actual Income',
                        data: []
                    },
                    {
                        label: 'Target Income',
                        data: []
                    }
                ]
            }
        });

        expenseBarChart = new Chart(document.getElementById('expenseBarChart'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                        label: 'Actual Expense',
                        data: []
                    },
                    {
                        label: 'Target Expense',
                        data: []
                    }
                ]
            }
        });

        netDonutChart = new Chart(document.getElementById('netDonutChart'), {
            type: 'doughnut',
            data: {
                labels: ['Net Capital', 'Remaining'],
                datasets: [{
                    data: [0, 0]
                }]
            },
            options: {
                cutout: '70%'
            }
        });
    }

    // Updates chart data without recreating charts
    function updateCharts(
        incomeSeries,
        expenseSeries,
        incomeTarget,
        expenseTarget,
        netCapital,
        netTarget
    ) {
        incomeBarChart.data.datasets[0].data = incomeSeries;
        incomeBarChart.data.datasets[1].data = new Array(12).fill(incomeTarget || 0);
        incomeBarChart.options.scales.y = {
            beginAtZero: true,
            max: getChartMax(incomeSeries, incomeTarget)
        };
        incomeBarChart.update();

        expenseBarChart.data.datasets[0].data = expenseSeries;
        expenseBarChart.data.datasets[1].data = new Array(12).fill(expenseTarget || 0);
        expenseBarChart.options.scales.y = {
            beginAtZero: true,
            max: getChartMax(expenseSeries, expenseTarget)
        };
        expenseBarChart.update();

        const remaining = Math.max(0, (netTarget || 0) - netCapital);
        netDonutChart.data.datasets[0].data = [
            Math.max(0, netCapital),
            remaining
        ];
        netDonutChart.update();
    }

    // Opens modal and pre-fills existing target values
    // AI assistance (ChatGPT) helped organize modal pre-fill and submit flow
    editBtn.addEventListener('click', async () => {
        const t = await fetchTargets();
        inpNet.value = t.targetNet || 0;
        inpIncome.value = t.monthlyIncomeTarget || 0;
        inpExpense.value = t.monthlyExpenseLimit || 0;
        inpStarting.value = t.startingCapital || 0;
        editModal.style.display = 'flex';
    });

    // Close modal without saving
    cancelTargetsBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Save updated targets and refresh dashboard
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        await fetch('/api/targets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetNet: parseAmount(inpNet.value),
                monthlyIncomeTarget: parseAmount(inpIncome.value),
                monthlyExpenseLimit: parseAmount(inpExpense.value),
                startingCapital: parseAmount(inpStarting.value)
            })
        });

        editModal.style.display = 'none';
        refreshAllUI();
    });

    createCharts();
    refreshAllUI();
});
