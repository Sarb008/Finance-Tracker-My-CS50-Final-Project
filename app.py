from cs50 import SQL
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Connect to SQLite database
db = SQL("sqlite:///finance.db")  # AI-assisted suggestion: database connection setup


@app.route("/")
@app.route("/a_dashboard.html")
def dashboard():
    # Fetch total income and expenses from the transactions table
    # AI-assisted: used ChatGPT to help structure SQL queries for totals
    income = db.execute(
        "SELECT IFNULL(SUM(amount), 0) AS total FROM transactions WHERE type='income'"
    )[0]["total"]

    expense = abs(db.execute(
        "SELECT IFNULL(SUM(amount), 0) AS total FROM transactions WHERE type='expense'"
    )[0]["total"])

    net_capital = income - expense  # calculate net capital

    # Get latest target for net capital from targets table
    target = db.execute(
        "SELECT target_net FROM targets ORDER BY id DESC LIMIT 1"
    )
    target_capital = target[0]["target_net"] if target else 0

    # Fetch recent 10 transactions to display on dashboard
    transactions = db.execute("""
        SELECT name, date, amount, type
        FROM transactions
        ORDER BY date DESC
        LIMIT 10
    """)

    # Prepare monthly chart data for visualization
    # AI-assisted: ChatGPT helped suggest grouped monthly chart query
    chart_data = db.execute("""
        SELECT strftime('%m', date) AS month,
               SUM(CASE
                   WHEN type='income' THEN amount
                   ELSE -amount
               END) AS total
        FROM transactions
        GROUP BY month
        ORDER BY month
    """)

    months = [row["month"] for row in chart_data]
    values = [row["total"] for row in chart_data]

    # Render dashboard template with all calculated values
    return render_template(
        "a_dashboard.html",
        income=income,
        expense=expense,
        net_capital=net_capital,
        target_capital=target_capital,
        transactions=transactions,
        months=months,
        values=values
    )


# Simple page render routes
@app.route("/expenses.html")
def expenses_page():
    return render_template("expenses.html")  # Render expenses page


@app.route("/receipts.html")
def receipts_page():
    return render_template("receipts.html")  # Render receipts page


@app.route("/settings.html")
def settings_page():
    return render_template("settings.html")  # Render settings page


@app.route("/targets.html")
def targets_page():
    return render_template("targets.html")  # Render targets page


# API endpoint: get all expenses
@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    # Fetch all expense transactions from database
    expenses = db.execute("""
        SELECT id, name, date, amount, category, method, vendor, notes
        FROM transactions
        WHERE type='expense'
        ORDER BY date DESC
    """)
    return jsonify({"expenses": expenses})


# API endpoint: add a new expense
@app.route("/api/expenses", methods=["POST"])
def add_expense():
    data = request.get_json()
    amount = abs(int(data["amount"]))  # ensure positive amount

    # Insert new expense record into database
    db.execute("""
        INSERT INTO transactions
        (name, date, amount, type, category, method, vendor, notes)
        VALUES (?, ?, ?, 'expense', ?, ?, ?, ?)
    """,
               data["name"],
               data["date"],
               amount,
               data.get("category"),
               data.get("method"),
               data.get("vendor"),
               data.get("notes", "")
               )

    return jsonify({"status": "success"})


# API endpoint: delete expense by id
@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    db.execute("DELETE FROM transactions WHERE id = ?", expense_id)
    return jsonify({"status": "deleted"})


# API endpoint: get all receipts (income)
@app.route("/api/receipts", methods=["GET"])
def get_receipts():
    # Fetch all income transactions
    receipts = db.execute("""
        SELECT id, name, date, amount, category, vendor, notes
        FROM transactions
        WHERE type='income'
        ORDER BY date DESC
    """)
    return jsonify({"receipts": receipts})


# API endpoint: add new receipt
@app.route("/api/receipts", methods=["POST"])
def add_receipt():
    data = request.get_json()
    # Insert new income record into database
    db.execute("""
        INSERT INTO transactions
        (name, date, amount, type, category, vendor, notes)
        VALUES (?, ?, ?, 'income', ?, ?, ?)
    """,
               data["title"],
               data["date"],
               data["amount"],
               data.get("category"),
               data.get("vendor"),
               data.get("notes", "")
               )
    return jsonify({"status": "success"})


