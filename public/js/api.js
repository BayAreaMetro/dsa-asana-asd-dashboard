(function exposeDashboardApi(root) {
    async function loadDashboard() {
        const response = await fetch("/api/dashboard", {
            headers: {
                Accept: "application/json"
            }
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to load dashboard");
        }

        return data;
    }

    root.DashboardApi = {
        loadDashboard
    };
}(window));
