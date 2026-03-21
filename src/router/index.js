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
import AppLayout from "@/layout/AppLayout.vue";

const routes = [
  {
    path: "/",
    component: AppLayout,
    redirect: "/projects",
    children: [
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
      // 详细页面（不嵌套在Layout中，或者也可以嵌套，看需求）
      {
        path: "requirements/:id",
        name: "RequirementDetail",
        component: RequirementDetail,
      },
      { path: "reports/:id", name: "ReportDetail", component: ReportDetail },
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
