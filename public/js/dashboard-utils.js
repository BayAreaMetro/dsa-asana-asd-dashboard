(function exposeDashboardUtils(root, factory) {
    const utilities = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = utilities;
    } else {
        root.DashboardUtils = utilities;
    }
}(typeof globalThis !== "undefined" ? globalThis : this, function createDashboardUtils() {
    const statusMap = {
        green: "On Track",
        yellow: "At Risk",
        red: "Off Track",
        blue: "On Hold",
        purple: "Complete"
    };

    function getStatusType(status) {
        if (!status) return "No status";
        return statusMap[status.color?.toLowerCase()] || "Unknown";
    }

    function calculateStats(projects) {
        return projects.reduce((stats, project) => {
            const statusType = getStatusType(project.status);

            if (statusType === "On Track") stats.onTrack += 1;
            if (statusType === "At Risk") stats.atRisk += 1;
            if (statusType === "Off Track") stats.offTrack += 1;
            if (statusType === "Complete") stats.complete += 1;
            if (statusType === "On Hold") stats.onHold += 1;
            return stats;
        }, { onTrack: 0, atRisk: 0, offTrack: 0, complete: 0, onHold: 0 });
    }

    function generateProgressDescription(stats, total) {
        if (total === 0) {
            return "This portfolio does not currently contain any projects.";
        }

        const messages = [
            `Portfolio health overview: ${Math.round((stats.onTrack / total) * 100)}% of projects are on track.`
        ];

        if (stats.atRisk > 0) {
            messages.push(
                `${Math.round((stats.atRisk / total) * 100)}% require attention and may need additional resources or timeline adjustments.`
            );
        }
        if (stats.offTrack > 0) {
            messages.push(`${stats.offTrack} project(s) are significantly behind schedule and need immediate intervention.`);
        }
        if (stats.complete > 0) {
            messages.push(`${stats.complete} project(s) have been successfully completed.`);
        }

        return messages.join(" ");
    }

    function displayValue(value) {
        return value === null || value === undefined || value === "" ? "-" : String(value);
    }

    function getRemainingClass(remaining) {
        if (remaining === "-") return "";
        const value = Number.parseFloat(remaining);
        if (value > 0) return "remaining-positive";
        if (value < 0) return "remaining-negative";
        return "remaining-zero";
    }

    function getQuarterClass(quarter) {
        const value = displayValue(quarter).toLowerCase();
        if (value.includes("q1")) return "quarter-q1";
        if (value.includes("q2")) return "quarter-q2";
        if (value.includes("q3")) return "quarter-q3";
        if (value.includes("q4")) return "quarter-q4";
        return "";
    }

    function getPriorityClass(priority) {
        const value = displayValue(priority).toLowerCase();
        if (value.includes("high")) return "priority-high";
        if (value.includes("medium")) return "priority-medium";
        if (value.includes("low")) return "priority-low";
        return "priority-none";
    }

    function uniqueValues(projects, selector) {
        return [...new Set(projects.map(selector).filter((value) => value && value !== "-"))].sort();
    }

    return {
        calculateStats,
        displayValue,
        generateProgressDescription,
        getPriorityClass,
        getQuarterClass,
        getRemainingClass,
        getStatusType,
        uniqueValues
    };
}));
