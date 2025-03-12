// App.js - Main application component
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// Layout components
import Navbar from './components/layout/Navbar.js';
import Footer from './components/layout/Footer';

// Page components
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import VideoPage from './pages/VideoPage';
import SearchPage from './pages/Search';
import CategoryPage from './pages/CategoryPage';
import TagPage from './pages/TagPage';
import ForYouPage from './pages/ForYouPage'; // Add the new For You page
import TrendingPage from './pages/TrendingPage'; // Add the new Trending page
import NotFoundPage from './pages/NotFoundPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/video/:id" element={<VideoPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/tag/:id" element={<TagPage />} />
              <Route path="/for-you" element={<ForYouPage />} /> {/* Add the new route */}
              <Route path="/trending" element={<TrendingPage />} /> {/* Add the new route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;