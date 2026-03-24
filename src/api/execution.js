import api from './index';

// 获取执行记录列表
export const getExecutions = (params) => api.get('/executions', { params });

// 获取单个执行记录
export const getExecutionRecord = (id) => api.get(`/executions/${id}`);

// 创建执行记录
export const createExecution = (data) => api.post('/executions', data);

// 更新执行记录
export const updateExecution = (id, data) => api.put(`/executions/${id}`, data);

// 删除执行记录
export const deleteExecution = (id) => api.delete(`/executions/${id}`);

// 重新执行
export const reExecute = (id, data) => api.post(`/executions/${id}/re-execute`, data);

// 获取执行记录详情（增强版）
export const getExecutionDetail = (id) => api.get(`/executions/${id}/detail`);

// 获取执行记录统计
export const getExecutionStats = (params) => api.get('/executions/stats', { params });

// 批量获取执行记录
export const getBatchExecutions = (ids) => api.post('/executions/batch', { ids });

// 停止执行
export const stopExecution = (id) => api.post(`/executions/${id}/stop`);

// 获取执行日志
export const getExecutionLogs = (id) => api.get(`/executions/${id}/logs`);

// 获取执行进度
export const getExecutionProgress = (id) => api.get(`/executions/${id}/progress`);

// 获取测试用例的执行历史
export const getTestCaseExecutions = (testcaseId) => api.get(`/testcases/${testcaseId}/executions`);

// 获取项目的执行记录
export const getProjectExecutions = (projectId) => api.get(`/projects/${projectId}/executions`);