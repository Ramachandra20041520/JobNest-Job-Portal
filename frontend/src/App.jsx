import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterJobs from "./pages/RecruiterJobs";
import Jobs from "./pages/Jobs";
import CandidateProfile from "./pages/CandidateProfile";
import MyApplications from "./pages/MyApplications";
import JobDetails from "./pages/JobDetails";
import RecruiterApplicants from "./pages/RecruiterApplicants";
import RecruiterApplicantDetails from "./pages/RecruiterApplicantDetails";
import RecruiterInterviews from "./pages/RecruiterInterviews";
import CandidateInterviews from "./pages/CandidateInterviews";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/candidate" element={<CandidateDashboard />} />
      <Route path="/candidate/profile" element={<CandidateProfile />} />
      <Route path="/recruiter" element={<RecruiterDashboard />} />
      <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:jobId" element={<JobDetails />} />
      <Route
        path="/my-applications"
        element={<MyApplications />}
      />
      <Route
        path="/recruiter/applicants"
        element={<RecruiterApplicants />}
      />
      <Route
        path="/recruiter/applicants/:applicationId"
        element={<RecruiterApplicantDetails />}
      />
      <Route
  path="/recruiter/interviews"
  element={<RecruiterInterviews />}
/>

<Route
  path="/candidate/interviews"
  element={<CandidateInterviews />}
/>
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}