import api from "./index";

// 获取测试用例列表
export const getTestCases = (params) => api.get("/testcases", { params });

// 获取单个测试用例
export const getTestCase = (id) => api.get(`/testcases/${id}`);

// 创建测试用例
export const createTestCase = (data) => api.post("/testcases", data);

// 更新测试用例
export const updateTestCase = (id, data) => api.put(`/testcases/${id}`, data);

// 删除测试用例
export const deleteTestCase = (id) => api.delete(`/testcases/${id}`);

// 批量操作
export const batchUpdateTestCases = (data) => api.put("/testcases/batch", data);
export const batchDeleteTestCases = (ids) => api.delete("/testcases/batch", { data: { ids } });

// 测试步骤相关
export const updateTestCaseSteps = (id, steps) => api.put(`/testcases/${id}/steps`, { steps });

// 导入/导出
export const importTestCases = (data) => api.post("/testcases/import", data);
export const exportTestCases = (params) => api.get("/testcases/export", { params, responseType: 'blob' });

// 复制测试用例
export const duplicateTestCase = (id, data) => api.post(`/testcases/${id}/duplicate`, data);

// 获取测试用例统计
export const getTestCaseStats = (params) => api.get("/testcases/stats", { params });

// 搜索测试用例
export const searchTestCases = (query) => api.get("/testcases/search", { params: { q: query } });

// 获取测试阶段
export const getTestPhases = () => api.get("/testcases/test-phases");

// 获取测试类型
export const getTestTypes = () => api.get("/testcases/test-types");

// 验证测试步骤JSON
export const validateTestSteps = (steps) => api.post("/testcases/validate-steps", { steps });

// 转换文本步骤为JSON
export const convertTextToJsonSteps = (text) => api.post("/testcases/convert-steps", { text });

// 获取测试用例模板
export const getTestCaseTemplate = () => api.get("/testcases/template");