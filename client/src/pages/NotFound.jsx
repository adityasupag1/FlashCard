import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="bg-surface min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <div className="relative mb-8 inline-block">
            <span className="text-[140px] md:text-[180px] font-black text-primary leading-none tracking-tighter">
              404
            </span>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-bg-yellow rounded-full -z-10" />
          </div>
          <h1 className="text-h2-section text-on-surface mb-3">Card not found</h1>
          <p className="text-on-surface-variant mb-8">
            We looked through every deck and couldn't find this page. It may have been moved or never existed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={user ? '/decks' : '/'}
              className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:scale-[1.03] transition-transform inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">home</span>
              {user ? 'My decks' : 'Home'}
            </Link>
            <Link
              to="/explore"
              className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary-fixed/30 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">explore</span>
              Explore decks
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
