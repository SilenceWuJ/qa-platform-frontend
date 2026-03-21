import api from "./index";
import request from "@/utils/request";

export const getRequirements = (params) => api.get("/requirements", { params });
export const getRequirement = (id) => api.get(`/requirements/${id}`);
export const createRequirement = (data) => api.post("/requirements", data);
export const updateRequirement = (id, data) =>
  api.put(`/requirements/${id}`, data);
export const deleteRequirement = (id) => api.delete(`/requirements/${id}`);
export const batchUploadRequirements = (projectId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(
    `/requirements/batch_upload?project_id=${projectId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
};
// export const getRequirements = () => {
//   return request({
//     url: "/requirements",
//     method: "get",
//   });
// };
export const downloadFile = (fileId) => {
  return request({
    url: `/files/${fileId}/download`,
    method: "get",
    responseType: "blob", // 重要：设置响应类型为 blob
  });
};
