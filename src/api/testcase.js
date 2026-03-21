import api from "./index";

export const getTestCases = (params) => api.get("/testcases", { params });
export const createTestCase = (data) => api.post("/testcases", data);
export const updateTestCase = (id, data) => api.put(`/testcases/${id}`, data);
export const deleteTestCase = (id) => api.delete(`/testcases/${id}`);