# API endpoint: delete receipt
@app.route("/api/receipts/<int:receipt_id>", methods=["DELETE"])
def delete_receipt(receipt_id):
    db.execute("DELETE FROM transactions WHERE id = ?", receipt_id)
    return jsonify({"status": "deleted"})


# API endpoint: get latest financial targets
@app.route("/api/targets", methods=["GET"])
def get_targets():
    row = db.execute("""
        SELECT target_net, monthly_income, monthly_expense, starting_capital
        FROM targets
        ORDER BY id DESC
        LIMIT 1
    """)

    if not row:
        return jsonify({})

    r = row[0]

    return jsonify({
        "targetNet": r["target_net"],
        "monthlyIncomeTarget": r["monthly_income"],
        "monthlyExpenseLimit": r["monthly_expense"],
        "startingCapital": r["starting_capital"]
    })


# API endpoint: save new targets
@app.route("/api/targets", methods=["POST"])
def save_targets():
    data = request.get_json()
    # Insert new targets into database
    db.execute("""
        INSERT INTO targets
        (target_net, monthly_income, monthly_expense, starting_capital)
        VALUES (?, ?, ?, ?)
    """,
               data["targetNet"],
               data["monthlyIncomeTarget"],
               data["monthlyExpenseLimit"],
               data.get("startingCapital", 0)
               )

    return jsonify({"status": "saved"})


# API endpoint: summary of current month
@app.route("/api/summary", methods=["GET"])
def summary():
    # AI-assisted: used ChatGPT to structure monthly series calculations
    # Get monthly totals for income
    income = db.execute("""
        SELECT IFNULL(SUM(amount),0) total
        FROM transactions
        WHERE type='income'
        AND strftime('%Y-%m', date) = (
            SELECT strftime('%Y-%m', date)
            FROM transactions
            ORDER BY date DESC
            LIMIT 1
        )
    """)[0]["total"]

    # Get monthly totals for expenses
    expense = db.execute("""
        SELECT IFNULL(SUM(amount),0) total
        FROM transactions
        WHERE type='expense'
        AND strftime('%Y-%m', date) = (
            SELECT strftime('%Y-%m', date)
            FROM transactions
            ORDER BY date DESC
            LIMIT 1
        )
    """)[0]["total"]

    # Total net capital across all transactions
    net = db.execute("""
        SELECT IFNULL(SUM(
            CASE WHEN type='income' THEN amount ELSE -amount END
        ),0) total
        FROM transactions
    """)[0]["total"]

    # Monthly series for charting
    income_rows = db.execute("""
        SELECT strftime('%m', date) AS month, SUM(amount) total
        FROM transactions
        WHERE type='income'
        GROUP BY month
    """)

    expense_rows = db.execute("""
        SELECT strftime('%m', date) AS month, SUM(amount) total
        FROM transactions
        WHERE type='expense'
        GROUP BY month
    """)

    # Initialize arrays for all months (Jan-Dec)
    monthly_income_series = [0] * 12
    monthly_expense_series = [0] * 12

    for row in income_rows:
        idx = int(row["month"]) - 1
        monthly_income_series[idx] = row["total"]

    for row in expense_rows:
        idx = int(row["month"]) - 1
        monthly_expense_series[idx] = row["total"]

    return jsonify({
        "monthly_income": income,
        "monthly_expense": expense,
        "net_capital": net,
        "monthly_income_series": monthly_income_series,
        "monthly_expense_series": monthly_expense_series
    })


# API endpoint: update starting capital
@app.route("/api/settings/capital", methods=["POST"])
def update_starting_capital():
    data = request.get_json()
    # Update latest target with new starting capital
    db.execute("""
        UPDATE targets
        SET starting_capital = ?
        WHERE id = (SELECT id FROM targets ORDER BY id DESC LIMIT 1)
    """, data["starting_capital"])

    return jsonify({"status": "saved"})


# API endpoint: delete all transactions (reset)
@app.route("/api/settings/reset", methods=["POST"])
def reset_all_transactions():
    # Reset entire transactions table
    db.execute("DELETE FROM transactions")
    return jsonify({"status": "reset"})
