# Finance Tracker
#### Video Demo: https://youtu.be/dPTKdsTZxzM
#### Description:

The **Finance Tracker** is a web-based financial management application. The main aim of this project is to help users track expenses, receipts, and targets in a clean and visual way. The application focuses on clarity and usability, making it suitable for demonstrating scenarios on real-world budgeting and financial analysis.

This project is implemented using **Flask, Python** for the backend, **SQLite** for database management, and **HTML, CSS, JavaScript, and Chart.js** for the frontend. All data shown in the application is fetched dynamically from the database and reflected in the dashboard, tables, and charts, immediately.

---

## File Structure Overview

- `app.py`: Main Flask application containing routes, API endpoints, and database logic
- `templates/`: HTML templates for all pages
- `static/css/`: Stylesheets for layout and UI styling
- `static/js/`: JavaScript files for dynamic table updates, filtering, and charts
- `finance.db`: SQLite database storing transactions and targets

---

## Project Overview

The application consists of five main sections:

1. **Dashboard**
2. **Expenses**
3. **Receipts**
4. **Targets**
5. **Settings**

Each section serves a distinct purpose while sharing a common database and backend logic.

---

## Dashboard

The dashboard provides a financial overview. It displays:

- Total income
- Total expenses
- Net capital
- Recent transactions
	- Provided with search and date filters
- Net Capital Charts

The dashboard aggregates data from the `transactions` table and calculates values such as net capital (income - expenses). Charts visualize monthly financial performance using Chart.js, allowing users to quickly understand trends over time.

---

## Expenses Page

The Expenses page allows users to manage all outgoing transactions. Users can:

- Add new expenses
- Categorize expenses (for example, Hardware, Marketing, Rent, Shipping)
- Specify payment methods (like Cash, UPI, Card, etc.)
- Add vendor details and notes
- Filter, search, sort, and delete expenses

Each expense is stored in the `transactions` table with a type of `expense`. The page updates without requiring a full reload, demonstrating real-time interaction between frontend JavaScript and backend Flask APIs.

I encountered here a challenge, which was handling unknown or new categories. Instead of hardcoding styles for each category, I implemented a category tag system so new categories still show up visually without interfering with or damaging the User Interface.

---

## Receipts (Income) Page

The Receipts page handles incoming transactions and functions similarly to the Expenses page. It allows users to:

- Add income entries
- Assign categories and vendors
- Include optional notes
- Sort and filter records

Income entries are also stored in the `transactions` table, differentiated by a `type` value of `income`. This approach simplifies queries while keeping the logic clear and consistent across the application.

There is an empty column for receipt, as for future developments, a feature can be added to upload receipt as PDF or image.

---

## Targets Page

The Targets page allows users to define and track financial goals, including:

- Target net capital
- Monthly income target
- Monthly expense limit
- Optional starting capital

The page displays progress using:
- Numeric summaries
- Progress bars
- Monthly bar charts (actual vs target)
- A donut chart for net capital health

Actual values are calculated from transaction data for the current month. This requires careful synchronization between backend summary queries and frontend rendering logic. I chose to store targets historically (instead of updating a single row) to allow future extensibility.

---

## Settings Page

The Settings page provides administrative controls, including:

- Updating starting capital
- Resetting all transaction data

This page demonstrates application control. Resetting data is especially useful for testing and demonstrations.

---

## Backend

The backend is written in Python using Flask and uses SQLite as the database system. The database contains two tables:

- `transactions`: Stores all income and expense records
- `targets`: Stores financial targets and starting capital

REST-style API endpoints (`/api/expenses`, `/api/receipts`, `/api/targets`, `/api/summary`) are used to separate data logic from UI rendering. This separation improves maintainability and reflects real-world web application architecture.

---

## Frontend

The frontend is built using:
- HTML for structure
- CSS for layout and styling
- JavaScript for interactivity
- Chart.js for data visualization

All charts update based on real database values.

---

## Design Decisions

Some key design decisions include:

- Using a single `transactions` table for both income and expenses to reduce redundancy
- Using JavaScript fetch APIs instead of server-side rendering for tables
- Keeping UI simple and readable rather than visually complex
- Prioritizing correctness and clarity over extra features

---

## Conclusion

This project brings together everything I learned throughout CS50. From writing backend logic and designing the database to building the frontend and focusing on usability, it pushed me to think about how real applications are actually built.
Working on this helped me understand how different technologies fit together to solve practical problems. I’m genuinely proud of how the project turned out and of the technical and design choices I made along the way.

