import { Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getLinkGroups, LinkGroup } from '@/lib/api';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLinkGroups();
        setLinkGroups(data);
      } catch (err) {
        console.error('Failed to load link groups:', err);
        setError('Failed to load link groups');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkGroups();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              className="float-right font-bold"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : linkGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No links available.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linkGroups
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(group => (
                <div className="mb-5 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.5rem)]" key={group.id} id={`group-${group.id}`}>
                  <div className="text-base leading-relaxed text-red-800 pl-1">{group.name}</div>
                  <div className="flex flex-wrap overflow-hidden z-10">
                    {(group.links || [])
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(link => (
                        <div className="w-28 m-0.5" key={link.id}>
                          <a 
                            className="block bg-black/35 text-white text-xs text-center py-1 px-0 leading-9 rounded transition-all duration-200 hover:bg-black/45 hover:font-bold"
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {link.name}
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {isAuthenticated && (
        <Link to="/admin">
          <div className="fixed bottom-6 right-6 p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-full shadow-lg transition-all duration-200">
            <Settings className="h-6 w-6" />
          </div>
        </Link>
      )}
    </div>
  );
};

export default Home; 