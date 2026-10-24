document.addEventListener('DOMContentLoaded', () => {

    // Grabbing required DOM elements once page loads
    const input = document.getElementById("date_picker");
    const output = document.getElementById("date_text");
    const searchInput = document.getElementById("search_trans");
    const clearBtn = document.getElementById("clear_filters");

    // Converts yyyy-mm-dd to a readable date format
    // AI assistance (ChatGPT) used to confirm locale-based date formatting approach
    function formatDateToLong(dateStr) {
        const options = {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        };
        return new Date(dateStr).toLocaleDateString('en-GB', options);
    }

    // Handles both date and text-based filtering
    function filterTransactions() {
        const date = input.value;
        const searchValue = searchInput.value.toLowerCase();

        document.querySelectorAll("#trans_table tbody tr").forEach(row => {
            const rowDateText = row.children[1].innerText;
            let rowDate = "";

            // Normalizing row date to compare with input date
            // AI assistance (ChatGPT) used to validate safe date parsing logic
            if (rowDateText) {
                const parsed = new Date(rowDateText);
                if (!isNaN(parsed)) {
                    rowDate = parsed.toISOString().split("T")[0];
                }
            }

            const name = row.children[0].innerText.toLowerCase();

            const show =
                (date === "" || rowDate === date) &&
                (name.includes(searchValue));

            row.style.display = show ? "" : "none";
        });
    }

    // Date change trigger
    input.addEventListener("change", () => {
        if (input.value) {
            output.textContent = formatDateToLong(input.value);
            filterTransactions();
        }
    });

    // Live search filtering
    searchInput.addEventListener("keyup", filterTransactions);

    // Resets all applied filters
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        input.value = "";
        output.textContent = "";
        filterTransactions();
    });

    // Default to today's date on load
    // AI assistance (ChatGPT) used to recall ISO date initialization pattern
    const today = new Date().toISOString().split("T")[0];
    input.value = today;
    output.textContent = formatDateToLong(today);

    // Chart.js setup
    const ctx = document.getElementById('netCapitalChart').getContext('2d');
    const netCapitalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Net Capital',
                data: chartData,
                borderColor: '#6600CC',
                backgroundColor: 'rgba(102, 0, 204, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});
