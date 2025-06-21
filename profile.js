document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const usernameElement = document.getElementById('username');
    const modal = document.getElementById('profileModal');
    const closeModal = document.querySelector('.close-modal');

    // Display username
    const username = localStorage.getItem('username');
    if (username && usernameElement) {
        usernameElement.textContent = username;

        // Make username clickable
        usernameElement.addEventListener('click', async function () {
            modal.style.display = 'block';
            showLoadingState();
            try {
                await fetchUserInfo(token);
            } catch (error) {
                console.error('Failed to load user data:', error);
                showErrorState(error.message);
            }
        });
    }

    // Load user stats on page load
    loadUserStats(token);
    loadXPChart(token);
    loadPassedProjects(token);
    loadXPTimelineChart(token);

    // Close modal handlers
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = 'none';
    });

    // Logout functionality
    document.getElementById('logoutButton')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});

function showLoadingState() {
    const fields = ['modalFullName', 'modalEmail'];
    fields.forEach(id => {
        const element = document.getElementById(id);
        element.textContent = 'Loading...';
        element.style.color = 'var(--mint)';
        element.className = 'detail-value loading';
    });
}

function showErrorState(message = 'Failed to load data') {
    const fields = ['modalFullName', 'modalEmail'];
    fields.forEach(id => {
        const element = document.getElementById(id);
        element.textContent = message;
        element.style.color = '#ff6b6b';
        element.className = 'detail-value error';
    });
}

function formatNumber(num) {
    return num.toLocaleString('en-US');
}

function truncateToFirstFourDigits(num) {
    const str = Math.floor(num).toString();
    return str.slice(0, 4);
}

async function loadUserStats(token) {
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query {
                        user {
                            id
                            login
                            auditRatio
                            totalUp
                            totalDown
                        }
                    }
                `
            })
        });

        const result = await response.json();

        if (!response.ok || result.errors) {
            throw new Error(result.errors?.[0]?.message || 'Error fetching stats');
        }

        updateUserStats(result.data.user[0]);

        // Load audit chart data
        await loadAuditChartData(token);
    } catch (error) {
        console.error('Failed to load user stats:', error);
        document.getElementById('auditRatio').textContent = 'Error loading';
        document.getElementById('currentLevel').textContent = 'Error loading';
        document.getElementById('auditsDone').textContent = 'Error loading';
        document.getElementById('auditsReceived').textContent = 'Error loading';
    }
}

async function loadAuditChartData(token) {
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query {
                        user {
                            totalUp
                            totalDown
                            auditRatio
                        }
                    }
                `
            })
        });

        const result = await response.json();

        if (!response.ok || result.errors) {
            throw new Error(result.errors?.[0]?.message || 'Error fetching audit data');
        }

        const userData = result.data.user[0];
        updateAuditNumbers(userData);
        createCustomDonutChart(userData);
    } catch (error) {
        console.error('Failed to load audit chart data:', error);
        showDonutChartError();
        document.getElementById('auditsDone').textContent = 'Error loading';
        document.getElementById('auditsReceived').textContent = 'Error loading';
    }
}

function updateAuditNumbers(userData) {
    const doneAudits = userData.totalUp || 0;
    const receivedAudits = userData.totalDown || 0;

    document.getElementById('auditsDone').textContent = (doneAudits / 1000000).toFixed(2);
    document.getElementById('auditsReceived').textContent = (receivedAudits / 1000000).toFixed(2);
}

function createCustomDonutChart(userData) {
    const done = userData.totalUp || 0;
    const received = userData.totalDown || 0;
    const total = done + received;

    const donePercent = total > 0 ? (done / total) * 100 : 0;
    const receivedPercent = total > 0 ? (received / total) * 100 : 0;

    const doneSlice = document.getElementById('doneSlice');
    const receivedSlice = document.getElementById('receivedSlice');

    if (!doneSlice || !receivedSlice) return;

    // Ensure their sum is exactly 100
    const adjustedDone = parseFloat(donePercent.toFixed(2));
    const adjustedReceived = 100 - adjustedDone;

    doneSlice.setAttribute('stroke-dasharray', `${adjustedDone} ${100 - adjustedDone}`);
    doneSlice.setAttribute('stroke-dashoffset', 25); // Starting position

    receivedSlice.setAttribute('stroke-dasharray', `${adjustedReceived} ${100 - adjustedReceived}`);
    receivedSlice.setAttribute('stroke-dashoffset', 25 - adjustedDone); // Start where doneSlice ends
}

