(function initializeDashboard(root) {
    const statusColors = {
        red: "#a4540a",
        yellow: "#a4540a",
        green: "#1f6b45",
        blue: "#2c5f8a",
        purple: "#164357",
        pink: "#a4540a",
        orange: "#a4540a",
        gray: "#5a707b",
        grey: "#5a707b"
    };
    const content = document.getElementById("content");
    const refreshButton = document.getElementById("refreshButton");
    const asanaLink = document.getElementById("asanaLink");
    const sidePanel = document.getElementById("sidePanel");
    const sidePanelTitle = document.getElementById("sidePanelTitle");
    const sidePanelContent = document.getElementById("sidePanelContent");

    function element(tag, options = {}) {
        const node = document.createElement(tag);
        if (options.className) node.className = options.className;
        if (options.text !== undefined) node.textContent = options.text;
        return node;
    }

    function statusColor(status) {
        return statusColors[status?.color?.toLowerCase()] || "#9e9e9e";
    }

    function createStatusBadge(status) {
        const color = statusColor(status);
        const badge = element("div", {
            className: "status-badge",
            text: root.DashboardUtils.getStatusType(status)
        });
        const symbol = element("span", { className: "status-symbol" });

        badge.style.backgroundColor = `${color}20`;
        badge.style.color = color;
        symbol.style.backgroundColor = color;
        badge.prepend(symbol);
        return badge;
    }

    function createCell(value, className = "") {
        return element("td", {
            className,
            text: root.DashboardUtils.displayValue(value)
        });
    }

    function closeSidePanel() {
        sidePanel.classList.remove("open");
        sidePanel.setAttribute("aria-hidden", "true");
    }

    function appendStatusText(container, text) {
        let list = null;

        for (const rawLine of text.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line) {
                list = null;
                continue;
            }

            const bullet = line.match(/^(?:[*\-\u2022]|\d+\.)\s+(.+)$/);
            if (bullet) {
                if (!list) {
                    list = element("ul");
                    container.append(list);
                }
                list.append(element("li", { text: bullet[1] }));
                continue;
            }

            list = null;
            if (/^summary:?$/i.test(line)) {
                container.append(element("h2", { text: "Summary" }));
            } else if (/^[A-Z][A-Za-z\s]+:?$/.test(line)) {
                container.append(element("h3", { text: line.replace(/:$/, "") }));
            } else {
                container.append(element("p", { text: line }));
            }
        }
    }

    function openStatusReport(project) {
        sidePanelTitle.textContent = project.name;
        sidePanelContent.replaceChildren();

        if (project.status?.text) {
            const report = element("div", { className: "status-report" });
            report.append(element("div", {
                className: "status-report-title",
                text: "Latest Status Update"
            }));
            report.append(element("div", {
                className: "status-report-date",
                text: project.status.created_at
                    ? new Date(project.status.created_at).toLocaleDateString()
                    : "Unknown date"
            }));
            const statusText = element("div", { className: "status-report-text" });
            appendStatusText(statusText, project.status.text);
            report.append(statusText);
            sidePanelContent.append(report);
        } else {
            sidePanelContent.append(element("div", {
                className: "no-status",
                text: project.dataAvailability?.details === "unavailable"
                    ? project.dataAvailability.message
                    : "No status report available for this project"
            }));
        }

        sidePanel.classList.add("open");
        sidePanel.setAttribute("aria-hidden", "false");
    }

    function createStats(projects) {
        const stats = root.DashboardUtils.calculateStats(projects);
        const definitions = [
            [projects.length, "Total Projects", ""],
            [stats.onTrack, "On Track", "on-track"],
            [stats.atRisk, "At Risk", "at-risk"],
            [stats.offTrack, "Off Track", "off-track"],
            [stats.onHold, "On Hold", "on-hold"]
        ];
        const grid = element("div", { className: "stats-grid" });

        for (const [value, label, className] of definitions) {
            const card = element("div", { className: "stat-card" });
            card.append(element("div", {
                className: `stat-number ${className}`.trim(),
                text: value
            }));
            card.append(element("div", { className: "stat-label", text: label }));
            grid.append(card);
        }

        return { grid, stats };
    }

    function createFilter(labelText, values) {
        const group = element("div", { className: "filter-group" });
        const label = element("label", { text: labelText });
        const select = element("select", { className: "filter-select" });
        const filterName = labelText.replace("Filter by ", "");
        const pluralName = filterName === "Priority" ? "Priorities" : `${filterName}s`;
        const allOption = element("option", { text: `All ${pluralName}` });
        allOption.value = "";
        select.append(allOption);

        for (const value of values) {
            const option = element("option", { text: value });
            option.value = value;
            select.append(option);
        }

        label.htmlFor = `${labelText.replace(/\s+/g, "").toLowerCase()}Filter`;
        select.id = label.htmlFor;
        group.append(label, select);
        return { group, select };
    }

    function createProjectsTable(projects) {
        const table = element("table", { className: "projects-table" });
        const head = element("thead");
        const headRow = element("tr");
        const columns = [
            "Status",
            "Project Name",
            "Priority",
            "Owner",
            "Budgeted Time",
            "Actual Time (Hours)",
            "Remaining",
            "FY Quarter Start"
        ];

        for (const column of columns) headRow.append(element("th", { text: column }));
        head.append(headRow);
        table.append(head);

        const body = element("tbody");
        for (const project of projects) {
            const row = element("tr", { className: project.status ? "clickable" : "" });
            const statusCell = element("td");
            statusCell.append(createStatusBadge(project.status));
            row.append(statusCell);
            row.append(createCell(project.name, "project-name"));
            row.append(createCell(
                project.customFields?.priority,
                root.DashboardUtils.getPriorityClass(project.customFields?.priority)
            ));
            row.append(createCell(project.owner));
            row.append(createCell(project.customFields?.budgetedTime));
            row.append(createCell(project.customFields?.actualTimeFTEs));
            row.append(createCell(
                project.customFields?.remainingTime,
                root.DashboardUtils.getRemainingClass(project.customFields?.remainingTime)
            ));
            row.append(createCell(
                project.customFields?.fyQuarterStart,
                root.DashboardUtils.getQuarterClass(project.customFields?.fyQuarterStart)
            ));
            row.dataset.owner = root.DashboardUtils.displayValue(project.owner);
            row.dataset.priority = root.DashboardUtils.displayValue(project.customFields?.priority);

            if (project.status) {
                row.tabIndex = 0;
                row.addEventListener("click", (event) => {
                    event.stopPropagation();
                    openStatusReport(project);
                });
                row.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openStatusReport(project);
                    }
                });
            }
            body.append(row);
        }
        table.append(body);
        return { table, rows: [...body.rows] };
    }

    function createPortfolio(portfolioData) {
        const projects = portfolioData.projects || [];
        const { grid, stats } = createStats(projects);
        const section = element("section", { className: "projects-section" });
        section.append(element("h2", {
            className: "section-title",
            text: portfolioData.portfolio.name
        }));
        section.append(element("p", {
            className: "progress-description",
            text: root.DashboardUtils.generateProgressDescription(stats, projects.length)
        }));

        if (projects.length === 0) {
            section.append(element("div", {
                className: "empty-projects",
                text: "No projects are currently available."
            }));
            return [grid, section];
        }

        const ownerFilter = createFilter(
            "Filter by Owner",
            root.DashboardUtils.uniqueValues(projects, (project) => project.owner)
        );
        const priorityFilter = createFilter(
            "Filter by Priority",
            root.DashboardUtils.uniqueValues(projects, (project) => project.customFields?.priority)
        );
        const filters = element("div", { className: "filters" });
        filters.append(ownerFilter.group, priorityFilter.group);
        section.append(filters);

        const { table, rows } = createProjectsTable(projects);
        function filterRows() {
            for (const row of rows) {
                const ownerMatches = !ownerFilter.select.value
                    || row.dataset.owner === ownerFilter.select.value;
                const priorityMatches = !priorityFilter.select.value
                    || row.dataset.priority === priorityFilter.select.value;
                row.classList.toggle("hidden", !ownerMatches || !priorityMatches);
            }
        }
        ownerFilter.select.addEventListener("change", filterRows);
        priorityFilter.select.addEventListener("change", filterRows);
        section.append(table);
        return [grid, section];
    }

    async function loadDashboard() {
        refreshButton.disabled = true;
        content.replaceChildren(element("div", {
            className: "loading",
            text: "Loading portfolio data..."
        }));

        try {
            const data = await root.DashboardApi.loadDashboard();
            const nodes = data.flatMap(createPortfolio);
            content.replaceChildren(...nodes);

            const portfolioUrl = data[0]?.portfolio?.asanaUrl;
            if (portfolioUrl) {
                asanaLink.href = portfolioUrl;
                asanaLink.classList.remove("hidden");
            } else {
                asanaLink.classList.add("hidden");
            }
        } catch (error) {
            content.replaceChildren(element("div", {
                className: "error",
                text: `Error: ${error.message}`
            }));
        } finally {
            refreshButton.disabled = false;
        }
    }

    refreshButton.addEventListener("click", loadDashboard);
    document.getElementById("closePanelButton").addEventListener("click", closeSidePanel);
    document.addEventListener("click", (event) => {
        if (sidePanel.classList.contains("open") && !sidePanel.contains(event.target)) {
            closeSidePanel();
        }
    });

    loadDashboard();
    root.setInterval(loadDashboard, 60 * 60 * 1000);
}(window));
