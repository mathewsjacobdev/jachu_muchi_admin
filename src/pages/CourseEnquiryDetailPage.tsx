import { Navigate, useParams } from "react-router-dom";

/** Legacy path; enquiries now live under `/enquiries/:id` and the shared API. */
const CourseEnquiryDetailPage = () => {
  const { id } = useParams();
  if (!id) {
    return <Navigate to="/enquiries" replace />;
  }
  return <Navigate to={`/enquiries/${id}`} replace />;
};

export default CourseEnquiryDetailPage;
