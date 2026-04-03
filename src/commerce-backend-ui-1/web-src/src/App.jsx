import { Route, Routes } from "react-router-dom";

import ExtensionRegistration from "./components/ExtensionRegistration.jsx";
import RuleForm from "./components/RuleForm.jsx";
import RuleList from "./components/RuleList.jsx";

export default function App() {
  return (
    <ExtensionRegistration>
      <Routes>
        <Route element={<RuleList />} path="/" />
        <Route element={<RuleForm />} path="/rules/new" />
        <Route element={<RuleForm />} path="/rules/edit/:country/:region" />
        <Route element={<div>404 Not Found</div>} path="*" />
      </Routes>
    </ExtensionRegistration>
  );
}
