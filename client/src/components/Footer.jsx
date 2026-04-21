export default function Footer() {
  return (
    <footer className="bg-bg-blue pt-16 pb-12 border-t border-border-subtle mt-20">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 text-sm text-slate-500">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              layers
            </span>
            <span className="text-xl font-bold text-slate-900">FlashDeck</span>
          </div>
          <p className="max-w-xs mb-6">
            The ultimate tool for turning static documents into dynamic learning — powered by AI and cognitive science.
          </p>
        </div>
        <div>
          <h5 className="font-bold text-slate-900 mb-4">Product</h5>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-primary transition-all">How it Works</a></li>
            <li><a href="#" className="hover:text-primary transition-all">AI Engine</a></li>
            <li><a href="#" className="hover:text-primary transition-all">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-slate-900 mb-4">Resources</h5>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-primary transition-all">Deck Library</a></li>
            <li><a href="#" className="hover:text-primary transition-all">Study Guide</a></li>
            <li><a href="#" className="hover:text-primary transition-all">Help Center</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-slate-900 mb-4">Company</h5>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-primary transition-all">About Us</a></li>
            <li><a href="#" className="hover:text-primary transition-all">Privacy</a></li>
            <li><a href="#" className="hover:text-primary transition-all">Contact</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-slate-900 mb-4">Legal</h5>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-primary transition-all">Terms</a></li>
            <li><a href="#" className="hover:text-primary transition-all">Cookies</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} FlashDeck. Built for learners.</p>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span className="material-symbols-outlined text-sm">bolt</span>
          POWERED BY ADVANCED AI
        </div>
      </div>
    </footer>
  );
}