function showDonutChartError() {
    const donutChart = document.getElementById('donutChart');
    if (donutChart) {
        donutChart.style.background = 'conic-gradient(#ff6b6b 0deg 360deg)';
    }
    document.getElementById('donutTotal').textContent = 'Error';
}

function updateUserStats(userData) {
    // Update audit ratio
    const auditRatio = userData.auditRatio ? userData.auditRatio.toFixed(2) : '0.00';
    document.getElementById('auditRatio').textContent = auditRatio;
}

async function fetchUserInfo(token) {
    const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `
                query {
                    user {
                        id
                        login
                        email
                        attrs
                        totalUp
                        totalDown
                        auditRatio
                    }
                }
            `
        })
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
        throw new Error(result.errors?.[0]?.message || 'Error fetching data');
    }

    updateProfileData(result.data.user[0]);
}

function updateProfileData(userData) {
    const fullName = `${userData.attrs?.firstName || ''} ${userData.attrs?.lastName || ''}`.trim() || 'Not provided';
    const email = userData.email || userData.login || 'Not provided';

    document.getElementById('modalFullName').textContent = fullName;
    document.getElementById('modalEmail').textContent = email;

    ['modalFullName', 'modalEmail'].forEach(id => {
        const element = document.getElementById(id);
        element.style.color = 'white';
        element.className = 'detail-value';
    });
}

async function loadXPChart(token) {
    try {
        showLoading();
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query {
                        transaction(
                            where: {
                                type: { _eq: "xp" }
                                object: { type: { _eq: "project" } }
                            },
                            order_by: { amount: desc },
                            limit: 20
                        ) {
                            object {
                                name
                            }
                            amount
                        }
                    }
                `
            })
        });

        const result = await response.json();
        if (!response.ok || result.errors) {
            throw new Error(result.errors?.[0]?.message || 'Error fetching XP chart data');
        }

        hideLoading();
        renderCustomBarChart(result.data.transaction);
    } catch (error) {
        console.error("XP chart error:", error);
        hideLoading();
        document.getElementById('xpChartContainer').innerHTML = '<p style="color:red; text-align: center;">Failed to load XP chart</p>';
    }
}

function renderCustomBarChart(xpData) {
    const container = document.getElementById('xpBarChart');
    if (!container) return;

    if (!xpData || xpData.length === 0) {
        container.innerHTML = '<p style="color: #ccc; text-align: center;">No XP data available</p>';
        return;
    }

    const maxValue = Math.max(...xpData.map(item => item.amount));
    const barWidth = 20;
    const barGap = 10;
    const barCount = xpData.length;
    const svgHeight = 300;
    const svgWidth = barCount * (barWidth + barGap);

    let svg = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMax meet" class="xp-bar-svg">`;

    xpData.forEach((item, i) => {
        const amount = item.amount;
        const amountInK = (amount / 1000).toFixed(1); // divide by 1000
        const height = (amount / maxValue) * (svgHeight - 60);
        const x = i * (barWidth + barGap);
        const y = svgHeight - height - 30;
        const projectName = item.object?.name || "Unnamed";

        svg += `
    <g>
        <title>${projectName}: ${amountInK} XP</title>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="#4CAF50" rx="3" ry="3" />
        <text x="${x + barWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" font-size="4" fill="#ccc" transform="rotate(-45, ${x + barWidth / 2}, ${svgHeight - 10})">
            ${projectName.length > 10 ? projectName.slice(0, 10) + "…" : projectName}
        </text>
    </g>
    `;
    });
    svg += `</svg>`;
    container.innerHTML = svg;
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function setErrorText(ids, message = "Error loading") {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = message;
    });
}

function calculateLevel(totalXP) {
    return Math.floor(totalXP / 1000) + 1;
}

