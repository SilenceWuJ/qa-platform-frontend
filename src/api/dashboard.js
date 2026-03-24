import api from "./index";

/**
 * 看板API
 */
export const getDashboardStats = () => api.get("/dashboard/stats");
export const getDashboardSummary = () => api.get("/dashboard/summary");
export const getTestRuns = (params) => api.get("/dashboard/test-runs", { params });
export const getTestReports = (params) => api.get("/dashboard/test-reports", { params });
export const getReportFiles = (params) => api.get("/dashboard/report-files", { params });
export const getDashboardHealth = () => api.get("/dashboard/health");