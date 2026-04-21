import { Navigate, useParams } from 'react-router-dom';

// Review mode is effectively the same as StudySession — the due-cards filter lives server-side.
// Redirect to keep URL scheme from the design without duplicating logic.
export default function ReviewDeck() {
  const { id } = useParams();
  return <Navigate to={`/study/${id}`} replace />;
}
