document.addEventListener("DOMContentLoaded", () => {

    // Modal and form elements
    const modal = document.getElementById("addReceiptModal");
    const openBtn = document.getElementById("add_receipt_btn");
    const cancelBtn = document.getElementById("cancel_r_btn");
    const addForm = document.getElementById("add_receipt_form");
    const tableBody = document.querySelector("#receipt_table tbody");

    // Search, filter and sort controls
    const searchInput = document.getElementById("receipt_search");
    const filterCategorySelect = document.getElementById("filter_receipt_category");
    const dateFilter = document.getElementById("filter_receipt_date");
    const sortSelect = document.getElementById("receipt_sort");

    // Cache to store receipts locally
    let RECEIPTS_CACHE = [];

    // Modal open / close handling
    openBtn.onclick = () => modal.style.display = "flex";
    cancelBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = "none";
    };

    // Escapes HTML to prevent unsafe DOM insertion
    // AI assistance (ChatGPT) used to recall standard client-side HTML escaping pattern
    const escapeHtml = s =>
        s ?
        String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;") :
        "";

    // Generates a consistent color for each category
    // AI assistance (ChatGPT) used to validate hash-to-HSL color generation approach
    function getCategoryColor(category) {
        if (!category) return "#666";

        let hash = 0;
        for (let i = 0; i < category.length; i++) {
            hash = category.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    // Creates and inserts a receipt row into the table
    function insertRow(r) {
        const tr = document.createElement("tr");
        tr.dataset.id = r.id;

        const category = r.category || "Other";
        const color = getCategoryColor(category);

        tr.innerHTML = `
            <td>${escapeHtml(r.name)}</td>
            <td>${escapeHtml(r.date)}</td>
            <td>
                <span class="cat_tag" style="background-color:${color}">
                    ${escapeHtml(category)}
                </span>
            </td>
            <td>${escapeHtml(r.vendor)}</td>
            <td>₹${escapeHtml(r.amount)}</td>
            <td>${r.img ? `<img src="${r.img}" class="thumb">` : "-"}</td>
            <td>${escapeHtml(r.notes || "-")}</td>
            <td><button class="delete_r_btn">Delete</button></td>
        `;

        tableBody.appendChild(tr);
    }

    // Fetches receipts from backend and renders them
    async function loadReceipts() {
        tableBody.innerHTML = "";

        const res = await fetch("/api/receipts");
        const data = await res.json();

        RECEIPTS_CACHE = data.receipts || [];

        RECEIPTS_CACHE.forEach(insertRow);
        populateCategoryFilter();
        applyFilters();
    }

    // Populates category dropdown dynamically
    function populateCategoryFilter() {
        const cats = [...new Set(RECEIPTS_CACHE.map(r => r.category).filter(Boolean))];
        filterCategorySelect.innerHTML = `<option value="">All Categories</option>`;
        cats.forEach(c => filterCategorySelect.add(new Option(c, c)));
    }

    // Handles adding a new receipt
    addForm.addEventListener("submit", async e => {
        e.preventDefault();

        let file = document.getElementById("r_image").files[0];
        let imgData = "";

        // Convert image to Base64 if provided
        // AI assistance (ChatGPT) used to confirm FileReader → Base64 workflow
        if (file) {
            imgData = await new Promise(res => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result);
                reader.readAsDataURL(file);
            });
        }

        const payload = {
            title: r_title.value.trim(),
            date: r_date.value,
            amount: Number(r_amount.value),
            category: r_category.value,
            vendor: r_vendor.value.trim(),
            notes: r_notes.value.trim(),
            img: imgData
        };

        await fetch("/api/receipts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        addForm.reset();
        modal.style.display = "none";
        loadReceipts();
    });

    // Delete receipt using event delegation
    document.addEventListener("click", async e => {
        if (!e.target.classList.contains("delete_r_btn")) return;

        const row = e.target.closest("tr");
        const id = row.dataset.id;

        if (!confirm("Delete this receipt?")) return;

        await fetch(`/api/receipts/${id}`, {
            method: "DELETE"
        });

        loadReceipts();
    });

    // Applies search, category and date filters
    // AI assistance (ChatGPT) used to reason about multi-column text filtering logic
    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const cat = filterCategorySelect.value.toLowerCase();
        const date = dateFilter.value;

        document.querySelectorAll("#receipt_table tbody tr").forEach(row => {
            const t = row.children;

            const show =
                (
                    t[0].innerText.toLowerCase().includes(search) ||
                    t[3].innerText.toLowerCase().includes(search) ||
                    t[6].innerText.toLowerCase().includes(search)
                ) &&
                (!cat || t[2].innerText.toLowerCase().includes(cat)) &&
                (!date || t[1].innerText === date);

            row.style.display = show ? "" : "none";
        });
    }

    // Filter listeners
    searchInput.addEventListener("keyup", applyFilters);
    filterCategorySelect.addEventListener("change", applyFilters);
    dateFilter.addEventListener("change", applyFilters);

    // Sort receipts based on selected option
    sortSelect.addEventListener("change", () => {
        let rows = Array.from(tableBody.rows);
        const criteria = sortSelect.value;

        rows.sort((a, b) => {
            if (criteria === "date") return new Date(a.children[1].innerText) - new Date(b.children[1].innerText);
            if (criteria === "title") return a.children[0].innerText.localeCompare(b.children[0].innerText);
            if (criteria === "category") return a.children[2].innerText.localeCompare(b.children[2].innerText);
            return 0;
        });

        rows.forEach(r => tableBody.appendChild(r));
    });

    // Initial load
    loadReceipts();
});