async function loadPassedProjects(token) {
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query {
                        transaction_aggregate(
                            where: {
                                type: { _eq: "xp" }
                                object: { type: { _eq: "project" } }
                                amount: { _gt: 0 }
                            },
                            distinct_on: objectId
                        ) {
                            aggregate {
                                count
                            }
                        }
                    }
                `
            })
        });

        const result = await response.json();
        if (!response.ok || result.errors) {
            throw new Error(result.errors?.[0]?.message || 'Error fetching passed projects');
        }

        const passedProjects = result.data.transaction_aggregate.aggregate?.count || 0;
        document.getElementById('passedProjects').textContent = passedProjects;

    } catch (error) {
        console.error('Failed to load passed projects:', error);
        document.getElementById('passedProjects').textContent = 'Error loading';
    }
}

async function loadXPTimelineChart(token) {
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query {
                        transaction(
                            where: {
                                type: {_eq: "xp"},
                                object: {type: {_eq: "project"}}
                            },
                            order_by: {createdAt: asc},
                            limit: 1000
                        ) {
                            createdAt
                            amount
                        }
                    }
                `
            })
        });

        const result = await response.json();
        if (!response.ok || result.errors) {
            throw new Error(result.errors?.[0]?.message || 'Error fetching XP timeline');
        }

        const xpData = result.data.transaction;
        const grouped = groupXPByDay(xpData);
        renderXPTimelineChart(grouped);

    } catch (error) {
        console.error("XP timeline chart error:", error);
        document.getElementById('xpTimelineChart').innerHTML = '<p style="color:red; text-align: center;">Failed to load XP timeline</p>';
    }
}

function groupXPByDay(data) {
    const xpByDate = {};
    data.forEach(tx => {
        const date = new Date(tx.createdAt).toISOString().slice(0, 10); // YYYY-MM-DD
        xpByDate[date] = (xpByDate[date] || 0) + tx.amount;
    });

    return Object.entries(xpByDate).map(([date, amount]) => ({
        date,
        amount
    }));
}

async function loadXPTimelineChart(token) {
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query {
                        transaction(
                            where: {
                                type: {_eq: "xp"},
                                object: {type: {_eq: "project"}}
                            },
                            order_by: {createdAt: asc},
                            limit: 1000
                        ) {
                            createdAt
                            amount
                        }
                    }
                `
            })
        });

        const result = await response.json();
        if (!response.ok || result.errors) {
            throw new Error(result.errors?.[0]?.message || 'Error fetching XP timeline');
        }

        const xpData = result.data.transaction;
        const groupedData = groupXPByDay(xpData);
        renderXPTimelineChart(groupedData);

    } catch (error) {
        console.error("XP timeline chart error:", error);
        const container = document.getElementById('xpTimelineChart');
        if (container) {
            container.innerHTML = '<p style="color:red; text-align:center;">Failed to load XP timeline</p>';
        }
    }
}

function groupXPByDay(data) {
    const grouped = {};
    data.forEach(entry => {
        const date = new Date(entry.createdAt).toISOString().slice(0, 10); // "YYYY-MM-DD"
        grouped[date] = (grouped[date] || 0) + entry.amount;
    });

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
}

function renderXPTimelineChart(data) {
    const container = document.getElementById('xpTimelineChart');
    if (!container || data.length === 0) return;

    const width = 1100;   // match bar chart viewBox width
    const height = 300;   // match vertical scale
    const padding = 50;

    const maxXP = Math.max(...data.map(d => d.amount));
    const pointCount = data.length;

    const points = data.map((d, i) => {
        const x = padding + (i / (pointCount - 1)) * (width - 2 * padding);
        const y = height - padding - (d.amount / maxXP) * (height - 2 * padding);
        return { x, y, date: d.date, amount: d.amount };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" class="xp-timeline-svg">
            <path d="${pathData}" fill="none" stroke="#4CAF50" stroke-width="2"/>
            ${points.map(p => `
                <circle cx="${p.x}" cy="${p.y}" r="3" fill="#4CAF50" />
                <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" fill="#ccc">
                    ${(p.amount / 1000).toFixed(1)}k
                </text>
            `).join('')}
        </svg>
    `;

    container.innerHTML = svg;
}
