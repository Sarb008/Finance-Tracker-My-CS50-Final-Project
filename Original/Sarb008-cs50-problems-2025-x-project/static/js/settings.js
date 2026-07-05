document.addEventListener("DOMContentLoaded", () => {

    // Keys used for storing data in localStorage
    const STARTING_CAPITAL_KEY = "startingCapital";
    const INCOME_CAT_KEY = "incomeCategories";
    const EXPENSE_CAT_KEY = "expenseCategories";
    const PROJECT_TAG_KEY = "projectTags";

    // Capital configuration elements
    const startingCapitalInput = document.getElementById("starting_capital_input");
    const saveStartingCapitalBtn = document.getElementById("save_starting_capital");
    const resetCapitalBtn = document.getElementById("reset_capital_btn");

    // Lists where tags are rendered
    const incomeList = document.getElementById("income_categories_list");
    const expenseList = document.getElementById("expense_categories_list");
    const projectTagsList = document.getElementById("project_tags_list");

    // Buttons to add new tags
    const addIncomeBtn = document.getElementById("add_income_category_btn");
    const addExpenseBtn = document.getElementById("add_expense_category_btn");
    const addProjectTagBtn = document.getElementById("add_project_tag_btn");

    // Modal elements
    const modal = document.getElementById("tag_modal");
    const modalTitle = document.getElementById("tag_modal_title");
    const tagNameInput = document.getElementById("tag_name_input");
    const saveTagBtn = document.getElementById("save_tag_btn");
    const cancelTagBtn = document.getElementById("cancel_tag_btn");

    // Tracks what is currently being edited
    let currentMode = null; // income | expense | project
    let editIndex = null;

    // Safely loads data from localStorage
    function loadData(key, fallback = []) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    // Saves updated data to localStorage
    function saveData(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Opens modal with given title and optional value
    // AI assistance (ChatGPT) used to confirm clean modal open/focus pattern
    function openModal(title, value = "") {
        modalTitle.textContent = title;
        tagNameInput.value = value;
        modal.style.display = "flex";
        tagNameInput.focus();
    }

    // Resets modal state and closes it
    function closeModal() {
        modal.style.display = "none";
        tagNameInput.value = "";
        currentMode = null;
        editIndex = null;
    }

    // Loads starting capital from backend
    (async function loadStartingCapital() {
        const res = await fetch("/api/targets");
        const data = await res.json();
        startingCapitalInput.value = data.startingCapital || 0;
    })();

    // Saves starting capital value
    saveStartingCapitalBtn.addEventListener("click", async () => {
        const value = Number(startingCapitalInput.value) || 0;

        await fetch("/api/settings/capital", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                starting_capital: value
            })
        });

        alert("Starting capital updated successfully.");
    });

    // Resets all transactions after confirmation
    resetCapitalBtn.addEventListener("click", async () => {
        if (!confirm("This will delete ALL income and expense records. Continue?")) return;

        await fetch("/api/settings/reset", {
            method: "POST"
        });

        alert("All transactions have been reset.");
    });

    // Creates a single tag element with edit/delete actions
    function createTagElement(name, mode, index) {
        const div = document.createElement("div");
        div.className = "tag_item";
        div.innerHTML = `
            ${name}
            <span class="tag_actions">
                <i class="edit_btn" data-mode="${mode}" data-index="${index}">✏️</i>
                <i class="delete_btn" data-mode="${mode}" data-index="${index}">🗑️</i>
            </span>
        `;
        return div;
    }

    // Renders all categories and tags
    function renderAll() {
        const income = loadData(INCOME_CAT_KEY);
        const expense = loadData(EXPENSE_CAT_KEY);
        const projects = loadData(PROJECT_TAG_KEY);

        incomeList.innerHTML = "";
        expenseList.innerHTML = "";
        projectTagsList.innerHTML = "";

        income.forEach((c, i) => incomeList.appendChild(createTagElement(c, "income", i)));
        expense.forEach((c, i) => expenseList.appendChild(createTagElement(c, "expense", i)));
        projects.forEach((c, i) => projectTagsList.appendChild(createTagElement(c, "project", i)));
    }

    // Open modal to add income category
    addIncomeBtn.addEventListener("click", () => {
        currentMode = "income";
        editIndex = null;
        openModal("Add Income Category");
    });

    // Open modal to add expense category
    addExpenseBtn.addEventListener("click", () => {
        currentMode = "expense";
        editIndex = null;
        openModal("Add Expense Category");
    });

    // Open modal to add project tag
    addProjectTagBtn.addEventListener("click", () => {
        currentMode = "project";
        editIndex = null;
        openModal("Add Project Tag");
    });

    // Handles edit and delete using event delegation
    // AI assistance (ChatGPT) suggested clean delegation pattern for dynamic elements
    document.addEventListener("click", (e) => {

        if (e.target.classList.contains("edit_btn")) {
            currentMode = e.target.dataset.mode;
            editIndex = Number(e.target.dataset.index);

            const key =
                currentMode === "income" ? INCOME_CAT_KEY :
                currentMode === "expense" ? EXPENSE_CAT_KEY :
                PROJECT_TAG_KEY;

            const list = loadData(key);
            openModal("Edit Item", list[editIndex]);
        }

        if (e.target.classList.contains("delete_btn")) {
            const mode = e.target.dataset.mode;
            const index = Number(e.target.dataset.index);

            const key =
                mode === "income" ? INCOME_CAT_KEY :
                mode === "expense" ? EXPENSE_CAT_KEY :
                PROJECT_TAG_KEY;

            const list = loadData(key);
            list.splice(index, 1);
            saveData(key, list);
            renderAll();
        }
    });

    // Saves new or edited tag from modal
    // AI assistance (ChatGPT) suggested concise logic for distinguishing edit vs new
    saveTagBtn.addEventListener("click", () => {
        const value = tagNameInput.value.trim();
        if (!value) return;

        const key =
            currentMode === "income" ? INCOME_CAT_KEY :
            currentMode === "expense" ? EXPENSE_CAT_KEY :
            PROJECT_TAG_KEY;

        const list = loadData(key);

        if (editIndex !== null) {
            list[editIndex] = value;
        } else {
            list.push(value);
        }

        saveData(key, list);
        closeModal();
        renderAll();
    });

    // Cancels modal action
    cancelTagBtn.addEventListener("click", closeModal);

    // Closes modal when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // Initial render on page load
    renderAll();
});
