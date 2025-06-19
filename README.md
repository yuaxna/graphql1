# GraphQL Profile Project

## Overview
A personal profile dashboard that fetches and displays school data from a GraphQL API, featuring JWT authentication and interactive SVG data visualizations.

## Features
- 🔐 JWT Authentication (username/email + password)
- 📊 3+ profile data sections (XP, grades, skills)
- 📈 2+ SVG statistical graphs
- 🚪 Login/Logout functionality
- 🌍 Hosted deployment

## Technologies
- Frontend: HTML5, CSS3, JavaScript
- Data: GraphQL API
- Auth: JWT (Bearer tokens)
- Charts: Custom SVG
- Hosting: GitHub Pages/Netlify

## Authentication Flow
1. User submits credentials (username/email + password)
2. System makes POST request to:
3. Successful login returns JWT token stored client-side
4. Token used for authenticated GraphQL queries:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}

GraphQL Queries
Basic User Info
graphql
Copy
{
  user {
    id
    login
    createdAt
  }
}
XP Transactions
graphql
Copy
{
  transaction(where: {type: {_eq: "xp"}}) {
    amount
    createdAt
    path
  }
}
Progress Data
graphql
Copy
{
  progress {
    objectId
    grade
    path
  }
}
Statistics Graphs (SVG)
XP Timeline - Line chart showing XP accumulation

Project Results - Bar chart of pass/fail ratios

Audit Ratio - Pie chart of up/down audits

Project Structure
Copy
/public
  index.html
  assets/
    styles.css
    scripts.js
    graphql.js
    auth.js
Hosting

How to Run
Clone repo

Open login.html in browser

Login with school credentials

Explore your data visualizations

Author
Your Name
your.email@example.com