import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import MyDecks from './pages/MyDecks';
import CreateDeck from './pages/CreateDeck';
import DeckDetail from './pages/DeckDetail';
import StudySession from './pages/StudySession';
import SessionComplete from './pages/SessionComplete';
import ReviewDeck from './pages/ReviewDeck';
import ProgressAnalytics from './pages/ProgressAnalytics';
import ExploreDecks from './pages/ExploreDecks';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/explore" element={<ExploreDecks />} />

      <Route path="/decks" element={<ProtectedRoute><MyDecks /></ProtectedRoute>} />
      <Route path="/decks/:id" element={<ProtectedRoute><DeckDetail /></ProtectedRoute>} />
      <Route path="/decks/:id/review" element={<ProtectedRoute><ReviewDeck /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateDeck /></ProtectedRoute>} />
      <Route path="/study/:deckId" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />
      <Route path="/session/:sessionId/complete" element={<ProtectedRoute><SessionComplete /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><ProgressAnalytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
