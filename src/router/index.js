import { createRouter, createWebHistory } from "vue-router";
import ProjectBoard from "../views/ProjectBoard.vue";
import AllTestCases from "../views/AllTestCases.vue";
import RequirementList from "../views/RequirementList.vue";
import ExecutionList from "../views/ExecutionList.vue";
import ReportList from "../views/ReportList.vue";
import MarkList from "../views/MarkList.vue";
import RequirementDetail from "../views/RequirementDetail.vue";
import ReportDetail from "../views/ReportDetail.vue";
import TestCaseNew from "../views/TestCaseNew.vue";
import TestCaseList from "../views/TestCaseList.vue";
import TestCaseDetail from "../views/TestCaseDetail.vue";
import AppLayout from "@/layout/AppLayout.vue";

const routes = [
  {
    path: "/",
    component: AppLayout,
    redirect: "/dashboard",
    children: [
      { path: "dashboard", name: "Dashboard", component: () => import('../views/Dashboard.vue') },
      { path: "projects", name: "ProjectBoard", component: ProjectBoard },
      { path: "testcases", name: "AllTestCases", component: AllTestCases },
      {
        path: "requirements",
        name: "RequirementList",
        component: RequirementList,
      },
      { path: "executions", name: "ExecutionList", component: ExecutionList },
      { path: "reports", name: "ReportList", component: ReportList },
      { path: "marks", name: "MarkList", component: MarkList },
      {
        path: "execution-records",
        name: "ExecutionRecords",
        component: ExecutionList,
      }, // 复用
      // 详细页面
      {
        path: "requirements/:id",
        name: "RequirementDetail",
        component: RequirementDetail,
      },
      { path: "reports/:id", name: "ReportDetail", component: ReportDetail },
      {
        path: "testcases/:id",
        name: "TestCaseDetail",
        component: TestCaseDetail,
        props: true,
      },
      {
        path: "executions/:id",
        name: "ExecutionDetail",
        component: () => import('../views/ExecutionDetail.vue'),
        props: true,
      },
      {
        path: "execution-monitor",
        name: "ExecutionMonitor",
        component: () => import('../views/ExecutionMonitor.vue'),
      },
      {
        path: "projects/:projectId/testcases",
        name: "TestCaseList",
        component: TestCaseList,
        props: true,
      },
      {
        path: "projects/:projectId/testcases/new",
        name: "TestCaseNew",
        component: TestCaseNew,
        props: true,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
