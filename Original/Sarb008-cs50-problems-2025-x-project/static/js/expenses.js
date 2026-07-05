document.addEventListener("DOMContentLoaded", () => {

    // Modal related elements
    const modal = document.getElementById("addExpenseModal");
    const openBtn = document.getElementById("add_exp_btn");
    const cancelBtn = document.getElementById("cancel_btn");
    const addForm = document.getElementById("add_exp_form");

    // Search, filter and sort controls
    const searchInput = document.getElementById("exp_search");
    const filterCategorySelect = document.getElementById("filter_category"); // dropdown filter
    const filterCategoryAuto = document.getElementById("filterCategory"); // quick filter
    const dateFilter = document.getElementById("filter_date");
    const sortSelect = document.getElementById("sortSelect");

    // Expense table body
    const tbody = document.querySelector("#exp_table tbody");

    // Cached expenses list for filtering/sorting without refetch
    let EXPENSES_CACHE = [];

    // Clears all rows from the table
    function clearTable() {
        tbody.innerHTML = "";
    }

    // Escapes user input before injecting into DOM
    // AI assistance (ChatGPT) used to recall standard HTML escaping pattern
    function escapeHtml(s) {
        if (s == null) return "";
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // Generates the same color for the same category every time
    // AI assistance (ChatGPT) used to validate hash-based color generation logic
    function getCategoryColor(category) {
        if (!category) return "#666";
        let hash = 0;
        for (let i = 0; i < category.length; i++) {
            hash = category.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
    }

    // Creates and inserts a single expense row
    function insertRowForExpense(exp) {
        const tr = document.createElement("tr");
        tr.dataset.id = exp.id;

        const category = exp.category || "Other";
        const color = getCategoryColor(category);

        tr.innerHTML = `
            <td>${escapeHtml(exp.name)}</td>
            <td>${escapeHtml(exp.date)}</td>
            <td>₹${escapeHtml(Math.abs(exp.amount))}</td>
            <td><span class="cat_tag" style="background-color:${color}">${escapeHtml(category)}</span></td>
            <td>${escapeHtml(exp.method || "-")}</td>
            <td>${escapeHtml(exp.vendor || "-")}</td>
            <td>${escapeHtml(exp.notes || "-")}</td>
            <td><button class="delete_btn">Delete</button></td>
        `;

        tbody.appendChild(tr);
    }

    // Fetches expenses from backend and renders them
    async function loadAndRenderExpenses() {
        clearTable();

        const res = await fetch("/api/expenses");
        const data = await res.json();

        EXPENSES_CACHE = data.expenses || [];

        EXPENSES_CACHE.forEach(insertRowForExpense);
        populateCategoryFilters();
        applyFilters();
    }

    // Returns a copy of cached expenses
    function getExpenses() {
        return [...EXPENSES_CACHE];
    }

    // Updates cache and re-renders table
    function setExpenses(arr) {
        EXPENSES_CACHE = arr;
        clearTable();
        EXPENSES_CACHE.forEach(insertRowForExpense);
        applyFilters();
    }

    // Resolves which category filter should be applied
    function getSelectedCategory() {
        if (filterCategoryAuto.value !== "all") {
            return filterCategoryAuto.value.toLowerCase();
        }
        if (filterCategorySelect.value !== "") {
            return filterCategorySelect.value.toLowerCase();
        }
        return "all";
    }

    // Applies search, category and date filters together
    // AI assistance (ChatGPT) used to reason about combined filter conditions
    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const cat = getSelectedCategory();
        const date = dateFilter.value;

        document.querySelectorAll("#exp_table tbody tr").forEach(row => {
            const rowText = row.innerText.toLowerCase();
            const rowDate = row.children[1].innerText;
            const rowCategory = row.children[3].innerText.toLowerCase();

            const show =
                (!search || rowText.includes(search)) &&
                (cat === "all" || rowCategory === cat) &&
                (!date || rowDate === date);

            row.style.display = show ? "" : "none";
        });
    }

    // Populates category dropdowns dynamically
    function populateCategoryFilters() {
        const cats = [...new Set(EXPENSES_CACHE.map(e => e.category).filter(Boolean))];

        filterCategorySelect.innerHTML = `<option value="">All Categories</option>`;
        filterCategoryAuto.innerHTML = `<option value="all">All</option>`;

        cats.forEach(c => {
            filterCategorySelect.add(new Option(c, c));
            filterCategoryAuto.add(new Option(c, c));
        });
    }

    // Handles sorting based on selected option
    sortSelect.addEventListener("change", e => {
        const arr = getExpenses();

        switch (e.target.value) {
            case "amount":
                arr.sort((a, b) => a.amount - b.amount);
                break;
            case "date":
                arr.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case "title":
                arr.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "category":
                arr.sort((a, b) => a.category.localeCompare(b.category));
                break;
        }

        setExpenses(arr);
    });

    // Filter triggers
    searchInput.addEventListener("keyup", applyFilters);
    dateFilter.addEventListener("change", applyFilters);
    filterCategorySelect.addEventListener("change", applyFilters);
    filterCategoryAuto.addEventListener("change", applyFilters);

    // Modal open / close handlers
    openBtn.onclick = () => modal.style.display = "flex";
    cancelBtn.onclick = () => modal.style.display = "none";

    // Handles expense submission
    addForm.addEventListener("submit", async e => {
        e.preventDefault();

        const payload = {
            name: exp_name.value.trim(),
            date: exp_date.value,
            amount: Number(exp_amount.value || 0),
            category: exp_category.value,
            method: exp_method.value,
            vendor: exp_vendor.value.trim(),
            notes: exp_notes.value.trim()
        };

        await fetch("/api/expenses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        addForm.reset();
        modal.style.display = "none";
        loadAndRenderExpenses();
    });

    // Handles delete using event delegation
    document.addEventListener("click", async e => {
        if (!e.target.classList.contains("delete_btn")) return;

        const row = e.target.closest("tr");
        if (!row) return;

        if (!confirm("Delete this expense?")) return;

        await fetch(`/api/expenses/${row.dataset.id}`, {
            method: "DELETE"
        });
        loadAndRenderExpenses();
    });

    // Initial data load
    loadAndRenderExpenses();
});
