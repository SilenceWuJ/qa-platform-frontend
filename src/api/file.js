import api from "./index";

export const uploadTempFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/files/upload/temp", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const uploadTestcaseFile = (testcaseId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/files/upload/testcase/${testcaseId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const uploadRequirementFile = (requirementId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/files/upload/requirement/${requirementId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const getTestcaseFiles = (testcaseId) => api.get(`/files/testcase/${testcaseId}`);

export const getRequirementFiles = (requirementId) => api.get(`/files/requirement/${requirementId}`);

export const getFile = (fileId) => api.get(`/files/${fileId}`);

export const downloadFile = (fileId) => api.get(`/files/download/${fileId}`, {
  responseType: "blob"
});

export const deleteFile = (fileId) => api.delete(`/files/${fileId}`);

export const previewFile = (fileId) => api.get(`/files/preview/${fileId}`);
